export type MaybePromise<Value> = Value | Promise<Value>;

export type StandardSchemaIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
};

export type StandardSchemaV1<Input = unknown, Output = Input> = {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => MaybePromise<
      | { readonly value: Output; readonly issues?: undefined }
      | { readonly issues: ReadonlyArray<StandardSchemaIssue> }
    >;
    readonly types?: { readonly input: Input; readonly output: Output };
    readonly jsonSchema?: {
      readonly input: (options: {
        readonly target: "draft-07" | "draft-2020-12" | "openapi-3.0";
      }) => Record<string, unknown>;
      readonly output: (options: {
        readonly target: "draft-07" | "draft-2020-12" | "openapi-3.0";
      }) => Record<string, unknown>;
    };
  };
};

export type InferSchemaInput<Schema extends StandardSchemaV1> = NonNullable<
  Schema["~standard"]["types"]
>["input"];

export type InferSchemaOutput<Schema extends StandardSchemaV1> = NonNullable<
  Schema["~standard"]["types"]
>["output"];

export type Risk = "low" | "medium" | "high";
export type RecoveryKind = "exact" | "compensating" | "irreversible";
export type AutonomyLevel = "preview" | "ask" | "reversible" | "trusted";
export type Actor = "agent" | "user" | "system";
export type Transport = string;
export type Grant = string;
export type ResourceId = string;
export type ResourceVersion = string | number;
export type SemanticValue = string | number | boolean | null;

export type Principal = {
  readonly id: string;
  readonly name?: string;
  readonly provider?: string;
  readonly assurance: "self-reported" | "authenticated" | "verified";
  readonly attributes?: Readonly<Record<string, SemanticValue>>;
};

export type ControlSettings = {
  readonly autonomy: AutonomyLevel;
  readonly paused: boolean;
  readonly grants: ReadonlyArray<Grant>;
};

export type ControlRequest = {
  readonly id: string;
  readonly controls: ControlSettings;
  readonly requestedAt: string;
  readonly requestedBy?: Principal;
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
  | { readonly outcome: "allow"; readonly reason: string }
  | { readonly outcome: "require_approval"; readonly reason: string }
  | { readonly outcome: "stage"; readonly reason: string }
  | { readonly outcome: "deny"; readonly reason: string };

export type SemanticChange = {
  readonly label: string;
  readonly path?: string;
  readonly kind?: "add" | "remove" | "replace" | "status";
  readonly before?: SemanticValue;
  readonly after?: SemanticValue;
};

export type ActionPreview<RecoveryData = undefined> = {
  readonly summary: string;
  readonly resources?: ReadonlyArray<ResourceId>;
  readonly changes?: ReadonlyArray<SemanticChange>;
  readonly details?: Readonly<Record<string, string>>;
  readonly recovery: RecoveryData;
};

export type ReadActionPreview = Omit<ActionPreview<never>, "recovery"> & {
  readonly recovery?: never;
};

export type OperationSuccess<Output> = {
  readonly ok: true;
  readonly value: Output;
};

export type OperationFailure = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
};

export type OperationResult<Output> =
  | OperationSuccess<Output>
  | OperationFailure;

export type InvocationMeta = {
  readonly actor: Actor;
  readonly principal?: Principal;
  readonly transport: Transport;
  readonly actionId: string;
  readonly runId: string;
  readonly taskId: string;
  readonly idempotencyKey: string;
  readonly signal?: AbortSignal;
};

export type ActionHandlerArgs<Context, Input> = {
  readonly input: Input;
  readonly context: Context;
  readonly meta: InvocationMeta;
};

export type RecoveryReceipt<RecoveryData> = ActionReceipt & {
  readonly recovery: RecoveryData;
};

export type RecoveryHandlerArgs<Context, RecoveryData, Output> = {
  readonly receipt: RecoveryReceipt<RecoveryData>;
  readonly output: Output;
  readonly context: Context;
  readonly meta: InvocationMeta;
};

type ActionDefinitionBase<
  Context,
  Schema extends StandardSchemaV1,
  Output,
