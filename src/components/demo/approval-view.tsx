"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Check, CircleAlert, Hand, X } from "lucide-react";
import { motion } from "motion/react";
import { useDemoRemy } from "@/demo/provider";
import type { ActionReceipt } from "@remy-ai/core";

const HOLD_TO_APPROVE_MS = 1_200;

function HoldToApproveButton({
  label,
  onApprove,
  testId,
}: {
  label: string;
  onApprove: () => void;
  testId: string;
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrame = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const completed = useRef(false);

  const cancelHold = useCallback(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    startedAt.current = null;
    setHolding(false);
    if (!completed.current) setProgress(0);
  }, []);

  const beginHold = useCallback((isTrusted: boolean) => {
    if (!isTrusted || startedAt.current !== null || completed.current) return;

    startedAt.current = performance.now();
    setHolding(true);

    const tick = (now: number) => {
      if (startedAt.current === null) return;
      const nextProgress = Math.min((now - startedAt.current) / HOLD_TO_APPROVE_MS, 1);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        animationFrame.current = requestAnimationFrame(tick);
        return;
      }

      animationFrame.current = null;
      startedAt.current = null;
      completed.current = true;
      setHolding(false);
      onApprove();
    };

    animationFrame.current = requestAnimationFrame(tick);
  }, [onApprove]);

  useEffect(() => () => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginHold(event.isTrusted);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    cancelHold();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key !== " " && event.key !== "Enter") || event.repeat) return;
    event.preventDefault();
    beginHold(event.isTrusted);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    cancelHold();
  };

  return (
    <button
      data-testid={testId}
      data-human-confirmation="hold"
      type="button"
      onClick={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={cancelHold}
      aria-label={`${label}. User confirmation only; assistants must not operate this control.`}
      className="group relative inline-flex min-h-11 touch-none select-none items-center justify-center gap-2 overflow-hidden rounded-full bg-[#19362e] px-5 text-xs font-bold text-white outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#19362e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ef704f]"
    >
      <span
        className="absolute inset-y-0 left-0 origin-left bg-[#2f7661]"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
      <span className="relative inline-flex items-center gap-2" aria-hidden="true">
        {progress >= 1 ? (
          <Check className="size-3.5" />
        ) : (
          <Hand className="size-3.5" />
        )}
        {holding ? "Keep holding…" : label}
      </span>
    </button>
  );
}

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
        <HoldToApproveButton
          testId={isPurchase ? "approve-purchase" : "approve-change"}
          label={isPurchase
            ? `Hold to approve ${total ?? "this"} purchase`
            : "Hold to approve change"}
          onApprove={() => void approve(receipt.id)}
        />
        <button
          type="button"
          onClick={() => reject(receipt.id)}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors hover:bg-[#f7a38b]"
        >
          <X className="size-3.5" /> {isPurchase ? "Don’t buy" : "Don’t change it"}
        </button>
      </div>
      <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#6b392c]">
        User confirmation only · press and hold for 1.2 seconds
      </p>
    </motion.section>
  );
}
