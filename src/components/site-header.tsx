import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RemyMark } from "./brand";

type HeaderTone = "light" | "paper" | "dark";

export function SiteHeader({ tone = "light" }: { tone?: HeaderTone }) {
  const isDark = tone === "dark";

  return (
    <header
      className={`relative z-50 border-b ${
        isDark
          ? "border-white/10 bg-[#0a0a0a] text-white"
          : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
      }`}
    >
      <div
        className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-10 lg:px-16"
      >
        <RemyMark tone={isDark ? "light" : "dark"} />
        <nav
          className={`hidden items-center gap-7 text-[13px] md:flex ${
            isDark ? "text-white/45" : "text-[var(--muted)]"
          }`}
        >
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[var(--ink)]"}
            href="/#product"
          >
            Product
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[var(--ink)]"}
            href="/#how-it-works"
          >
            How it works
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[var(--ink)]"}
            href="/docs"
          >
            Docs
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[var(--ink)]"}
            href="/demo"
          >
            Demo
          </Link>
        </nav>
        <Link
          href="/docs#quickstart"
          className={`group inline-flex h-9 items-center gap-2 border px-3.5 text-xs font-medium transition-colors ${
            isDark
              ? "border-white bg-white text-[#0a0a0a] hover:bg-white/85"
              : "border-[var(--ink)] bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)]"
          }`}
        >
          Read quickstart
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
