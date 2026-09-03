"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { DemoRemyProvider, useDemoRemy } from "@/demo/provider";
import { useWebMCPRegistration } from "@/demo/use-webmcp-registration";
import { ActionCenter } from "./action-center";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
});

function DemoWorkspace() {
  const { runtime, state, remySnapshot, reset } = useDemoRemy();
  const webmcpStatus = useWebMCPRegistration(runtime.remy);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [judgeMode] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("judge") === "1",
  );
  const request = state.returnRequest;
  const refundWaiting = remySnapshot.receipts.some(
    (receipt) =>
      receipt.action.name === "issue_refund" &&
      ["awaiting_approval", "staged"].includes(receipt.status),
  );

  function resetDemo() {
    reset();
    setDrawerOpen(false);
  }

  const connection = connectionCopy(webmcpStatus);

  return (
    <div className="min-h-screen bg-[#f3f1ea] text-[#17342b]">
      <div
        className={`min-h-screen transition-[padding] duration-200 ease-out ${
          drawerOpen ? "lg:pr-[430px]" : ""
        }`}
      >
        <div className="bg-[#17342b] px-4 py-2 text-center text-[11px] font-medium text-white/80">
          Free delivery over £50 · 30-day returns
        </div>

        <header className="border-b border-[#d3cec1] bg-[#fffdf7]">
          <div className="mx-auto flex min-h-[72px] max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
            <div className="flex items-center gap-6">
              <Link
                href="/demo"
                className="text-[26px] font-black tracking-[-0.07em]"
                aria-label="Morrow orders"
              >
                morrow<span className="text-[#e85d28]">.</span>
              </Link>
              <span className="hidden h-5 w-px bg-[#d3cec1] sm:block" aria-hidden="true" />
              <span className="hidden text-sm font-medium text-[#66766f] sm:inline">
                Your orders
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span
                className={`inline-flex min-h-9 items-center gap-2 border border-[#d3cec1] bg-white px-3 text-xs font-semibold ${connection.tone}`}
                data-testid="webmcp-status"
              >
                <span className={`size-2 rounded-full ${connection.dot}`} aria-hidden="true" />
                {connection.label}
              </span>
              <button
                type="button"
                onClick={resetDemo}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-xs font-semibold text-[#5f6e67] transition-colors hover:text-[#17342b]"
              >
                <RotateCcw className="size-3.5" />
                Reset demo
              </button>
            </div>
          </div>
        </header>

        {judgeMode ? (
          <aside className="border-b border-[#d3cec1] bg-[#f6dacd]" data-testid="judge-instructions">
            <div className="mx-auto max-w-[1240px] px-5 py-4 sm:px-8">
              <p className="text-sm font-bold">Judge test path</p>
              <p className="mt-1 max-w-4xl text-xs leading-5 text-[#5d5049]">
                Through WebMCP: create the return for both items, add “Incompatible with my laptop”, change the address to 22 New Road, book next Friday, then issue the refund. Open Remy to review or reverse actions.
              </p>
            </div>
          </aside>
        ) : null}

        <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#69766f] hover:text-[#17342b]"
          >
            <ArrowLeft className="size-3.5" /> Back to Remy
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#c9c3b5] pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#69766f]">
                Delivered {state.order.deliveredAt}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-[-0.055em] sm:text-6xl">
                Order #1842
              </h1>
            </div>
            <span className="w-fit border border-[#8eaa9d] bg-[#dce7df] px-3 py-2 text-xs font-semibold text-[#2e654f]">
              Return available
            </span>
          </div>

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)] lg:gap-12">
            <section className="min-w-0" aria-labelledby="order-items-heading">
              <div className="relative h-[240px] overflow-hidden bg-[#d7d9cd] sm:h-auto sm:aspect-[16/8.5]">
                <Image
                  src="/images/morrow-headphones-kit.png"
                  alt="Charcoal headphones beside their canvas travel case"
                  fill
                  priority
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="border-x border-b border-[#d3cec1] bg-[#fffdf7]">
                <div className="border-b border-[#d3cec1] px-5 py-4">
                  <h2 id="order-items-heading" className="text-sm font-bold">
                    Two items
                  </h2>
                </div>
                {state.order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#ded9cc] px-5 py-5 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-[#748078]">{item.detail} · Quantity 1</p>
                    </div>
                    <p className="font-semibold">{money.format(item.price)}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="min-w-0 space-y-5">
              <section className="border border-[#c9c3b5] bg-[#fffdf7]">
                <div className="flex items-center justify-between gap-4 border-b border-[#d3cec1] px-5 py-5">
                  <div>
                    <p className="text-xs font-medium text-[#748078]">Return status</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">
                      {request.refund.status === "issued"
                        ? "Return complete"
                        : request.status === "not_started"
                          ? "No return started"
                          : "Return in progress"}
                    </h2>
                  </div>
                  <span
                    className={`grid size-11 shrink-0 place-items-center ${
                      request.status === "not_started"
                        ? "bg-[#e9e5db] text-[#81847d]"
                        : "bg-[#dce7df] text-[#3f6f5b]"
                    }`}
                  >
                    <PackageCheck className="size-5" />
                  </span>
                </div>

                <dl className="px-5">
                  <ReturnState
                    label="Items"
                    value={request.itemIds.length === 2 ? "Both items" : "Not selected"}
                    state={request.itemIds.length === 2 ? "done" : "idle"}
                  />
                  <ReturnState
                    label="Reason"
                    value={request.reason ?? "Not added"}
                    state={request.reason ? "done" : "idle"}
                  />
                  <ReturnState
                    label="Address"
                    value={request.collectionAddress}
                    state={request.collectionAddress === "22 New Road" ? "done" : "idle"}
                  />
                  <ReturnState
                    label="Collection"
                    value={
                      request.collection.status === "booked"
                        ? `${request.collection.date} · booked`
                        : request.collection.status === "cancelled"
                          ? "Cancelled"
                          : "Not booked"
                    }
                    state={
                      request.collection.status === "booked"
                        ? "done"
                        : request.collection.status === "cancelled"
                          ? "recovered"
                          : "idle"
                    }
                  />
                  <ReturnState
                    label="Refund"
                    value={
                      request.refund.status === "issued"
                        ? "£84 sent to Visa ending 4242"
                        : refundWaiting
                          ? "Waiting for approval"
                          : "Not issued"
                    }
                    state={
                      request.refund.status === "issued"
                        ? "done"
                        : refundWaiting
                          ? "waiting"
                          : "idle"
                    }
                  />
                </dl>
              </section>

              <section className="border border-[#d3cec1] bg-[#e9e5db] p-5">
                <h2 className="text-sm font-bold">Payment summary</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryLine label="Headphones" value="£64" />
                  <SummaryLine label="Case" value="£20" />
                  <div className="border-t border-[#c9c3b5] pt-3">
                    <SummaryLine label="Refund total" value="£84" strong />
                  </div>
                </dl>
                <p className="mt-4 border-t border-[#c9c3b5] pt-4 text-xs leading-5 text-[#69766f]">
                  Original payment · {state.order.paymentMethod}
                </p>
              </section>
            </aside>
          </div>

          <p className="mt-10 border-t border-[#d3cec1] pt-5 text-xs text-[#7a817c]">
            Fictional order for the Remy WebMCP demo. No collection or payment is created.
          </p>
        </main>
      </div>

      <ActionCenter
        connectionStatus={webmcpStatus}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

function ReturnState({
  label,
  value,
  state,
}: {
  readonly label: string;
  readonly value: string;
  readonly state: "idle" | "done" | "waiting" | "recovered";
}) {
  return (
    <motion.div
      layout
      className="grid grid-cols-[20px_5.5rem_1fr] gap-3 border-b border-[#ded9cc] py-4 last:border-b-0"
    >
      <span
        className={`mt-0.5 grid size-5 place-items-center border ${
          state === "waiting"
            ? "border-[#e85d28] bg-[#f8d8cb] text-[#93422f]"
            : state === "done" || state === "recovered"
              ? "border-[#8eaa9d] bg-[#dce7df] text-[#3f6f5b]"
              : "border-[#b8b2a6] text-transparent"
        }`}
      >
        {state === "waiting" ? (
          <CircleDashed className="size-3 animate-spin" />
        ) : (
          <Check className="size-3" strokeWidth={3} />
        )}
      </span>
      <dt className="text-xs font-medium text-[#748078]">{label}</dt>
      <dd className="text-right text-xs font-semibold leading-5">{value}</dd>
    </motion.div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-bold" : "text-[#69766f]"}>{label}</dt>
      <dd className={strong ? "font-bold" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function connectionCopy(status: string) {
  if (status === "ready") {
    return { label: "WebMCP ready", dot: "bg-[#3f6f5b]", tone: "text-[#2e654f]" };
  }
  if (status === "checking") {
    return { label: "Checking WebMCP", dot: "bg-[#d49a2f]", tone: "text-[#6e5a2e]" };
  }
  if (status === "unsupported") {
    return { label: "WebMCP unavailable", dot: "bg-[#8c8981]", tone: "text-[#64615b]" };
  }
  return { label: "WebMCP partially available", dot: "bg-[#93422f]", tone: "text-[#93422f]" };
}

export function DemoApp() {
  return (
    <DemoRemyProvider>
      <DemoWorkspace />
    </DemoRemyProvider>
  );
}