> = {
  readonly name: string;
  readonly version?: string;
  readonly title: string;
  readonly description: string;
  readonly input: Schema;
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
  readonly requiredGrants?: ReadonlyArray<Grant>;
  readonly metadata?: Readonly<Record<string, SemanticValue>>;
  readonly preview: (
    args: ActionHandlerArgs<Context, InferSchemaOutput<Schema>>,
  ) => MaybePromise<ReadActionPreview | ActionPreview<unknown>>;
  readonly execute: (
    args: ActionHandlerArgs<Context, InferSchemaOutput<Schema>>,
  ) => MaybePromise<OperationResult<Output>>;
  readonly redactInput?: (
    input: InferSchemaOutput<Schema>,
  ) => Readonly<Record<string, SemanticValue>>;
  readonly exposeOutput?: (output: Output) => unknown;
};

export type ReadActionDefinition<
  Context,
  Schema extends StandardSchemaV1,
  Output,
> = ActionDefinitionBase<Context, Schema, Output> & {
  readonly kind: "read";
  readonly risk?: never;
  readonly approval?: never;
  readonly recovery?: never;
  readonly preview: (
    args: ActionHandlerArgs<Context, InferSchemaOutput<Schema>>,
  ) => MaybePromise<ReadActionPreview>;
};

type WriteActionDefinitionBase<
  Context,
  Schema extends StandardSchemaV1,
  Output,
  RecoveryData,
> = ActionDefinitionBase<Context, Schema, Output> & {
  readonly kind: "write";
  readonly risk: Risk;
  readonly approval?: "policy" | "always";
  readonly preview: (
    args: ActionHandlerArgs<Context, InferSchemaOutput<Schema>>,
  ) => MaybePromise<ActionPreview<RecoveryData>>;
};

export type ExactActionDefinition<
  Context,
  Schema extends StandardSchemaV1,
  Output,
  RecoveryData,
  RecoveryOutput,
> = WriteActionDefinitionBase<Context, Schema, Output, RecoveryData> & {
  readonly recovery: {
    readonly kind: "exact";
    readonly execute: (
      args: RecoveryHandlerArgs<Context, RecoveryData, Output>,
    ) => MaybePromise<OperationResult<RecoveryOutput>>;
  };
};

export type CompensatingActionDefinition<
  Context,
  Schema extends StandardSchemaV1,
  Output,
  RecoveryData,
  RecoveryOutput,
> = WriteActionDefinitionBase<Context, Schema, Output, RecoveryData> & {
  readonly recovery: {
    readonly kind: "compensating";
    readonly automatic?: boolean;
    readonly execute: (
      args: RecoveryHandlerArgs<Context, RecoveryData, Output>,
    ) => MaybePromise<OperationResult<RecoveryOutput>>;
  };
};

export type IrreversibleActionDefinition<
  Context,
  Schema extends StandardSchemaV1,
  Output,
> = Omit<
  WriteActionDefinitionBase<Context, Schema, Output, never>,
  "preview"
> & {
  readonly preview: (
    args: ActionHandlerArgs<Context, InferSchemaOutput<Schema>>,
  ) => MaybePromise<ReadActionPreview>;
  readonly recovery: { readonly kind: "irreversible" };
};

export type ActionDefinition<
  Context,
  Schema extends StandardSchemaV1 = StandardSchemaV1,
  Output = unknown,
  RecoveryData = unknown,
  RecoveryOutput = unknown,
> =
  | ReadActionDefinition<Context, Schema, Output>
  | ExactActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >
  | CompensatingActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >
  | IrreversibleActionDefinition<Context, Schema, Output>;

export type ActionInput<Action> = Action extends {
  readonly input: infer Schema extends StandardSchemaV1;
}
  ? InferSchemaInput<Schema>
  : never;

export type ActionOutput<Action> = Action extends {
  readonly execute: (...args: never[]) => MaybePromise<OperationResult<infer Output>>;
}
  ? Output
  : never;

export type ActionDescriptor = {
  readonly name: string;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly kind: "read" | "write";
  readonly risk?: Risk;
  readonly recovery: RecoveryKind | "none";
  readonly automaticCompensation: boolean;
  readonly approval: "policy" | "always";
  readonly requiredGrants: ReadonlyArray<Grant>;
  readonly metadata: Readonly<Record<string, SemanticValue>>;
  readonly input: StandardSchemaV1;
  readonly jsonSchema?: Readonly<Record<string, unknown>>;
};

