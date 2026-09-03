import type {
  ActionReceipt,
  ActionStatus,
  Actor,
  AutonomyLevel,
  ControlSettings,
  JournalEvent,
  JournalStore,
  JournalStoreResult,
  PersistedJournal,
  PolicyDecision,
  Principal,
  ReceiptResource,
  RecoveryKind,
  Risk,
  SemanticChange,
  SemanticValue,
} from "./public-types";

const ACTION_STATUSES = new Set<ActionStatus>([
  "proposed", "staged", "awaiting_approval", "executing", "committed",
  "revert_requested", "reverting", "reverted", "compensated", "rejected",
  "denied", "failed",
]);
const ACTORS = new Set<Actor>(["agent", "user", "system"]);
const AUTONOMY = new Set<AutonomyLevel>([
  "preview", "ask", "reversible", "trusted",
]);
const RECOVERY = new Set<RecoveryKind | "none">([
  "exact", "compensating", "irreversible", "none",
]);
const RISKS = new Set<Risk>(["low", "medium", "high"]);
const MAX_RECEIPTS = 2_000;
const MAX_EVENTS = 10_000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function ok<Value>(value: Value): JournalStoreResult<Value> {
  return { ok: true, value };
}

function storeFailure(code: string, error: unknown): JournalStoreResult<never> {
  return {
    ok: false,
    code,
    message: error instanceof Error ? error.message : "Browser storage failed.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: ReadonlyArray<string>) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isString(value: unknown, max = 512): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isOptionalString(value: unknown, max = 512) {
  return value === undefined || isString(value, max);
}

function isSemanticValue(value: unknown): value is SemanticValue {
  return value === null || typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean";
}

function isSemanticRecord(value: unknown, maxEntries = 32) {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= maxEntries && entries.every(
    ([key, entry]) => key.length <= 96 && isSemanticValue(entry),
  );
}

function isStringRecord(value: unknown, maxEntries = 32) {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= maxEntries && entries.every(
    ([key, entry]) => key.length <= 96 && typeof entry === "string" && entry.length <= 512,
  );
}

function isPrincipal(value: unknown): value is Principal {
  if (!isRecord(value)) return false;
  return hasOnlyKeys(value, ["id", "name", "provider", "assurance", "attributes"]) &&
    isString(value.id, 256) && isOptionalString(value.name, 96) &&
    isOptionalString(value.provider, 96) &&
    ["self-reported", "authenticated", "verified"].includes(String(value.assurance)) &&
    (value.attributes === undefined || isSemanticRecord(value.attributes, 16));
}

function isPolicyDecision(value: unknown): value is PolicyDecision {
  if (!isRecord(value) || !isString(value.reason, 1_000)) return false;
  return hasOnlyKeys(value, ["outcome", "reason"]) &&
    ["allow", "require_approval", "stage", "deny"].includes(String(value.outcome));
}

function isChange(value: unknown): value is SemanticChange {
  if (!isRecord(value) || !isString(value.label, 160)) return false;
  return hasOnlyKeys(value, ["label", "path", "kind", "before", "after"]) &&
    isOptionalString(value.path, 256) &&
    (value.kind === undefined || ["add", "remove", "replace", "status"].includes(String(value.kind))) &&
    (value.before === undefined || isSemanticValue(value.before)) &&
    (value.after === undefined || isSemanticValue(value.after));
}

function isResource(value: unknown): value is ReceiptResource {
  if (!isRecord(value) || !isString(value.id, 256)) return false;
  const validVersion = (version: unknown) => version === undefined ||
    (typeof version === "string" && version.length <= 512) ||
    (typeof version === "number" && Number.isFinite(version));
  return hasOnlyKeys(value, ["id", "beforeVersion", "afterVersion"]) &&
    validVersion(value.beforeVersion) && validVersion(value.afterVersion);
}

function isReceipt(value: unknown): value is ActionReceipt {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.action)) return false;
  const action = value.action;
  const validAction = hasOnlyKeys(action, ["name", "version", "title", "kind", "risk", "recovery"]) &&
    isString(action.name, 64) && isString(action.version, 32) &&
    isString(action.title, 160) && (action.kind === "read" || action.kind === "write") &&
    RECOVERY.has(action.recovery as RecoveryKind | "none") &&
    (action.risk === undefined || RISKS.has(action.risk as Risk));
  return Boolean(hasOnlyKeys(value, [
    "schemaVersion", "id", "runId", "taskId", "sequence", "action", "actor",
    "principal", "transport", "input", "policyDecision", "summary", "changes",
    "details", "resources", "status", "idempotencyKey", "proposedAt",
    "completedAt", "durationMs", "errorCode", "reversesReceiptId",
    "reversedByReceiptId",
  ]) && validAction && isString(value.id, 256) && isString(value.runId, 256) &&
    isString(value.taskId, 256) && Number.isInteger(value.sequence) && Number(value.sequence) > 0 &&
    ACTORS.has(value.actor as Actor) &&
    (value.principal === undefined || isPrincipal(value.principal)) &&
    isString(value.transport, 96) &&
    (value.input === undefined || isSemanticRecord(value.input)) &&
    isPolicyDecision(value.policyDecision) && isString(value.summary, 1_000) &&
    Array.isArray(value.changes) && value.changes.length <= 64 && value.changes.every(isChange) &&
    (value.details === undefined || isStringRecord(value.details)) &&
    Array.isArray(value.resources) && value.resources.length <= 64 && value.resources.every(isResource) &&
    ACTION_STATUSES.has(value.status as ActionStatus) && isString(value.idempotencyKey, 512) &&
    isString(value.proposedAt, 64) && isOptionalString(value.completedAt, 64) &&
    (value.durationMs === undefined || (typeof value.durationMs === "number" && value.durationMs >= 0)) &&
    isOptionalString(value.errorCode, 96) && isOptionalString(value.reversesReceiptId, 256) &&
    isOptionalString(value.reversedByReceiptId, 256));
}

