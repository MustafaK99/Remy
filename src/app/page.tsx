import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { HeroLedger } from "@/components/landing/hero-ledger";
import { Quickstart } from "@/components/landing/quickstart";

const benefits = [
  {
    title: "See every change",
    text: "Customers see a plain-language update each time their assistant changes the website.",
  },
  {
    title: "Money waits",
    text: "Refunds, purchases, and other permanent actions stop until the customer says yes.",
  },
  {
    title: "Change it back",
    text: "If an action is safe to reverse, Remy gives the customer a specific way to reverse it.",
  },
];

const flow = [
  ["Customer", "Asks their AI assistant"],
  ["WebMCP", "Calls the right website action"],
  ["Remy", "Shows it, checks it, saves it"],
  ["Your site", "Makes the real change"],
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f7f0e4] text-[#17221d]">
      <div className="bg-[#f7f0e4]">
        <SiteHeader />

        <section className="mx-auto max-w-[1360px] border-x border-[#17342b]/16">
          <div className="grid lg:min-h-[700px] lg:grid-cols-[0.86fr_1.14fr]">
            <div className="flex flex-col justify-center border-b border-[#17342b]/16 px-5 py-14 sm:px-9 sm:py-20 lg:border-b-0 lg:px-12 lg:py-20 xl:px-16">
              <h1 className="max-w-[720px] text-[clamp(3.45rem,12vw,6.4rem)] font-black leading-[0.91] tracking-[-0.075em] lg:text-[clamp(4.2rem,5.35vw,5.4rem)]">
                AI assistants can use your website.
                <span className="mt-2 block text-[#ef6f50]">
                  Customers see every change.
                </span>
              </h1>

              <div className="mt-9 max-w-[580px] border-t border-[#17342b]/18 pt-7">
                <p className="max-w-[560px] text-base font-medium leading-7 text-[#46564e] sm:text-lg sm:leading-8">
                  Remy connects your website to AI through WebMCP. It shows
                  customers what changed, waits before money moves, and lets
                  them reverse safe actions.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/demo"
                    className="group inline-flex min-h-12 items-center gap-3 bg-[#17342b] px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  >
                    Watch an AI return an order
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex min-h-12 items-center border border-[#17342b]/35 px-5 text-sm font-bold transition-colors hover:bg-[#e3eadf]"
                  >
                    Add Remy to a site
                  </Link>
                </div>
              </div>
            </div>

            <div className="warm-grid flex items-center border-[#17342b]/16 bg-[#ff805f] px-4 py-8 sm:px-8 sm:py-12 lg:border-l lg:px-9 xl:px-12">
              <HeroLedger />
            </div>
          </div>
        </section>
      </div>

      <section id="principles" className="bg-[#fffaf0]">
        <div className="mx-auto max-w-[1360px] border-x border-[#17342b]/14">
          <div className="grid border-b border-[#17342b]/14 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="px-5 py-9 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#6c7871] sm:px-9 lg:border-r lg:border-[#17342b]/14 lg:px-12 lg:py-20">
              What customers get
            </div>
            <div className="px-5 pb-12 sm:px-9 lg:px-12 lg:py-20 xl:px-16">
              <h2 className="max-w-[880px] text-4xl font-black leading-[1] tracking-[-0.058em] sm:text-6xl lg:text-7xl">
                The assistant does the clicking. The customer sees every step.
              </h2>
            </div>
          </div>

          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="grid border-b border-[#17342b]/14 px-5 py-8 sm:px-9 lg:grid-cols-[0.34fr_0.66fr] lg:px-0 lg:py-0"
            >
              <div className="flex items-start gap-4 lg:border-r lg:border-[#17342b]/14 lg:px-12 lg:py-10">
                <span
                  className={`grid size-8 shrink-0 place-items-center font-mono text-xs font-black ${
                    index === 1 ? "bg-[#ff805f]" : "bg-[#f4c95d]"
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className="text-2xl font-black tracking-[-0.04em]">
                  {benefit.title}
                </h3>
              </div>
              <p className="mt-3 max-w-[620px] text-base leading-7 text-[#59675f] lg:mt-0 lg:px-12 lg:py-10 xl:px-16">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#e3eadf]">
        <div className="mx-auto max-w-[1360px] border-x border-[#17342b]/14">
          <div className="grid border-b border-[#17342b]/14 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="px-5 py-9 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#607269] sm:px-9 lg:border-r lg:border-[#17342b]/14 lg:px-12 lg:py-20">
              For developers
            </div>
            <div className="px-5 pb-12 sm:px-9 lg:px-12 lg:py-20 xl:px-16">
              <h2 className="max-w-[850px] text-4xl font-black leading-[1] tracking-[-0.058em] sm:text-6xl lg:text-7xl">
                Add safe WebMCP actions to Next.js in one command.
              </h2>
              <p className="mt-7 max-w-[650px] text-base leading-7 text-[#52655c]">
                Remy installs the WebMCP connection and the customer controls.
                You describe each website action once.
              </p>
            </div>
          </div>
          <Quickstart />
        </div>
      </section>

      <section className="bg-[#17342b] text-white">
        <div className="mx-auto max-w-[1360px] border-x border-white/14 px-5 py-16 sm:px-9 lg:px-12 lg:py-24 xl:px-16">
          <div className="grid gap-8 lg:grid-cols-[0.6fr_0.4fr] lg:items-end">
            <h2 className="max-w-[850px] text-4xl font-black leading-[1] tracking-[-0.058em] sm:text-6xl lg:text-7xl">
              A request becomes a safe website action.
            </h2>
            <p className="max-w-[500px] text-base leading-7 text-white/62">
              WebMCP gives the assistant the action. Remy gives the customer a
              clear view and the final say.
            </p>
          </div>

          <div className="mt-14 grid text-sm sm:grid-cols-[1fr_28px_1fr_28px_1fr_28px_1fr] sm:items-center">
            {flow.map(([title, text], index) => (
              <div key={title} className="contents">
                <div
                  className={`border p-5 ${
                    title === "Remy"
                      ? "border-[#ff805f] bg-[#24483c]"
                      : "border-white/18"
                  }`}
                >
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">{text}</p>
                </div>
                {index < flow.length - 1 ? (
                  <span className="py-2 text-center text-[#f4c95d] sm:py-0">
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4c95d]">
        <div className="mx-auto max-w-[1360px] border-x border-[#17342b]/16 px-5 py-16 sm:px-9 lg:px-12 lg:py-24 xl:px-16">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="max-w-[940px] text-5xl font-black leading-[0.94] tracking-[-0.068em] sm:text-7xl lg:text-8xl">
              Watch an AI assistant return a real-looking order.
            </h2>
            <Link
              href="/demo"
              className="group inline-flex min-h-14 w-fit shrink-0 items-center gap-3 bg-[#ef6f50] px-6 text-sm font-black text-[#17221d] transition-transform hover:-translate-y-1"
            >
              Open the WebMCP demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#17342b] text-white/55">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-5 border-x border-white/14 px-5 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-12">
          <p>Remy · WebMCP actions people can see and reverse.</p>
          <div className="flex gap-6 font-bold text-white">
            <Link href="/docs" className="hover:text-[#ff9a80]">
              Docs
            </Link>
            <Link href="/demo" className="hover:text-[#ff9a80]">
              WebMCP demo
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
