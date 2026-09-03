"use client";

import { useMemo } from "react";
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
import type { WebMCPStatus } from "@/remy/adapters/webmcp";
import type { ActionReceipt } from "@/remy/core/types";
import { summarizeActionRun } from "@/remy/core/summary";
import {
  latestAwaitingReceipt,
  useRemy,
  type ControlMode,
} from "@/remy/react/provider";
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
    label: "Preview only",
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
  reversedTitle: string;
  reversedDetail: string;
  reverseLabel: string;
};

function inputOf(receipt: ActionReceipt) {
  return receipt.input as Record<string, unknown>;
}

function activityCopy(receipt: ActionReceipt): ActivityCopy {
  const input = inputOf(receipt);
  const firstDiff = receipt.diff[0];

  if (receipt.reversesReceiptId) {
    return {
      title:
        receipt.actionName === "revert_choose_delivery"
          ? "Delivery restored to standard"
          : receipt.title,
      detail:
        firstDiff?.displayBefore && firstDiff.displayAfter
          ? `${firstDiff.displayBefore} → ${firstDiff.displayAfter}`
          : "The earlier state was restored.",
      reversedTitle: receipt.title,
      reversedDetail: "This recovery remains linked to the original change.",
      reverseLabel: "",
    };
  }

  switch (receipt.actionName) {
    case "add_to_cart":
      return {
        title: "Morrow One added to your bag",
        detail: `${String(input.colour)} · Quantity ${String(input.quantity)}`,
        reversedTitle: "Morrow One removed from your bag",
        reversedDetail: "The bag is back to how it was before.",
        reverseLabel: "Remove from bag",
      };
    case "remove_from_cart":
      return {
        title: "Morrow One removed from your bag",
        detail: "The item is no longer in your bag.",
        reversedTitle: "Morrow One put back in your bag",
        reversedDetail: "The removed item was restored.",
        reverseLabel: "Put it back",
      };
    case "set_quantity":
      return {
        title: `Quantity changed to ${String(input.quantity)}`,
        detail: "Your bag total changed too.",
        reversedTitle: `Quantity changed back to ${String(receipt.before)}`,
        reversedDetail: "The earlier quantity was restored.",
        reverseLabel: `Set back to ${String(receipt.before)}`,
      };
    case "choose_delivery": {
      const express = input.method === "express";
      const previousExpress = receipt.before === "express";
      return {
        title: express ? "Express delivery selected" : "Standard delivery selected",
        detail: express ? "Arrives tomorrow · £8" : "Arrives in 3–5 days · Free",
        reversedTitle: previousExpress
          ? "Express delivery restored"
          : "Standard delivery restored",
        reversedDetail: previousExpress
          ? "Delivery is back to tomorrow."
          : "Delivery is back to 3–5 days.",
        reverseLabel: previousExpress ? "Use express" : "Use standard",
      };
    }
    case "apply_discount":
      return {
        title: "10% discount applied",
        detail: "Code HELLO10 is now in your bag.",
        reversedTitle: "Discount removed",
        reversedDetail: "HELLO10 is no longer applied.",
        reverseLabel: "Remove discount",
      };
    case "place_order":
      return {
        title: "Order placed",
        detail: receipt.preview.summary.replace("Place", "Placed"),
        reversedTitle: "Order placed",
        reversedDetail: "The purchase is complete.",
        reverseLabel: "",
      };
    default:
      return {
        title: receipt.title,
        detail: receipt.preview.summary,
        reversedTitle: "Change reversed",
        reversedDetail: "The earlier value was restored.",
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
    snapshot,
    controlMode,
    lastError,
    setControlMode,
    setAllowPurchases,
    revert,
    engine,
  } = useRemy();
  const awaiting = latestAwaitingReceipt(snapshot.receipts);
  const permissionRequest = snapshot.pendingControlRequest;
  const activities = useMemo(
    () =>
      snapshot.receipts.filter(
        (receipt) =>
          receipt.diff.length > 0 &&
          !["awaiting_approval", "staged"].includes(receipt.status),
      ),
    [snapshot.receipts],
  );
  const runSummary = useMemo(
    () => summarizeActionRun(snapshot.receipts),
    [snapshot.receipts],
  );
  const happened = activities.filter(
    (receipt) => !["rejected", "denied", "failed"].includes(receipt.status),
  );
  const didNotHappen = activities.filter((receipt) =>
    ["rejected", "denied", "failed"].includes(receipt.status),
  );
  const unseenCount = activities.filter(
    (receipt) => receipt.actor === "agent" && receipt.status === "committed",
  ).length;
  const working = snapshot.receipts.some((receipt) =>
    ["proposed", "executing", "reverting"].includes(receipt.status),
  );
  const optionIndex = Math.max(
    0,
    controlOptions.findIndex((option) => option.value === controlMode),
  );
  const selectedOption = controlOptions[optionIndex];
  const stepPercent = 100 / (controlOptions.length - 1);
  const stepOffset = 24 / (controlOptions.length - 1);
  const railPosition = (index: number) =>
    `calc(12px + ${index * stepPercent}% - ${index * stepOffset}px)`;
  const assistantName = snapshot.activeAgent?.name;
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
            : "WebMCP registration failed · shop still works";
  const dockLabel = permissionRequest
    ? "AI wants more access"
    : awaiting
      ? "Purchase needs approval"
      : unseenCount > 0
        ? `${unseenCount} ${unseenCount === 1 ? "change" : "changes"} by AI`
        : `${selectedOption.shortLabel} · Purchases ${snapshot.allowPurchases ? "on" : "ask"}`;
  const notificationCount = permissionRequest || awaiting ? "!" : unseenCount || undefined;

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-x-3 bottom-3 z-[70] flex max-h-[58svh] flex-col overflow-hidden border border-[#19362e]/15 bg-[#fffaf2] text-[#19362e] shadow-[0_22px_70px_rgba(25,54,46,.2)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-h-[76svh] sm:w-[420px] lg:inset-y-0 lg:right-0 lg:max-h-none lg:border-y-0 lg:border-r-0 lg:shadow-[-12px_0_40px_rgba(25,54,46,.1)]"
            aria-label="Remy AI controls and changes"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[#19362e]/12 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <RemySymbol />
                <div className="min-w-0">
                  <h2 className="text-sm font-black tracking-[-0.02em]">Remy</h2>
                  <p className="mt-0.5 truncate text-[11px] text-[#718078]">
                    {assistantLine}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Hide Remy"
                className="grid size-9 place-items-center border border-transparent text-[#64766e] transition-colors hover:border-[#19362e]/15 hover:bg-[#f3eadc] hover:text-[#19362e]"
              >
                <X className="size-[17px]" />
              </button>
            </header>

            <section className="border-b border-[#19362e]/12 bg-[#f3eadc] px-5 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-black">AI access</h3>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#557067]">
                  {selectedOption.label}
                </span>
              </div>

              <div className="relative mt-4 h-10 focus-within:ring-2 focus-within:ring-[#ef704f] focus-within:ring-offset-2 focus-within:ring-offset-[#f3eadc]">
                <div className="absolute left-3 right-3 top-1/2 h-[3px] -translate-y-1/2 bg-[#c7cfc7]" />
                <motion.div
                  className="absolute left-3 top-1/2 h-[3px] -translate-y-1/2 bg-[#ef704f]"
                  animate={{ width: `calc(${optionIndex * stepPercent}% - ${optionIndex * stepOffset}px)` }}
                  transition={{ type: "spring", stiffness: 310, damping: 31 }}
                />
                {controlOptions.map((option, index) => (
                  <span
                    key={option.value}
                    className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 border-2 border-[#f3eadc] ${
                      index <= optionIndex ? "bg-[#ef704f]" : "bg-[#9ba9a1]"
                    }`}
                    style={{ left: railPosition(index) }}
                  />
                ))}
                <motion.span
                  className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center border-2 border-[#19362e] bg-[#f4c95d]"
                  animate={{ left: railPosition(optionIndex) }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                >
                  <selectedOption.icon className="size-3.5" strokeWidth={2.5} />
                </motion.span>
                <input
                  aria-label="AI access"
                  aria-valuetext={selectedOption.label}
                  type="range"
                  min={0}
                  max={controlOptions.length - 1}
                  step={1}
                  value={optionIndex}
                  onChange={(event) =>
                    setControlMode(controlOptions[Number(event.target.value)].value)
                  }
                  className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>

              <div className="grid grid-cols-4 gap-1">
                {controlOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setControlMode(option.value)}
                    className={`text-[10px] font-bold transition-colors ${
                      option.value === controlMode
                        ? "text-[#19362e]"
                        : "text-[#87928d] hover:text-[#52675e]"
                    }`}
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={selectedOption.value}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="mt-3 min-h-5 text-xs leading-5 text-[#596d64]"
                >
                  {selectedOption.description}
                </motion.p>
              </AnimatePresence>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#19362e]/12 pt-4">
                <div>
                  <p className="text-xs font-black">Buy without asking</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#718078]">
                    {controlMode === "full"
                      ? snapshot.allowPurchases
                        ? "AI may charge your saved payment method."
                        : "Every purchase still needs your approval."
                      : "Available only with Trusted run."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={snapshot.allowPurchases}
                  aria-label="Allow AI to buy without asking"
                  disabled={controlMode !== "full"}
                  onClick={() => setAllowPurchases(!snapshot.allowPurchases)}
                  className={`relative h-7 w-12 shrink-0 border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    snapshot.allowPurchases
                      ? "border-[#19362e] bg-[#19362e]"
                      : "border-[#19362e]/25 bg-[#fffaf2]"
                  }`}
                >
                  <motion.span
                    className={`absolute top-1 size-[18px] ${
                      snapshot.allowPurchases ? "bg-[#f4c95d]" : "bg-[#8d9993]"
                    }`}
                    animate={{ left: snapshot.allowPurchases ? 24 : 4 }}
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
                      Allow {permissionRequest.controls.paused || permissionRequest.controls.autonomy === "preview" ? "Preview only" : permissionRequest.controls.autonomy === "trusted" ? "Trusted run" : permissionRequest.controls.autonomy === "ask" ? "Ask on changes" : "Reversible actions"}
                      {permissionRequest.controls.allowPurchases
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

              <section className="border-b border-[#19362e]/12 px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-black">Run summary</h3>
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[#718078]">
                    Changes only
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 border-y border-[#19362e]/12">
                  <RunStat value={runSummary.automatic} label="Automatic" />
                  <RunStat value={runSummary.approvals} label="Approvals" />
                  <RunStat value={runSummary.recovered} label="Recovered" />
                  <RunStat value={runSummary.unresolved} label="Unresolved" />
                </div>
                <p className="mt-2 text-[10px] text-[#87928d]">
                  {runSummary.changes} state-changing {runSummary.changes === 1 ? "action" : "actions"}. Read-only tools are excluded.
                </p>
              </section>

              <section className="px-5 py-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black">Changes</h3>
                    <p className="mt-1 text-xs text-[#718078]">
                      What changed on the site, in order.
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
                      Changes made by you or an assistant will appear here.
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
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{ y: -2 }}
            onClick={() => onOpenChange(true)}
            className={`fixed bottom-4 right-4 z-50 flex min-h-14 max-w-[calc(100vw-2rem)] items-center gap-3 border p-2 pr-4 text-left shadow-[0_12px_34px_rgba(25,54,46,.16)] sm:bottom-6 sm:right-6 ${
              permissionRequest || awaiting
                ? "border-[#19362e] bg-[#ef704f]"
                : "border-[#19362e]/18 bg-[#fffaf2]"
            }`}
            aria-label={`Open Remy. ${dockLabel}`}
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
  const reversed = ["reverted", "compensated"].includes(receipt.status);
  const stopped = ["rejected", "denied", "failed"].includes(receipt.status);
  const working = ["proposed", "executing", "reverting"].includes(receipt.status);
  const title = reversed
    ? copy.reversedTitle
    : stopped
      ? receipt.actionName === "place_order"
        ? "Order was not placed"
        : `${copy.title} was not completed`
      : copy.title;
  const detail = reversed
    ? copy.reversedDetail
    : stopped
      ? receipt.status === "denied"
        ? "Blocked by your AI setting. Nothing changed."
        : "Nothing changed on the website."
      : copy.detail;
  const status = reversed
    ? "Changed back"
    : stopped
      ? receipt.status === "denied"
        ? "Blocked"
        : "Not done"
      : working
        ? "Working"
        : isRecovery
          ? "Recovery"
          : "Done";
  const requester = receipt.agent?.name ?? "AI";
  const actorLabel = isRecovery
    ? `Recovery receipt · linked to ${receipt.reversesReceiptId}`
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
          reversed
            ? "border-[#d7b13c] bg-[#f8de87]"
            : stopped
              ? "border-[#d79a86] bg-[#f7d7cc] text-[#994832]"
              : "border-[#9fc7ad] bg-[#dcebdd] text-[#28735b]"
        }`}
      >
        {working ? (
          <CircleDashed className="size-3.5 animate-spin" />
        ) : reversed ? (
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
          receipt.reversibility !== "irreversible" &&
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

function RunStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-[#19362e]/10 py-3 text-center last:border-r-0">
      <p className="text-lg font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.05em] text-[#718078]">
        {label}
      </p>
    </div>
  );
}
