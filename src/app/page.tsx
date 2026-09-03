import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroActionDemo } from "@/components/landing/hero-action-demo";
import { Quickstart } from "@/components/landing/quickstart";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  ["Wrap", "Describe the change around a function your application already uses."],
  ["Decide", "Apply your policy and the access the user has chosen."],
  ["Recover", "Record what happened and provide the correct path back."],
];

const recovery = [
  ["Exact undo", "Restore the recorded previous value.", "Rename a document"],
  ["Compensation", "Run a new corrective action.", "Cancel a booking"],
  ["Irreversible", "Pause for explicit approval.", "Publish a document"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader tone="paper" />

      <section className="border-b border-[var(--line)]">
        <div className="site-container pb-20 pt-20 sm:pb-24 sm:pt-24 lg:pb-28 lg:pt-28">
          <div className="hero-enter max-w-[64rem]">
            <p className="home-eyebrow">OPEN-SOURCE CONTROLS FOR AI AGENT ACTIONS</p>
            <h1 className="mt-6 max-w-[62rem] text-[clamp(3.25rem,7vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.066em]">
              Stop approving every agent action.
            </h1>
            <p className="mt-8 max-w-[53rem] text-xl leading-8 text-[var(--ink-soft)] sm:text-[1.35rem] sm:leading-9">
              Remy lets reversible changes run automatically, pauses
              consequential actions, and leaves a readable receipt and recovery
              path for every change.
            </p>
            <p className="mt-4 text-base font-medium text-[var(--muted)]">
              WebMCP first. Protocol-neutral underneath.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#product" className="group inline-flex min-h-12 items-center gap-2 rounded-[6px] bg-[var(--ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-soft)]">
                See it work
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="group inline-flex min-h-12 items-center gap-2 rounded-[6px] border border-[var(--line-strong)] bg-white px-5 text-sm font-semibold transition-colors hover:border-[var(--ink)]">
                View the source
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <p className="mt-8 flex items-center gap-3 text-sm font-semibold text-[var(--ink-soft)]">
              <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
              3 actions · 2 automatic · 1 approval
            </p>
          </div>

          <div id="product" className="hero-enter-delay scroll-mt-6 pt-20 sm:pt-24">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Three actions. One approval. Nothing hidden.
              </h2>
            </div>
            <HeroActionDemo />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="home-section border-b border-[var(--line)]">
        <div className="site-container">
          <SectionHeading
            eyebrow="How it works"
            title="Wrap → Decide → Recover"
            text="Remy controls application actions, not model responses."
          />
          <ol className="mt-12 border-t border-[var(--line-strong)]">
            {workflow.map(([title, text], index) => (
              <li key={title} className="grid gap-3 border-b border-[var(--line)] py-7 sm:grid-cols-[3rem_9rem_1fr] sm:items-baseline">
                <span className="text-sm font-semibold text-[var(--accent)]">0{index + 1}</span>
                <h3 className="text-lg font-semibold tracking-[-0.025em]">{title}</h3>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="recovery" className="home-section border-b border-[var(--line)] bg-white">
        <div className="site-container grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <SectionHeading
            eyebrow="Recovery"
            title="Call recovery what it is."
            text="Remy distinguishes an undo from a corrective action—and never promises either when none exists."
          />
          <div className="border-t border-[var(--line-strong)]">
            {recovery.map(([title, text, example]) => (
              <div key={title} className="grid gap-2 border-b border-[var(--line)] py-6 sm:grid-cols-[9rem_1fr_10rem] sm:items-baseline">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-[var(--muted)]">{text}</p>
                <p className="text-xs text-[var(--ink-soft)]">{example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="home-section border-b border-[var(--line)]">
        <div className="site-container">
          <SectionHeading
            eyebrow="Developer quickstart"
            title="Wrap one real function."
            text="The alpha packages are typed, framework-optional, and verified as installable tarballs."
          />
          <Quickstart />
        </div>
      </section>

      <section className="home-section border-b border-[var(--line)] bg-[var(--paper-muted)]">
        <div className="site-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
          <SectionHeading
            eyebrow="Open source"
            title="WebMCP works now."
            text="The MIT-licensed core stays protocol-neutral. Other adapters remain on the roadmap until they are implemented."
          />
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold lg:justify-end" aria-label="Project links">
            <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-hover)]">Source</a>
            <a href="https://github.com/MustafaK99/Remy/blob/master/LICENSE" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-hover)]">MIT licence</a>
            <a href="https://github.com/MustafaK99/Remy/blob/master/ROADMAP.md" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-hover)]">Roadmap</a>
          </nav>
        </div>
      </section>

      <section className="home-section bg-[var(--ink)] text-white">
        <div className="site-container flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker text-[var(--accent)]">Remy alpha</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">
              Ship agents users aren’t afraid to trust.
            </h2>
          </div>
          <Link href="/docs#quickstart" className="group inline-flex min-h-12 shrink-0 items-center gap-2 rounded-[6px] bg-white px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--paper-muted)]">
            Read the quickstart
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[var(--ink)] text-white">
        <div className="site-container flex flex-col gap-5 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Remy · permissions, approvals, receipts and recovery.</p>
          <nav className="flex gap-6 font-medium text-white/80" aria-label="Footer">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/demo" className="hover:text-white">Demo</Link>
            <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, text }: { readonly eyebrow: string; readonly title: string; readonly text: string }) {
  return (
    <div>
      <p className="section-kicker text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-0.05em] sm:text-5xl">{title}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
