import type { ActionReceipt } from "./types";

export type ActionRunSummary = {
  changes: number;
  automatic: number;
  approvals: number;
  recovered: number;
  unresolved: number;
};

const unresolvedStatuses = new Set([
  "awaiting_approval",
  "staged",
  "denied",
  "failed",
]);

function isStateChanging(receipt: ActionReceipt) {
  // actionKind is present on new receipts. The diff fallback keeps summaries
  // useful for local snapshots created before this field was introduced.
  return receipt.actionKind === "mutation" ||
    (receipt.actionKind === undefined && receipt.diff.length > 0);
}

export function summarizeActionRun(
  receipts: ActionReceipt[],
): ActionRunSummary {
  const changes = receipts.filter(
    (receipt) => isStateChanging(receipt) && !receipt.reversesReceiptId,
  );

  return {
    changes: changes.length,
    automatic: changes.filter(
      (receipt) =>
        receipt.actor === "agent" &&
        receipt.policyDecision.outcome === "allow" &&
        ["committed", "reverted", "compensated"].includes(receipt.status),
    ).length,
    approvals: changes.filter(
      (receipt) => receipt.policyDecision.outcome === "require_approval",
    ).length,
    recovered: changes.filter((receipt) => Boolean(receipt.reversedByReceiptId))
      .length,
    unresolved: changes.filter((receipt) =>
      unresolvedStatuses.has(receipt.status),
    ).length,
  };
}
