import { decidePolicy } from "./policy";
import type {
  ActionEvent,
  ActionReceipt,
  ActionRecord,
  AgentIdentity,
  AnyActionDefinition,
  AutonomyLevel,
  ControlRequest,
  ControlSettings,
  EngineSnapshot,
  EngineStateAdapter,
  PersistedEngineSnapshot,
  RunMeta,
  RunResult,
} from "./types";

type EngineOptions<State> = {
  taskId?: string;
  runId?: string;
  autonomy?: AutonomyLevel;
  allowPurchases?: boolean;
  onPersist?: (snapshot: PersistedEngineSnapshot<State>) => void;
};

type Listener = () => void;

function now() {
  return new Date().toISOString();
}

function reverseDiff(receipt: ActionReceipt) {
  return receipt.diff.map((entry) => ({
    ...entry,
    kind:
      entry.kind === "add"
        ? ("remove" as const)
        : entry.kind === "remove"
          ? ("add" as const)
          : entry.kind,
    before: entry.after,
    after: entry.before,
    displayBefore: entry.displayAfter,
    displayAfter: entry.displayBefore,
  }));
}

export class RemyEngine<State> {
  private readonly actions = new Map<string, AnyActionDefinition<State>>();
  private records: ActionRecord[] = [];
  private events: ActionEvent[] = [];
  private autonomy: AutonomyLevel;
  private paused = false;
  private allowPurchases: boolean;
  private activeAgent?: AgentIdentity;
  private pendingControlRequest?: ControlRequest;
  private listeners = new Set<Listener>();
  private actionCounter = 0;
  private eventCounter = 0;
  private controlRequestCounter = 0;
  private readonly idempotency = new Map<string, string>();
  private readonly taskId: string;
  private readonly runId: string;
  private readonly onPersist?: (
    snapshot: PersistedEngineSnapshot<State>,
  ) => void;

  constructor(
    private readonly stateAdapter: EngineStateAdapter<State>,
    options: EngineOptions<State> = {},
  ) {
    this.autonomy = options.autonomy ?? "reversible";
    this.allowPurchases = options.allowPurchases ?? false;
    this.taskId = options.taskId ?? "return-order-1842";
    this.runId = options.runId ?? "remy-demo-run";
    this.onPersist = options.onPersist;
  }

  register(action: AnyActionDefinition<State>) {
    if (this.actions.has(action.name)) {
      throw new Error(`Action \"${action.name}\" is already registered.`);
    }
    this.actions.set(action.name, action);
    return this;
  }

  listActions() {
    return Array.from(this.actions.values());
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): EngineSnapshot<State> => ({
    state: this.stateAdapter.getState(),
    receipts: this.getReceipts(),
    events: [...this.events],
    autonomy: this.autonomy,
    paused: this.paused,
    allowPurchases: this.allowPurchases,
    activeAgent: this.activeAgent,
    pendingControlRequest: this.pendingControlRequest,
  });

  getServerSnapshot = this.getSnapshot;

  getPersistedSnapshot = (): PersistedEngineSnapshot<State> => ({
    state: this.stateAdapter.getState(),
    records: [...this.records],
    events: [...this.events],
    autonomy: this.autonomy,
    paused: this.paused,
    allowPurchases: this.allowPurchases,
  });

  restore(snapshot: PersistedEngineSnapshot<State>) {
    this.stateAdapter.setState(snapshot.state);
    this.records = snapshot.records ?? [];
    this.events = snapshot.events ?? [];
    this.autonomy = snapshot.autonomy ?? "reversible";
    this.paused = snapshot.paused ?? false;
    this.allowPurchases = snapshot.allowPurchases ?? false;
    this.actionCounter = this.records.length;
    this.eventCounter = this.events.length;
    this.records.forEach((record) =>
      this.idempotency.set(record.idempotencyKey, record.id),
    );
    this.emit(false);
  }

  setAutonomy(level: AutonomyLevel) {
    this.autonomy = level;
    this.emit();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.emit();
  }

  setAllowPurchases(allowPurchases: boolean) {
    this.allowPurchases = allowPurchases;
    this.emit();
  }

