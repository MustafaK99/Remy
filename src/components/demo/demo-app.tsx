"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { CopyButton } from "@/components/copy-button";
import {
  getCartTotal,
  getDeliveryCost,
  getDiscount,
  getSubtotal,
  type ProductColour,
} from "@/demo/data";
import { useWebMCPRegistration } from "@/remy/adapters/webmcp";
import { RemyProvider, useRemy } from "@/remy/react/provider";
import { ActionCenter } from "./action-center";

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
});

function DemoWorkspace() {
  const { engine, snapshot, runUserAction, reset } = useRemy();
  const webmcpStatus = useWebMCPRegistration(engine);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedColour, setSelectedColour] =
    useState<ProductColour>("Charcoal");
  const [discountCode, setDiscountCode] = useState("");
  const state = snapshot.state;
  const line = state.cart.line;
  const total = getCartTotal(state);

  const addToBag = () =>
    runUserAction("add_to_cart", {
      productId: "morrow-one",
      colour: selectedColour,
      quantity: line?.quantity ?? 1,
    });

  const setQuantity = (quantity: number) =>
    runUserAction("set_quantity", {
      productId: "morrow-one",
      quantity,
    });

  const applyDiscount = () => {
    const normalized = discountCode.trim().toUpperCase();
    if (normalized !== "HELLO10") return;
    void runUserAction("apply_discount", { code: "HELLO10" });
    setDiscountCode("");
  };

  const resetDemo = () => {
    reset();
    setDrawerOpen(false);
    setSelectedColour("Charcoal");
    setDiscountCode("");
  };

  const webmcpMessage =
    webmcpStatus === "ready"
      ? "WebMCP tools ready"
      : webmcpStatus === "checking"
        ? "Checking WebMCP support"
        : webmcpStatus === "unsupported"
          ? "WebMCP is unavailable in this browser — the shop still works normally"
          : "WebMCP tools could not register — the shop still works normally";

  return (
    <div className="min-h-screen bg-[#f4efe5] text-[#19362e]">
      <div
        className={`min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          drawerOpen ? "lg:pr-[420px]" : ""
        }`}
      >
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a] text-white shadow-[0_8px_30px_rgba(10,10,10,.12)]">
          <div className="mx-auto max-w-[1280px] px-5 py-3 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#e66749]">
                  Live WebMCP demo
                </p>
                <p className="mt-1 text-[11px] leading-4 text-white/48" aria-live="polite">
                  {webmcpMessage}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={resetDemo}
                  className="inline-flex min-h-9 items-center gap-1.5 border border-white/18 px-3 text-white/72 transition-colors hover:border-white/40 hover:text-white"
                >
                  <RotateCcw className="size-3.5" /> Reset demo
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="hidden text-white/82 transition-colors hover:text-white sm:block"
                >
                  Open Remy
                </button>
                <Link href="/" className="hidden text-white/42 transition-colors hover:text-white/80 md:block">
                  How it works
                </Link>
              </div>
            </div>

            <div className="mt-3 grid gap-px border border-white/12 bg-white/12 lg:grid-cols-[1fr_220px]">
              <div className="flex min-w-0 items-center justify-between gap-3 bg-[#111111] py-2 pl-3 pr-2">
                <div className="min-w-0">
                  <span className="mr-2 font-mono text-[8px] uppercase tracking-[0.08em] text-white/32">First</span>
                  <code className="text-[11px] text-white/76">Add Morrow One in Charcoal, choose express delivery, and apply HELLO10.</code>
                </div>
                <CopyButton
                  value="Add Morrow One in Charcoal, choose express delivery, and apply HELLO10."
                  label="Copy"
                  tone="dark"
                />
              </div>
              <div className="flex items-center justify-between gap-3 bg-[#111111] py-2 pl-3 pr-2">
                <div>
                  <span className="mr-2 font-mono text-[8px] uppercase tracking-[0.08em] text-white/32">Then</span>
                  <code className="text-[11px] text-white/76">Buy it.</code>
                </div>
                <CopyButton value="Buy it." label="Copy" tone="dark" />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4 sm:hidden">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="text-white/82 transition-colors hover:text-white"
              >
                Open Remy
              </button>
              <Link href="/" className="text-white/42 transition-colors hover:text-white/80">
                How it works
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-[#19362e] px-4 py-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0]/75">
          Free delivery over £50 · 30-day returns
        </div>

        <header className="border-b border-[#19362e]/12 bg-[#fffaf2]">
          <div className="mx-auto flex h-[74px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-10">
              <Link
                href="#"
                className="text-[26px] font-black tracking-[-0.07em]"
                aria-label="Morrow home"
              >
                morrow<span className="text-[#ef704f]">.</span>
              </Link>
              <nav className="hidden items-center gap-8 text-sm font-semibold text-[#53675f] md:flex">
                <Link href="#product" className="text-[#19362e]">
                  Headphones
                </Link>
                <Link href="#details" className="hover:text-[#19362e]">
                  About
                </Link>
                <Link href="#support" className="hover:text-[#19362e]">
                  Support
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Search"
                className="grid size-10 place-items-center rounded-full transition-colors hover:bg-[#eee8dc]"
              >
                <Search className="size-[18px]" />
              </button>
              <button
                type="button"
                aria-label="Your account"
                className="hidden size-10 place-items-center rounded-full transition-colors hover:bg-[#eee8dc] sm:grid"
              >
                <UserRound className="size-[18px]" />
              </button>
              <a
                href="#bag"
                aria-label={`Shopping bag, ${line?.quantity ?? 0} items`}
                className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-[#eee8dc]"
              >
                <ShoppingBag className="size-[18px]" />
                <motion.span
                  key={line?.quantity ?? 0}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-[#f4c95d] font-mono text-[9px] font-bold"
                >
                  {line?.quantity ?? 0}
                </motion.span>
              </a>
            </div>
          </div>
        </header>

        <main id="product" className="mx-auto max-w-[1280px] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
          <div className="mb-6 text-xs text-[#75837d]">
            <p>Home / Headphones / Morrow One</p>
          </div>

          <div className="grid gap-9 lg:grid-cols-[minmax(0,1.18fr)_minmax(330px,.82fr)] lg:gap-12">
            <section className="relative overflow-hidden rounded-[28px] bg-[#d9dfd1] lg:sticky lg:top-6 lg:self-start">
              <div className="relative aspect-[4/3] lg:aspect-[4/4.15]">
                <Image
                  src="/images/morrow-headphones-kit.png"
                  alt="Morrow One charcoal headphones beside their canvas travel case"
                  fill
                  loading="eager"
                  sizes="(min-width: 1280px) 650px, (min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute left-5 top-5 rounded-full bg-[#fffaf2]/92 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] backdrop-blur-sm">
                  New · Morrow One
                </div>
              </div>
            </section>

            <div className="min-w-0">
              <section>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#53675f]">
                  <span className="flex text-[#e66b49]" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="size-3.5 fill-current" />
                    ))}
                  </span>
                  <span>4.9 · 216 reviews</span>
                </div>
                <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#718078]">
                  Wireless headphones
                </p>
                <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.06em] sm:text-6xl">
                  Morrow One
                </h1>
                <p className="mt-5 text-2xl font-bold tracking-[-0.035em]">
                  {money.format(state.product.price)}
                </p>
                <p className="mt-4 max-w-[540px] text-base leading-7 text-[#596b64]">
                  {state.product.description}
                </p>

                <fieldset className="mt-8">
                  <legend className="text-sm font-bold">Colour</legend>
                  <div className="mt-3 flex gap-3">
                    {(["Charcoal", "Oat"] as ProductColour[]).map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => setSelectedColour(colour)}
                        aria-pressed={selectedColour === colour}
                        className={`flex min-h-12 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold transition-colors ${
                          selectedColour === colour
                            ? "border-[#19362e] bg-[#19362e] text-white"
                            : "border-[#19362e]/18 bg-[#fffaf2] hover:border-[#19362e]/45"
                        }`}
                      >
                        <span
                          className={`size-4 rounded-full border ${
                            colour === "Charcoal"
                              ? "border-white/30 bg-[#2e3431]"
                              : "border-[#19362e]/12 bg-[#d9cdb8]"
                          }`}
                        />
                        {colour}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="button"
                  onClick={() => void addToBag()}
                  className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#19362e] px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  {line ? "Update bag" : "Add to bag"}
                  <span className="text-white/45">·</span>
                  {money.format(state.product.price * (line?.quantity ?? 1))}
                </button>

                <div id="details" className="mt-8 divide-y divide-[#19362e]/12 border-y border-[#19362e]/12">
                  {["What’s included", "Delivery & returns", "Product details"].map(
                    (label) => (
                      <button
                        key={label}
                        type="button"
                        className="flex min-h-14 w-full items-center justify-between text-left text-sm font-semibold"
                      >
                        {label}
                        <ChevronDown className="size-4 text-[#7b8983]" />
                      </button>
                    ),
                  )}
                </div>
              </section>

              <motion.section
                id="bag"
                layout
                className="mt-12 rounded-[24px] bg-[#fffaf2] p-5 ring-1 ring-[#19362e]/12 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#73817b]">
                      Your bag
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
                      {state.order.status === "placed"
                        ? "Order confirmed"
                        : line
                          ? "Ready when you are"
                          : "Your bag is empty"}
                    </h2>
                  </div>
                  {line ? (
                    <span className="rounded-full bg-[#f4c95d] px-3 py-1.5 text-xs font-bold">
                      {line.quantity} {line.quantity === 1 ? "item" : "items"}
                    </span>
                  ) : null}
                </div>

                {state.order.status === "placed" ? (
                  <div className="mt-6 rounded-[18px] bg-[#dcebdd] p-5">
                    <span className="grid size-10 place-items-center rounded-full bg-[#28735b] text-white">
                      <Check className="size-5" strokeWidth={3} />
                    </span>
                    <p className="mt-4 text-lg font-bold">Order {state.order.id}</p>
                    <p className="mt-1 text-sm leading-6 text-[#52675e]">
                      Confirmation sent. Your Morrow One is on its way.
                    </p>
                    <button
                      type="button"
                      onClick={resetDemo}
                      className="mt-4 text-sm font-bold underline decoration-[#19362e]/30 underline-offset-4"
                    >
                      Continue shopping
                    </button>
                  </div>
                ) : line ? (
                  <>
                    <div className="mt-6 flex gap-4 border-b border-[#19362e]/12 pb-5">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-[14px] bg-[#d9dfd1]">
                        <Image
                          src="/images/morrow-headphones-kit.png"
                          alt=""
                          fill
                          sizes="80px"
                          className="scale-[1.45] object-cover object-[31%_68%]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-bold">{line.name}</p>
                            <p className="mt-1 text-xs text-[#728079]">{line.colour}</p>
                          </div>
                          <p className="font-bold">
                            {money.format(line.price * line.quantity)}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex h-9 items-center rounded-full border border-[#19362e]/18">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={line.quantity <= 1}
                              onClick={() => void setQuantity(line.quantity - 1)}
                              className="grid size-9 place-items-center disabled:opacity-30"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={line.quantity >= 3}
                              onClick={() => void setQuantity(line.quantity + 1)}
                              className="grid size-9 place-items-center disabled:opacity-30"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void runUserAction("remove_from_cart", {
                                productId: "morrow-one",
                              })
                            }
                            className="text-xs font-semibold text-[#66766f] underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    <fieldset className="mt-5">
                      <legend className="text-sm font-bold">Delivery</legend>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {([
                          ["standard", "Standard", "3–5 days", "Free"],
                          ["express", "Express", "Tomorrow", "£8"],
                        ] as const).map(([value, title, detail, price]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              void runUserAction("choose_delivery", { method: value })
                            }
                            aria-pressed={state.cart.delivery === value}
                            className={`rounded-[16px] border p-3 text-left transition-colors ${
                              state.cart.delivery === value
                                ? "border-[#28735b] bg-[#e2eee4]"
                                : "border-[#19362e]/12 hover:border-[#19362e]/35"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-3 text-sm font-bold">
                              {title} <span>{price}</span>
                            </span>
                            <span className="mt-1 block text-xs text-[#718078]">
                              {detail}
                            </span>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="mt-5 flex gap-2">
                      <input
                        value={discountCode}
                        onChange={(event) => setDiscountCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") applyDiscount();
                        }}
                        placeholder="Discount code"
                        aria-label="Discount code"
                        className="min-h-11 min-w-0 flex-1 rounded-full border border-[#19362e]/16 bg-transparent px-4 text-sm uppercase outline-none placeholder:normal-case focus:border-[#19362e]/50"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={discountCode.trim().toUpperCase() !== "HELLO10"}
                        className="min-h-11 rounded-full border border-[#19362e]/18 px-4 text-xs font-bold disabled:opacity-35"
                      >
                        Apply
                      </button>
                    </div>
                    {state.cart.discount ? (
                      <p className="mt-2 text-xs font-semibold text-[#28735b]">
                        HELLO10 applied · 10% off
                      </p>
                    ) : null}

                    <dl className="mt-6 space-y-2 text-sm">
                      <SummaryLine label="Subtotal" value={money.format(getSubtotal(state))} />
                      <SummaryLine
                        label="Delivery"
                        value={
                          getDeliveryCost(state)
                            ? money.format(getDeliveryCost(state))
                            : "Free"
                        }
                      />
                      {getDiscount(state) ? (
                        <SummaryLine
                          label="Discount"
                          value={`−${money.format(getDiscount(state))}`}
                          accent
                        />
                      ) : null}
                      <div className="border-t border-[#19362e]/12 pt-3">
                        <SummaryLine label="Total" value={money.format(total)} strong />
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => void runUserAction("place_order", {})}
                      className="mt-5 flex min-h-13 w-full items-center justify-center rounded-full bg-[#ef704f] px-5 text-sm font-black text-[#19362e] transition-transform hover:-translate-y-0.5"
                    >
                      Buy now · {money.format(total)}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-5 text-[#7a8781]">
                      Paying with {state.customer.paymentMethod}
                    </p>
                  </>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-[#65746d]">
                    Pick a colour and add Morrow One to start your order.
                  </p>
                )}
              </motion.section>
            </div>
          </div>

          <section
            id="support"
            className="mt-20 border-t border-[#19362e]/12 pt-8 text-sm text-[#718078]"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <p>Morrow is a fictional shop built to demonstrate WebMCP actions.</p>
              <p>No payment or order is created.</p>
            </div>
          </section>
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

function SummaryLine({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "text-base font-black" : "text-[#687770]"}>
        {label}
      </dt>
      <dd
        className={
          strong
            ? "text-base font-black"
            : accent
              ? "font-bold text-[#28735b]"
              : "font-semibold"
        }
      >
        {value}
      </dd>
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
