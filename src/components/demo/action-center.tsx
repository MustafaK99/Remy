"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  CircleDashed,
  RotateCcw,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ActionReceipt } from "@remy-ai/core";
import type { WebMCPStatus } from "@remy-ai/webmcp";
import {
  AutonomySlider,
  type AutonomyOption,
} from "@/components/autonomy-slider";
import {
  latestAwaitingReceipt,
  useDemoRemy,
  type ControlMode,
} from "@/demo/provider";
import { ApprovalView } from "./approval-view";

const controlOptions: ReadonlyArray<AutonomyOption<ControlMode>> = [
  {
    value: "preview",
    label: "Preview",
    shortLabel: "Preview",
    description: "AI can prepare changes. Nothing runs.",
  },
  {
    value: "ask",
    label: "Ask on changes",
    shortLabel: "Ask",
    description: "Every state-changing action waits for you.",
  },
  {
    value: "safe",
    label: "Reversible actions",
    shortLabel: "Reversible",
    description: "Recoverable work runs. The refund waits.",
  },
  {
    value: "full",
    label: "Trusted run",
    shortLabel: "Trusted",
    description: "All registered return actions may run without another prompt.",
  },
];

function activityCopy(receipt: ActionReceipt) {
  const input = receipt.input ?? {};

  if (receipt.reversesReceiptId) {
    const firstChange = receipt.changes[0];
    return {
      title: receipt.action.name.includes("book_collection")
        ? "Collection cancellation recorded"
        : "Previous value restored",
      detail: firstChange
        ? `${String(firstChange.before ?? "Before")} → ${String(firstChange.after ?? "After")}`
        : "Linked recovery for the earlier action.",
      reverseLabel: "",
    };
  }

  switch (receipt.action.name) {
    case "create_return":
      return {
        title: "Return created",
        detail: "Headphones and case · £84 total",
        reverseLabel: "Remove return",
      };
    case "add_return_reason":
      return {
        title: "Return reason added",
        detail: String(input.reason ?? "Reason recorded"),
        reverseLabel: "Remove reason",
      };
    case "change_collection_address":
      return {
        title: "Collection address changed",
        detail: "14 High Street → 22 New Road",
        reverseLabel: "Restore 14 High Street",
      };
    case "book_collection":
      return {
        title: "Collection booked",
        detail: `${String(input.date ?? "Next Friday")} · 22 New Road`,
        reverseLabel: "Cancel collection",
      };
    case "issue_refund":
      return {
        title: "£84 refund issued",
        detail: "Sent to Visa ending 4242",
        reverseLabel: "",
      };
    default:
      return {
        title: receipt.action.title,
        detail: receipt.summary,
        reverseLabel: "Recover action",
      };
  }
}

function RemySymbol({ attention = false }: { readonly attention?: boolean }) {
  return (
    <span
      className={`relative block size-8 shrink-0 border ${
        attention
          ? "border-[var(--ink)] bg-[var(--accent)]"
          : "border-[var(--line-strong)] bg-[var(--paper-muted)]"
      }`}
      aria-hidden="true"
    >
      <span className="absolute left-[7px] top-[8px] h-1.5 w-4 -skew-x-[32deg] bg-[var(--ink)]" />
      <span className="absolute bottom-[8px] right-[7px] h-1.5 w-4 -skew-x-[32deg] bg-[var(--accent)]" />
    </span>
  );
}

