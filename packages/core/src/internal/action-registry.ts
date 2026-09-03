import type {
  ActionDefinition,
  ActionDescriptor,
  ActionPreview,
  InvocationMeta,
  OperationResult,
  ReadActionPreview,
  RecoveryReceipt,
  SemanticValue,
  StandardSchemaIssue,
  StandardSchemaV1,
} from "../public-types";

export type ValidationResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly issues: ReadonlyArray<StandardSchemaIssue> };

export type InternalAction<Context> = {
  readonly source: object;
  readonly descriptor: ActionDescriptor;
  readonly validate: (input: unknown) => Promise<ValidationResult>;
  readonly preview: (args: {
    readonly input: unknown;
    readonly context: Context;
    readonly meta: InvocationMeta;
  }) => Promise<ReadActionPreview | ActionPreview<unknown>>;
  readonly execute: (args: {
    readonly input: unknown;
    readonly context: Context;
    readonly meta: InvocationMeta;
  }) => Promise<OperationResult<unknown>>;
  readonly recover?: (args: {
    readonly receipt: RecoveryReceipt<unknown>;
    readonly output: unknown;
    readonly context: Context;
    readonly meta: InvocationMeta;
  }) => Promise<OperationResult<unknown>>;
  readonly redactInput?: (
    input: unknown,
  ) => Readonly<Record<string, SemanticValue>>;
  readonly exposeOutput?: (output: unknown) => unknown;
};

export function eraseAction<
  Context,
  Schema extends StandardSchemaV1,
  Output,
  RecoveryData,
  RecoveryOutput,
>(
  definition: ActionDefinition<
    Context,
    Schema,
    Output,
    RecoveryData,
    RecoveryOutput
  >,
): InternalAction<Context> {
  const recovery = definition.kind === "read" ? "none" : definition.recovery.kind;
  const recoveryHandler =
    definition.kind === "write" && definition.recovery.kind !== "irreversible"
      ? definition.recovery.execute
      : undefined;
  const descriptor: ActionDescriptor = Object.freeze({
    name: definition.name,
    version: definition.version ?? "1",
    title: definition.title,
    description: definition.description,
    kind: definition.kind,
    risk: definition.kind === "write" ? definition.risk : undefined,
    recovery,
    automaticCompensation:
      definition.kind === "write" &&
      definition.recovery.kind === "compensating" &&
      definition.recovery.automatic === true,
    approval:
      definition.kind === "write" ? definition.approval ?? "policy" : "policy",
    requiredGrants: Object.freeze([...(definition.requiredGrants ?? [])]),
    metadata: Object.freeze({ ...(definition.metadata ?? {}) }),
    input: definition.input,
    jsonSchema: definition.jsonSchema,
  });

  return {
    source: definition,
    descriptor,
    validate: async (rawInput) => {
      const result = await definition.input["~standard"].validate(rawInput);
      return result.issues
        ? { ok: false, issues: result.issues }
        : { ok: true, value: result.value };
    },
    preview: async ({ input, context, meta }) =>
      definition.preview({
        // Standard Schema validation has produced Schema's output type here.
        // This is the only input-erasure boundary in the registry.
        input: input as never,
        context,
        meta,
      }),
    execute: async ({ input, context, meta }) =>
      definition.execute({ input: input as never, context, meta }),
    recover: recoveryHandler
        ? async ({ receipt, output, context, meta }) =>
            recoveryHandler({
              receipt: receipt as RecoveryReceipt<never>,
              output: output as never,
              context,
              meta,
            })
        : undefined,
    redactInput: definition.redactInput
      ? (input) => definition.redactInput?.(input as never) ?? {}
      : undefined,
    exposeOutput: definition.exposeOutput
      ? (output) => definition.exposeOutput?.(output as never)
      : undefined,
  };
}
