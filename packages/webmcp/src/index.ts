import type {
  ActionDescriptor,
  ControlSettings,
  Principal,
  RemyClient,
  RunResult,
} from "@remy-ai/core";

export type WebMCPStatus =
  | "checking"
  | "ready"
  | "partial"
  | "unsupported"
  | "error";

export type WebMCPTool = {
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly annotations?: {
    readonly readOnlyHint?: boolean;
    readonly untrustedContentHint?: boolean;
  };
  readonly execute: (input?: unknown) => unknown | Promise<unknown>;
};

export type WebMCPModelContext = {
  readonly registerTool: (
    tool: WebMCPTool,
    options?: { readonly signal?: AbortSignal },
  ) => void | Promise<void>;
};

export type WebMCPRegistration = {
  readonly status: Exclude<WebMCPStatus, "checking">;
  readonly registered: ReadonlyArray<string>;
  readonly failures: ReadonlyArray<{ readonly name: string; readonly error: string }>;
  readonly unregister: () => void;
};

export type RegisterOptions = {
  readonly signal?: AbortSignal;
  readonly modelContext?: WebMCPModelContext;
  /** Extra page-specific tools that should share this registration lifecycle. */
  readonly additionalTools?: ReadonlyArray<WebMCPTool>;
};

const EMPTY_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function inputJsonSchema(action: ActionDescriptor) {
  if (action.jsonSchema) return { ...action.jsonSchema };
  const converter = action.input["~standard"].jsonSchema?.input;
  if (!converter) {
    throw new Error(
      `Action "${action.name}" cannot be registered with WebMCP because its Standard Schema implementation does not expose JSON Schema. Provide jsonSchema explicitly.`,
    );
  }
  const schema = converter({ target: "draft-07" });
  if (!isRecord(schema) || Object.keys(schema).length === 0) {
    throw new Error(
      `Action "${action.name}" produced an empty JSON Schema. Provide an explicit, restrictive jsonSchema override.`,
    );
  }
  return schema;
}

function safeJson(value: unknown, depth = 0): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return typeof value === "string" ? value.slice(0, 2_000) : value;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (depth >= 5) return undefined;
  if (Array.isArray(value)) {
    return value.slice(0, 100).map((entry) => safeJson(entry, depth + 1));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .flatMap(([key, entry]) => {
          const safe = safeJson(entry, depth + 1);
          return safe === undefined ? [] : [[key.slice(0, 128), safe]];
        }),
    );
  }
  return undefined;
}

function conciseResult<Context>(
  remy: RemyClient<Context>,
  actionName: string,
  result: RunResult,
) {
  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.error,
      actionId: result.actionId,
    };
  }
  const exposedOutput = result.output === undefined
    ? undefined
    : safeJson(remy.exposeOutput(actionName, result.output));
  return {
    ok: true,
    actionId: result.actionId,
    status: result.status,
    summary: result.summary,
    requiresApproval: result.requiresApproval ?? false,
    ...(result.requiresApproval
      ? {
          userActionRequired: true,
          approvalInstruction:
            "Stop and wait for the user to approve or reject this action. Do not click, press, or otherwise operate the approval control on the user's behalf.",
        }
      : {}),
    ...(exposedOutput === undefined ? {} : { output: exposedOutput }),
  };
}

function descriptorDescription(action: ActionDescriptor) {
  if (action.kind === "read") return `Read-only. ${action.description}`;
  if (action.recovery === "irreversible") {
    return `Consequential and irreversible. ${action.description}`;
  }
  return `${action.recovery === "exact" ? "Exactly recoverable" : "Compensating recovery"}. ${action.description}`;
}

function getDocumentContext(): WebMCPModelContext | undefined {
  if (typeof document === "undefined") return undefined;
  return (document as Document & { readonly modelContext?: WebMCPModelContext })
    .modelContext;
}

