"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  CircleDashed,
  EyeOff,
  Hand,
  RotateCcw,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { WebMCPStatus } from "@remy-ai/webmcp";
import type { ActionReceipt } from "@remy-ai/core";
import { AutonomySlider } from "@/components/autonomy-slider";
import {
  latestAwaitingReceipt,
  useDemoRemy,
  type ControlMode,
} from "@/demo/provider";
import { ApprovalView } from "./approval-view";

const controlOptions: Array<{
  value: ControlMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof EyeOff;
}> = [
  {
    value: "preview",
    label: "Preview",
    shortLabel: "Preview",
    description: "AI can prepare changes, but nothing runs yet.",
    icon: EyeOff,
  },
  {
    value: "ask",
    label: "Ask on changes",
    shortLabel: "Ask",
    description: "Every AI change waits. This demo would interrupt four times.",
    icon: Hand,
  },
  {
    value: "safe",
    label: "Reversible actions",
    shortLabel: "Reversible",
    description: "Three reversible changes run. The purchase still waits.",
    icon: ShieldCheck,
  },
  {
    value: "full",
    label: "Trusted run",
    shortLabel: "Trusted",
    description: "AI can run every action your site has allowed.",
    icon: Zap,
  },
];

type ActivityCopy = {
  title: string;
  detail: string;
  reverseLabel: string;
};

function inputOf(receipt: ActionReceipt) {
  return receipt.input ?? {};
}

function activityCopy(receipt: ActionReceipt): ActivityCopy {
  const input = inputOf(receipt);
  const firstDiff = receipt.changes[0];

  if (receipt.reversesReceiptId) {
    return {
      title:
        receipt.action.name === "recover_choose_delivery"
          ? "Delivery restored to standard"
          : receipt.action.title,
      detail:
        firstDiff?.before !== undefined && firstDiff.after !== undefined
          ? `${String(firstDiff.before)} → ${String(firstDiff.after)}`
          : "The earlier state was restored.",
      reverseLabel: "",
    };
  }

  switch (receipt.action.name) {
    case "add_to_cart":
      return {
        title: "Morrow One added to your bag",
        detail: `${String(input.colour)} · Quantity ${String(input.quantity)}`,
        reverseLabel: "Remove from bag",
      };
    case "remove_from_cart":
      return {
        title: "Morrow One removed from your bag",
        detail: "The item is no longer in your bag.",
        reverseLabel: "Put it back",
      };
    case "set_quantity":
      return {
        title: `Quantity changed to ${String(input.quantity)}`,
        detail: "Your bag total changed too.",
        reverseLabel: `Set back to ${String(firstDiff?.before ?? "before")}`,
      };
    case "choose_delivery": {
      const express = input.method === "express";
      const previousExpress = firstDiff?.before === "Express · £8";
      return {
        title: express ? "Express delivery selected" : "Standard delivery selected",
        detail: express ? "Arrives tomorrow · £8" : "Arrives in 3–5 days · Free",
        reverseLabel: previousExpress ? "Use express" : "Use standard",
      };
    }
    case "apply_discount":
      return {
        title: "10% discount applied",
        detail: "Code HELLO10 is now in your bag.",
        reverseLabel: "Remove discount",
      };
    case "place_order":
      return {
        title: "Order placed",
        detail: receipt.summary.replace("Place", "Placed"),
        reverseLabel: "",
      };
    default:
      return {
        title: receipt.action.title,
        detail: receipt.summary,
        reverseLabel: "Change it back",
      };
  }
}

function RemySymbol({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      className={`relative block size-8 shrink-0 border ${
        inverted
          ? "border-white/25 bg-[#19362e]"
          : "border-[#19362e]/15 bg-[#e7eee6]"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute left-[7px] top-[8px] h-1.5 w-4 -skew-x-[32deg] ${
          inverted ? "bg-white" : "bg-[#19362e]"
        }`}
      />
      <span className="absolute bottom-[8px] right-[7px] h-1.5 w-4 -skew-x-[32deg] bg-[#ef704f]" />
    </span>
  );
}

