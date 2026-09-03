import { createActionBuilder, type ActionBuilder } from "./action";
import { createMemoryJournalStore, parsePersistedJournal } from "./journal";
import { createAutonomyPolicy } from "./policy";
import { eraseAction, type InternalAction } from "./internal/action-registry";
import {
  boundedChanges,
  boundedDetails,
  boundedPrincipal,
  boundedRecord,
  boundedText,
} from "./internal/sanitize";
import type {
  ActionDefinition,
  ActionDescriptor,
  ActionPreview,
  ActionReceipt,
  ActionStatus,
  Actor,
  Clock,
  ControlRequest,
  ControlSettings,
  IdGenerator,
  InferSchemaInput,
  JournalEvent,
  JournalStore,
  JournalStoreResult,
  OperationResult,
  PersistedJournal,
  Policy,
  PolicyDecision,
  Principal,
  RecoveryReceipt,
  RemySnapshot,
  ResourceVersion,
  ResourceVersionProvider,
  RestoreResult,
  RunMeta,
  RunResult,
  SemanticChange,
  StandardSchemaV1,
} from "./public-types";

type Listener = () => void;

export type RemyOptions<Context> = {
  readonly context: () => Context;
  readonly resources?: ResourceVersionProvider;
  readonly policy?: Policy;
  readonly journal?: JournalStore;
  readonly controls?: Partial<ControlSettings>;
  readonly defaultRunId?: string;
  readonly defaultTaskId?: string;
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
};

type PrivateExecution<Context> = {
  readonly action: InternalAction<Context>;
  readonly input: unknown;
  readonly recovery: unknown;
  output?: unknown;
};

const DEFAULT_CONTROLS: ControlSettings = Object.freeze({
  autonomy: "reversible",
  paused: false,
  grants: Object.freeze([]),
});