function isEvent(value: unknown): value is JournalEvent {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  return Boolean(hasOnlyKeys(value, [
    "schemaVersion", "id", "receiptId", "sequence", "type", "actor", "at", "errorCode",
  ]) && isString(value.id, 256) && isString(value.receiptId, 256) &&
    Number.isInteger(value.sequence) && ACTION_STATUSES.has(value.type as ActionStatus) &&
    ACTORS.has(value.actor as Actor) && isString(value.at, 64) &&
    isOptionalString(value.errorCode, 96));
}

function isControls(value: unknown): value is ControlSettings {
  if (!isRecord(value)) return false;
  return hasOnlyKeys(value, ["autonomy", "paused", "grants"]) &&
    AUTONOMY.has(value.autonomy as AutonomyLevel) && typeof value.paused === "boolean" &&
    Array.isArray(value.grants) && value.grants.length <= 128 &&
    value.grants.every((grant) => isString(grant, 160));
}

export function parsePersistedJournal(value: unknown): JournalStoreResult<PersistedJournal> {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    return { ok: false, code: "INVALID_JOURNAL_VERSION", message: "The stored Remy journal is missing schemaVersion 1." };
  }
  if (!hasOnlyKeys(value, ["schemaVersion", "controls", "receipts", "events"]) ||
    !isControls(value.controls) || !Array.isArray(value.receipts) ||
    value.receipts.length > MAX_RECEIPTS || !value.receipts.every(isReceipt) ||
    !Array.isArray(value.events) || value.events.length > MAX_EVENTS || !value.events.every(isEvent)) {
    return { ok: false, code: "INVALID_JOURNAL", message: "The stored Remy journal failed schema validation." };
  }
  return ok(value as PersistedJournal);
}

export function createMemoryJournalStore(initial?: unknown): JournalStore {
  let value = initial;
  return {
    load: () => ok(value),
    save: (journal) => {
      value = structuredClone(journal);
      return ok(undefined);
    },
    clear: () => {
      value = undefined;
      return ok(undefined);
    },
  };
}

export function createBrowserJournalStore(options: {
  readonly namespace: string;
  readonly storage?: StorageLike;
}): JournalStore {
  const key = `${options.namespace}:journal:v1`;
  const getStorage = () => options.storage ?? globalThis.localStorage;
  return {
    load: () => {
      try {
        const raw = getStorage().getItem(key);
        return ok(raw === null ? undefined : JSON.parse(raw));
      } catch (error) {
        return storeFailure("JOURNAL_READ_FAILED", error);
      }
    },
    save: (journal) => {
      try {
        getStorage().setItem(key, JSON.stringify(journal));
        return ok(undefined);
      } catch (error) {
        return storeFailure("JOURNAL_WRITE_FAILED", error);
      }
    },
    clear: () => {
      try {
        getStorage().removeItem(key);
        return ok(undefined);
      } catch (error) {
        return storeFailure("JOURNAL_CLEAR_FAILED", error);
      }
    },
  };
}