  setControls(controls: ControlSettings) {
    this.autonomy = controls.autonomy;
    this.paused = controls.paused;
    this.allowPurchases = controls.allowPurchases;
    this.pendingControlRequest = undefined;
    this.emit();
  }

  identifyAgent(identity: Omit<AgentIdentity, "selfReported">) {
    this.activeAgent = { ...identity, selfReported: true };
    this.emit(false);
  }

  requestControlChange(controls: ControlSettings) {
    this.controlRequestCounter += 1;
    this.pendingControlRequest = {
      id: `control-${String(this.controlRequestCounter).padStart(3, "0")}`,
      controls,
      requestedAt: now(),
      requestedBy: this.activeAgent,
    };
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
    this.records = [];
    this.events = [];
    this.idempotency.clear();
    this.actionCounter = 0;
    this.eventCounter = 0;
    this.autonomy = "reversible";
    this.paused = false;
    this.allowPurchases = false;
    this.activeAgent = undefined;
    this.pendingControlRequest = undefined;
    this.controlRequestCounter = 0;
    this.stateAdapter.reset();
    this.emit();
  }

  async run(
    actionName: string,
    rawInput: unknown,
    meta: RunMeta = {},
  ): Promise<RunResult> {
    const action = this.actions.get(actionName);
    if (!action) {
      return {
        ok: false,
        code: "ACTION_NOT_FOUND",
        error: `No Remy action named \"${actionName}\" is registered.`,
      };
    }

    const idempotencyKey =
      meta.idempotencyKey ?? `${this.runId}:${actionName}:${this.actionCounter + 1}`;
    const existingId = this.idempotency.get(idempotencyKey);
    if (existingId) {
      const existing = this.getReceipt(existingId);
      if (!existing) {
        return {
          ok: false,
          code: "RECEIPT_NOT_FOUND",
          error: "The idempotent result could not be restored.",
        };
      }
      return {
        ok: true,
        actionId: existing.id,
        status: existing.status,
        summary: existing.preview.summary,
        output: existing.output,
        requiresApproval: existing.status === "awaiting_approval",
      };
    }

    const parsed = action.inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
        .join("; ");
      const actionId = this.nextActionId();
      const failedRecord: ActionRecord = {
        id: actionId,
        runId: this.runId,
        taskId: this.taskId,
        sequence: this.records.length + 1,
        actionName,
        title: action.title,
        actor: meta.actor ?? "agent",
        agent:
          (meta.actor ?? "agent") === "agent"
            ? (meta.agent ?? this.activeAgent)
            : undefined,
        transport: meta.transport ?? "manual",
        input: rawInput,
        inputSummary: "Input validation failed",
        preview: {
          summary: "Remy rejected invalid action input.",
          resourceKeys: [],
          diff: [],
        },
        before: undefined,
        after: undefined,
        diff: [],
        risk: action.risk,
        reversibility: action.reversibility,
        policyDecision: {
          outcome: "deny",
          reason: "Runtime input validation failed before preview or execution.",
        },
        resourceKeys: [],
        beforeVersions: {},
        idempotencyKey,
        proposedAt: now(),
      };
      this.records.push(failedRecord);
      this.idempotency.set(idempotencyKey, actionId);
      this.appendEvent(actionId, "proposed", failedRecord.actor);
      this.appendEvent(
        actionId,
        "failed",
        "system",
        undefined,
        "INVALID_INPUT",
        message,
      );
      this.emit();
      return {
        ok: false,
        actionId,
        status: "failed",
        code: "INVALID_INPUT",
        error: message,
      };
    }

    const actor = meta.actor ?? "agent";
    const transport = meta.transport ?? "manual";
    let preview;
    try {
      preview = await action.preview(parsed.data, this.stateAdapter);
    } catch (error) {
      return {
        ok: false,
        code: "PREVIEW_FAILED",
        error: error instanceof Error ? error.message : "The preview failed.",
      };
    }