function defaultId(kind: "receipt" | "event" | "control") {
  const random = globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${kind}-${random}`;
}

function boundedId(value: string, fallback: string, max = 256) {
  return value.trim().slice(0, max) || fallback;
}

function boundedVersion(value: ResourceVersion | undefined) {
  return typeof value === "string" ? value.slice(0, 512) : value;
}

function normalizeControls(
  controls: Partial<ControlSettings> | ControlSettings | undefined,
): ControlSettings {
  return Object.freeze({
    autonomy: controls?.autonomy ?? DEFAULT_CONTROLS.autonomy,
    paused: controls?.paused ?? DEFAULT_CONTROLS.paused,
    grants: Object.freeze(
      Array.from(new Set(controls?.grants ?? DEFAULT_CONTROLS.grants)).map(
        (grant) => grant.slice(0, 160),
      ),
    ),
  });
}

function reverseChanges(
  changes: ReadonlyArray<SemanticChange>,
): ReadonlyArray<SemanticChange> {
  return changes.map((change) => ({
    ...change,
    kind:
      change.kind === "add"
        ? "remove"
        : change.kind === "remove"
          ? "add"
          : change.kind,
    before: change.after,
    after: change.before,
  }));
}

function issuesMessage(
  issues: ReadonlyArray<{
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
  }>,
) {
  return issues
    .map((issue) => {
      const path = issue.path
        ?.map((part) =>
          typeof part === "object" && part !== null && "key" in part
            ? String(part.key)
            : String(part),
        )
        .join(".");
      return `${path || "input"}: ${issue.message}`;
    })
    .join("; ");
}

export class RemyClient<Context> {
  readonly defineAction: ActionBuilder<Context> = createActionBuilder<Context>();

  private readonly actions = new Map<string, InternalAction<Context>>();
  private descriptors: ReadonlyArray<ActionDescriptor> = Object.freeze([]);
  private readonly receipts = new Map<string, ActionReceipt>();
  private receiptOrder: string[] = [];
  private events: JournalEvent[] = [];
  private readonly privateExecutions = new Map<string, PrivateExecution<Context>>();
  private readonly idempotency = new Map<string, string>();
  private readonly listeners = new Set<Listener>();
  private controls: ControlSettings;
  private activePrincipal?: Principal;
  private pendingControlRequest?: ControlRequest;
  private snapshot: RemySnapshot;
  private readonly serverSnapshot: RemySnapshot;
  private readonly context: () => Context;
  private readonly resources?: ResourceVersionProvider;
  private readonly policy: Policy;
  private readonly journal: JournalStore;
  private readonly clock: Clock;
  private readonly idGenerator: IdGenerator;
  private readonly defaultRunId: string;
  private readonly defaultTaskId: string;
  private readonly initialControls: ControlSettings;
  private lastStoreError?: JournalStoreResult<never>;

  constructor(options: RemyOptions<Context>) {
    this.context = options.context;
    this.resources = options.resources;
    this.policy = options.policy ?? createAutonomyPolicy();
    this.journal = options.journal ?? createMemoryJournalStore();
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? defaultId;
    this.initialControls = normalizeControls(options.controls);
    this.controls = this.initialControls;
    this.defaultRunId = boundedId(
      options.defaultRunId ?? this.idGenerator("receipt"),
      "default-run",
    );
    this.defaultTaskId = boundedId(
      options.defaultTaskId ?? this.defaultRunId,
      "default-task",
    );
    this.snapshot = this.createSnapshot();
    this.serverSnapshot = this.snapshot;
  }

  register<
    Schema extends StandardSchemaV1,
    Output,
    RecoveryData,
    RecoveryOutput,
  >(
    action: ActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >,
  ) {
    if (this.actions.has(action.name)) {
      throw new Error(`Action "${action.name}" is already registered.`);
    }
    this.actions.set(action.name, eraseAction(action));
    this.descriptors = Object.freeze(
      Array.from(this.actions.values(), ({ descriptor }) => descriptor),
    );
    return this;
  }

  listActions = (): ReadonlyArray<ActionDescriptor> => this.descriptors;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  getServerSnapshot = () => this.serverSnapshot;

  getReceipt = (receiptId: string) => this.receipts.get(receiptId);

  getLastStoreError = () => this.lastStoreError;

  exposeOutput(actionName: string, output: unknown) {
    return this.actions.get(actionName)?.exposeOutput?.(output);
  }

  setControls(controls: ControlSettings) {
    this.controls = normalizeControls(controls);
    this.pendingControlRequest = undefined;
    this.emit();
  }

  setAutonomy(autonomy: ControlSettings["autonomy"]) {
    this.setControls({ ...this.controls, autonomy });
  }

  setPaused(paused: boolean) {
    this.setControls({ ...this.controls, paused });
  }

  setGrant(grant: string, enabled: boolean) {
    const grants = new Set(this.controls.grants);
    if (enabled) grants.add(grant);
    else grants.delete(grant);
    this.setControls({ ...this.controls, grants: [...grants] });
  }

  identifyPrincipal(principal: Principal) {
    this.activePrincipal = boundedPrincipal(principal);
    this.emit(false);
  }

  requestControlChange(controls: ControlSettings) {
    this.pendingControlRequest = Object.freeze({
      id: boundedId(this.idGenerator("control"), "control"),
      controls: normalizeControls(controls),
      requestedAt: this.now(),
      requestedBy: this.activePrincipal,
    });
    this.emit(false);
    return this.pendingControlRequest;
  }

  approveControlChange(requestId: string) {
    if (this.pendingControlRequest?.id !== requestId) return false;
    this.setControls(this.pendingControlRequest.controls);
    return true;
  }

  rejectControlChange(requestId: string) {
    if (this.pendingControlRequest?.id !== requestId) return false;
    this.pendingControlRequest = undefined;
    this.emit(false);
    return true;
  }

  reset() {
    this.receipts.clear();
    this.receiptOrder = [];
    this.events = [];
    this.privateExecutions.clear();
    this.idempotency.clear();
    this.controls = this.initialControls;
    this.activePrincipal = undefined;
    this.pendingControlRequest = undefined;
    const cleared = this.journal.clear();
    if (!cleared.ok) this.lastStoreError = cleared;
    this.emit(false);
  }

  restore(): RestoreResult {
    const loaded = this.journal.load();
    if (!loaded.ok) {
      this.lastStoreError = loaded;
      return { ok: false, code: loaded.code, error: loaded.message };
    }
    if (loaded.value === undefined) return { ok: true, restored: 0 };
    const parsed = parsePersistedJournal(loaded.value);
    if (!parsed.ok) {
      this.lastStoreError = parsed;
      return { ok: false, code: parsed.code, error: parsed.message };
    }
    this.receipts.clear();
    this.receiptOrder = [];
    for (const receipt of parsed.value.receipts) {
      this.receipts.set(receipt.id, Object.freeze(receipt));
      this.receiptOrder.push(receipt.id);
      this.idempotency.set(receipt.idempotencyKey, receipt.id);
    }
    this.events = [...parsed.value.events];
    this.controls = normalizeControls(parsed.value.controls);
    this.emit(false);
    return { ok: true, restored: this.receiptOrder.length };
  }

  async run<
    Schema extends StandardSchemaV1,
    Output,
    RecoveryData,
    RecoveryOutput,
  >(
    action: ActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >,
    input: InferSchemaInput<Schema>,
    meta: RunMeta = {},
  ): Promise<RunResult<Output>> {
    const registered = this.actions.get(action.name);
    if (!registered || registered.source !== action) {
      return {
        ok: false,
        code: "ACTION_NOT_REGISTERED",
        error: `Register action "${action.name}" before running it.`,
      };
    }
    // The typed action and the registered source are identity-equal, so the
    // erased registry output is Output at this boundary.
    return this.runByName(action.name, input, meta) as Promise<RunResult<Output>>;
  }

  async runByName(
    actionName: string,
    rawInput: unknown,
    meta: RunMeta = {},
  ): Promise<RunResult> {
    const action = this.actions.get(actionName);
    if (!action) {
      return { ok: false, code: "ACTION_NOT_FOUND", error: `No Remy action named "${actionName}" is registered.` };
    }
    const existingId = meta.idempotencyKey
      ? this.idempotency.get(meta.idempotencyKey)
      : undefined;
    if (existingId) return this.resultForExisting(existingId);

    const actionId = boundedId(this.idGenerator("receipt"), "receipt");
    const runId = boundedId(meta.runId ?? this.defaultRunId, "default-run");
    const taskId = boundedId(meta.taskId ?? this.defaultTaskId, "default-task");
    const idempotencyKey = boundedId(
      meta.idempotencyKey ?? `${runId}:${actionName}:${actionId}`,
      `${actionName}:${actionId}`,
      512,
    );
    const actor = meta.actor ?? "agent";
    const principal = actor === "agent"
      ? boundedPrincipal(meta.principal ?? this.activePrincipal)
      : boundedPrincipal(meta.principal);
    const invocation = {
      actor,
      principal,
      transport: meta.transport ?? "internal",
      actionId,
      runId,
      taskId,
      idempotencyKey,
      signal: meta.signal,
    } as const;

    const validation = await action.validate(rawInput);
    if (!validation.ok) {
      const message = issuesMessage(validation.issues);
      this.createFailedReceipt(action, invocation, "INVALID_INPUT", "Remy rejected invalid action input.");
      return { ok: false, actionId, status: "failed", code: "INVALID_INPUT", error: message };
    }

    let preview: Readonly<ActionPreview<unknown>> | Readonly<Omit<ActionPreview<never>, "recovery">>;
    try {
      preview = await action.preview({ input: validation.value, context: this.context(), meta: invocation });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The action preview failed.";
      this.createFailedReceipt(action, invocation, "PREVIEW_FAILED", message);
      return { ok: false, actionId, status: "failed", code: "PREVIEW_FAILED", error: message };
    }

    let decision: PolicyDecision;
    try {
      decision = await this.policy({
        action: action.descriptor,
        actor,
        principal,
        transport: invocation.transport,
        controls: this.controls,
        runId,
        taskId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The action policy failed.";
      this.createFailedReceipt(action, invocation, "POLICY_FAILED", message);
      return { ok: false, actionId, status: "failed", code: "POLICY_FAILED", error: message };
    }

    const resources = (preview.resources ?? []).slice(0, 64).map((id) => ({
      id: id.slice(0, 256),
      beforeVersion: boundedVersion(this.resources?.getVersion(id)),
    }));
    const receipt: ActionReceipt = Object.freeze({
      schemaVersion: 1,
      id: actionId,
      runId: runId.slice(0, 256),
      taskId: taskId.slice(0, 256),
      sequence: this.receiptOrder.length + 1,
      action: {
        name: action.descriptor.name,
        version: action.descriptor.version,
        title: boundedText(action.descriptor.title, 160),
        kind: action.descriptor.kind,
        risk: action.descriptor.risk,
        recovery: action.descriptor.recovery,
      },
      actor,
      principal,
      transport: invocation.transport.slice(0, 96),
      input: boundedRecord(action.redactInput?.(validation.value)),
      policyDecision: { ...decision, reason: boundedText(decision.reason) },
      summary: boundedText(preview.summary),
      changes: boundedChanges(preview.changes),
      details: boundedDetails(preview.details),
      resources,
      status: "proposed",
      idempotencyKey: idempotencyKey.slice(0, 512),
      proposedAt: this.now(),
    });
    this.addReceipt(receipt);
    this.privateExecutions.set(actionId, {
      action,
      input: validation.value,
      recovery: "recovery" in preview ? preview.recovery : undefined,
    });
    this.appendEvent(actionId, "proposed", actor);

    if (decision.outcome === "deny") {
      this.updateReceipt(actionId, { status: "denied", completedAt: this.now() });
      this.appendEvent(actionId, "denied", "system");
      this.emit();
      return { ok: false, actionId, status: "denied", code: "POLICY_DENIED", error: decision.reason };
    }
    if (decision.outcome === "stage") {
      this.updateReceipt(actionId, { status: "staged" });
      this.appendEvent(actionId, "staged", actor);
      this.emit();
      return { ok: true, actionId, status: "staged", summary: receipt.summary };
    }
    if (decision.outcome === "require_approval") {
      this.updateReceipt(actionId, { status: "awaiting_approval" });
      this.appendEvent(actionId, "awaiting_approval", actor);
      this.emit();
      return { ok: true, actionId, status: "awaiting_approval", summary: receipt.summary, requiresApproval: true };
    }
    return this.executeReceipt(actionId, actor);
  }

  async approve(actionId: string): Promise<RunResult> {
    const receipt = this.receipts.get(actionId);
    if (!receipt || !["awaiting_approval", "staged"].includes(receipt.status)) {
      return { ok: false, actionId, code: "NOT_AWAITING_APPROVAL", error: "This action is no longer waiting for approval." };
    }
    const conflict = this.findVersionConflict(receipt, "before");
    if (conflict) {
      const message = "This approval is out of date because the application changed. Prepare the action again.";
      this.updateReceipt(actionId, { status: "failed", completedAt: this.now(), errorCode: "STALE_APPROVAL" });
      this.appendEvent(actionId, "failed", "system", "STALE_APPROVAL");
      this.emit();
      return { ok: false, actionId, status: "failed", code: "STALE_APPROVAL", error: message };
    }
    if (!this.privateExecutions.has(actionId)) {
      return { ok: false, actionId, code: "PENDING_DATA_UNAVAILABLE", error: "Private execution data was not persisted. Prepare the action again." };
    }
    return this.executeReceipt(actionId, "user");
  }

  reject(actionId: string): RunResult {
    const receipt = this.receipts.get(actionId);
    if (!receipt || !["awaiting_approval", "staged"].includes(receipt.status)) {
      return { ok: false, actionId, code: "NOT_AWAITING_APPROVAL", error: "This action is no longer waiting for approval." };
    }
    this.updateReceipt(actionId, { status: "rejected", completedAt: this.now() });
    this.appendEvent(actionId, "rejected", "user");
    this.emit();
    return { ok: true, actionId, status: "rejected", summary: receipt.summary };
  }

  async revert(actionId: string, meta: RunMeta = {}): Promise<RunResult> {
    const receipt = this.receipts.get(actionId);
    if (!receipt || receipt.status !== "committed") {
      return { ok: false, actionId, code: "NOT_REVERSIBLE_NOW", error: "Only a committed action can be recovered." };
    }
    if (!["exact", "compensating"].includes(receipt.action.recovery)) {
      return { ok: false, actionId, code: "IRREVERSIBLE", error: "This action has no recovery path." };
    }
    const actor = meta.actor ?? "user";
    if (actor === "agent" && this.controls.paused) {
      return { ok: false, actionId, code: "POLICY_DENIED", error: "Agent changes are paused." };
    }
    if (actor === "agent" && ["ask", "preview"].includes(this.controls.autonomy)) {
      return { ok: false, actionId, code: "APPROVAL_REQUIRED", error: "The current policy requires the user to recover this action." };
    }
    const conflict = this.findVersionConflict(receipt, "after");
    if (conflict) {
      return { ok: false, actionId, code: "VERSION_CONFLICT", error: `Cannot safely recover because ${conflict} changed later.` };
    }
    const execution = this.privateExecutions.get(actionId);
    if (!execution?.action.recover) {
      return { ok: false, actionId, code: "RECOVERY_DATA_UNAVAILABLE", error: "Private recovery data is unavailable. The application must prepare a new corrective action." };
    }

    const reversalId = boundedId(this.idGenerator("receipt"), "recovery");
    const runId = boundedId(meta.runId ?? receipt.runId, receipt.runId);
    const taskId = boundedId(meta.taskId ?? receipt.taskId, receipt.taskId);
    const idempotencyKey = boundedId(
      meta.idempotencyKey ?? `${receipt.id}:recovery`,
      `${receipt.id}:recovery`,
      512,
    );
    const principal = actor === "agent" ? boundedPrincipal(meta.principal ?? this.activePrincipal) : boundedPrincipal(meta.principal);
    const beforeResources = receipt.resources.map((resource) => ({
      id: resource.id,
      beforeVersion: boundedVersion(this.resources?.getVersion(resource.id)),
    }));
    const isCompensation = receipt.action.recovery === "compensating";
    const reversal: ActionReceipt = Object.freeze({
      schemaVersion: 1,
      id: reversalId,
      runId,
      taskId,
      sequence: this.receiptOrder.length + 1,
      action: {
        name: `${isCompensation ? "compensate" : "recover"}_${receipt.action.name}`.slice(0, 64),
        version: receipt.action.version,
        title: boundedText(
          `${isCompensation ? "Compensate for" : "Restore"} ${receipt.action.title.toLowerCase()}`,
          160,
        ),
        kind: "write" as const,
        risk: receipt.action.risk,
        recovery: "none" as const,
      },
      actor,
      principal,
      transport: (meta.transport ?? "internal").slice(0, 96),
      policyDecision: {
        outcome: "allow" as const,
        reason: actor === "user" ? "The user requested this recovery." : "The current policy allows this recovery.",
      },
      summary: boundedText(
        isCompensation
          ? `Run a corrective action for ${receipt.action.title.toLowerCase()}.`
          : `Restore the state before ${receipt.action.title.toLowerCase()}.`,
      ),
      changes: reverseChanges(receipt.changes),
      resources: beforeResources,
      status: "proposed",
      idempotencyKey,
      reversesReceiptId: receipt.id,
      proposedAt: this.now(),
    });
    this.addReceipt(reversal);
    this.appendEvent(receipt.id, "revert_requested", actor);
    this.appendEvent(reversalId, "proposed", actor);
    this.updateReceipt(reversalId, { status: "reverting" });
    this.appendEvent(reversalId, "reverting", actor);
    this.emit();

    const invocation = {
      actor,
      principal,
      transport: meta.transport ?? "internal",
      actionId: reversalId,
      runId,
      taskId,
      idempotencyKey,
      signal: meta.signal,
    } as const;
    let result: OperationResult<unknown>;
    try {
      result = await execution.action.recover({
        receipt: { ...receipt, recovery: execution.recovery } as RecoveryReceipt<unknown>,
        output: execution.output,
        context: this.context(),
        meta: invocation,
      });
    } catch (error) {
      result = { ok: false, code: "RECOVERY_FAILED", message: error instanceof Error ? error.message : "Recovery failed." };
    }
    if (!result.ok) {
      this.finishFailure(reversalId, result.code);
      return { ok: false, actionId: reversalId, status: "failed", code: result.code, error: result.message };
    }
    const resources = this.bumpAndReadResources(reversal.resources);
    this.updateReceipt(reversalId, { status: "committed", resources, completedAt: this.now(), durationMs: this.duration(reversal.proposedAt) });
    this.updateReceipt(receipt.id, {
      status: isCompensation ? "compensated" : "reverted",
      reversedByReceiptId: reversalId,
    });
    this.appendEvent(reversalId, "committed", actor);
    this.appendEvent(receipt.id, isCompensation ? "compensated" : "reverted", "system");
    this.emit();
    return { ok: true, actionId: reversalId, status: "committed", summary: reversal.summary, output: result.value };
  }

  canRevert(receipt: ActionReceipt) {
    if (receipt.status !== "committed" || !["exact", "compensating"].includes(receipt.action.recovery)) {
      return { allowed: false, reason: "This action cannot be recovered now." } as const;
    }
    const conflict = this.findVersionConflict(receipt, "after");
    if (conflict) return { allowed: false, reason: `Cannot safely recover because ${conflict} changed later.` } as const;
    if (!this.privateExecutions.has(receipt.id)) {
      return { allowed: false, reason: "Private recovery data is unavailable." } as const;
    }
    return { allowed: true } as const;
  }

  private async executeReceipt(actionId: string, actor: Actor): Promise<RunResult> {
    const receipt = this.receipts.get(actionId);
    const execution = this.privateExecutions.get(actionId);
    if (!receipt || !execution) {
      return { ok: false, actionId, code: "PENDING_DATA_UNAVAILABLE", error: "Private execution data is unavailable. Prepare the action again." };
    }
    this.updateReceipt(actionId, { status: "executing" });
    this.appendEvent(actionId, "executing", actor);
    this.emit();
    let result: OperationResult<unknown>;
    try {
      result = await execution.action.execute({
        input: execution.input,
        context: this.context(),
        meta: {
          actor,
          principal: receipt.principal,
          transport: receipt.transport,
          actionId,
          runId: receipt.runId,
          taskId: receipt.taskId,
          idempotencyKey: receipt.idempotencyKey,
        },
      });
    } catch (error) {
      result = { ok: false, code: "EXECUTION_FAILED", message: error instanceof Error ? error.message : "The action failed." };
    }
    if (!result.ok) {
      this.finishFailure(actionId, result.code);
      return { ok: false, actionId, status: "failed", code: result.code, error: result.message };
    }
    execution.output = result.value;
    const resources = this.bumpAndReadResources(receipt.resources);
    this.updateReceipt(actionId, {
      status: "committed",
      resources,
      completedAt: this.now(),
      durationMs: this.duration(receipt.proposedAt),
    });
    this.appendEvent(actionId, "committed", actor);
    this.emit();
    return { ok: true, actionId, status: "committed", summary: receipt.summary, output: result.value };
  }

  private createFailedReceipt(
    action: InternalAction<Context>,
    invocation: {
      readonly actor: Actor;
      readonly principal?: Principal;
      readonly transport: string;
      readonly actionId: string;
      readonly runId: string;
      readonly taskId: string;
      readonly idempotencyKey: string;
    },
    errorCode: string,
    summary: string,
  ) {
    const at = this.now();
    const receipt: ActionReceipt = Object.freeze({
      schemaVersion: 1,
      id: invocation.actionId,
      runId: invocation.runId,
      taskId: invocation.taskId,
      sequence: this.receiptOrder.length + 1,
      action: {
        name: action.descriptor.name,
        version: action.descriptor.version,
        title: action.descriptor.title,
        kind: action.descriptor.kind,
        risk: action.descriptor.risk,
        recovery: action.descriptor.recovery,
      },
      actor: invocation.actor,
      principal: invocation.principal,
      transport: invocation.transport,
      policyDecision: { outcome: "deny" as const, reason: "The action failed before execution." },
      summary: boundedText(summary),
      changes: [],
      resources: [],
      status: "failed",
      idempotencyKey: invocation.idempotencyKey,
      proposedAt: at,
      completedAt: at,
      durationMs: 0,
      errorCode,
    });
    this.addReceipt(receipt);
    this.appendEvent(receipt.id, "proposed", invocation.actor);
    this.appendEvent(receipt.id, "failed", "system", errorCode);
    this.emit();
  }

  private addReceipt(receipt: ActionReceipt) {
    this.receipts.set(receipt.id, receipt);
    this.receiptOrder.push(receipt.id);
    this.idempotency.set(receipt.idempotencyKey, receipt.id);
  }

  private updateReceipt(
    id: string,
    patch: Partial<Pick<ActionReceipt, "status" | "resources" | "completedAt" | "durationMs" | "errorCode" | "reversedByReceiptId">>,
  ) {
    const current = this.receipts.get(id);
    if (!current) return;
    this.receipts.set(id, Object.freeze({ ...current, ...patch }));
  }

  private appendEvent(receiptId: string, type: ActionStatus, actor: Actor, errorCode?: string) {
    this.events.push(Object.freeze({
      schemaVersion: 1,
      id: boundedId(this.idGenerator("event"), `event-${this.events.length + 1}`),
      receiptId,
      sequence: this.events.length + 1,
      type,
      actor,
      at: this.now(),
      errorCode,
    }));
  }

  private finishFailure(receiptId: string, code: string) {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return;
    this.updateReceipt(receiptId, {
      status: "failed",
      completedAt: this.now(),
      durationMs: this.duration(receipt.proposedAt),
      errorCode: code.slice(0, 96),
    });
    this.appendEvent(receiptId, "failed", "system", code.slice(0, 96));
    this.emit();
  }

  private findVersionConflict(receipt: ActionReceipt, side: "before" | "after") {
    return receipt.resources.find((resource) => {
      const expected = side === "before" ? resource.beforeVersion : resource.afterVersion;
      return expected !== undefined &&
        boundedVersion(this.resources?.getVersion(resource.id)) !== expected;
    })?.id;
  }

  private bumpAndReadResources(resources: ActionReceipt["resources"]) {
    return resources.map((resource) => ({
      ...resource,
      afterVersion: boundedVersion(
        this.resources?.bumpVersion
          ? this.resources.bumpVersion(resource.id)
          : this.resources?.getVersion(resource.id),
      ),
    }));
  }

  private resultForExisting(actionId: string): RunResult {
    const receipt = this.receipts.get(actionId);
    if (!receipt) return { ok: false, code: "RECEIPT_NOT_FOUND", error: "The idempotent receipt is unavailable." };
    return {
      ok: true,
      actionId,
      status: receipt.status,
      summary: receipt.summary,
      output: this.privateExecutions.get(actionId)?.output,
      requiresApproval: receipt.status === "awaiting_approval",
    };
  }

  private duration(proposedAt: string) {
    return Math.max(0, this.clock().getTime() - new Date(proposedAt).getTime());
  }

  private now() {
    return this.clock().toISOString();
  }

  private persistedJournal(): PersistedJournal {
    return {
      schemaVersion: 1,
      controls: this.controls,
      receipts: this.receiptOrder.flatMap((id) => {
        const receipt = this.receipts.get(id);
        return receipt ? [receipt] : [];
      }),
      events: this.events,
    };
  }

  private createSnapshot(): RemySnapshot {
    return Object.freeze({
      receipts: Object.freeze(this.receiptOrder.flatMap((id) => {
        const receipt = this.receipts.get(id);
        return receipt ? [receipt] : [];
      })),
      events: Object.freeze([...this.events]),
      controls: this.controls,
      activePrincipal: this.activePrincipal,
      pendingControlRequest: this.pendingControlRequest,
    });
  }

  private emit(persist = true) {
    this.snapshot = this.createSnapshot();
    if (persist) {
      const saved = this.journal.save(this.persistedJournal());
      if (!saved.ok) this.lastStoreError = saved;
    }
    this.listeners.forEach((listener) => listener());
  }
}

export function createRemy<Context>(options: RemyOptions<Context>) {
  return new RemyClient(options);
}
