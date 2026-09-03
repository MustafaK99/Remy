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
      className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border px-3 font-mono text-[11px] font-semibold transition-colors ${
        tone === "dark"
          ? "border-white/22 bg-white/6 text-white/72 hover:border-white/45 hover:bg-white/10"
          : "border-[var(--line)] bg-[var(--paper-strong)] text-[var(--ink-soft)] hover:border-[var(--line-strong)]"
      }`}
      aria-label={`${label}: ${value}`}
    >
      {copied ? (
        <Check className="size-3.5 text-[var(--success)]" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