    const decision =
      actor === "user"
        ? ({
            outcome: "allow",
            reason: "The customer requested this directly in the website UI.",
          } as const)
        : decidePolicy(
            action,
            this.autonomy,
            this.paused,
            this.allowPurchases,
          );
    const actionId = this.nextActionId();
    const proposedAt = now();
    const record: ActionRecord = {
      id: actionId,
      runId: this.runId,
      taskId: this.taskId,
      sequence: this.records.length + 1,
      actionName,
      title: action.title,
      actor,
      agent: actor === "agent" ? (meta.agent ?? this.activeAgent) : undefined,
      transport,
      input: parsed.data,
      inputSummary:
        action.summarizeInput?.(parsed.data) ?? preview.summary,
      preview,
      before: preview.before,
      after: preview.after,
      diff: preview.diff,
      risk: action.risk,
      reversibility: action.reversibility,
      policyDecision: decision,
      resourceKeys: preview.resourceKeys,
      beforeVersions: Object.fromEntries(
        preview.resourceKeys.map((key) => [key, this.stateAdapter.getVersion(key)]),
      ),
      idempotencyKey,
      proposedAt,
    };

    this.records.push(record);
    this.idempotency.set(idempotencyKey, actionId);
    this.appendEvent(actionId, "proposed", actor);

    if (decision.outcome === "deny") {
      this.appendEvent(actionId, "denied", "system", {
        reason: decision.reason,
      });
      this.emit();
      return {
        ok: false,
        actionId,
        status: "denied",
        code: "POLICY_DENIED",
        error: decision.reason,
      };
    }

    if (decision.outcome === "stage") {
      this.appendEvent(actionId, "staged", actor);
      this.emit();
      return {
        ok: true,
        actionId,
        status: "staged",
        summary: preview.summary,
      };
    }

    if (decision.outcome === "require_approval") {
      this.appendEvent(actionId, "awaiting_approval", actor);
      this.emit();
      return {
        ok: true,
        actionId,
        status: "awaiting_approval",
        summary: preview.summary,
        requiresApproval: true,
      };
    }

