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
          : "border-[#19362e]/10 bg-[#f4efe5] text-[#19362e]"
      }`}
    >
      <div
        className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-10 lg:px-16"
      >
        <RemyMark tone={isDark ? "light" : "dark"} />
        <nav
          className={`hidden items-center gap-7 text-[13px] md:flex ${
            isDark ? "text-white/45" : "text-[#676c64]"
          }`}
        >
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/#product"
          >
            Product
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/#how-it-works"
          >
            How it works
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
            href="/docs"
          >
            Docs
          </Link>
          <Link
            className={isDark ? "hover:text-white" : "hover:text-[#111510]"}
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
              : "border-[#19362e] bg-[#19362e] text-white hover:bg-[#28483e]"
          }`}
        >
          Run locally
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
