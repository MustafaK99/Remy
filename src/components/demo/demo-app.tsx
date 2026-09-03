"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDashed,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { HERO_PROMPT } from "@/demo/data";
import { useWebMCPRegistration } from "@/remy/adapters/webmcp";
import { RemyProvider, useRemy } from "@/remy/react/provider";
import { ActionCenter } from "./action-center";

function DemoWorkspace() {
  const { engine, snapshot, runStatus, runDemo, reset } = useRemy();
  const webmcpStatus = useWebMCPRegistration(engine);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const demo = snapshot.state;
  const webmcpReady = webmcpStatus === "ready";
  const requestSent = runStatus !== "idle" || snapshot.receipts.length > 0;
  const refundComplete = demo.return.refund.status === "issued";
  const refundWaiting = snapshot.receipts.some(
    (receipt) =>
      receipt.actionName === "issue_refund" &&
      ["awaiting_approval", "staged"].includes(receipt.status),
  );

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const startReturn = async () => {
    setDrawerOpen(true);
    await runDemo();
  };

  const restartDemo = () => {
    reset();
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f0e4] text-[#18201c]">
      <div className="bg-[#17342b] px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
        Free delivery on orders over £50 · 30-day returns
      </div>

      <header className="border-b border-[#17342b]/16 bg-[#fffaf0]">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-9">
            <Link
              href="#"
              className="text-2xl font-black tracking-[-0.065em] text-[#17342b]"
            >
              morrow<span className="text-[#ef6f50]">.</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4e5d55] md:flex">
              <Link href="#products" className="hover:text-[#17342b]">
                Headphones
              </Link>
              <Link href="#products" className="hover:text-[#17342b]">
                Accessories
              </Link>
              <Link href="#support" className="hover:text-[#17342b]">
                Support
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              className="grid size-10 place-items-center hover:bg-[#e9e4d8]"
            >
              <Search className="size-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Your account"
              className="hidden size-10 place-items-center hover:bg-[#e9e4d8] sm:grid"
            >
              <UserRound className="size-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Shopping bag, 0 items"
              className="relative grid size-10 place-items-center hover:bg-[#e9e4d8]"
            >
              <ShoppingBag className="size-[18px]" />
              <span className="absolute right-0 top-0 grid size-4 place-items-center bg-[#f4c95d] font-mono text-[8px] font-bold">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#17342b]/18 bg-[#f4c95d] text-[#17342b]">
        <div className="mx-auto flex min-h-10 max-w-[1240px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-xs font-bold">
            <Sparkles className="size-3.5" />
            WebMCP demo: a browser assistant is using this shop
          </p>
          <div className="flex shrink-0 items-center gap-4">
            {requestSent ? (
              <button
                type="button"
                onClick={restartDemo}
                className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] underline underline-offset-4"
              >
                Start over
              </button>
            ) : null}
            <Link
              href="/"
              className="hidden items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] sm:inline-flex"
            >
              <ArrowLeft className="size-3" /> Remy site
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-[#7a827d]">
          <Link href="#" className="hover:text-[#17342b]">
            Your account
          </Link>
          <ChevronRight className="size-3" />
          <Link href="#" className="hover:text-[#17342b]">
            Orders
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-[#17342b]">#1842</span>
        </nav>

        <div className="mt-6 flex flex-col justify-between gap-4 border-b border-[#17342b]/16 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#78827d]">
              Delivered 28 August
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-6xl">
              Order #1842
            </h1>
          </div>
          <span className="w-fit border border-[#237158]/35 bg-[#dceadf] px-3 py-2 text-xs font-bold text-[#17634b]">
            Return available until 27 September
          </span>
        </div>

        <section className="mt-6 grid border-2 border-[#17342b] bg-[#e3eadf] lg:grid-cols-[180px_1fr_auto]">
          <div className="flex items-center gap-3 border-b border-[#17342b] bg-[#17342b] px-4 py-4 text-white lg:border-b-0 lg:border-r">
            <span className="grid size-9 place-items-center bg-[#ff805f] text-[#17342b]">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/55">
                Browser
              </p>
              <p className="text-sm font-bold">AI assistant</p>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-5">
            <p className="text-sm font-semibold leading-6 sm:text-base">
              “{HERO_PROMPT}”
            </p>
            <p className="mt-2 text-xs leading-5 text-[#5e6c65]">
              {webmcpReady
                ? "Your browser is connected. This request will use the shop’s WebMCP actions."
                : "Guided demo: this button drives the same WebMCP actions a browser assistant would call."}
            </p>
          </div>
          <div className="flex items-center border-t border-[#17342b]/20 p-3 lg:border-l lg:border-t-0">
            <button
              type="button"
              onClick={() => void startReturn()}
              disabled={requestSent}
              data-testid="run-demo"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#ef6f50] px-5 text-sm font-black text-[#17221d] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-default disabled:bg-[#cad6ca] disabled:text-[#58645e] lg:w-auto"
            >
              {runStatus === "running" ? (
                <CircleDashed className="size-4 animate-spin" />
              ) : requestSent ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <Sparkles className="size-4" />
              )}
              {runStatus === "running"
                ? "Sending request"
                : requestSent
                  ? "Request sent"
                  : "Send with WebMCP"}
              {!requestSent ? (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              ) : null}
            </button>
          </div>
        </section>

        <div id="products" className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <section>
            <div className="relative aspect-[16/10] overflow-hidden bg-[#d9dfd1]">
              <Image
                src="/images/morrow-headphones-kit.png"
                alt="Charcoal studio headphones and their canvas travel case"
                fill
                loading="eager"
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 left-4 bg-[#fffaf0] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#17342b]">
                Morrow listening set
              </span>
            </div>

            <div className="border-x border-b border-[#17342b]/16 bg-[#fffaf0]">
              {demo.order.items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[76px_1fr_auto] items-center gap-4 border-b border-[#17342b]/12 p-4 last:border-b-0 sm:grid-cols-[92px_1fr_auto] sm:p-5"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#e1e5dc]">
                    <Image
                      src="/images/morrow-headphones-kit.png"
                      alt=""
                      fill
                      loading="eager"
                      sizes="92px"
                      className="scale-[1.55] object-cover"
                      style={{ objectPosition: index === 0 ? "30% 68%" : "69% 59%" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold sm:text-lg">{item.name}</p>
                    <p className="mt-1 text-xs text-[#7a827d]">
                      Charcoal · Quantity 1
                    </p>
                  </div>
                  <p className="font-bold">£{item.price}.00</p>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <section className="border-2 border-[#17342b] bg-[#fffaf0]">
              <div className="border-b border-[#17342b]/16 px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b847e]">
                      Return status
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
                      {refundComplete
                        ? "Return complete"
                        : demo.return.status === "not_started"
                          ? "Nothing returned yet"
                          : "Return in progress"}
                    </h2>
                  </div>
                  <span
                    className={`grid size-11 shrink-0 place-items-center ${
                      refundComplete
                        ? "bg-[#f4c95d]"
                        : demo.return.status === "not_started"
                          ? "bg-[#e6e1d7] text-[#8b918d]"
                          : "bg-[#d3eadc] text-[#17634b]"
                    }`}
                  >
                    <PackageCheck className="size-5" />
                  </span>
                </div>
              </div>

              <div className="px-5 py-2 sm:px-6">
                <OrderState
                  label="Items"
                  value={
                    demo.return.status === "not_started"
                      ? "Not selected"
                      : "Both items"
                  }
                  active={demo.return.status !== "not_started"}
                />
                <OrderState
                  label="Reason"
                  value={demo.return.reason ?? "Not added"}
                  active={Boolean(demo.return.reason)}
                />
                <OrderState
                  label="Collection"
                  value={
                    demo.return.collection.status === "booked"
                      ? `Next Friday · ${demo.return.collectionAddress}`
                      : demo.return.collection.status === "cancelled"
                        ? "Cancelled"
                        : "Not booked"
                  }
                  active={demo.return.collection.status === "booked"}
                />
                <OrderState
                  label="Refund"
                  value={
                    refundComplete
                      ? "£84 sent to Visa ending 4242"
                      : refundWaiting
                        ? "Waiting for your approval"
                        : "Not started"
                  }
                  active={refundComplete}
                  waiting={refundWaiting}
                />
              </div>
            </section>

            <section className="mt-5 border border-[#17342b]/16 bg-[#eee8dc] p-5 sm:p-6">
              <h2 className="text-lg font-black tracking-[-0.035em]">
                Payment summary
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                <SummaryLine label="Items" value="£84.00" />
                <SummaryLine label="Delivery" value="Free" />
                <div className="border-t border-[#17342b]/14 pt-3">
                  <SummaryLine label="Paid" value="£84.00" strong />
                </div>
              </dl>
              <p className="mt-5 border-t border-[#17342b]/14 pt-4 text-xs leading-5 text-[#69746e]">
                Visa ending 4242 · 14 High Street, London
              </p>
            </section>
          </aside>
        </div>

        <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-[#858d88]">
          Demo shop · no real order, collection, or payment is created
        </p>
      </main>

      <ActionCenter
        connectionStatus={webmcpStatus}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

function OrderState({
  label,
  value,
  active,
  waiting = false,
}: {
  label: string;
  value: string;
  active: boolean;
  waiting?: boolean;
}) {
  return (
    <motion.div
      layout
      className="grid grid-cols-[18px_86px_1fr] gap-3 border-b border-[#17342b]/11 py-4 last:border-b-0"
    >
      <span
        className={`mt-0.5 grid size-[18px] place-items-center ${
          waiting
            ? "bg-[#ff805f] text-[#17221d]"
            : active
              ? "bg-[#2b8a67] text-white"
              : "border border-[#9ea6a1] text-transparent"
        }`}
      >
        {waiting ? (
          <CircleDashed className="size-2.5 animate-spin" />
        ) : (
          <Check className="size-2.5" strokeWidth={3} />
        )}
      </span>
      <dt className="text-xs font-semibold text-[#78827d]">{label}</dt>
      <dd className="text-right text-xs font-bold leading-5">{value}</dd>
    </motion.div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-black" : "text-[#69746e]"}>{label}</dt>
      <dd className={strong ? "font-black" : "font-semibold"}>{value}</dd>
    </div>
  );
}

export function DemoApp() {
  return (
    <RemyProvider>
      <DemoWorkspace />
    </RemyProvider>
  );
}
