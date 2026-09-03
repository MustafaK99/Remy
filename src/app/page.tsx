import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroActionDemo } from "@/components/landing/hero-action-demo";
import { Quickstart } from "@/components/landing/quickstart";
import { SiteHeader } from "@/components/site-header";

const benefits = [
  [
    "Less interruption",
    "Recoverable work can run without stopping the user each time.",
  ],
  [
    "Explicit control",
    "Consequential actions wait for the exact approval they need.",
  ],
  [
    "A durable record",
    "Every change leaves a readable receipt and the right way back.",
  ],
];

const workflow = [
  ["Wrap", "Describe the change around a function your application already uses."],
  ["Decide", "Apply your policy, the action risk, and the access the user chose."],
  ["Recover", "Keep the receipt and run exact undo or a corrective action when needed."],
];

const recovery = [
  ["Exact undo", "Restore the previous value.", "Rename a document"],
  ["Compensation", "Run a new corrective action.", "Cancel a booking"],
  ["Irreversible", "Require the right approval.", "Issue a refund"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader tone="paper" />

      <section className="border-b border-[var(--line)]">
        <div className="site-container pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="hero-enter grid gap-9 border-b border-[var(--line-strong)] pb-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,.62fr)] lg:items-end lg:gap-16">
            <div>
              <p className="home-eyebrow">OPEN SOURCE <span aria-hidden="true">·</span> WEBMCP</p>
              <h1 className="mt-5 max-w-[54rem] text-[clamp(3.2rem,5.7vw,5.15rem)] font-semibold leading-[0.94] tracking-[-0.062em]">
                Let agents act. Keep every change under control.
              </h1>
            </div>

            <div className="pb-1">
              <p className="text-lg leading-8 text-[var(--ink-soft)]">
                Remy adds approvals, human-readable receipts and rollback to the
                actions AI agents take in your app.
              </p>
              <p className="mt-4 text-sm font-semibold leading-6 text-[var(--ink)]">
                Reversible work runs automatically. Consequential actions wait for you.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/demo"
                  className="group inline-flex min-h-12 items-center gap-2 bg-[var(--ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent)]"
              >
                Try the live demo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com/MustafaK99/Remy"
                target="_blank"
                rel="noreferrer"
                  className="group inline-flex min-h-12 items-center gap-2 border border-[var(--line-strong)] bg-transparent px-5 text-sm font-semibold transition-colors hover:border-[var(--ink)]"
              >
                View on GitHub
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              </div>
            </div>
          </div>

          <div className="hero-enter-delay grid gap-3 border-b border-[var(--line)] py-5 text-sm leading-6 sm:grid-cols-[10rem_1fr] sm:items-baseline">
            <strong className="font-semibold text-[var(--accent)]">WebMCP + Remy</strong>
            <p className="max-w-3xl text-[var(--ink-soft)]">
              WebMCP lets the agent act. Remy decides when it may, records what
              changed and gives the user a way back.
            </p>
          </div>

          <div id="product" className="hero-enter-delay scroll-mt-6 pt-12 sm:pt-14">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-[2.35rem]">
                Three actions. One approval. Nothing hidden.
              </h2>
              <p className="text-sm font-semibold text-[var(--ink-soft)]">
                3 actions <span aria-hidden="true">·</span> 2 automatic <span aria-hidden="true">·</span> 1 approval
              </p>
            </div>
            <HeroActionDemo />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="site-container grid divide-y divide-[var(--line)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {benefits.map(([title, text], index) => (
            <article
              key={title}
              className={`grid grid-cols-[2rem_1fr] gap-3 py-9 md:block md:px-8 md:py-11 ${index === 0 ? "md:pl-0" : ""}`}
            >
              <span className="text-xs font-semibold text-[var(--accent)]">0{index + 1}</span>
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] md:mt-5">{title}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="home-section border-b border-[var(--line)]">
        <div className="site-container">
          <SectionHeading
            eyebrow="How it works"
            title="Wrap → Decide → Recover"
            text="Remy controls application actions, not model responses."
          />
          <ol className="mt-10 border-t border-[var(--line-strong)]">
            {workflow.map(([title, text], index) => (
              <li
                key={title}
                className="grid gap-3 border-b border-[var(--line)] py-7 sm:grid-cols-[3rem_9rem_1fr] sm:items-baseline"
              >
                <span className="text-sm font-semibold text-[var(--accent)]">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.025em]">{title}</h3>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-section border-b border-[var(--line)]">
        <div className="site-container grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <SectionHeading
            eyebrow="Recovery"
            title="A precise way back."
            text="Remy distinguishes an undo from a corrective action—and never promises either when none exists."
          />
          <div className="border-t border-[var(--line-strong)]">
            {recovery.map(([title, text, example]) => (
              <div
                key={title}
                className="grid gap-2 border-b border-[var(--line)] py-6 sm:grid-cols-[9rem_1fr_10rem] sm:items-baseline"
              >
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
            text="The public alpha runs from this repository today. The packages are prepared but not yet published to npm."
          />
          <Quickstart />
        </div>
      </section>

      <section className="home-section border-b border-[var(--line)] bg-[var(--paper-muted)]">
        <div className="site-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
          <SectionHeading
            eyebrow="Open source"
            title="WebMCP works now."
            text="Remy is MIT licensed. The core stays protocol-neutral; future adapters remain on the roadmap until they are implemented."
          />
          <nav
            className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold lg:justify-end"
            aria-label="Project links"
          >
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
          <Link
            href="/demo"
            className="group inline-flex min-h-12 shrink-0 items-center gap-2 bg-white px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--paper-muted)]"
          >
            Try the live demo
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[var(--ink)] text-white">
        <div className="site-container flex flex-col gap-5 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>Remy · control, receipts and recovery for agent actions.</p>
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

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div>
      <p className="section-kicker text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-0.05em] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