export function ActionCenter({
  connectionStatus,
  open,
  onOpenChange,
}: {
  readonly connectionStatus: WebMCPStatus;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const {
    controlMode,
    lastError,
    setControlMode,
    revert,
    runtime,
    remySnapshot: snapshot,
  } = useDemoRemy();
  const reducedMotion = useReducedMotion();
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
          (receipt.actor === "agent" || Boolean(receipt.reversesReceiptId)),
      ),
    [snapshot.receipts],
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
    (receipt) =>
      receipt.actor === "agent" && receipt.sequence > effectiveLastSeen,
  ).length;
  const working = snapshot.receipts.some((receipt) =>
    ["proposed", "executing", "reverting"].includes(receipt.status),
  );
  const selectedOption = controlOptions.find(
    (option) => option.value === controlMode,
  ) ?? controlOptions[2];
  const assistantName = snapshot.activePrincipal?.name;
  const assistantLine = assistantName
    ? `${assistantName} · identity self-reported`
    : connectionStatus === "checking"
      ? "Checking WebMCP support"
      : connectionStatus === "ready"
        ? "WebMCP ready"
        : connectionStatus === "unsupported"
          ? "WebMCP unavailable · return page still works"
          : connectionStatus === "partial"
            ? "Some WebMCP actions are unavailable"
            : "WebMCP registration failed · return page still works";
  const dockLabel = permissionRequest
    ? "AI wants more access"
    : awaiting?.action.name === "issue_refund"
      ? "£84 refund needs approval"
      : awaiting
        ? "One change needs approval"
        : unseenCount > 0
          ? `${unseenCount} ${unseenCount === 1 ? "agent change" : "agent changes"}`
          : selectedOption.label;
  const notificationCount = permissionRequest || awaiting
    ? "!"
    : unseenCount || undefined;

  useEffect(() => {
    if (open && !wasOpen.current) closeButtonRef.current?.focus();
    if (!open && wasOpen.current) {
      requestAnimationFrame(() => dockButtonRef.current?.focus());
    }
    wasOpen.current = open;
  }, [open]);

  function closePanel() {
    setLastSeenSequence(latestAgentSequence);
    onOpenChange(false);
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.aside
            id="remy-panel"
            initial={reducedMotion ? false : { x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%", opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-3 z-[70] flex max-h-[64svh] flex-col overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-strong)] text-[var(--ink)] shadow-[0_18px_50px_rgba(23,23,19,.14)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-h-[78svh] sm:w-[430px] lg:inset-y-0 lg:right-0 lg:max-h-none lg:border-y-0 lg:border-r-0 lg:shadow-[-8px_0_32px_rgba(23,23,19,.08)]"
            role="dialog"
            aria-modal="false"
            aria-labelledby="remy-panel-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closePanel();
            }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <RemySymbol attention={Boolean(permissionRequest || awaiting)} />
                <div className="min-w-0">
                  <h2 id="remy-panel-title" className="text-sm font-bold tracking-[-0.02em]">
                    Remy
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    {assistantLine}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePanel}
                aria-label="Hide Remy"
                className="grid size-11 cursor-pointer place-items-center text-[var(--muted)] transition-colors hover:bg-[var(--paper-muted)] hover:text-[var(--ink)]"
              >
                <X className="size-[17px]" />
              </button>
            </header>

            <section className="border-b border-[var(--line)] bg-[var(--paper)] px-5 py-5">
              <AutonomySlider
                label="AI access"
                value={controlMode}
                options={controlOptions}
                onChange={setControlMode}
              />
            </section>

            <div className="remy-scroll min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence initial={false}>
                {permissionRequest ? (
                  <motion.section
                    key={permissionRequest.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-[var(--line)] bg-[var(--accent-soft)] px-5 py-5"
                  >
                    <p className="text-xs font-semibold text-[var(--warning)]">
                      Permission request
                    </p>
                    <h3 className="mt-2 text-lg font-bold tracking-[-0.03em]">
                      {permissionRequest.requestedBy?.name ?? "AI"} wants more access
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
                      Allow {controlLabel(permissionRequest.controls.autonomy)}. The change has not been applied yet.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => runtime.remy.rejectControlChange(permissionRequest.id)}
                        className="min-h-11 cursor-pointer border border-[var(--line-strong)] bg-[var(--paper-strong)] px-3 text-xs font-semibold"
                      >
                        Keep my settings
                      </button>
                      <button
                        type="button"
                        onClick={() => runtime.remy.approveControlChange(permissionRequest.id)}
                        className="min-h-11 cursor-pointer bg-[var(--ink)] px-3 text-xs font-semibold text-white"
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
                    <h3 className="text-sm font-bold">Agent activity</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      What the agent requested, in order.
                    </p>
                  </div>
                  {working ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success)]">
                      <CircleDashed className="size-3.5 animate-spin" /> Executing
                    </span>
                  ) : null}
                </div>

                {activities.length === 0 ? (
                  <div className="mt-5 border-y border-[var(--line)] py-7">
                    <p className="text-sm font-semibold">No agent changes yet.</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      WebMCP actions will appear here with their outcome.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {activities.map((receipt) => (
                      <ActivityRow
                        key={receipt.id}
                        receipt={receipt}
                        canRecover={runtime.remy.canRevert(receipt).allowed}
                        onRecover={() => void revert(receipt.id)}
                      />
                    ))}
                  </div>
                )}

                {lastError ? (
                  <div className="mt-4 flex gap-2 border border-[var(--warning)] bg-[var(--warning-soft)] p-3 text-xs leading-5 text-[var(--warning)]">
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
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setLastSeenSequence(latestAgentSequence);
              onOpenChange(true);
            }}
            className={`fixed bottom-4 right-4 z-50 flex min-h-14 max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-3 border p-2 pr-4 text-left shadow-[0_10px_30px_rgba(23,23,19,.12)] sm:bottom-6 sm:right-6 ${
              permissionRequest || awaiting
                ? "border-[var(--ink)] bg-[var(--accent)]"
                : "border-[var(--line-strong)] bg-[var(--paper-strong)]"
            }`}
            aria-label={`Open Remy. ${dockLabel}`}
            aria-controls="remy-panel"
            aria-expanded="false"
          >
            <span className="relative">
              <RemySymbol attention={Boolean(permissionRequest || awaiting)} />
              {notificationCount ? (
                <span className="absolute -right-2 -top-2 grid size-[18px] place-items-center bg-[var(--ink)] text-[9px] font-bold text-white ring-2 ring-[var(--paper-strong)]">
                  {notificationCount}
                </span>
              ) : null}
            </span>
            <span>
              <span className="block text-[10px] font-semibold text-[var(--muted)]">
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

