import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { HeroActionDemo } from "@/components/landing/hero-action-demo";
import { Quickstart } from "@/components/landing/quickstart";
import { SiteHeader } from "@/components/site-header";

const howItWorks = [
  {
    number: "01",
    title: "Define the action",
    text: "Describe what changes, how risky it is, what the user should see first, and how recovery works.",
  },
  {
    number: "02",
    title: "Let Remy handle execution",
    text: "Remy validates the input, applies developer policy and user autonomy, then executes, pauses, or blocks.",
  },
  {
    number: "03",
    title: "Keep the user in control",
    text: "Every attempt gets a readable receipt, a clear outcome, and the honest recovery option for that action.",
  },
];

const recoveryTypes = [
  {
    label: "Exact undo",
    description: "Restore the previous state after checking nothing changed underneath it.",
    example: "Express delivery → restore standard delivery",
  },
  {
    label: "Compensation",
    description: "Perform a new corrective action when time cannot literally run backward.",
    example: "Booked appointment → cancel the booking",
  },
  {
    label: "Irreversible",
    description: "Be explicit that recovery is impossible and require the right approval first.",
    example: "Placed purchase → cannot be uncharged by pretending it never happened",
  },
];

const adapters = [
  ["WebMCP", "Working implementation", "Page-scoped tools in the Morrow demo."],
  ["MCP", "Planned adapter", "Expose the same semantic actions outside the browser."],
  ["Agent SDKs", "Planned adapters", "Use the same policy and receipts in agent runtimes."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5f5f3]">
      <SiteHeader tone="dark" />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-16 sm:px-10 sm:pt-24 lg:px-16">
          <div className="max-w-[900px]">
            <h1 className="text-[clamp(3.2rem,6.4vw,5.7rem)] font-medium leading-[0.96] tracking-[-0.068em] text-white">
              Ship agents users aren&apos;t afraid to trust.
            </h1>
            <p className="mt-7 max-w-[720px] text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              Control, receipts, and recovery for AI agent actions.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/38">
              Let reversible work happen. Pause what matters. Give users a way back.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex h-12 items-center gap-2 bg-[#f5f5f3] px-5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-white/85"
              >
                Try the demo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com/MustafaK99/Remy"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-12 items-center gap-2 border border-white/20 px-5 text-sm font-medium text-white/76 transition-colors hover:border-white/42 hover:text-white"
              >
                View source
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="mt-10 flex max-w-[720px] flex-col gap-3 border-y border-white/10 py-4 sm:flex-row sm:items-center">
              <span className="w-24 shrink-0 font-mono text-[10px] text-white/35">
                Run source
              </span>
              <div className="flex h-11 min-w-0 flex-1 items-center justify-between gap-4 border border-white/14 bg-white/[0.025] pl-4 pr-2">
                <code className="truncate font-mono text-[12px] text-white/72">
                  <span className="mr-2 text-[#e66749]">$</span>
                  git clone https://github.com/MustafaK99/Remy.git
                </code>
                <CopyButton value="git clone https://github.com/MustafaK99/Remy.git" tone="dark" />
              </div>
              <Link
                href="/docs#quickstart"
                className="group inline-flex h-11 shrink-0 items-center gap-2 px-1 text-xs font-medium text-white/56 hover:text-white sm:px-3"
              >
                Local quickstart
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-3 max-w-[720px] font-mono text-[9px] leading-4 text-white/30">
              Early WebMCP implementation · packages and one-call integration are roadmap work
            </p>
          </div>

          <div className="mt-14 sm:mt-18">
            <HeroActionDemo />
          </div>
        </div>
      </section>

      <section id="problem" className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <SectionIntro
            label="The missing middle"
            title="Approving everything kills autonomy. Approving nothing kills trust."
            text="Remy decides how each action should be handled from developer policy, reversibility, and the user's chosen autonomy level."
          />
          <div className="mt-14 grid border-y border-white/12 md:grid-cols-3">
            <ProblemColumn
              label="Approve every action"
              outcome="Safe, but slow"
              text="The user becomes a confirmation loop and the agent stops being useful."
            />
            <ProblemColumn
              label="Remy's middle ground"
              outcome="Useful autonomy"
              text="Safe work runs, consequential work waits, and every result has a record."
              active
            />
            <ProblemColumn
              label="Approve nothing"
              outcome="Fast, but opaque"
              text="Users discover mistakes after state has already changed—if they notice at all."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <SectionIntro
            label="How Remy works"
            title="One action definition. One honest execution path."
            text="Developers describe business meaning instead of rebuilding approval, audit, diff, and reversal infrastructure for every feature."
          />
          <div className="mt-14 border-t border-white/12">
            {howItWorks.map((step) => (
              <div
                key={step.number}
                className="grid gap-3 border-b border-white/12 py-7 sm:grid-cols-[52px_0.75fr_1.25fr] sm:items-start"
              >
                <span className="font-mono text-[10px] text-[#e66749]">
                  {step.number}
                </span>
                <h3 className="text-base font-medium text-white/90">{step.title}</h3>
                <p className="max-w-[560px] text-sm leading-6 text-white/44">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="receipts" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[0.72fr_1.28fr] lg:px-16 lg:py-28">
          <div>
            <p className="font-mono text-[10px] text-white/35">Receipts</p>
            <h2 className="mt-4 max-w-[430px] text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-4xl">
              A system of record people can actually read.
            </h2>
            <p className="mt-5 max-w-[450px] text-sm leading-6 text-white/47">
              Each attempt records the requester, policy decision, before-and-after
              change, result, and recovery path. Failed and reversed actions remain
              visible instead of disappearing from history.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/13 bg-[#eee9df] text-[#17241f]">
            <div className="flex items-center justify-between border-b border-[#17241f]/12 px-5 py-4">
              <span className="font-mono text-[9px] text-[#6e7872]">Receipt #03</span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#276d4e]">
                <Check className="size-3.5" /> Completed
              </span>
            </div>
            <div className="grid sm:grid-cols-[1fr_1fr]">
              <div className="border-b border-[#17241f]/12 p-5 sm:border-b-0 sm:border-r sm:p-6">
                <p className="text-lg font-semibold tracking-[-0.035em]">
                  Express delivery selected
                </p>
                <p className="mt-2 text-xs leading-5 text-[#68756e]">
                  Requested by Claude · WebMCP
                </p>
                <dl className="mt-6 border-y border-[#17241f]/12">
                  <ReceiptLine label="Policy" value="Automatic · exact undo" />
                  <ReceiptLine label="Result" value="Cart total updated" />
                  <ReceiptLine label="Recorded" value="10:42:09" />
                </dl>
              </div>
              <div className="p-5 sm:p-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#737d77]">
                  What changed
                </p>
                <dl className="mt-4 border-y border-[#17241f]/12">
                  <ReceiptLine label="From" value="Standard · Free" />
                  <ReceiptLine label="To" value="Express · £8" />
                </dl>
                <p className="mt-5 text-[11px] leading-5 text-[#68756e]">
                  The exact reversal restores standard delivery and appends a
                  linked recovery receipt. The original never disappears.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recovery" className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <SectionIntro
            label="Recovery semantics"
            title="Undo when it is true. Compensate when it isn't."
            text="Remy makes the recovery contract explicit, so the interface never promises that every real-world action can be rolled back."
          />
          <div className="mt-14 border-t border-white/12">
            {recoveryTypes.map((type, index) => (
              <div
                key={type.label}
                className="grid gap-3 border-b border-white/12 py-7 sm:grid-cols-[52px_0.65fr_1fr_1fr] sm:items-start"
              >
                <span className="font-mono text-[10px] text-white/25">0{index + 1}</span>
                <h3 className="text-sm font-medium text-white/90">{type.label}</h3>
                <p className="text-sm leading-6 text-white/44">{type.description}</p>
                <p className="font-mono text-[10px] leading-5 text-white/28">{type.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sdk" className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <SectionIntro
            label="Developer integration"
            title="Read the implementation. Define the action beside your code."
            text="The current source includes the engine, React boundary, Morrow actions, and WebMCP adapter. Published packages and one-call setup are planned, not implied."
          />
          <Quickstart />
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 font-medium text-white/76 hover:text-white"
            >
              Read the implementation docs
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-white/24">Early implementation · protocol-neutral core</span>
          </div>
        </div>
      </section>

      <section id="adapters" className="border-b border-white/10">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="font-mono text-[10px] text-white/35">Adapters</p>
              <h2 className="mt-4 max-w-[430px] text-3xl font-medium tracking-[-0.045em] sm:text-4xl">
                WebMCP is the first adapter, not the product boundary.
              </h2>
              <p className="mt-5 max-w-[450px] text-sm leading-6 text-white/47">
                The core action and policy engine does not depend on a browser,
                UI framework, or agent protocol.
              </p>
            </div>
            <div className="border-t border-white/12">
              {adapters.map(([name, status, description]) => (
                <div
                  key={name}
                  className="grid gap-2 border-b border-white/12 py-6 sm:grid-cols-[120px_150px_1fr] sm:items-center"
                >
                  <span className="text-sm font-medium text-white/88">{name}</span>
                  <span className="font-mono text-[9px] text-[#e66749]">{status}</span>
                  <span className="text-sm leading-6 text-white/42">{description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 grid gap-12 border-t border-white/12 pt-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="font-mono text-[10px] text-white/35">Open SDK</p>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.04em]">
                The action contract stays open and in your codebase.
              </h3>
              <p className="mt-4 max-w-[500px] text-sm leading-6 text-white/45">
                Define actions, run policy locally, keep receipts, and build any
                interface you need without adopting a hosted control panel.
              </p>
              <div className="mt-5 flex gap-5 text-xs text-white/64">
                <a href="https://github.com/MustafaK99/Remy/blob/master/LICENSE" target="_blank" rel="noreferrer" className="hover:text-white">MIT licence</a>
                <a href="https://github.com/MustafaK99/Remy/blob/master/ROADMAP.md" target="_blank" rel="noreferrer" className="hover:text-white">Roadmap</a>
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] text-white/35">Optional hosted layer · planned</p>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.04em]">
                Add coordination when applications outgrow local state.
              </h3>
              <p className="mt-4 max-w-[500px] text-sm leading-6 text-white/45">
                Durable histories, shared policies, approval routing, monitoring,
                alerts, and evidence exports can sit above the same open contract.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 px-5 py-16 sm:px-10 md:flex-row md:items-center lg:px-16">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.04em]">
              Give agents room to work without asking users to look away.
            </h2>
            <p className="mt-3 text-sm text-white/42">
              Try the complete Morrow WebMCP flow or inspect the source guide.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="group inline-flex h-11 items-center gap-2 bg-white px-4 text-sm font-medium text-black hover:bg-white/85"
            >
              Try the demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs"
              className="group inline-flex h-11 items-center gap-2 border border-white/20 px-4 text-sm font-medium text-white/72 hover:border-white/40 hover:text-white"
            >
              View the docs
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-xs text-white/34 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <p>Remy — control, receipts, and recovery for agent actions.</p>
          <div className="flex gap-6 text-white/58">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/demo" className="hover:text-white">Demo</Link>
            <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="hover:text-white">Source</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionIntro({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
      <p className="font-mono text-[10px] text-white/35">{label}</p>
      <div>
        <h2 className="max-w-[790px] text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-5 max-w-[680px] text-sm leading-6 text-white/47">{text}</p>
      </div>
    </div>
  );
}

function ProblemColumn({
  label,
  outcome,
  text,
  active = false,
}: {
  label: string;
  outcome: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`min-h-52 border-b border-white/12 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${
        active ? "bg-white/[0.045]" : ""
      }`}
    >
      <p className={`font-mono text-[9px] ${active ? "text-[#e66749]" : "text-white/30"}`}>
        {label}
      </p>
      <h3 className="mt-8 text-xl font-medium tracking-[-0.035em]">{outcome}</h3>
      <p className="mt-3 max-w-[300px] text-sm leading-6 text-white/43">{text}</p>
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[78px_1fr] gap-3 border-b border-[#17241f]/12 py-3 text-xs last:border-b-0">
      <dt className="text-[#77817c]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
