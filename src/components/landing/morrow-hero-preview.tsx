"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { ActionReceipt } from "@remy-ai/core";
import { useRemySnapshot } from "@remy-ai/react";
import { createDemoRuntime } from "@/demo/runtime";
import { getCartTotal } from "@/demo/data";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
});

export function MorrowHeroPreview() {
  const [runtime] = useState(() => createDemoRuntime());
  const snapshot = useRemySnapshot(runtime.remy);
  const shop = useSyncExternalStore(
    runtime.store.subscribe,
    runtime.store.getSnapshot,
    runtime.store.getServerSnapshot,
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const runPreview = useCallback(async () => {
    setBusy(true);
    runtime.reset();
    await runtime.remy.runByName(
      "add_to_cart",
      { productId: "morrow-one", colour: "Charcoal", quantity: 1 },
      { actor: "agent", transport: "webmcp" },
    );
    const delivery = await runtime.remy.runByName(
      "choose_delivery",
      { method: "express" },
      { actor: "agent", transport: "webmcp" },
    );
    await runtime.remy.runByName(
      "place_order",
      {},
      { actor: "agent", transport: "webmcp" },
    );
    if (delivery.ok) setSelectedId(delivery.actionId);
    setBusy(false);
  }, [runtime]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void runPreview();
  }, [runPreview]);

  const receipts = snapshot.receipts.filter((receipt) =>
    ["add_to_cart", "choose_delivery", "place_order", "recover_choose_delivery"].includes(
      receipt.action.name,
    ),
  );
  const selected = receipts.find((receipt) => receipt.id === selectedId)
    ?? receipts.find((receipt) => receipt.action.name === "choose_delivery")
    ?? receipts[0];
  const pendingPurchase = receipts.find(
    (receipt) => receipt.action.name === "place_order" && receipt.status === "awaiting_approval",
  );

  async function undoDelivery(receipt: ActionReceipt) {
    setBusy(true);
    const result = await runtime.remy.revert(receipt.id, {
      actor: "user",
      transport: "homepage",
    });
    if (result.ok) setSelectedId(result.actionId);
    setBusy(false);
  }

  async function approvePurchase() {
    if (!pendingPurchase) return;
    setBusy(true);
    await runtime.remy.approve(pendingPurchase.id);
    setSelectedId(pendingPurchase.id);
    setBusy(false);
  }

  const change = selected?.changes[0];
  const deliveryReceipt = receipts.find(
    (receipt) => receipt.action.name === "choose_delivery",
  );
  const canUndoDelivery = deliveryReceipt
    ? runtime.remy.canRevert(deliveryReceipt).allowed
    : false;

  return (
    <div data-testid="landing-morrow-preview" className="grid h-full min-h-[620px] grid-rows-[56px_150px_auto_1fr] lg:min-h-[700px]">
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 font-mono text-xs sm:px-6">
        <span className="text-[var(--text-primary)]">REMY / MORROW CHECKOUT</span>
        <button type="button" onClick={() => void runPreview()} disabled={busy} className="min-h-11 cursor-pointer text-[var(--text-quiet)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-wait">
          Reset
        </button>
      </header>

      <div className="grid grid-cols-[142px_1fr] border-b border-[var(--border-subtle)] sm:grid-cols-[180px_1fr]">
        <div className="relative border-r border-[var(--border-subtle)]">
          <Image src="/images/morrow-headphones-kit.png" alt="Morrow One headphones" fill sizes="180px" className="object-cover" priority />
        </div>
        <div className="flex flex-col justify-center px-5 sm:px-6">
          <p className="font-mono text-[10px] text-[var(--text-quiet)]">SHOPPING BAG</p>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <strong className="text-base font-medium text-[var(--text-primary)]">Morrow One</strong>
            <span className="font-mono text-sm text-[var(--text-secondary)]">{money.format(getCartTotal(shop))}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-quiet)]">Charcoal · Express delivery</p>
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)]" aria-live="polite" aria-busy={busy}>
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3 sm:px-6">
          <span className="font-mono text-[10px] text-[var(--text-quiet)]">AGENT ACTIONS</span>
          <span className="font-mono text-[10px] text-[var(--success)]">REVERSIBLE ACTIONS</span>
        </div>
        {receipts.map((receipt) => (
          <ActionRow
            key={receipt.id}
            receipt={receipt}
            selected={receipt.id === selected?.id}
            onSelect={() => setSelectedId(receipt.id)}
          />
        ))}
      </div>

      <div className="grid min-h-0 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 px-5 py-5 sm:px-6">
          <p className="font-mono text-[10px] text-[var(--text-quiet)]">READABLE RECEIPT</p>
          <h3 className="mt-3 text-lg font-normal tracking-[-0.03em] text-[var(--text-primary)]">
            {selected?.reversesReceiptId ? "Delivery restored" : selected?.action.title ?? "Preparing actions"}
          </h3>
          {change ? (
            <dl className="mt-4 grid grid-cols-[64px_1fr] gap-y-2 border-t border-[var(--border-subtle)] pt-3 text-xs">
              <dt className="text-[var(--text-quiet)]">Before</dt>
              <dd className="text-[var(--text-secondary)]">{String(change.before ?? "Empty")}</dd>
              <dt className="text-[var(--text-quiet)]">After</dt>
              <dd className="text-[var(--text-primary)]">{String(change.after ?? "Empty")}</dd>
            </dl>
          ) : null}
          {selected?.reversesReceiptId ? (
            <p className="mt-3 font-mono text-[10px] text-[var(--success)]">LINKED RECOVERY RECEIPT</p>
          ) : null}
        </div>
        <div className="flex items-end gap-2 border-t border-[var(--border-subtle)] px-5 py-5 sm:w-[206px] sm:flex-col sm:items-stretch sm:justify-end sm:border-l sm:border-t-0">
          {canUndoDelivery && deliveryReceipt ? (
            <button data-testid="landing-undo-delivery" type="button" disabled={busy} onClick={() => void undoDelivery(deliveryReceipt)} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-[var(--border-strong)] px-3 font-mono text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--text-secondary)] disabled:cursor-wait">
              <RotateCcw className="size-3.5" /> Undo delivery
            </button>
          ) : null}
          {pendingPurchase ? (
            <button data-testid="landing-approve-purchase" type="button" disabled={busy} onClick={() => void approvePurchase()} className="min-h-10 cursor-pointer bg-[var(--text-primary)] px-3 font-mono text-xs text-[var(--background)] transition-colors hover:bg-white disabled:cursor-wait">
              Approve {money.format(getCartTotal(shop))} purchase
            </button>
          ) : shop.order.status === "placed" ? (
            <p className="inline-flex min-h-10 items-center justify-center gap-2 font-mono text-xs text-[var(--success)]"><Check className="size-3.5" /> Order placed</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionRow({ receipt, selected, onSelect }: { readonly receipt: ActionReceipt; readonly selected: boolean; readonly onSelect: () => void }) {
  const isWaiting = receipt.status === "awaiting_approval";
  const isRecovery = Boolean(receipt.reversesReceiptId);
  const status = isWaiting ? "WAITING FOR YOU" : isRecovery ? "RECOVERY" : receipt.status === "reverted" ? "UNDONE" : "AUTOMATIC";

  return (
    <button type="button" onClick={onSelect} className={`grid min-h-[58px] w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border-subtle)] px-5 text-left last:border-b-0 sm:px-6 ${selected ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}>
      <span className={`grid size-[18px] place-items-center border ${isWaiting ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--success)] text-[var(--success)]"}`}>
        {isWaiting ? "!" : <Check className="size-3" strokeWidth={2} />}
      </span>
      <span className="truncate text-sm text-[var(--text-primary)]">{receipt.action.title}</span>
      <span className={`font-mono text-[9px] ${isWaiting ? "text-[var(--accent)]" : "text-[var(--text-quiet)]"}`}>{status}</span>
    </button>
  );
}