export function ActionCenter({
  connectionStatus,
  open,
  onOpenChange,
}: {
  connectionStatus: WebMCPStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    controlMode,
    lastError,
    setControlMode,
    revert,
    runtime,
    remySnapshot: snapshot,
    purchaseGrant,
    setPurchaseGrant,
  } = useDemoRemy();
  const engine = runtime.remy;
  const [lastSeenSequence, setLastSeenSequence] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dockButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  const awaiting = latestAwaitingReceipt(snapshot.receipts);
  const permissionRequest = snapshot.pendingControlRequest;
  const activities = useMemo(
    () =>
      snapshot.receipts.filter(
        (receipt) =>
          receipt.changes.length > 0 &&
          (receipt.actor === "agent" || Boolean(receipt.reversesReceiptId)) &&
          !["awaiting_approval", "staged"].includes(receipt.status),
      ),
    [snapshot.receipts],
  );
  const happened = activities.filter(
    (receipt) => !["rejected", "denied", "failed"].includes(receipt.status),
  );
  const didNotHappen = activities.filter((receipt) =>
    ["rejected", "denied", "failed"].includes(receipt.status),
  );
  const latestAgentSequence = snapshot.receipts.reduce(
    (latest, receipt) =>
      receipt.actor === "agent" ? Math.max(latest, receipt.sequence) : latest,
    0,
  );
  const effectiveLastSeen = latestAgentSequence < lastSeenSequence
    ? 0
    : lastSeenSequence;
  const unseenCount = activities.filter(
    (receipt) => receipt.actor === "agent" && receipt.sequence > effectiveLastSeen,
  ).length;
  const working = snapshot.receipts.some((receipt) =>
    ["proposed", "executing", "reverting"].includes(receipt.status),
  );
  const optionIndex = Math.max(
    0,
    controlOptions.findIndex((option) => option.value === controlMode),
  );
  const selectedOption = controlOptions[optionIndex];
  const assistantName = snapshot.activePrincipal?.name;
  const assistantLine = assistantName
    ? `${assistantName} is using this shop`
    : working
      ? "An assistant is working"
      : connectionStatus === "checking"
        ? "Checking assistant support"
        : connectionStatus === "ready"
          ? "Ready for an assistant"
        : connectionStatus === "unsupported"
            ? "WebMCP unavailable · shop still works"
            : connectionStatus === "partial"
              ? "Some assistant actions are unavailable"
              : "WebMCP registration failed · shop still works";
  const dockLabel = permissionRequest
    ? "AI wants more access"
    : awaiting
      ? "Purchase needs approval"
      : unseenCount > 0
        ? `${unseenCount} ${unseenCount === 1 ? "change" : "changes"} by AI`
        : `${selectedOption.shortLabel} · Purchases ${purchaseGrant ? "on" : "ask"}`;
  const notificationCount = permissionRequest || awaiting ? "!" : unseenCount || undefined;

  useEffect(() => {
    if (open && !wasOpen.current) closeButtonRef.current?.focus();
    if (!open && wasOpen.current) {
      requestAnimationFrame(() => dockButtonRef.current?.focus());
    }
    wasOpen.current = open;
  }, [open]);

  const closePanel = () => {
    setLastSeenSequence(latestAgentSequence);
    onOpenChange(false);
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.aside
            id="remy-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-x-3 bottom-3 z-[70] flex max-h-[58svh] flex-col overflow-hidden border border-[#19362e]/15 bg-[#fffaf2] text-[#19362e] shadow-[0_22px_70px_rgba(25,54,46,.2)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-h-[76svh] sm:w-[420px] lg:inset-y-0 lg:right-0 lg:max-h-none lg:border-y-0 lg:border-r-0 lg:shadow-[-12px_0_40px_rgba(25,54,46,.1)]"
            role="dialog"
            aria-modal="false"
            aria-labelledby="remy-panel-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closePanel();
            }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-[#19362e]/12 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <RemySymbol />
                <div className="min-w-0">
                  <h2 id="remy-panel-title" className="text-sm font-black tracking-[-0.02em]">Remy</h2>
                  <p className="mt-0.5 truncate text-[11px] text-[#718078]">
                    {assistantLine}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePanel}
                aria-label="Hide Remy"
                className="grid size-9 place-items-center border border-transparent text-[#64766e] transition-colors hover:border-[#19362e]/15 hover:bg-[#f3eadc] hover:text-[#19362e]"
              >
                <X className="size-[17px]" />
              </button>
            </header>

            <section className="border-b border-[#19362e]/12 bg-[#f3eadc] px-5 py-5">
              <AutonomySlider
                label="AI access"
                value={controlMode}
                options={controlOptions}
                onChange={setControlMode}
              />

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#19362e]/12 pt-4">
                <div>
                  <p className="text-xs font-black">Buy without asking</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#718078]">
                    {controlMode === "full"
                      ? purchaseGrant
                        ? "AI may charge your saved payment method."
                        : "Every purchase still needs your approval."
                      : "Available only with Trusted run."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={purchaseGrant}
                  aria-label="Allow AI to buy without asking"
                  disabled={controlMode !== "full"}
                  onClick={() => setPurchaseGrant(!purchaseGrant)}
                  className={`relative h-7 w-12 shrink-0 border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    purchaseGrant
                      ? "border-[#19362e] bg-[#19362e]"
                      : "border-[#19362e]/25 bg-[#fffaf2]"
                  }`}
                >
                  <motion.span
                    className={`absolute top-1 size-[18px] ${
                      purchaseGrant ? "bg-[#f4c95d]" : "bg-[#8d9993]"
                    }`}
                    animate={{ left: purchaseGrant ? 24 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  />
                </button>
              </div>
            </section>

            <div className="remy-scroll min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {permissionRequest ? (
                  <motion.section
                    key={permissionRequest.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-[#19362e]/12 bg-[#f8c9b8] px-5 py-5"
                  >
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#7b4435]">
                      Access request
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-[-0.035em]">
                      {permissionRequest.requestedBy?.name ?? "AI"} wants more access
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[#71473b]">
                      Allow {permissionRequest.controls.paused || permissionRequest.controls.autonomy === "preview" ? "Preview" : permissionRequest.controls.autonomy === "trusted" ? "Trusted run" : permissionRequest.controls.autonomy === "ask" ? "Ask on changes" : "Reversible actions"}
                      {permissionRequest.controls.grants.includes("commerce.purchase")
                        ? " and buying without approval."
                        : ". Purchases will still ask."}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => engine.rejectControlChange(permissionRequest.id)}
                        className="min-h-10 border border-[#19362e]/25 bg-[#fffaf2] px-3 text-xs font-bold"
                      >
                        Keep my settings
                      </button>
                      <button
                        type="button"
                        onClick={() => engine.approveControlChange(permissionRequest.id)}
                        className="min-h-10 bg-[#19362e] px-3 text-xs font-bold text-white"
                      >
                        Allow this change
                      </button>
                    </div>
                  </motion.section>
                ) : null}
                {awaiting ? <ApprovalView key={awaiting.id} receipt={awaiting} /> : null}
              </AnimatePresence>

              <section className="px-5 py-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black">Agent activity</h3>
                    <p className="mt-1 text-xs text-[#718078]">
                      Assistant changes only · newest first.
                    </p>
                  </div>
                  {working ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#28735b]">
                      <CircleDashed className="size-3.5 animate-spin" /> Working
                    </span>
                  ) : null}
                </div>

                {activities.length === 0 ? (
                  <div className="mt-5 border-y border-[#19362e]/12 py-7">
                    <p className="text-sm font-bold">Nothing has changed yet.</p>
                    <p className="mt-1 text-xs leading-5 text-[#718078]">
                      Changes made by an assistant will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-7">
                    {happened.length > 0 ? (
                      <ActivityGroup
                        label="Happened"
                        description="These changes are live on the website."
                        receipts={happened}
                        canReverse={(receipt) => engine.canRevert(receipt).allowed}
                        onReverse={(receipt) => void revert(receipt.id)}
                      />
                    ) : null}
                    {didNotHappen.length > 0 ? (
                      <ActivityGroup
                        label="Did not happen"
                        description="These attempts made no change."
                        receipts={didNotHappen}
                        canReverse={() => false}
                        onReverse={() => undefined}
                      />
                    ) : null}
                  </div>
                )}

                {lastError ? (
                  <div className="mt-4 flex gap-2 border border-[#c8684b]/25 bg-[#ffe0d4] p-3 text-xs leading-5 text-[#7c3d2d]">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    {lastError}
                  </div>
                ) : null}
              </section>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!open ? (
          <motion.button
            ref={dockButtonRef}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{ y: -2 }}
            onClick={() => {
              setLastSeenSequence(latestAgentSequence);
              onOpenChange(true);
            }}
            className={`fixed bottom-4 right-4 z-50 flex min-h-14 max-w-[calc(100vw-2rem)] items-center gap-3 border p-2 pr-4 text-left shadow-[0_12px_34px_rgba(25,54,46,.16)] sm:bottom-6 sm:right-6 ${
              permissionRequest || awaiting
                ? "border-[#19362e] bg-[#ef704f]"
                : "border-[#19362e]/18 bg-[#fffaf2]"
            }`}
            aria-label={`Open Remy. ${dockLabel}`}
            aria-controls="remy-panel"
            aria-expanded="false"
          >
            <span className="relative">
              <RemySymbol inverted={Boolean(permissionRequest || awaiting)} />
              {notificationCount ? (
                <span className="absolute -right-2 -top-2 grid size-[18px] place-items-center bg-[#f4c95d] font-mono text-[9px] font-black text-[#19362e] ring-2 ring-[#fffaf2]">
                  {notificationCount}
                </span>
              ) : null}
            </span>
            <span>
              <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#718078]">
                Remy
              </span>
              <span className="mt-0.5 block text-xs font-black sm:text-sm">
                {dockLabel}
              </span>
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ActivityGroup({
  label,
  description,
  receipts,
  canReverse,
  onReverse,
}: {
  label: string;
  description: string;
  receipts: ActionReceipt[];
  canReverse: (receipt: ActionReceipt) => boolean;
  onReverse: (receipt: ActionReceipt) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#557067]">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-[#87928d]">{description}</p>
      <div className="mt-2 divide-y divide-[#19362e]/10 border-y border-[#19362e]/10">
        <AnimatePresence initial={false}>
          {[...receipts].reverse().map((receipt) => (
            <ActivityRow
              key={receipt.id}
              receipt={receipt}
              canReverse={canReverse(receipt)}
              onReverse={() => onReverse(receipt)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActivityRow({
  receipt,
  canReverse,
  onReverse,
}: {
  receipt: ActionReceipt;
  canReverse: boolean;
  onReverse: () => void;
}) {
  const copy = activityCopy(receipt);
  const isRecovery = Boolean(receipt.reversesReceiptId);
  const recovered = ["reverted", "compensated"].includes(receipt.status);
  const stopped = ["rejected", "denied", "failed"].includes(receipt.status);
  const working = ["proposed", "executing", "reverting"].includes(receipt.status);
  const title = stopped
      ? receipt.action.name === "place_order"
        ? "Order was not placed"
        : `${copy.title} was not completed`
      : copy.title;
  const detail = stopped
      ? receipt.status === "denied"
        ? "Blocked by your AI setting. Nothing changed."
        : "Nothing changed on the website."
      : recovered
        ? `${copy.detail} · A linked recovery followed.`
      : copy.detail;
  const status = stopped
      ? receipt.status === "denied"
        ? "Blocked"
        : "Not done"
      : recovered
        ? "Recovered"
      : working
        ? "Working"
        : isRecovery
          ? "Recovered"
          : "Done";
  const requester = receipt.principal?.name ?? "AI";
  const actorLabel = isRecovery
    ? `${receipt.actor === "user" ? "Recovered by you" : `Recovered by ${requester}`} · linked to the earlier change`
    :
    receipt.actor === "user"
      ? "Changed by you"
      : receipt.status === "committed" &&
          ["require_approval", "stage"].includes(receipt.policyDecision.outcome)
        ? `Approved by you · requested by ${requester}`
        : `Changed by ${requester}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-4"
    >
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center border ${
          recovered || isRecovery
            ? "border-[#d7b13c] bg-[#f8de87]"
            : stopped
              ? "border-[#d79a86] bg-[#f7d7cc] text-[#994832]"
              : "border-[#9fc7ad] bg-[#dcebdd] text-[#28735b]"
        }`}
      >
        {working ? (
          <CircleDashed className="size-3.5 animate-spin" />
        ) : recovered || isRecovery ? (
          <RotateCcw className="size-3.5" />
        ) : stopped ? (
          <X className="size-3.5" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-5">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[#718078]">{detail}</p>
          </div>
          <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-[0.06em] text-[#687970]">
            {status}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold text-[#87928d]">{actorLabel}</p>
          {receipt.status === "committed" &&
          ["exact", "compensating"].includes(receipt.action.recovery) &&
          canReverse &&
          copy.reverseLabel ? (
            <button
              type="button"
              onClick={onReverse}
              className="text-[10px] font-bold text-[#28735b] underline decoration-[#28735b]/30 underline-offset-4 hover:text-[#19362e]"
            >
              {copy.reverseLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
