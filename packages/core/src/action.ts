import type {
  ActionDefinition,
  CompensatingActionDefinition,
  ExactActionDefinition,
  IrreversibleActionDefinition,
  OperationFailure,
  OperationSuccess,
  ReadActionDefinition,
  StandardSchemaV1,
} from "./public-types";

const ACTION_NAME = /^[a-z][a-z0-9_]{1,63}$/;

export type ActionBuilder<Context> = {
  <Schema extends StandardSchemaV1, Output>(
    definition: ReadActionDefinition<Context, Schema, Output>,
  ): ReadActionDefinition<Context, Schema, Output>;
  <
    Schema extends StandardSchemaV1,
    Output,
    RecoveryData,
    RecoveryOutput,
  >(
    definition: ExactActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >,
  ): ExactActionDefinition<
    Context,
    Schema,
    Output,
    RecoveryData,
    RecoveryOutput
  >;
  <
    Schema extends StandardSchemaV1,
    Output,
    RecoveryData,
    RecoveryOutput,
  >(
    definition: CompensatingActionDefinition<
      Context,
      Schema,
      Output,
      RecoveryData,
      RecoveryOutput
    >,
  ): CompensatingActionDefinition<
    Context,
    Schema,
    Output,
    RecoveryData,
    RecoveryOutput
  >;
  <Schema extends StandardSchemaV1, Output>(
    definition: IrreversibleActionDefinition<Context, Schema, Output>,
  ): IrreversibleActionDefinition<Context, Schema, Output>;
};

function assertDefinition(definition: ActionDefinition<unknown>) {
  if (!ACTION_NAME.test(definition.name)) {
    throw new Error(
      `Invalid Remy action name "${definition.name}". Use 2-64 lowercase letters, numbers, or underscores, beginning with a letter.`,
    );
  }
  if (!definition.title.trim()) {
    throw new Error(`Action "${definition.name}" needs a readable title.`);
  }
  if (definition.title.length > 160) {
    throw new Error(`Action "${definition.name}" title must be 160 characters or fewer.`);
  }
  if (!definition.description.trim()) {
    throw new Error(`Action "${definition.name}" needs a tool description.`);
  }
  if (definition.description.length > 1_000) {
    throw new Error(`Action "${definition.name}" description must be 1,000 characters or fewer.`);
  }
  if (definition.version !== undefined && (!definition.version.trim() || definition.version.length > 32)) {
    throw new Error(`Action "${definition.name}" version must be 1-32 characters.`);
  }
  if (typeof definition.input?.["~standard"]?.validate !== "function") {
    throw new Error(
      `Action "${definition.name}" input must implement Standard Schema V1.`,
    );
  }
  if (definition.kind === "write" && definition.recovery.kind !== "irreversible") {
    if (typeof definition.recovery.execute !== "function") {
      throw new Error(
        `Action "${definition.name}" declares ${definition.recovery.kind} recovery but has no recovery handler.`,
      );
    }
  }
}

export function createActionBuilder<Context>(): ActionBuilder<Context> {
  const builder = (definition: ActionDefinition<Context>) => {
    // Validation is intentionally centralized here so configuration errors fail
    // during application startup rather than during an agent request.
    assertDefinition(definition as ActionDefinition<unknown>);
    return Object.freeze(definition);
  };
  return builder as ActionBuilder<Context>;
}

export const defineAction = createActionBuilder<void>();

export function succeed<Output>(value: Output): OperationSuccess<Output> {
  return { ok: true, value };
}

export function fail(code: string, message: string): OperationFailure {
  return { ok: false, code, message };
}
