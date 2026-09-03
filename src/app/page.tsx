import type { ReactNode } from "react";
import Link from "next/link";
import { RemyMark } from "@/components/brand";
import { MorrowHeroPreview } from "@/components/landing/morrow-hero-preview";
import {
  ApprovalFeature,
  AutonomyFeature,
  ReceiptFeature,
} from "@/components/landing/product-features";
import { Quickstart } from "@/components/landing/quickstart";

const proof = [
  ["SAFE CHANGES", "Run automatically"],
  ["CONSEQUENTIAL ACTIONS", "Wait for approval"],
  ["EVERY CHANGE", "Leaves a receipt"],
] as const;

export default function Home() {
  return (
    <main className="remy-landing min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="remy-landing-frame">
        <header className="grid h-[64px] grid-cols-[1fr_auto] border-b border-[var(--border-subtle)] md:h-[82px]">
          <div className="flex min-w-0 items-center gap-8 px-5 md:px-8">
            <RemyMark tone="light" />
            <nav className="hidden items-center gap-6 font-mono text-sm text-[var(--text-quiet)] md:flex" aria-label="Primary navigation">
              <Link href="#product" className="transition-colors hover:text-[var(--text-primary)]">Product</Link>
              <Link href="/docs" className="transition-colors hover:text-[var(--text-primary)]">Docs</Link>
              <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text-primary)]">GitHub</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 border-l border-[var(--border-subtle)] px-3 md:px-8">
            <Link href="/demo" className="hidden h-10 items-center border border-[var(--border-strong)] px-4 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:inline-flex">
              Live demo
            </Link>
            <Link href="#quickstart" className="inline-flex h-10 items-center bg-[var(--text-primary)] px-4 font-mono text-sm text-[var(--background)] transition-colors hover:bg-white">
              Get started
            </Link>
          </div>
        </header>

        <section className="landing-hero grid border-b border-[var(--border-subtle)] lg:grid-cols-2">
          <div className="landing-enter flex min-h-[590px] flex-col justify-center border-b border-[var(--border-subtle)] px-5 py-16 sm:px-8 lg:min-h-[700px] lg:border-b-0 lg:border-r lg:px-8 lg:py-20">
            <div className="inline-flex w-fit items-center gap-2 border border-[var(--border-strong)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
              <span className="size-2 bg-[var(--accent)]" aria-hidden="true" />
              OPEN SOURCE · WEBMCP FIRST
            </div>
            <h1 className="mt-8 max-w-[510px] text-[44px] font-normal leading-[1] tracking-[-0.05em] sm:text-[56px] lg:text-[64px] lg:leading-[64px]">
              <span className="block">Let AI agents act</span>
              <span className="block">without giving up</span>
              <span className="block">control</span>
            </h1>
            <p className="mt-7 max-w-[450px] text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
              Remy adds permissions, approvals, receipts and undo to the actions agents take inside your app.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/demo" className="inline-flex h-11 items-center bg-[var(--text-primary)] px-5 font-mono text-sm text-[var(--background)] transition-colors hover:bg-white">
                Try the live demo
              </Link>
              <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center border border-[var(--border-strong)] px-5 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                View on GitHub
              </a>
            </div>
          </div>
          <div className="landing-enter-delay min-h-[620px] bg-[var(--surface-1)] lg:min-h-[700px]">
            <MorrowHeroPreview />
          </div>
        </section>

        <section className="grid border-b border-[var(--border-subtle)] sm:grid-cols-3" aria-label="Remy outcomes">
          {proof.map(([label, value], index) => (
            <div key={label} className={`min-h-[112px] border-b border-[var(--border-subtle)] px-5 py-6 last:border-b-0 sm:border-b-0 sm:px-8 ${index > 0 ? "sm:border-l" : ""}`}>
              <p className="font-mono text-[11px] text-[var(--text-quiet)]">{label}</p>
              <p className="mt-3 text-base text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </section>

        <section id="product" className="grid border-b border-[var(--border-subtle)] lg:grid-cols-2">
          <div className="min-h-[480px] border-b border-[var(--border-subtle)] bg-[var(--surface-1)] lg:border-b-0 lg:border-r">
            <AutonomyFeature />
          </div>
          <FeatureCopy title="Let reversible work run">
            Low-risk changes execute automatically according to the user’s selected access.
          </FeatureCopy>
        </section>

        <section className="grid border-b border-[var(--border-subtle)] lg:grid-cols-2">
          <div className="order-1 min-h-[480px] border-b border-[var(--border-subtle)] bg-[var(--surface-1)] lg:order-2 lg:border-b-0 lg:border-l">
            <ApprovalFeature />
          </div>
          <div className="order-2 lg:order-1">
            <FeatureCopy title="Pause what matters">
              Purchases and irreversible actions wait for explicit, specific approval.
            </FeatureCopy>
          </div>
        </section>

        <section className="grid border-b border-[var(--border-subtle)] lg:grid-cols-2">
          <div className="min-h-[480px] border-b border-[var(--border-subtle)] bg-[var(--surface-1)] lg:border-b-0 lg:border-r">
            <ReceiptFeature />
          </div>
          <FeatureCopy title="Show what happened">
            Every agent action leaves a readable receipt and the correct recovery option.
          </FeatureCopy>
        </section>

        <section id="quickstart" className="grid scroll-mt-4 border-b border-[var(--border-subtle)] lg:grid-cols-[.78fr_1.22fr]">
          <div className="flex min-h-[390px] flex-col justify-center border-b border-[var(--border-subtle)] px-5 py-14 sm:px-8 lg:border-b-0 lg:border-r">
            <p className="font-mono text-xs text-[var(--text-quiet)]">DEVELOPER QUICKSTART</p>
            <h2 className="mt-5 max-w-[390px] text-[40px] font-normal leading-[1.05] tracking-[-0.045em] sm:text-[48px]">
              Add control to one real action
            </h2>
            <p className="mt-5 max-w-[390px] text-base leading-7 text-[var(--text-secondary)]">
              Wrap the function your app already trusts, then expose it through WebMCP.
            </p>
          </div>
          <Quickstart />
        </section>

        <section className="flex min-h-[330px] flex-col justify-center px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div>
            <p className="font-mono text-xs text-[var(--text-quiet)]">MIT LICENSED · TYPESCRIPT</p>
            <h2 className="mt-5 max-w-[700px] text-[40px] font-normal leading-[1.04] tracking-[-0.045em] sm:text-[56px]">
              Ship agents users aren’t afraid to trust.
            </h2>
          </div>
          <Link href="/demo" className="mt-8 inline-flex h-11 w-fit shrink-0 items-center bg-[var(--text-primary)] px-5 font-mono text-sm text-[var(--background)] transition-colors hover:bg-white lg:mt-0">
            Try the live demo
          </Link>
        </section>

        <footer className="flex min-h-[72px] flex-col gap-4 border-t border-[var(--border-subtle)] px-5 py-5 font-mono text-xs text-[var(--text-quiet)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Remy · control, receipts and recovery for agent actions.</p>
          <nav className="flex gap-6" aria-label="Footer">
            <Link href="/docs" className="hover:text-[var(--text-primary)]">Docs</Link>
            <Link href="/demo" className="hover:text-[var(--text-primary)]">Demo</Link>
            <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)]">GitHub</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}

function FeatureCopy({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col justify-center px-5 py-14 sm:px-8 lg:min-h-[480px] lg:px-12">
      <h2 className="max-w-[430px] text-[40px] font-normal leading-[1.05] tracking-[-0.045em] sm:text-[48px]">
        {title}
      </h2>
      <p className="mt-5 max-w-[420px] text-base leading-7 text-[var(--text-secondary)]">
        {children}
      </p>
    </div>
  );
}
