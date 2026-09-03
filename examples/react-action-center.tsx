"use client";

import type { RemyClient } from "../src/remy/core";
import { useRemySnapshot } from "../src/remy/react";

export function AgentActivity({ remy }: { readonly remy: RemyClient<unknown> }) {
  const snapshot = useRemySnapshot(remy);
  const agentReceipts = snapshot.receipts.filter(
    (receipt) => receipt.actor === "agent" || receipt.reversesReceiptId,
  );

  return (
    <ol aria-label="Agent activity">
      {agentReceipts.map((receipt) => (
        <li key={receipt.id}>
          {receipt.summary} — {receipt.status}
        </li>
      ))}
    </ol>
  );
}