export async function registerWebMCP<Context>(
  remy: RemyClient<Context>,
  options: RegisterOptions = {},
): Promise<WebMCPRegistration> {
  const modelContext = options.modelContext ?? getDocumentContext();
  if (!modelContext?.registerTool) {
    return {
      status: "unsupported",
      registered: [],
      failures: [],
      unregister: () => undefined,
    };
  }

  const lifecycle = new AbortController();
  const externalSignal = options.signal;
  let cleanedUp = false;
  let externalListenerAttached = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (externalListenerAttached) {
      externalSignal?.removeEventListener("abort", cleanup);
      externalListenerAttached = false;
    }
    lifecycle.abort();
  };
  if (externalSignal?.aborted) cleanup();
  else if (externalSignal) {
    externalSignal.addEventListener("abort", cleanup, { once: true });
    externalListenerAttached = true;
  }

  const registered: string[] = [];
  const failures: Array<{ name: string; error: string }> = [];
  const pendingRegistrations: Array<Promise<void>> = [];
  const register = async (tool: WebMCPTool) => {
    if (lifecycle.signal.aborted) return;
    try {
      await modelContext.registerTool(tool, { signal: lifecycle.signal });
      registered.push(tool.name);
    } catch (error) {
      failures.push({
        name: tool.name,
        error: error instanceof Error ? error.message : "Registration failed.",
      });
    }
  };

  const queue = (tool: WebMCPTool) => {
    pendingRegistrations.push(register(tool));
  };

  // Page-specific task tools are the clearest entry point for an agent. Start
  // registering them first, then initiate every remaining registration without
  // waiting for a round trip between tools.
  for (const tool of options.additionalTools ?? []) {
    queue(tool);
  }

  for (const action of remy.listActions()) {
    try {
      const schema = inputJsonSchema(action);
      queue({
        name: action.name,
        title: action.title,
        description: descriptorDescription(action),
        inputSchema: schema,
        annotations: {
          readOnlyHint: action.kind === "read",
          untrustedContentHint: false,
        },
        execute: async (rawInput) => {
          const result = await remy.runByName(action.name, rawInput ?? {}, {
            actor: "agent",
            transport: "webmcp",
            signal: lifecycle.signal,
          });
          return conciseResult(remy, action.name, result);
        },
      });
    } catch (error) {
      failures.push({
        name: action.name,
        error: error instanceof Error ? error.message : "Schema conversion failed.",
      });
    }
  }

  queue({
    name: "get_remy_status",
    title: "Read Remy controls",
    description: "Read the current autonomy mode, grants, principal attribution, and pending control request. This changes nothing.",
    inputSchema: EMPTY_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => {
      const snapshot = remy.getSnapshot();
      return {
        remy: { present: true, version: "0.1.0-alpha", headless: true },
        controls: snapshot.controls,
        principal: snapshot.activePrincipal ?? null,
        pendingControlRequest: snapshot.pendingControlRequest ?? null,
      };
    },
  });

  queue({
    name: "identify_assistant",
    title: "Identify this assistant to Remy",
    description: "Set a self-reported assistant label for action attribution. This never grants authority.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 48 },
        provider: { type: "string", minLength: 1, maxLength: 48 },
        sessionId: { type: "string", minLength: 1, maxLength: 96 },
      },
      required: ["name"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (!isRecord(input) || typeof input.name !== "string" || !input.name.trim()) {
        return { ok: false, code: "INVALID_INPUT", message: "name is required." };
      }
      const name = input.name.trim().slice(0, 48);
      const provider = typeof input.provider === "string"
        ? input.provider.trim().slice(0, 48)
        : undefined;
      const id = typeof input.sessionId === "string" && input.sessionId.trim()
        ? input.sessionId.trim().slice(0, 96)
        : `${provider ?? "assistant"}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const principal: Principal = {
        id,
        name,
        provider: provider || undefined,
        assurance: "self-reported",
      };
      remy.identifyPrincipal(principal);
      return {
        ok: true,
        principal,
        note: "Self-reported identity is attribution only, never authorization.",
      };
    },
  });

  queue({
    name: "request_remy_controls",
    title: "Request different Remy controls",
    description: "Request a different autonomy mode, pause state, or named grants. Increased access waits for the user.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["preview", "ask", "reversible", "trusted"] },
        paused: { type: "boolean" },
        grants: { type: "array", maxItems: 32, items: { type: "string", minLength: 1, maxLength: 160 } },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (!isRecord(input)) return { ok: false, code: "INVALID_INPUT", message: "Expected an object." };
      const before = remy.getSnapshot().controls;
      const mode = ["preview", "ask", "reversible", "trusted"].includes(String(input.mode))
        ? input.mode as ControlSettings["autonomy"]
        : before.autonomy;
      const grants = Array.isArray(input.grants)
        ? Array.from(new Set(input.grants.filter((grant): grant is string => typeof grant === "string" && grant.length > 0).slice(0, 32)))
        : [...before.grants];
      const controls: ControlSettings = {
        autonomy: mode,
        paused: typeof input.paused === "boolean" ? input.paused : before.paused,
        grants,
      };
      const rank = { preview: 0, ask: 1, reversible: 2, trusted: 3 } as const;
      const increasesAccess = rank[controls.autonomy] > rank[before.autonomy] ||
        (before.paused && !controls.paused) ||
        controls.grants.some((grant) => !before.grants.includes(grant));
      if (increasesAccess) {
        const request = remy.requestControlChange(controls);
        return { ok: true, status: "awaiting_user", requestId: request.id, message: "The request is visible in Remy and has not been applied." };
      }
      remy.setControls(controls);
      return { ok: true, status: "applied", controls: remy.getSnapshot().controls };
    },
  });

  queue({
    name: "get_action_history",
    title: "Read agent action history",
    description: "Read concise semantic receipts for agent-requested actions. This changes nothing.",
    inputSchema: EMPTY_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => ({
      receipts: remy.getSnapshot().receipts
        .filter((receipt) => receipt.actor === "agent" || receipt.reversesReceiptId)
        .map((receipt) => ({
          id: receipt.id,
          action: receipt.action.name,
          title: receipt.action.title,
          status: receipt.status,
          principal: receipt.principal?.name,
          recovery: receipt.action.recovery,
        })),
    }),
  });

  queue({
    name: "revert_action",
    title: "Recover a Remy action",
    description: "Run the exact or compensating recovery for one committed receipt after version-safety checks.",
    inputSchema: {
      type: "object",
      properties: { receiptId: { type: "string", minLength: 1, maxLength: 256 } },
      required: ["receiptId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (input) => {
      if (!isRecord(input) || typeof input.receiptId !== "string" || !input.receiptId.trim()) {
        return { ok: false, code: "INVALID_INPUT", message: "receiptId must be a non-empty string." };
      }
      const result = await remy.revert(input.receiptId, {
        actor: "agent",
        transport: "webmcp",
        signal: lifecycle.signal,
      });
      return conciseResult(remy, "revert_action", result);
    },
  });

  await Promise.all(pendingRegistrations);

  const status = failures.length === 0
    ? "ready"
    : registered.length > 0
      ? "partial"
      : "error";
  return {
    status,
    registered: Object.freeze([...registered]),
    failures: Object.freeze([...failures]),
    unregister: cleanup,
  };
}
