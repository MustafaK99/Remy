"use client";

import { ArrowRight, CircleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import type { ActionReceipt } from "@remy-ai/core";
import { useDemoRemy } from "@/demo/provider";

export function ApprovalView({ receipt }: { readonly receipt: ActionReceipt }) {
  const { approve, reject } = useDemoRemy();
  const isRefund = receipt.action.name === "issue_refund";
  const isStaged = receipt.status === "staged";
  const details = Object.entries(receipt.details ?? {});

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-[var(--line)] bg-[var(--accent-soft)] px-5 py-5 text-[var(--ink)]"
      aria-labelledby={`approval-title-${receipt.id}`}
    >
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center bg-[var(--ink)] text-white">
          <CircleAlert className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-[var(--warning)]">
            {isStaged ? "Prepared for review" : "Needs your approval"}
          </p>
          <h3
            id={`approval-title-${receipt.id}`}
            className="mt-2 text-xl font-bold leading-tight tracking-[-0.04em]"
          >
            {isRefund ? "Issue the £84 refund?" : "Run this change?"}
          </h3>
          <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
            {isRefund
              ? "The refund cannot be undone. Check the amount and destination first."
              : receipt.summary}
          </p>
        </div>
      </div>

      {details.length > 0 ? (
        <dl className="mt-4 divide-y divide-[var(--line-strong)] border-y border-[var(--line-strong)] text-xs">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-[var(--muted)]">{label}</dt>
              <dd className="max-w-[62%] text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          data-testid={isRefund ? "approve-refund" : "approve-change"}
          type="button"
          onClick={() => void approve(receipt.id)}
          className="group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 bg-[var(--ink)] px-5 text-xs font-semibold text-white transition-colors hover:bg-[var(--ink-soft)]"
        >
          {isRefund ? "Approve £84 refund" : "Run this change"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          data-testid={isRefund ? "reject-refund" : "reject-change"}
          type="button"
          onClick={() => reject(receipt.id)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 px-4 text-xs font-semibold transition-colors hover:bg-[var(--warning-soft)]"
        >
          <X className="size-3.5" /> {isRefund ? "Reject refund" : "Reject change"}
        </button>
      </div>
    </motion.section>
  );
}
