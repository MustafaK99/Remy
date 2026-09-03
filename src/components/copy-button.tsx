"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  tone = "light",
}: {
  value: string;
  label?: string;
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex h-8 shrink-0 items-center gap-2 border px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] transition-colors ${
        tone === "dark"
          ? "border-white/22 bg-white/6 text-white/72 hover:border-white/45 hover:bg-white/10"
          : "border-black/14 bg-white/55 text-[#4d514b] hover:border-black/30 hover:bg-white"
      }`}
      aria-label={`${label}: ${value}`}
    >
      {copied ? (
        <Check className="size-3 text-[#70d5aa]" />
      ) : (
        <Copy className="size-3" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
