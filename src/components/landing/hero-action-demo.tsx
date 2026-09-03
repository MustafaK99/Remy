"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, CircleAlert, Eye, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ActionReceipt, AutonomyLevel } from "@remy-ai/core";
import { useRemySnapshot } from "@remy-ai/react";
import { AutonomySlider, type AutonomyOption } from "@/components/autonomy-slider";
import { createDocumentRuntime } from "@/landing/document-runtime";

const modes: ReadonlyArray<AutonomyOption<AutonomyLevel>> = [
  { value: "preview", label: "Preview", shortLabel: "Preview", description: "Remy prepares each change without running it." },
  { value: "ask", label: "Ask on changes", shortLabel: "Ask", description: "Every state change waits for the user." },
  { value: "reversible", label: "Reversible actions", shortLabel: "Reversible", description: "Recoverable changes run. Publishing still waits." },
  { value: "trusted", label: "Trusted run", shortLabel: "Trusted", description: "Allowed work runs, while the publish hard stop still applies." },
];

export function HeroActionDemo() {
  const [runtime] = useState(() => createDocumentRuntime());
  const snapshot = useRemySnapshot(runtime.remy);
  const documentState = useSyncExternalStore(runtime.store.subscribe, runtime.store.getSnapshot, runtime.store.getServerSnapshot);
  const [mode, setMode] = useState<AutonomyLevel>("reversible");
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function runScenario(nextMode: AutonomyLevel) {
    setBusy(true);
    setMode(nextMode);
    const results = await runtime.runScenario(nextMode);
    setSelectedId(results.rename.actionId);
    setBusy(false);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setBusy(true);
    void runtime.runScenario("reversible").then((results) => {
      setSelectedId(results.rename.actionId);
      setBusy(false);
    });
  }, [runtime]);

  const receipts = snapshot.receipts;
  const selected = receipts.find((receipt) => receipt.id === selectedId) ?? receipts[0];
  const awaitingPublish = receipts.find((receipt) => receipt.action.name === "publish_document" && receipt.status === "awaiting_approval");
  const approvedPublish = receipts.find((receipt) => receipt.action.name === "publish_document" && receipt.status === "committed");
  const scenarioDescription = approvedPublish
    ? "The user approved publishing after reviewing the receipt."
    : mode === "preview"
    ? "Three changes are prepared. Nothing has run."
    : mode === "ask"
      ? "Every document change is waiting for the user."
      : "Two recoverable changes ran. Publishing is waiting.";

  async function recover(receipt: ActionReceipt) {
    setBusy(true);
    const result = await runtime.remy.revert(receipt.id, { actor: "user", transport: "homepage" });
    if (result.ok) setSelectedId(result.actionId);
    setBusy(false);
  }

  async function approvePublish() {
    if (!awaitingPublish) return;
    setBusy(true);
    const result = await runtime.remy.approve(awaitingPublish.id);
    if (result.ok) setSelectedId(awaitingPublish.id);
    setBusy(false);
  }

  return (
    <section
      data-testid="document-action-demo"
      className="overflow-hidden rounded-[2px] border border-[var(--line-strong)] bg-white text-[var(--ink)]"
    >
      <header className="flex flex-col gap-3 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-sm font-semibold tracking-[-0.02em]">Document actions</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{scenarioDescription}</p>
        </div>
        <button
          type="button"
          onClick={() => void runScenario("reversible")}
          disabled={busy}
          className="min-h-11 cursor-pointer px-2 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:cursor-wait disabled:opacity-50"
        >
          Reset
        </button>
      </header>

      <div className="border-b border-[var(--line)] bg-[var(--paper-muted)] px-5 py-5 sm:px-7">
        <span className="text-xs font-semibold text-[var(--muted)]">Agent request</span>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
          Rename “Untitled document” to “Launch brief”, move it to Project Atlas, then publish it.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <div className="min-w-0 border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--line)] p-5 sm:p-7">
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <StateValue label="Document" value={documentState.title} />
              <StateValue label="Workspace" value={documentState.workspace} />
              <StateValue label="Visibility" value={documentState.published ? "Public" : "Private"} />
            </div>
            <AutonomySlider label="Agent access" value={mode} options={modes} onChange={(nextMode) => void runScenario(nextMode)} />
          </div>

          <div aria-live="polite" aria-busy={busy}>
            {receipts.length === 0 ? (
              <div className="px-5 py-8 text-sm text-[var(--muted)] sm:px-7">Preparing the action preview…</div>
            ) : receipts.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} selected={receipt.id === selected?.id} onSelect={() => setSelectedId(receipt.id)} />
            ))}
          </div>
        </div>

        <ReceiptInspector
          receipt={selected}
          canRecover={selected ? runtime.remy.canRevert(selected).allowed : false}
          waitingPublish={Boolean(awaitingPublish)}
          publishApproved={Boolean(approvedPublish)}
          busy={busy}
          onRecover={recover}
          onApprove={approvePublish}
        />
      </div>
    </section>
  );
}

function StateValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="border-l border-[var(--line-strong)] pl-3">
      <span className="block text-[11px] text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block truncate text-sm font-semibold">{value}</strong>
    </div>
  );
}

