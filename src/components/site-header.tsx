import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RemyMark } from "./brand";

type HeaderTone = "light" | "paper" | "dark";

export function SiteHeader({ tone = "light" }: { tone?: HeaderTone }) {
  const isDark = tone === "dark";

  return (
    <header
      className={`relative z-50 border-b ${
        isDark
          ? "border-white/15 bg-[#092b23] text-white"
          : "border-black/12 bg-[#f2f0e7] text-[#111510]"
      }`}
    >
      <div
        className={`mx-auto flex h-16 max-w-[1360px] items-center justify-between border-x px-5 sm:px-9 lg:px-12 ${
          isDark ? "border-white/15" : "border-black/12"
        }`}
      >
        <RemyMark tone={isDark ? "light" : "dark"} />
        <nav
          className={`hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.09em] md:flex ${
            isDark ? "text-white/58" : "text-[#676c64]"
          }`}
        >
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/#how-it-works"
          >
            Install
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/docs"
          >
            Docs
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/#principles"
          >
            How it works
          </Link>
        </nav>
        <Link
          href="/demo"
          className={`group inline-flex h-9 items-center gap-2 border px-3.5 text-xs font-semibold transition-colors ${
            isDark
              ? "border-white/28 text-white hover:border-[#ff6b43] hover:bg-[#ff6b43] hover:text-[#111510]"
              : "border-[#17342b] bg-[#ef6f50] text-[#17221d] hover:-translate-y-0.5 hover:bg-[#f4c95d]"
          }`}
        >
          See it work
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </header>
  );
}