    return this.executeRecord(record, action, parsed.data);
  }

  async approve(actionId: string): Promise<RunResult> {
    const receipt = this.getReceipt(actionId);
    if (!receipt || !["awaiting_approval", "staged"].includes(receipt.status)) {
      return {
        ok: false,
        actionId,
        code: "NOT_AWAITING_APPROVAL",
        error: "This action is no longer waiting for approval.",
      };
    }
    const action = this.actions.get(receipt.actionName);
    if (!action) {
      return {
        ok: false,
        actionId,
        code: "ACTION_NOT_FOUND",
        error: "The action definition is no longer registered.",
      };
    }
    const changedResource = receipt.resourceKeys.find(
      (key) => this.stateAdapter.getVersion(key) !== receipt.beforeVersions[key],
    );
    if (changedResource) {
      const message =
        "This approval is out of date because the page changed. Ask the assistant to prepare it again.";
      this.appendEvent(
        actionId,
        "failed",
        "system",
        { resourceKey: changedResource },
        "STALE_APPROVAL",
        message,
      );
      this.emit();
      return {
        ok: false,
        actionId,
        status: "failed",
        code: "STALE_APPROVAL",
        error: message,
      };
    }
    return this.executeRecord(receipt, action, receipt.input, "user");
  }

  reject(actionId: string): RunResult {
    const receipt = this.getReceipt(actionId);
    if (!receipt || !["awaiting_approval", "staged"].includes(receipt.status)) {
      return {
        ok: false,
        actionId,
        code: "NOT_AWAITING_APPROVAL",
        error: "This action is no longer waiting for approval.",
      };
    }
    this.appendEvent(actionId, "rejected", "user");
    this.emit();
    return {
      ok: true,
      actionId,
      status: "rejected",
      summary: receipt.preview.summary,
    };
  }

  async revert(actionId: string, meta: RunMeta = {}): Promise<RunResult> {
    const receipt = this.getReceipt(actionId);
    if (!receipt || receipt.status !== "committed") {
      return {
        ok: false,
        actionId,
        code: "NOT_REVERSIBLE_NOW",
        error: "Only a committed action can be reversed.",
      };
    }
    if (receipt.reversibility === "irreversible") {
      return {
        ok: false,
        actionId,
        code: "IRREVERSIBLE",
        error: "This action cannot be undone.",
      };
    }
    const actor = meta.actor ?? "user";
    if (actor === "agent" && this.paused) {
      return {
        ok: false,
        actionId,
        code: "POLICY_DENIED",
        error: "AI changes are off.",
      };
    }
    if (
      actor === "agent" &&
      (this.autonomy === "ask" || this.autonomy === "preview")
    ) {
      return {
        ok: false,
        actionId,
        code: "APPROVAL_REQUIRED",
        error: "This setting requires the user to reverse the change in Remy.",
      };
    }
    const conflict = receipt.resourceKeys.find(
      (key) => this.stateAdapter.getVersion(key) !== receipt.afterVersions?.[key],
    );
    if (conflict) {
      return {
        ok: false,
        actionId,
        code: "VERSION_CONFLICT",
        error: "Cannot safely undo because this item changed later.",
      };
    }

    const action = this.actions.get(receipt.actionName);
    if (!action) {
      return {
        ok: false,
        actionId,
        code: "ACTION_NOT_FOUND",
        error: "The original action definition is unavailable.",
      };
    }

    const reversalId = this.nextActionId();
    const isCompensation = receipt.reversibility === "compensating";
    const reversalTitle = isCompensation
      ? receipt.actionName === "book_collection"
        ? "Cancelled collection"
        : `Reversed ${receipt.title.toLowerCase()}`
      : receipt.actionName === "update_collection_address"
        ? "Restored collection address"
        : `Undid ${receipt.title.toLowerCase()}`;
    const reversalRecord: ActionRecord = {
      ...receipt,
      id: reversalId,
      sequence: this.records.length + 1,
      actionName: isCompensation
        ? `compensate_${receipt.actionName}`
        : `revert_${receipt.actionName}`,
      title: reversalTitle,
      actor,
      agent: actor === "agent" ? (meta.agent ?? this.activeAgent) : undefined,
      transport: meta.transport ?? "internal",
      input: { receiptId: receipt.id },
      inputSummary: `${isCompensation ? "Compensate" : "Undo"} ${receipt.title}`,
      preview: {
        summary: isCompensation
          ? `${reversalTitle}; the original remains in history.`
          : `${reversalTitle} to its previous value.`,
        resourceKeys: receipt.resourceKeys,
        before: receipt.after,
        after: receipt.before,
        diff: reverseDiff(receipt),
      },
      before: receipt.after,
      after: receipt.before,
      diff: reverseDiff(receipt),
      output: undefined,
      policyDecision: {
        outcome: "allow",
        reason:
          actor === "user"
            ? "The user explicitly requested this reversal."
            : "The current Remy setting allows this reversible AI change.",
      },
      beforeVersions: Object.fromEntries(
        receipt.resourceKeys.map((key) => [key, this.stateAdapter.getVersion(key)]),
      ),
      afterVersions: undefined,
      idempotencyKey: `${receipt.id}:reversal`,
      reversesReceiptId: receipt.id,
      proposedAt: now(),
    };

    this.records.push(reversalRecord);
    this.idempotency.set(reversalRecord.idempotencyKey, reversalId);
    this.appendEvent(receipt.id, "revert_requested", actor);
    this.appendEvent(reversalId, "proposed", actor);
    this.appendEvent(reversalId, "reverting", actor);
    this.emit();

    try {
      const handler = isCompensation ? action.compensate : action.undo;
      if (!handler) {
        throw new Error("This action does not provide a reversal handler.");
      }
      const output = await handler(receipt, this.stateAdapter, {
        actor,
        transport: meta.transport ?? "internal",
        actionId: reversalId,
        idempotencyKey: reversalRecord.idempotencyKey,
      });
      reversalRecord.output = output;
      reversalRecord.afterVersions = Object.fromEntries(
        receipt.resourceKeys.map((key) => [key, this.stateAdapter.bumpVersion(key)]),
      );
      const originalStatus = isCompensation ? "compensated" : "reverted";
      this.appendEvent(reversalId, "committed", actor);
      this.appendEvent(receipt.id, originalStatus, "system", {
        reversedByReceiptId: reversalId,
      });
      this.emit();
      return {
        ok: true,
        actionId: reversalId,
        status: "committed",
        summary: reversalRecord.preview.summary,
        output,
      };
    } catch (error) {
      this.appendEvent(
        reversalId,
        "failed",
        "system",
        undefined,
        "REVERSAL_FAILED",
        error instanceof Error ? error.message : "The reversal failed.",
      );
      this.emit();
      return {
        ok: false,
        actionId: reversalId,
        status: "failed",
        code: "REVERSAL_FAILED",
        error: error instanceof Error ? error.message : "The reversal failed.",
      };
    }
  }

  simulateVersionConflict(resourceKey: string) {
    this.stateAdapter.bumpVersion(resourceKey);
    this.emit();
  }

  canRevert(receipt: ActionReceipt) {
    if (receipt.status !== "committed" || receipt.reversibility === "irreversible") {
      return { allowed: false, reason: "This action cannot be reversed." };
    }
    const conflict = receipt.resourceKeys.some(
      (key) => this.stateAdapter.getVersion(key) !== receipt.afterVersions?.[key],
    );
    return conflict
      ? {
          allowed: false,
          reason: "Cannot safely undo because this item changed later.",
        }
      : { allowed: true };
  }

  private async executeRecord(
    record: ActionRecord,
    action: AnyActionDefinition<State>,
    input: unknown,
    actor = record.actor,
  ): Promise<RunResult> {
    this.appendEvent(record.id, "executing", actor);
    this.emit();
    try {
      const output = await action.execute(input, this.stateAdapter, {
        actor,
        transport: record.transport,
        actionId: record.id,
        idempotencyKey: record.idempotencyKey,
      });
      record.output = output;
      record.afterVersions = Object.fromEntries(
        record.resourceKeys.map((key) => [
          key,
          action.kind === "mutation"
            ? this.stateAdapter.bumpVersion(key)
            : this.stateAdapter.getVersion(key),
        ]),
      );
      this.appendEvent(record.id, "committed", actor);
      this.emit();
      return {
        ok: true,
        actionId: record.id,
        status: "committed",
        summary: record.preview.summary,
        output,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The action failed to execute.";
      this.appendEvent(
        record.id,
        "failed",
        "system",
        undefined,
        "EXECUTION_FAILED",
        message,
      );
      this.emit();
      return {
        ok: false,
        actionId: record.id,
        status: "failed",
        code: "EXECUTION_FAILED",
        error: message,
      };
    }
  }

  private getReceipts(): ActionReceipt[] {
    return this.records.map((record) => {
      const events = this.events.filter((event) => event.actionId === record.id);
      const latest = events.at(-1);
      const completion = [...events]
        .reverse()
        .find((event) =>
          [
            "committed",
            "failed",
            "rejected",
            "denied",
            "reverted",
            "compensated",
          ].includes(event.type),
        );
      const reversalEvent = [...events]
        .reverse()
        .find((event) => ["reverted", "compensated"].includes(event.type));
      return {
        ...record,
        status: latest?.type ?? "proposed",
        completedAt: completion?.at,
        reversedByReceiptId: reversalEvent?.data?.reversedByReceiptId as
          | string
          | undefined,
      };
    });
  }

  private getReceipt(actionId: string) {
    return this.getReceipts().find((receipt) => receipt.id === actionId);
  }

  private nextActionId() {
    this.actionCounter += 1;
    return `remy-${String(this.actionCounter).padStart(3, "0")}`;
  }

  private appendEvent(
    actionId: string,
    type: ActionEvent["type"],
    actor: ActionEvent["actor"],
    data?: Record<string, unknown>,
    errorCode?: string,
    errorMessage?: string,
  ) {
    this.eventCounter += 1;
    this.events.push({
      id: `event-${String(this.eventCounter).padStart(3, "0")}`,
      actionId,
      sequence: this.eventCounter,
      type,
      actor,
      at: now(),
      data,
      error:
        errorCode && errorMessage
          ? { code: errorCode, message: errorMessage }
          : undefined,
    });
  }

  private emit(persist = true) {
    if (persist) {
      this.onPersist?.(this.getPersistedSnapshot());
    }
    this.listeners.forEach((listener) => listener());
  }
}