export type ResourceVersionProvider = {
  readonly getVersion: (resource: ResourceId) => ResourceVersion | undefined;
  readonly bumpVersion?: (resource: ResourceId) => ResourceVersion;
};

export type PolicyRequest = {
  readonly action: ActionDescriptor;
  readonly actor: Actor;
  readonly principal?: Principal;
  readonly transport: Transport;
  readonly controls: ControlSettings;
  readonly runId: string;
  readonly taskId: string;
};

export type Policy = (
  request: PolicyRequest,
) => MaybePromise<PolicyDecision>;

export type RunMeta = {
  readonly actor?: Actor;
  readonly principal?: Principal;
  readonly transport?: Transport;
  readonly idempotencyKey?: string;
  readonly runId?: string;
  readonly taskId?: string;
  readonly signal?: AbortSignal;
};

/**
 * Controls how long a caller waits for a recorded action to leave a pending
 * state. Waiting never removes or rewrites the underlying receipt.
 */
export type WaitForActionOptions = {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

export type RunSuccess<Output> = {
  readonly ok: true;
  readonly actionId: string;
  readonly status: ActionStatus;
  readonly summary: string;
  readonly output?: Output;
  readonly requiresApproval?: boolean;
};

export type RunFailure = {
  readonly ok: false;
  readonly actionId?: string;
  readonly status?: ActionStatus;
  readonly code: string;
  readonly error: string;
};

export type RunResult<Output = unknown> = RunSuccess<Output> | RunFailure;

export type ReceiptResource = {
  readonly id: ResourceId;
  readonly beforeVersion?: ResourceVersion;
  readonly afterVersion?: ResourceVersion;
};

export type ActionReceipt = {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly runId: string;
  readonly taskId: string;
  readonly sequence: number;
  readonly action: {
    readonly name: string;
    readonly version: string;
    readonly title: string;
    readonly kind: "read" | "write";
    readonly risk?: Risk;
    readonly recovery: RecoveryKind | "none";
  };
  readonly actor: Actor;
  readonly principal?: Principal;
  readonly transport: Transport;
  readonly input?: Readonly<Record<string, SemanticValue>>;
  readonly policyDecision: PolicyDecision;
  readonly summary: string;
  readonly changes: ReadonlyArray<SemanticChange>;
  readonly details?: Readonly<Record<string, string>>;
  readonly resources: ReadonlyArray<ReceiptResource>;
  readonly status: ActionStatus;
  readonly idempotencyKey: string;
  readonly proposedAt: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly reversesReceiptId?: string;
  readonly reversedByReceiptId?: string;
};

export type JournalEvent = {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly receiptId: string;
  readonly sequence: number;
  readonly type: ActionStatus;
  readonly actor: Actor;
  readonly at: string;
  readonly errorCode?: string;
};

export type PersistedJournal = {
  readonly schemaVersion: 1;
  readonly controls: ControlSettings;
  readonly receipts: ReadonlyArray<ActionReceipt>;
  readonly events: ReadonlyArray<JournalEvent>;
};

export type JournalStoreResult<Value = void> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly code: string; readonly message: string };

export type JournalStore = {
  readonly load: () => JournalStoreResult<unknown | undefined>;
  readonly save: (journal: PersistedJournal) => JournalStoreResult;
  readonly clear: () => JournalStoreResult;
};

export type RemySnapshot = {
  readonly receipts: ReadonlyArray<ActionReceipt>;
  readonly events: ReadonlyArray<JournalEvent>;
  readonly controls: ControlSettings;
  readonly activePrincipal?: Principal;
  readonly pendingControlRequest?: ControlRequest;
};

export type RestoreResult =
  | { readonly ok: true; readonly restored: number }
  | { readonly ok: false; readonly code: string; readonly error: string };

export type IdGenerator = (kind: "receipt" | "event" | "control") => string;
export type Clock = () => Date;
