"use client";

import { ArrowRight, CircleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import { useDemoRemy } from "@/demo/provider";
import type { ActionReceipt } from "@remy-ai/core";

export function ApprovalView({ receipt }: { receipt: ActionReceipt }) {
  const { approve, reject } = useDemoRemy();
  const isPurchase = receipt.action.name === "place_order";
  const details = Object.entries(receipt.details ?? {});
  const total = receipt.details?.Total;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border-b border-[#19362e]/12 bg-[#ef704f] px-5 py-5 text-[#19362e]"
      aria-labelledby="approval-title"
    >
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#19362e] text-white">
          <CircleAlert className="size-4" />
        </span>
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.11em]">
            Needs your approval
          </p>
          <h3
            id="approval-title"
            className="mt-2 text-xl font-black leading-tight tracking-[-0.04em]"
          >
            {isPurchase ? "Ready to buy?" : "Make this change?"}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[#643426]">
            {isPurchase
              ? "AI prepared the order. Check it before your card is charged."
              : receipt.summary}
          </p>
        </div>
      </div>

      {details.length > 0 ? (
        <dl className="mt-4 divide-y divide-[#19362e]/14 border-y border-[#19362e]/14 text-xs">
          {details
            .filter(([label]) => label !== "Can this be undone?")
            .map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-[#6b392c]">{label}</dt>
                <dd className="max-w-[62%] text-right font-bold">{value}</dd>
              </div>
            ))}
        </dl>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          data-testid={isPurchase ? "approve-purchase" : "approve-change"}
          type="button"
          onClick={() => void approve(receipt.id)}
          className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#19362e] px-5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          {isPurchase
            ? `Approve ${total ?? "this"} purchase`
            : "Approve change"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => reject(receipt.id)}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors hover:bg-[#f7a38b]"
        >
          <X className="size-3.5" /> {isPurchase ? "Don’t buy" : "Don’t change it"}
        </button>
      </div>
    </motion.section>
  );
}
