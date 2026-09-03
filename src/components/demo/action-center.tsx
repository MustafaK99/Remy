"use client";

import { useMemo, type CSSProperties } from "react";
import {
  Bell,
  Check,
  CircleAlert,
  CircleDashed,
  PanelRightClose,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { WebMCPStatus } from "@/remy/adapters/webmcp";
import type { ActionReceipt, AutonomyLevel } from "@/remy/core/types";
import { latestAwaitingReceipt, useRemy } from "@/remy/react/provider";
import { ApprovalView } from "./approval-view";

const autonomyOptions: Array<{
  value: AutonomyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "preview",
    label: "Show only",
    description: "The assistant can look, but it cannot change the page.",
  },
  {
    value: "ask",
    label: "Ask me first",
    description: "Every change waits for you.",
  },
  {
    value: "reversible",
    label: "Safe changes",
    description: "Undoable changes happen automatically. Money still waits.",
  },
  {
    value: "trusted",
    label: "More freedom",
    description: "Allowed changes happen automatically. Money still waits.",
  },
];

const actionCopy: Record<
  string,
  {
    title: string;
    detail: string;
    reverse: string;
    reversed: string;
    reversedDetail: string;
    redo: string;
  }
> = {
  create_return_draft: {
    title: "Started the return",
    detail: "Both items were added",
    reverse: "Stop this return",
    reversed: "Return stopped",
    reversedDetail: "The items are no longer being returned",
    redo: "Start the return again",
  },
  add_return_reason: {
    title: "Added the reason",
    detail: "Incompatible with my laptop",
    reverse: "Remove the reason",
    reversed: "Reason removed",
    reversedDetail: "No return reason is saved",
    redo: "Add the reason again",
  },
  update_collection_address: {
    title: "Changed the pickup address",
    detail: "14 High Street → 22 New Road",
    reverse: "Restore old address",
    reversed: "Old address restored",
    reversedDetail: "Pickup is back at 14 High Street",
    redo: "Use 22 New Road again",
  },
  book_collection: {
    title: "Booked the collection",
    detail: "Next Friday from 22 New Road",
    reverse: "Cancel the collection",
    reversed: "Collection cancelled",
    reversedDetail: "No pickup is booked",
    redo: "Book the collection again",
  },
  issue_refund: {
    title: "Refund £84",
    detail: "To Visa ending 4242",
    reverse: "",
    reversed: "",
    reversedDetail: "",
    redo: "",
  },
};