function ActivityRow({
  receipt,
  canRecover,
  onRecover,
}: {
  readonly receipt: ActionReceipt;
  readonly canRecover: boolean;
  readonly onRecover: () => void;
}) {
  const copy = activityCopy(receipt);
  const isRecovery = Boolean(receipt.reversesReceiptId);
  const status = statusCopy(receipt);
  const requester = receipt.principal?.name ?? "AI assistant";
  const actor = isRecovery
    ? `${receipt.actor === "user" ? "Recovered by you" : `Recovered by ${requester}`} · linked receipt`
    : receipt.actor === "user"
      ? "Changed by you"
      : receipt.status === "committed" &&
          ["require_approval", "stage"].includes(receipt.policyDecision.outcome)
        ? `Approved by you · requested by ${requester}`
        : `Requested by ${requester}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-4"
    >
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center border ${status.iconClass}`}
      >
        <status.Icon className={`size-3.5 ${status.spin ? "animate-spin" : ""}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{copy.title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {copy.detail}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold ${status.textClass}`}>
            {status.label}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-[var(--muted)]">{actor}</p>
          {receipt.status === "committed" && canRecover && copy.reverseLabel ? (
            <button
              type="button"
              onClick={onRecover}
              className="min-h-8 cursor-pointer text-[11px] font-semibold text-[var(--success)] underline decoration-current/30 underline-offset-4 hover:text-[var(--ink)]"
            >
              {copy.reverseLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function statusCopy(receipt: ActionReceipt) {
  if (receipt.reversesReceiptId) {
    return {
      label: "Recovery",
      Icon: RotateCcw,
      iconClass: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
      textClass: "text-[var(--success)]",
      spin: false,
    };
  }
  if (["proposed", "executing", "reverting"].includes(receipt.status)) {
    return {
      label: "Executing",
      Icon: CircleDashed,
      iconClass: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]",
      textClass: "text-[var(--accent)]",
      spin: true,
    };
  }
  if (receipt.status === "awaiting_approval" || receipt.status === "staged") {
    return {
      label: receipt.status === "staged" ? "Pending" : "Waiting",
      Icon: CircleAlert,
      iconClass: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--warning)]",
      textClass: "text-[var(--warning)]",
      spin: false,
    };
  }
  if (["rejected", "denied", "failed"].includes(receipt.status)) {
    return {
      label: receipt.status === "failed" ? "Failed" : receipt.status === "denied" ? "Blocked" : "Rejected",
      Icon: X,
      iconClass: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
      textClass: "text-[var(--warning)]",
      spin: false,
    };
  }
  if (["reverted", "compensated"].includes(receipt.status)) {
    return {
      label: "Reversed",
      Icon: RotateCcw,
      iconClass: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
      textClass: "text-[var(--success)]",
      spin: false,
    };
  }
  return {
    label: "Completed",
    Icon: Check,
    iconClass: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    textClass: "text-[var(--success)]",
    spin: false,
  };
}

function controlLabel(autonomy: string) {
  return autonomy === "preview"
    ? "Preview"
    : autonomy === "ask"
      ? "Ask on changes"
      : autonomy === "trusted"
        ? "Trusted run"
        : "Reversible actions";
}
