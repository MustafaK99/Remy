"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, CircleAlert, Eye, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const autonomyModes = [
  {
    label: "Preview only",
    shortLabel: "Preview",
    description: "Show every proposed change without changing the shop.",
  },
  {
    label: "Ask on changes",
    shortLabel: "Ask",
    description: "This four-change journey would interrupt the user four times.",
  },
  {
    label: "Reversible actions",
    shortLabel: "Reversible",
    description: "Three reversible changes run. The purchase still waits.",
  },
  {
    label: "Trusted run",
    shortLabel: "Trusted",
    description: "Developer hard stops still apply; purchases ask by default.",
  },
];

type ReceiptId = "cart" | "delivery" | "discount" | "purchase" | "recovery";
type ReceiptStatus =
  | "Automatic"
  | "Complete"
  | "Waiting for you"
  | "Would ask"
  | "Preview"
  | "Recovered";

type TimelineItem = {
  id: ReceiptId;
  title: string;
  detail: string;
  status: ReceiptStatus;
  recovery?: string;
};

export function HeroActionDemo() {
  const [modeIndex, setModeIndex] = useState(2);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptId>("delivery");
  const [deliveryRestored, setDeliveryRestored] = useState(false);
  const [purchaseApproved, setPurchaseApproved] = useState(false);
  const mode = autonomyModes[modeIndex];
  const total = deliveryRestored ? 115 : 123;
  const progress = (modeIndex / (autonomyModes.length - 1)) * 100;
  const isAsk = modeIndex === 1;
  const isPreview = modeIndex === 0;
  const reversibleStatus: ReceiptStatus = isPreview
    ? "Preview"
    : isAsk
      ? "Would ask"
      : "Automatic";

  const timeline: TimelineItem[] = [
    {
      id: "cart",
      title: "Morrow One added",
      detail: "Charcoal · £128",
      status: reversibleStatus,
      recovery: "Exact undo",
    },
    {
      id: "delivery",
      title: deliveryRestored ? "Express delivery recovered" : "Express delivery selected",
      detail: deliveryRestored ? "Restored to standard · Free" : "Arrives tomorrow · £8",
      status: deliveryRestored ? "Recovered" : reversibleStatus,
      recovery: "Exact undo",
    },
    {
      id: "discount",
      title: "HELLO10 applied",
      detail: "10% off · saves £13",
      status: reversibleStatus,
      recovery: "Exact undo",
    },
    {
      id: "purchase",
      title: purchaseApproved ? "Order placed" : `Purchase £${total}`,
      detail: purchaseApproved ? "Order MO-2048 confirmed" : "Saved Visa ending 4242",
      status: purchaseApproved
        ? "Complete"
        : isPreview
          ? "Preview"
          : isAsk
            ? "Would ask"
            : "Waiting for you",
      recovery: "Irreversible",
    },
  ];

  if (deliveryRestored) {
    timeline.splice(3, 0, {
      id: "recovery",
      title: "Delivery restored to standard",
      detail: "Express · £8 → Standard · Free",
      status: "Complete",
      recovery: "Linked to #02",
    });
  }

  function reset() {
    setModeIndex(2);
    setSelectedReceipt("delivery");
    setDeliveryRestored(false);
    setPurchaseApproved(false);
  }

  return (
    <motion.div
      id="product"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[20px] border border-white/14 bg-[#ece7dd] text-[#17241f]"
    >
      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#17241f]/12 bg-[#f6f2ea] px-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-[-0.025em]">
            Morrow demo · Reversible actions
          </p>
          <p className="mt-0.5 hidden text-[10px] text-[#68736d] sm:block">
            The agent completes three reversible changes. Remy pauses the purchase.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 font-mono text-[9px] font-medium text-[#68736d] transition-colors hover:text-[#17241f]"
        >
          Reset demo
        </button>
      </div>

      <div className="grid xl:grid-cols-[250px_minmax(0,1fr)_310px]">
        <section className="border-b border-[#17241f]/12 bg-[#e5ded1] p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">
            Agent request
          </p>
          <p className="mt-3 text-sm leading-6 text-[#31443b]">
            Add Morrow One in Charcoal, choose express delivery, and apply HELLO10.
          </p>

          <div className="mt-6 overflow-hidden rounded-[16px] bg-[#d6ddd0]">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/morrow-headphones-kit.png"
                alt="Morrow One headphones and travel case"
                fill
                sizes="250px"
                className="object-cover"
              />
            </div>
          </div>

          <dl className="mt-5 border-y border-[#17241f]/12 text-xs">
            <SummaryLine label="Product" value="£128" />
            <SummaryLine label="Delivery" value={deliveryRestored ? "Free" : "£8"} />
            <SummaryLine label="HELLO10" value="−£13" accent />
            <SummaryLine label="Total" value={`£${total}`} strong />
          </dl>
        </section>

        <section className="min-w-0 border-b border-[#17241f]/12 bg-[#f6f2ea] xl:border-b-0 xl:border-r">
          <div className="border-b border-[#17241f]/12 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">
                  Remy action center
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Morrow checkout
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-[#4c6258]">Claude</p>
                <p className="mt-1 font-mono text-[8px] text-[#7a837e]">via WebMCP</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs font-semibold">AI access</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={mode.label}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="text-[10px] font-medium text-[#4d675b]"
                  >
                    {mode.label}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="relative mt-3 h-7 px-2">
                <div className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-[#b8beb8]" />
                <motion.div
                  className="absolute left-2 top-1/2 h-px -translate-y-1/2 bg-[#d95839]"
                  animate={{ width: `calc(${progress}% - ${progress * 0.16}px)` }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
                {autonomyModes.map((option, index) => (
                  <span
                    key={option.label}
                    className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#f6f2ea] ${
                      index <= modeIndex ? "bg-[#d95839]" : "bg-[#9fa8a2]"
                    }`}
                    style={{ left: `calc(8px + ${(index / 3) * 100}% - ${(index / 3) * 16}px)` }}
                  />
                ))}
                <motion.span
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#17241f] bg-[#f6f2ea]"
                  animate={{ left: `calc(8px + ${progress}% - ${progress * 0.16}px)` }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={modeIndex}
                  aria-label="Agent autonomy"
                  aria-valuetext={mode.label}
                  onChange={(event) => setModeIndex(Number(event.target.value))}
                  className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {autonomyModes.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setModeIndex(index)}
                    className={`text-[9px] font-medium leading-3 transition-colors ${
                      index === modeIndex ? "text-[#17241f]" : "text-[#89918c] hover:text-[#4d5b54]"
                    }`}
                  >
                    {option.shortLabel}
                  </button>
                ))}
              </div>
              <p className="mt-3 min-h-5 text-[10px] leading-4 text-[#737d77]">
                {mode.description}
              </p>
            </div>

          </div>

          <div className="divide-y divide-[#17241f]/10">
            <AnimatePresence initial={false}>
              {timeline.map((item) => (
                <TimelineRow
                  key={item.id}
                  item={item}
                  selected={selectedReceipt === item.id}
                  onSelect={() => setSelectedReceipt(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        <ReceiptDetail
          selectedReceipt={selectedReceipt}
          deliveryRestored={deliveryRestored}
          purchaseApproved={purchaseApproved}
          total={total}
          onUndo={() => {
            setDeliveryRestored(true);
            setSelectedReceipt("recovery");
          }}
          onApprove={() => {
            setPurchaseApproved(true);
            setSelectedReceipt("purchase");
          }}
        />
      </div>
    </motion.div>
  );
}

function TimelineRow({ item, selected, onSelect }: { item: TimelineItem; selected: boolean; onSelect: () => void }) {
  const waiting = item.status === "Waiting for you" || item.status === "Would ask";
  const preview = item.status === "Preview";

  return (
    <motion.button
      type="button"
      layout
      initial={item.id === "recovery" ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-3.5 text-left sm:px-6 ${selected ? "bg-[#eee8dc]" : "hover:bg-[#f0ebe2]"}`}
    >
      <span className={`mt-0.5 grid size-6 place-items-center rounded-full ${waiting ? "bg-[#f3c0af] text-[#913a27]" : preview ? "bg-[#dfe2de] text-[#67736d]" : item.status === "Recovered" ? "bg-[#eadcaa] text-[#705c19]" : "bg-[#d6e9dd] text-[#26714f]"}`}>
        {waiting ? <CircleAlert className="size-3.5" /> : preview ? <Eye className="size-3.5" /> : item.status === "Recovered" ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" strokeWidth={2.5} />}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold leading-5">{item.title}</span>
        <span className="mt-0.5 block truncate text-[10px] leading-4 text-[#6f7b75]">{item.detail}</span>
      </span>
      <span className="text-right">
        <span className={`block font-mono text-[8px] font-medium uppercase tracking-[0.05em] ${waiting ? "text-[#a13e28]" : "text-[#69766f]"}`}>{item.status}</span>
        <span className="mt-1 block text-[8px] text-[#8a928e]">{item.recovery}</span>
      </span>
    </motion.button>
  );
}

function ReceiptDetail({ selectedReceipt, deliveryRestored, purchaseApproved, total, onUndo, onApprove }: { selectedReceipt: ReceiptId; deliveryRestored: boolean; purchaseApproved: boolean; total: number; onUndo: () => void; onApprove: () => void }) {
  const isDelivery = selectedReceipt === "delivery";
  const isRecovery = selectedReceipt === "recovery";
  const isPurchase = selectedReceipt === "purchase";

  return (
    <aside className="bg-[#ede7dc] p-5 sm:p-6" aria-live="polite">
      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">Readable receipt</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={selectedReceipt} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }} className="mt-4">
          <h3 className="text-lg font-semibold leading-6 tracking-[-0.035em]">
            {isDelivery ? "Express delivery selected" : isRecovery ? "Delivery restored to standard" : isPurchase ? purchaseApproved ? "Order MO-2048 placed" : `Purchase £${total} waiting` : selectedReceipt === "cart" ? "Morrow One added" : "HELLO10 applied"}
          </h3>
          <p className="mt-2 text-[11px] leading-5 text-[#68756e]">Requested by Claude · WebMCP</p>

          {isDelivery || isRecovery ? (
            <dl className="mt-6 border-y border-[#17241f]/12">
              <DiffLine label="From" value={isRecovery ? "Express · £8" : "Standard · Free"} />
              <DiffLine label="To" value={isRecovery ? "Standard · Free" : "Express · £8"} />
            </dl>
          ) : null}

          {isPurchase ? (
            <dl className="mt-6 border-y border-[#17241f]/12">
              <DiffLine label="Charge" value={`£${total}`} />
              <DiffLine label="Method" value="Visa ending 4242" />
              <DiffLine label="Recovery" value="Irreversible" />
            </dl>
          ) : null}

          {isRecovery ? (
            <p className="mt-5 rounded-lg bg-[#e3dac8] p-3 text-[10px] leading-4 text-[#5c665f]">Linked to receipt #02. The original action remains in append-only history.</p>
          ) : null}

          {isDelivery && !deliveryRestored ? (
            <button type="button" onClick={onUndo} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#17241f]/22 bg-[#f6f2ea] px-3 text-xs font-semibold transition-colors hover:border-[#17241f]/45">
              <RotateCcw className="size-3.5" /> Restore standard delivery
            </button>
          ) : null}

          {isPurchase && !purchaseApproved ? (
            <button type="button" onClick={onApprove} className="mt-6 min-h-10 bg-[#17241f] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#2d443a]">Approve £{total} purchase</button>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

function SummaryLine({ label, value, strong = false, accent = false }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#17241f]/10 py-2.5 last:border-b-0">
      <dt className={strong ? "font-semibold" : "text-[#647169]"}>{label}</dt>
      <dd className={strong ? "font-semibold" : accent ? "font-medium text-[#28735b]" : "font-medium"}>{value}</dd>
    </div>
  );
}

function DiffLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-3 border-b border-[#17241f]/12 py-3 text-xs last:border-b-0">
      <dt className="text-[#77817c]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