function receiptStatus(receipt: ActionReceipt) {
  if (receipt.reversesReceiptId) return { label: "Recovery recorded", tone: "success" };
  if (receipt.status === "awaiting_approval") return { label: "Waiting for you", tone: "warning" };
  if (receipt.status === "staged") return { label: "Previewed", tone: "neutral" };
  if (receipt.status === "reverted" || receipt.status === "compensated") return { label: "Recovered", tone: "success" };
  if (receipt.status === "committed" && receipt.action.recovery === "irreversible") return { label: "Approved", tone: "success" };
  if (receipt.status === "committed") return { label: "Ran automatically", tone: "success" };
  return { label: receipt.status.replaceAll("_", " "), tone: "neutral" };
}

function recoveryLabel(receipt: ActionReceipt) {
  if (receipt.reversesReceiptId) return `Linked to ${receipt.reversesReceiptId.slice(-6)}`;
  if (receipt.action.recovery === "exact") return "Exact undo";
  if (receipt.action.recovery === "compensating") return "Compensation";
  return receipt.action.recovery === "irreversible" ? "Irreversible" : "No change";
}

function ReceiptRow({ receipt, selected, onSelect }: { readonly receipt: ActionReceipt; readonly selected: boolean; readonly onSelect: () => void }) {
  const status = receiptStatus(receipt);
  const Icon = status.tone === "warning" ? CircleAlert : status.tone === "success" ? Check : Eye;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid min-h-[76px] w-full cursor-pointer grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line)] px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--paper)] sm:px-7 ${selected ? "bg-[var(--paper)]" : ""}`}
    >
      <span className={`grid size-8 place-items-center ${status.tone === "warning" ? "bg-[var(--warning-soft)] text-[var(--warning)]" : status.tone === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--paper-muted)] text-[var(--muted)]"}`}>
        <Icon className="size-4" strokeWidth={2.25} />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-semibold">{receipt.action.title}</strong>
        <span className="mt-1 block truncate text-xs text-[var(--muted)]">{receipt.summary}</span>
      </span>
      <span className="text-right">
        <span className={`block text-[11px] font-semibold ${status.tone === "warning" ? "text-[var(--warning)]" : "text-[var(--ink-soft)]"}`}>{status.label}</span>
        <span className="mt-1 block text-[10px] text-[var(--muted)]">{recoveryLabel(receipt)}</span>
      </span>
    </button>
  );
}

function ReceiptInspector({ receipt, canRecover, waitingPublish, publishApproved, busy, onRecover, onApprove }: {
  readonly receipt?: ActionReceipt;
  readonly canRecover: boolean;
  readonly waitingPublish: boolean;
  readonly publishApproved: boolean;
  readonly busy: boolean;
  readonly onRecover: (receipt: ActionReceipt) => Promise<void>;
  readonly onApprove: () => Promise<void>;
}) {
  const change = receipt?.changes[0];

  return (
    <aside className="min-h-[23rem] bg-[var(--paper)] p-5 sm:p-7" aria-live="polite">
      <span className="text-xs font-semibold text-[var(--muted)]">Readable receipt</span>
      <AnimatePresence mode="wait" initial={false}>
        {receipt ? (
          <motion.div key={receipt.id} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.16 }} className="mt-4">
            <h3 className="text-xl font-semibold tracking-[-0.035em]">{receipt.action.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Requested by AI assistant · self-reported · WebMCP</p>

            {change ? (
              <dl className="mt-6 border-y border-[var(--line)]">
                <DiffLine label="Changed" value={change.label} />
                <DiffLine label="Before" value={String(change.before ?? "—")} />
                <DiffLine label="After" value={String(change.after ?? "—")} />
              </dl>
            ) : null}

            <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
              {receipt.reversesReceiptId
                ? "This recovery is linked to the original receipt. Both stay in history."
                : receipt.action.recovery === "irreversible"
                  ? "This action cannot be undone, so Remy pauses it for explicit approval."
                  : "Remy can restore the recorded previous value if the resource has not changed again."}
            </p>

            {canRecover ? (
              <button type="button" disabled={busy} onClick={() => void onRecover(receipt)} className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[var(--line-strong)] bg-[var(--paper-strong)] px-4 text-sm font-semibold transition-colors hover:border-[var(--ink)] disabled:cursor-wait disabled:opacity-50">
                <RotateCcw className="size-4" /> Undo change
              </button>
            ) : null}

            {receipt.action.name === "publish_document" && waitingPublish ? (
              <button type="button" disabled={busy} onClick={() => void onApprove()} className="mt-6 min-h-11 cursor-pointer bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-soft)] disabled:cursor-wait disabled:opacity-50">
                Approve publish
              </button>
            ) : null}

            {receipt.action.name === "publish_document" && publishApproved ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--success)]"><Check className="size-4" /> Publish approved</p>
            ) : null}
          </motion.div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Select an action to inspect its receipt.</p>
        )}
      </AnimatePresence>
    </aside>
  );
}

function DiffLine({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-[var(--line)] py-3 text-xs last:border-b-0">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