function receiptCopy(receipt: ActionReceipt) {
  return (
    actionCopy[receipt.actionName] ?? {
      title: receipt.title,
      detail: receipt.preview.summary,
      reverse: "Change it back",
      reversed: "Changed back",
      reversedDetail: "The previous value was restored",
      redo: "Make this change again",
    }
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
  const { snapshot, runStatus, lastError, setAutonomy, revert, engine } =
    useRemy();
  const awaiting = latestAwaitingReceipt(snapshot.receipts);
  const changes = useMemo(
    () => {
      const latestByAction = new Map<string, ActionReceipt>();
      for (const receipt of snapshot.receipts) {
        if (receipt.diff.length === 0 || receipt.reversesReceiptId) continue;
        latestByAction.delete(receipt.actionName);
        latestByAction.set(receipt.actionName, receipt);
      }
      return [...latestByAction.values()];
    },
    [snapshot.receipts],
  );
  const completedCount = changes.filter(
    (receipt) => receipt.status === "committed",
  ).length;
  const autonomyIndex = Math.max(
    0,
    autonomyOptions.findIndex((option) => option.value === snapshot.autonomy),
  );
  const autonomy = autonomyOptions[autonomyIndex];
  const connectionLabel =
    connectionStatus === "ready"
      ? "Live WebMCP connection"
      : connectionStatus === "checking"
        ? "Checking WebMCP"
        : "Guided WebMCP demo";
  const status = awaiting
    ? "Your decision needed"
    : runStatus === "running"
      ? "Assistant is working"
      : snapshot.state.return.refund.status === "issued"
        ? "Return complete"
        : changes.length > 0
          ? "Changes made"
          : "Ready";
  const dockLabel = awaiting
    ? "1 decision waiting"
    : runStatus === "running"
      ? "Assistant is working"
      : completedCount > 0
        ? `${completedCount} ${completedCount === 1 ? "change" : "changes"} made`
        : "Watch the assistant";
  const sliderStyle = {
    "--slider-progress": `${(autonomyIndex / (autonomyOptions.length - 1)) * 100}%`,
  } as CSSProperties;

  return (
    <>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close Remy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 z-[60] cursor-default bg-[#17221d]/18 sm:backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[440px] flex-col border-l-2 border-[#17342b] bg-[#f6f0e4] text-[#17221d]"
              aria-label="Changes made by the browser assistant"
              role="dialog"
              aria-modal="true"
            >
              <header className="border-b border-[#17342b]/18 bg-[#17342b] px-5 py-5 text-white sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center bg-[#ff805f] text-[#17221d]">
                      <Sparkles className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                        Remy
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">
                        What the assistant changed
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Hide Remy"
                    className="grid size-10 shrink-0 place-items-center border border-white/20 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <PanelRightClose className="size-4" />
                  </button>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/12 pt-4 text-xs">
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className={`size-2 ${
                        awaiting
                          ? "bg-[#ff805f]"
                          : runStatus === "running"
                            ? "animate-pulse bg-[#f4c95d]"
                            : "bg-[#7dd6ad]"
                      }`}
                    />
                    {status}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-white/45">
                    {connectionLabel}
                  </span>
                </div>
              </header>

              <section className="border-b border-[#17342b]/14 bg-[#e3eadf] px-5 py-5 sm:px-6">
                <div className="flex items-baseline justify-between gap-4">
                  <label
                    htmlFor="assistant-freedom"
                    className="text-sm font-bold"
                  >
                    How freely can the assistant act?
                  </label>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#17634b]">
                    {autonomy.label}
                  </span>
                </div>
                <input
                  id="assistant-freedom"
                  type="range"
                  min={0}
                  max={autonomyOptions.length - 1}
                  step={1}
                  value={autonomyIndex}
                  onChange={(event) =>
                    setAutonomy(autonomyOptions[Number(event.target.value)].value)
                  }
                  style={sliderStyle}
                  className="remy-slider mt-4 w-full"
                  aria-valuetext={autonomy.label}
                />
                <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#65766e]">
                  <span>Ask more</span>
                  <span>Act more</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#4f6259]">
                  {autonomy.description}
                </p>
              </section>

              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-end justify-between border-b border-[#17342b]/12 px-5 py-4 sm:px-6">
                  <div>
                    <h3 className="text-base font-bold">This return</h3>
                    <p className="mt-1 text-xs text-[#65736d]">
                      {changes.length === 0
                        ? "No changes yet"
                        : `${completedCount} finished${awaiting ? " · 1 waiting" : ""}`}
                    </p>
                  </div>
                  {runStatus === "running" ? (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#17634b]">
                      <CircleDashed className="size-4 animate-spin" /> Working
                    </span>
                  ) : null}
                </div>

                <div className="remy-scroll min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-6">
                  {changes.length === 0 ? (
                    <div className="grid min-h-[280px] place-items-center text-center">
                      <div className="max-w-[250px]">
                        <span className="mx-auto grid size-14 place-items-center bg-[#e3eadf] text-[#17634b]">
                          <Bell className="size-6" />
                        </span>
                        <p className="mt-5 text-lg font-semibold tracking-[-0.025em]">
                          Send the return request
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#66746d]">
                          The assistant&apos;s website changes will appear here as
                          they happen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#17342b]/12">
                      <AnimatePresence initial={false}>
                        {[...changes].reverse().map((receipt) => {
                          const collectionBlocksAddress =
                            receipt.actionName === "update_collection_address" &&
                            snapshot.state.return.collection.status === "booked";
                          const finishedReturnLocksSetup =
                            snapshot.state.return.refund.status === "issued" &&
                            ["create_return_draft", "add_return_reason"].includes(
                              receipt.actionName,
                            );
                          const canReverse =
                            engine.canRevert(receipt).allowed &&
                            !collectionBlocksAddress &&
                            !finishedReturnLocksSetup;

                          return (
                            <ChangeRow
                              key={receipt.id}
                              receipt={receipt}
                              onReverse={() => void revert(receipt.id)}
                              onRedo={() =>
                                void engine.run(receipt.actionName, receipt.input, {
                                  actor: "user",
                                  transport: "manual",
                                })
                              }
                              canReverse={canReverse}
                              canRedo={!finishedReturnLocksSetup}
                              blockedReason={
                                collectionBlocksAddress
                                  ? "Cancel the collection before changing the address."
                                  : undefined
                              }
                            />
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {lastError ? (
                    <div className="mt-4 flex gap-2 border border-[#a84835]/30 bg-[#ffe1d6] p-3 text-xs leading-5 text-[#7c3326]">
                      <CircleAlert className="mt-0.5 size-4 shrink-0" />
                      {lastError}
                    </div>
                  ) : null}
                </div>
              </section>

              <footer className="flex items-center justify-between border-t border-[#17342b]/14 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.08em] text-[#6e7873] sm:px-6">
                <span>Saved on this page</span>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="font-bold text-[#17634b] hover:text-[#102f25]"
                >
                  Hide Remy
                </button>
              </footer>

              <AnimatePresence>
                {awaiting ? <ApprovalView receipt={awaiting} /> : null}
              </AnimatePresence>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!open ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            whileHover={{ y: -3 }}
            onClick={() => onOpenChange(true)}
            className="fixed bottom-4 right-4 z-50 flex min-h-14 max-w-[calc(100vw-2rem)] items-center gap-3 border-2 border-[#17342b] bg-[#f6f0e4] p-2 pr-4 text-left text-[#17221d] sm:bottom-6 sm:right-6"
            aria-label={`Open Remy. ${dockLabel}`}
          >
            <span
              className={`relative grid size-10 shrink-0 place-items-center ${
                awaiting ? "bg-[#ff805f]" : "bg-[#17342b] text-white"
              }`}
            >
              {awaiting ? (
                <CircleAlert className="size-5" />
              ) : (
                <Sparkles className="size-5" />
              )}
              {changes.length > 0 ? (
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center border border-[#17342b] bg-[#f4c95d] font-mono text-[9px] font-bold text-[#17221d]">
                  {awaiting ? "!" : changes.length}
                </span>
              ) : null}
            </span>
            <span>
              <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#738078]">
                Remy
              </span>
              <span className="mt-0.5 block text-xs font-bold sm:text-sm">
                {dockLabel}
              </span>
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ChangeRow({
  receipt,
  onReverse,
  onRedo,
  canReverse,
  canRedo,
  blockedReason,
}: {
  receipt: ActionReceipt;
  onReverse: () => void;
  onRedo: () => void;
  canReverse: boolean;
  canRedo: boolean;
  blockedReason?: string;
}) {
  const copy = receiptCopy(receipt);
  const waiting = ["awaiting_approval", "staged"].includes(receipt.status);
  const reversed = ["reverted", "compensated"].includes(receipt.status);
  const failed = ["failed", "denied", "rejected"].includes(receipt.status);
  const working = ["proposed", "executing", "reverting"].includes(
    receipt.status,
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="flex gap-3 py-4"
    >
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center ${
          waiting
            ? "bg-[#ff805f] text-[#17221d]"
            : reversed
              ? "bg-[#f4c95d] text-[#17221d]"
              : failed
                ? "bg-[#f0c8bc] text-[#8a3d30]"
                : "bg-[#cfe7d9] text-[#17634b]"
        }`}
      >
        {waiting ? (
          <CircleAlert className="size-3.5" />
        ) : working ? (
          <CircleDashed className="size-3.5 animate-spin" />
        ) : reversed ? (
          <RotateCcw className="size-3.5" />
        ) : failed ? (
          <X className="size-3.5" />
        ) : (
          <Check className="size-3.5" strokeWidth={3} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {reversed ? copy.reversed : copy.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#68746d]">
              {reversed ? copy.reversedDetail : copy.detail}
            </p>
          </div>
          {waiting ? (
            <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#ad4a32]">
              Waiting
            </span>
          ) : null}
        </div>
        {receipt.status === "committed" &&
        receipt.reversibility !== "irreversible" &&
        copy.reverse &&
        canReverse ? (
          <button
            type="button"
            onClick={onReverse}
            className="mt-3 inline-flex min-h-8 items-center gap-1.5 border border-[#17634b]/28 px-2.5 text-[10px] font-bold text-[#17634b] transition-colors hover:bg-[#dce9df]"
          >
            <RotateCcw className="size-3" /> {copy.reverse}
          </button>
        ) : null}
        {receipt.status === "committed" && blockedReason ? (
          <p className="mt-2 text-[10px] leading-4 text-[#8b6d36]">
            {blockedReason}
          </p>
        ) : null}
        {reversed && copy.redo && canRedo ? (
          <button
            type="button"
            onClick={onRedo}
            className="mt-3 inline-flex min-h-8 items-center gap-1.5 border border-[#17634b]/28 px-2.5 text-[10px] font-bold text-[#17634b] transition-colors hover:bg-[#dce9df]"
          >
            <RotateCcw className="size-3 -scale-x-100" /> {copy.redo}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
