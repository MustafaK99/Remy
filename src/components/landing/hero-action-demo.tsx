"use client";

import { useState } from "react";
import { Check, CircleAlert, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const autonomyModes = [
  {
    label: "Preview only",
    shortLabel: "Preview",
    description: "Show what would happen. Do not change application state.",
  },
  {
    label: "Ask on changes",
    shortLabel: "Ask",
    description: "Every state-changing action waits for the user.",
  },
  {
    label: "Reversible actions",
    shortLabel: "Reversible",
    description: "Reversible work runs. Consequential actions still wait.",
  },
  {
    label: "Trusted run",
    shortLabel: "Trusted",
    description: "Run within developer policy. Explicit hard stops still apply.",
  },
];

type ReceiptId =
  | "return"
  | "reason"
  | "address"
  | "collection"
  | "refund"
  | "reversal";

type TimelineItem = {
  id: ReceiptId;
  title: string;
  detail: string;
  status: "Done" | "Waiting" | "Reversed";
  recovery?: string;
};

const baseTimeline: TimelineItem[] = [
  {
    id: "return",
    title: "Return created",
    detail: "2 items from order #1842",
    status: "Done",
  },
  {
    id: "reason",
    title: "Return reason added",
    detail: "Incompatible with my laptop",
    status: "Done",
  },
  {
    id: "address",
    title: "Collection address changed",
    detail: "14 High Street → 22 New Road",
    status: "Done",
    recovery: "Exact undo",
  },
  {
    id: "collection",
    title: "Friday collection booked",
    detail: "Cancellation available",
    status: "Done",
    recovery: "Compensation",
  },
  {
    id: "refund",
    title: "Refund £84",
    detail: "Original payment method",
    status: "Waiting",
    recovery: "Irreversible",
  },
];

export function HeroActionDemo() {
  const [modeIndex, setModeIndex] = useState(2);
  const [selectedReceipt, setSelectedReceipt] =
    useState<ReceiptId>("address");
  const [addressReverted, setAddressReverted] = useState(false);
  const [refundApproved, setRefundApproved] = useState(false);

  const mode = autonomyModes[modeIndex];
  const progress = (modeIndex / (autonomyModes.length - 1)) * 100;
  const timeline = baseTimeline.map((item) => {
    if (item.id === "address" && addressReverted) {
      return { ...item, status: "Reversed" as const };
    }
    if (item.id === "refund" && refundApproved) {
      return {
        ...item,
        detail: "Refund sent to original payment method",
        status: "Done" as const,
      };
    }
    return item;
  });

  if (addressReverted) {
    timeline.push({
      id: "reversal",
      title: "Collection address restored",
      detail: "22 New Road → 14 High Street",
      status: "Done",
      recovery: "Reverses #03",
    });
  }

  function reset() {
    setModeIndex(2);
    setSelectedReceipt("address");
    setAddressReverted(false);
    setRefundApproved(false);
  }

  return (
    <motion.div
      id="product"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[20px] border border-white/14 bg-[#ece7dd] text-[#17241f]"
    >
      <div className="flex min-h-12 items-center justify-between border-b border-[#17241f]/12 bg-[#f6f2ea] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-[-0.025em]">
            Morrow returns
          </span>
          <span className="hidden font-mono text-[9px] text-[#68736d] sm:inline">
            Order #1842
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="font-mono text-[9px] font-medium text-[#68736d] transition-colors hover:text-[#17241f]"
        >
          Reset demo
        </button>
      </div>

      <div className="grid xl:grid-cols-[240px_minmax(0,1fr)_310px]">
        <section className="border-b border-[#17241f]/12 bg-[#e5ded1] p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">
            Agent request
          </p>
          <p className="mt-3 text-sm leading-6 text-[#31443b]">
            Return both items, collect next Friday from 22 New Road, and refund
            the original payment method.
          </p>

          <div className="mt-7 border-t border-[#17241f]/12">
            <OrderLine name="Morrow headphones" price="£64" />
            <OrderLine name="Canvas case" price="£20" />
            <div className="flex items-center justify-between border-b border-[#17241f]/12 py-3 text-sm font-semibold">
              <span>Total refund</span>
              <span>£84</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono text-[9px] text-[#727b75]">Collection</p>
            <p className="mt-1 text-xs font-medium leading-5">
              Friday · {addressReverted ? "14 High Street" : "22 New Road"}
            </p>
          </div>
        </section>

        <section className="min-w-0 border-b border-[#17241f]/12 bg-[#f6f2ea] xl:border-b-0 xl:border-r">
          <div className="border-b border-[#17241f]/12 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">
                  Remy action center
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Return order #1842
                </h2>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1.5 text-[10px] font-medium text-[#4c6258]">
                  <span className="size-1.5 rounded-full bg-[#43a778]" />
                  Claude
                </p>
                <p className="mt-1 font-mono text-[8px] text-[#7a837e]">
                  via WebMCP
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs font-semibold">Autonomy</p>
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
                  animate={{
                    left: `calc(8px + ${progress}% - ${progress * 0.16}px)`,
                  }}
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
                      index === modeIndex
                        ? "text-[#17241f]"
                        : "text-[#89918c] hover:text-[#4d5b54]"
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
                <motion.div
                  key={item.id}
                  layout
                  initial={item.id === "reversal" ? { opacity: 0, y: -8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-3.5 sm:px-6 ${
                    selectedReceipt === item.id ? "bg-[#eee8dc]" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-6 place-items-center rounded-full ${
                      item.status === "Waiting"
                        ? "bg-[#f3c0af] text-[#913a27]"
                        : item.status === "Reversed"
                          ? "bg-[#eadcaa] text-[#705c19]"
                          : "bg-[#d6e9dd] text-[#26714f]"
                    }`}
                  >
                    {item.status === "Waiting" ? (
                      <CircleAlert className="size-3.5" />
                    ) : item.status === "Reversed" ? (
                      <RotateCcw className="size-3.5" />
                    ) : (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(item.id)}
                    className="min-w-0 text-left"
                  >
                    <span className="block text-xs font-semibold leading-5">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] leading-4 text-[#6f7b75]">
                      {item.detail}
                    </span>
                  </button>
                  <div className="text-right">
                    <span
                      className={`block font-mono text-[8px] font-medium uppercase tracking-[0.05em] ${
                        item.status === "Waiting" ? "text-[#a13e28]" : "text-[#69766f]"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.recovery ? (
                      <span className="mt-1 block text-[8px] text-[#8a928e]">
                        {item.recovery}
                      </span>
                    ) : null}
                  </div>
                  {item.id === "refund" && !refundApproved ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRefundApproved(true);
                        setSelectedReceipt("refund");
                      }}
                      className="col-start-2 mt-1 w-fit rounded-md bg-[#17241f] px-3 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#2d443a]"
                    >
                      Approve £84 refund
                    </button>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <ReceiptDetail
          selectedReceipt={selectedReceipt}
          addressReverted={addressReverted}
          refundApproved={refundApproved}
          onUndo={() => {
            setAddressReverted(true);
            setSelectedReceipt("reversal");
          }}
        />
      </div>
    </motion.div>
  );
}

function OrderLine({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#17241f]/12 py-3 text-xs">
      <span className="text-[#55645d]">{name}</span>
      <span className="font-medium">{price}</span>
    </div>
  );
}

function ReceiptDetail({
  selectedReceipt,
  addressReverted,
  refundApproved,
  onUndo,
}: {
  selectedReceipt: ReceiptId;
  addressReverted: boolean;
  refundApproved: boolean;
  onUndo: () => void;
}) {
  const isAddress = selectedReceipt === "address";
  const isReversal = selectedReceipt === "reversal";
  const isRefund = selectedReceipt === "refund";

  return (
    <aside className="bg-[#ede7dc] p-5 sm:p-6" aria-live="polite">
      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.11em] text-[#6c756f]">
        Receipt
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedReceipt}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18 }}
          className="mt-4"
        >
          <h3 className="text-lg font-semibold leading-6 tracking-[-0.035em]">
            {isAddress
              ? "Collection address changed"
              : isReversal
                ? "Collection address restored"
                : isRefund
                  ? refundApproved
                    ? "£84 refund approved"
                    : "£84 refund waiting"
                  : "Action completed"
            }
          </h3>
          <p className="mt-2 text-[11px] leading-5 text-[#68756e]">
            Requested by Claude · WebMCP
          </p>

          {isAddress || isReversal ? (
            <dl className="mt-6 border-y border-[#17241f]/12">
              <DiffLine label="From" value={isReversal ? "22 New Road" : "14 High Street"} />
              <DiffLine label="To" value={isReversal ? "14 High Street" : "22 New Road"} />
            </dl>
          ) : null}

          {isRefund ? (
            <dl className="mt-6 border-y border-[#17241f]/12">
              <DiffLine label="Amount" value="£84" />
              <DiffLine label="Method" value="Original payment" />
              <DiffLine label="Result" value={refundApproved ? "Completed" : "No money moved"} />
            </dl>
          ) : null}

          {isReversal ? (
            <div className="mt-5 rounded-lg bg-[#e3dac8] p-3 text-[10px] leading-4 text-[#5c665f]">
              Linked to the original address receipt. Both records remain in history.
            </div>
          ) : null}

          {isAddress && !addressReverted ? (
            <button
              type="button"
              onClick={onUndo}
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#17241f]/22 bg-[#f6f2ea] px-3 text-xs font-semibold transition-colors hover:border-[#17241f]/45"
            >
              <RotateCcw className="size-3.5" />
              Undo address change
            </button>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </aside>
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
