import Link from "next/link";
import { ArrowRight, Check, GitBranch } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { HeroActionDemo } from "@/components/landing/hero-action-demo";
import { Quickstart } from "@/components/landing/quickstart";
import { SiteHeader } from "@/components/site-header";

const installCommand = "npm install @remy-ai/core @remy-ai/webmcp";

const workflow = [
  ["01", "Wrap", "Describe the change around the function your application already uses."],
  ["02", "Decide", "Your policy and the user’s selected access determine whether it runs or waits."],
  ["03", "Recover", "Record a readable receipt and provide the correct path back when one exists."],
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
        <div className="site-container grid min-h-[calc(100svh-4rem)] items-center gap-12 py-12 xl:grid-cols-[minmax(25rem,.72fr)_minmax(43rem,1.28fr)] xl:gap-14 xl:py-16">
          <div className="hero-enter min-w-0 max-w-[38rem]">
            <p className="technical-label text-[var(--accent)]">OPEN-SOURCE TYPESCRIPT SDK · WEBMCP FIRST</p>
            <h1 className="mt-5 text-[clamp(3.5rem,6vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.072em]">
              Let agents act without asking every time.
            </h1>
            <p className="mt-7 max-w-[37rem] text-lg leading-8 text-[var(--ink-soft)]">
              Remy wraps your app’s existing functions with permissions,
              approvals, receipts and recovery. Reversible changes run
              automatically. Consequential actions wait for the user.
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--muted)]">
              Your application keeps its state, authentication and business logic.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo" className="group inline-flex min-h-12 items-center gap-2 bg-[var(--ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-soft)]">
                Try the live demo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/docs#quickstart" className="group inline-flex min-h-12 items-center gap-2 border border-[var(--line-strong)] bg-[var(--paper-strong)] px-5 text-sm font-semibold transition-colors hover:border-[var(--ink)]">
                Read the quickstart
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-8 flex w-full max-w-[35rem] min-w-0 items-center justify-between gap-3 overflow-hidden border-y border-[var(--line)] py-3 pl-4">
              <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--ink-soft)]">{installCommand}</code>
              <CopyButton value={installCommand} />
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">Package artifacts verified · npm publication pending</p>
            <p className="mt-4 text-sm font-semibold text-[var(--ink-soft)]">Morrow demo: 4 actions · 3 automatic · 1 approval</p>
          </div>

          <div className="hero-enter-delay min-w-0">
            <HeroActionDemo />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="home-section border-b border-[var(--line)]">
        <div className="site-container">
          <SectionHeading eyebrow="How it works" title="Wrap → Decide → Recover" text="Remy controls application actions, not model responses." />
          <ol className="mt-12 border-t border-[var(--line-strong)]">
            {workflow.map(([number, title, text]) => (
              <li key={number} className="grid gap-3 border-b border-[var(--line)] py-7 sm:grid-cols-[4rem_10rem_1fr] sm:items-baseline">
                <span className="font-mono text-xs font-semibold text-[var(--accent)]">{number}</span>
                <h3 className="text-xl font-semibold tracking-[-0.035em]">{title}</h3>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="recovery" className="home-section border-b border-[var(--line)] bg-[var(--paper-strong)]">
        <div className="site-container grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <SectionHeading eyebrow="Recovery" title="Say what can actually be reversed." text="Remy never calls every corrective action “undo.”" />
          <div className="border-t border-[var(--line-strong)]">
            {recovery.map(([title, text, example]) => (
              <div key={title} className="grid gap-2 border-b border-[var(--line)] py-6 sm:grid-cols-[10rem_1fr_10rem] sm:items-baseline">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-[var(--muted)]">{text}</p>
                <p className="font-mono text-xs text-[var(--ink-soft)]">{example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="home-section border-b border-[var(--line)]">
        <div className="site-container">
          <SectionHeading eyebrow="Install" title="Wrap one real function." text="The alpha packages are small, typed and framework-optional." />
          <Quickstart />
        </div>
      </section>

      <section className="home-section border-b border-[var(--line)] bg-[var(--paper-muted)]">
        <div className="site-container grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
          <div>
            <GitBranch className="size-6 text-[var(--accent)]" />
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-5xl">Open where control matters.</h2>
          </div>
          <div>
            <p className="max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
              The core contract, policy engine and journal are MIT licensed. WebMCP works now; MCP and agent SDK adapters stay on the public roadmap until they are implemented.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold">
              <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[var(--accent-hover)]"><Check className="size-4" /> View source</a>
              <a href="https://github.com/MustafaK99/Remy/blob/master/LICENSE" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-hover)]">MIT licence</a>
              <a href="https://github.com/MustafaK99/Remy/blob/master/ROADMAP.md" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-hover)]">Roadmap</a>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section bg-[var(--ink)] text-white">
        <div className="site-container flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="technical-label text-[var(--accent)]">Remy alpha</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-0.055em] sm:text-6xl">Ship agents users aren’t afraid to trust.</h2>
          </div>
          <Link href="/docs#quickstart" className="group inline-flex min-h-12 shrink-0 items-center gap-2 bg-white px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--paper-muted)]">
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
      <p className="technical-label text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">{title}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{text}</p>
    </div>
  );
}
