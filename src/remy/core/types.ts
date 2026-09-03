import type { ZodType } from "zod";

export type Risk = "low" | "medium" | "high";
export type Reversibility = "exact" | "compensating" | "irreversible";
export type AutonomyLevel = "preview" | "ask" | "reversible" | "trusted";
export type Actor = "agent" | "user" | "system";
export type Transport = "webmcp" | "manual" | "internal";

export type AgentIdentity = {
  id: string;
  name: string;
  provider?: string;
  selfReported: true;
};

export type ControlSettings = {
  autonomy: AutonomyLevel;
  paused: boolean;
  allowPurchases: boolean;
};

export type ControlRequest = {
  id: string;
  controls: ControlSettings;
  requestedAt: string;
  requestedBy?: AgentIdentity;
};

export type ActionStatus =
  | "proposed"
  | "staged"
  | "awaiting_approval"
  | "executing"
  | "committed"
  | "revert_requested"
  | "reverting"
  | "reverted"
  | "compensated"
  | "rejected"
  | "denied"
  | "failed";

export type PolicyDecision =
  | { outcome: "allow"; reason: string }
  | { outcome: "require_approval"; reason: string }
  | { outcome: "stage"; reason: string }
  | { outcome: "deny"; reason: string };

export type DiffEntry = {
  path: string;
  label: string;
  kind: "add" | "remove" | "replace" | "status";
  before?: unknown;
  after?: unknown;
  displayBefore?: string;
  displayAfter?: string;
};

export type ActionPreview = {
  summary: string;
  resourceKeys: string[];
  before?: unknown;
  after?: unknown;
  diff: DiffEntry[];
  detail?: Record<string, string>;
};

export type ActionRecord = {
  id: string;
  runId: string;
  taskId: string;
  sequence: number;
  actionName: string;
  title: string;
  actor: Actor;
  agent?: AgentIdentity;
  transport: Transport;
  input: unknown;
  inputSummary: string;
  preview: ActionPreview;
  before: unknown;
  after: unknown;
  diff: DiffEntry[];
  output?: unknown;
  risk: Risk;
  reversibility: Reversibility;
  policyDecision: PolicyDecision;
  resourceKeys: string[];
  beforeVersions: Record<string, number>;
  afterVersions?: Record<string, number>;
  idempotencyKey: string;
  reversesReceiptId?: string;
  proposedAt: string;
};

export type ActionEvent = {
  id: string;
  actionId: string;
  sequence: number;
  type: ActionStatus;
  actor: Actor;
  at: string;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
};

export type ActionReceipt = ActionRecord & {
  status: ActionStatus;
  completedAt?: string;
  reversedByReceiptId?: string;
};

export type EngineStateAdapter<State> = {
  getState: () => State;
  setState: (next: State) => void;
  getVersion: (resourceKey: string) => number;
  bumpVersion: (resourceKey: string) => number;
  reset: () => void;
};

export type ActionContext<State> = EngineStateAdapter<State>;

export type ActionDefinition<State, Input = unknown, Output = unknown> = {
  name: string;
  title: string;
  description: string;
  kind: "read" | "mutation";
  inputSchema: ZodType<Input>;
  inputJsonSchema: Record<string, unknown>;
  risk: Risk;
  reversibility: Reversibility;
  alwaysRequireApproval?: boolean;
  requiresPurchasePermission?: boolean;
  safeToCompensateAutomatically?: boolean;
  preview: (
    input: Input,
    context: ActionContext<State>,
  ) => Promise<ActionPreview> | ActionPreview;
  execute: (
    input: Input,
    context: ActionContext<State>,
    meta: ExecutionMeta,
  ) => Promise<Output> | Output;
  undo?: (
    receipt: ActionReceipt,
    context: ActionContext<State>,
    meta: ExecutionMeta,
  ) => Promise<unknown> | unknown;
  compensate?: (
    receipt: ActionReceipt,
    context: ActionContext<State>,
    meta: ExecutionMeta,
  ) => Promise<unknown> | unknown;
  summarizeInput?: (input: Input) => string;
};

export type AnyActionDefinition<State> = ActionDefinition<
  State,
  // Input is deliberately erased at the registry boundary and validated at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  unknown
>;

export type ExecutionMeta = {
  actor: Actor;
  transport: Transport;
  actionId: string;
  idempotencyKey: string;
};

export type RunMeta = {
  actor?: Actor;
  agent?: AgentIdentity;
  transport?: Transport;
  idempotencyKey?: string;
};

export type RunResult =
  | {
      ok: true;
      actionId: string;
      status: ActionStatus;
      summary: string;
      output?: unknown;
      requiresApproval?: boolean;
    }
  | {
      ok: false;
      actionId?: string;
      status?: ActionStatus;
      code: string;
      error: string;
    };

export type EngineSnapshot<State> = {
  state: State;
  receipts: ActionReceipt[];
  events: ActionEvent[];
  autonomy: AutonomyLevel;
  paused: boolean;
  allowPurchases: boolean;
  activeAgent?: AgentIdentity;
  pendingControlRequest?: ControlRequest;
};

export type PersistedEngineSnapshot<State> = {
  state: State;
  records: ActionRecord[];
  events: ActionEvent[];
  autonomy: AutonomyLevel;
  paused: boolean;
  allowPurchases?: boolean;
};
