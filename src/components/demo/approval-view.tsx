"use client";

import { ArrowRight, CircleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import type { ActionReceipt } from "@/remy/core/types";
import { useRemy } from "@/remy/react/provider";

export function ApprovalView({ receipt }: { receipt: ActionReceipt }) {
  const { approve, reject } = useRemy();
  const isRefund = receipt.actionName === "issue_refund";
  const title = isRefund ? "Refund £84 to this card?" : "Allow this change?";
  const description = isRefund
    ? "The assistant is ready to refund Visa ending 4242. Money cannot be pulled back, so Remy waited for you."
    : `${receipt.preview.summary} Remy waited because this needs your say.`;

  return (
    <motion.section
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      className="absolute inset-x-0 bottom-0 z-30 border-t-2 border-[#172f28] bg-[#ff805f] p-5 text-[#17221d] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
    >
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center border border-[#172f28]/35 bg-[#ffd9ca]">
          <CircleAlert className="size-5" />
        </span>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
            Your decision
          </p>
          <h3
            id="approval-title"
            className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em]"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#563127]">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          data-testid={isRefund ? "approve-refund" : "approve-change"}
          type="button"
          onClick={() => void approve(receipt.id)}
          className="group inline-flex min-h-12 items-center justify-center gap-2 bg-[#16362c] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          {isRefund ? "Yes, refund £84" : "Yes, allow it"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          type="button"
          onClick={() => reject(receipt.id)}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#172f28]/35 px-5 text-sm font-bold transition-colors hover:bg-[#ffd9ca]"
        >
          <X className="size-4" /> No, stop here
        </button>
      </div>
    </motion.section>
  );
}
