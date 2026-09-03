"use client";

import { useState } from "react";
import { Check, EyeOff, Hand, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { AutonomySlider, type AutonomyOption } from "@/components/autonomy-slider";

type Mode = "preview" | "ask" | "safe" | "trusted";

const modes: ReadonlyArray<AutonomyOption<Mode>> = [
  { value: "preview", label: "Preview", shortLabel: "Preview", description: "Prepare changes without executing them.", icon: EyeOff },
  { value: "ask", label: "Ask on changes", shortLabel: "Ask", description: "Pause before every state change.", icon: Hand },
  { value: "safe", label: "Reversible actions", shortLabel: "Reversible", description: "Changes Remy can reverse run automatically. Purchases still wait.", icon: ShieldCheck },
  { value: "trusted", label: "Trusted run", shortLabel: "Trusted", description: "Run actions covered by the authority the user granted.", icon: Zap },
];

export function AutonomyFeature() {
  const [mode, setMode] = useState<Mode>("safe");
  const automatic = mode === "safe" || mode === "trusted";

  return (
    <div className="flex h-full min-h-[480px] items-center px-5 py-12 sm:px-10">
      <div className="w-full border-y border-[var(--border-subtle)] py-6">
        <AutonomySlider label="Agent access" value={mode} options={modes} onChange={setMode} />
        <div className="mt-5 border-t border-[var(--border-subtle)]">
          <StatusLine label="Morrow One added" status={automatic ? "AUTOMATIC" : mode === "preview" ? "PREVIEW" : "WAITING"} active={automatic} />
          <StatusLine label="Express delivery selected" status={automatic ? "AUTOMATIC" : mode === "preview" ? "PREVIEW" : "WAITING"} active={automatic} />
          <StatusLine label="Purchase £123" status={mode === "trusted" ? "AUTOMATIC" : mode === "preview" ? "PREVIEW" : "WAITING"} active={mode === "trusted"} warning={mode !== "trusted"} />
        </div>
      </div>
    </div>
  );
}

function StatusLine({ label, status, active, warning = false }: { readonly label: string; readonly status: string; readonly active: boolean; readonly warning?: boolean }) {
  return (
    <div className="grid min-h-[58px] grid-cols-[22px_1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] last:border-b-0">
      <span className={`grid size-[18px] place-items-center border ${active ? "border-[var(--success)] text-[var(--success)]" : warning ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border-strong)] text-[var(--text-quiet)]"}`}>
        {active ? <Check className="size-3" /> : "·"}
      </span>
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
      <span className={`font-mono text-[9px] ${warning ? "text-[var(--accent)]" : "text-[var(--text-quiet)]"}`}>{status}</span>
    </div>
  );
}

export function ApprovalFeature() {
  const [approved, setApproved] = useState(false);

  return (
    <div className="flex h-full min-h-[480px] items-center px-5 py-12 sm:px-10">
      <div className="w-full border border-[var(--border-strong)] bg-[var(--background)]">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="font-mono text-[10px] text-[var(--accent)]">EXPLICIT APPROVAL</p>
          <h3 className="mt-3 text-2xl font-normal tracking-[-0.035em]">Place order for £115?</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Visa ending 4242 will be charged.</p>
        </div>
        <dl className="divide-y divide-[var(--border-subtle)] px-5 text-sm">
          <ApprovalLine label="Morrow One" value="£128" />
          <ApprovalLine label="HELLO10" value="−£13" />
          <ApprovalLine label="Total" value="£115" strong />
        </dl>
        <div className="grid grid-cols-2 border-t border-[var(--border-subtle)]">
          <button type="button" onClick={() => setApproved(false)} className="min-h-11 cursor-pointer border-r border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Reject</button>
          <button type="button" onClick={() => setApproved(true)} className="min-h-11 cursor-pointer bg-[var(--text-primary)] font-mono text-xs text-[var(--background)] hover:bg-white">{approved ? "Approved" : "Approve £115 purchase"}</button>
        </div>
      </div>
    </div>
  );
}

function ApprovalLine({ label, value, strong = false }: { readonly label: string; readonly value: string; readonly strong?: boolean }) {
  return (
    <div className={`flex justify-between py-3 ${strong ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
      <dt>{label}</dt><dd className={strong ? "font-medium" : ""}>{value}</dd>
    </div>
  );
}

export function ReceiptFeature() {
  const [recovered, setRecovered] = useState(false);

  return (
    <div className="flex h-full min-h-[480px] items-center px-5 py-12 sm:px-10">
      <div className="w-full border-y border-[var(--border-subtle)]">
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] text-[var(--text-quiet)]">READABLE RECEIPT</p>
              <h3 className="mt-3 text-xl font-normal tracking-[-0.03em]">Express delivery selected</h3>
            </div>
            <span className="font-mono text-[9px] text-[var(--success)]">{recovered ? "REVERSED" : "COMPLETED"}</span>
          </div>
          <dl className="mt-5 grid grid-cols-[72px_1fr] gap-y-3 border-y border-[var(--border-subtle)] py-4 text-sm">
            <dt className="text-[var(--text-quiet)]">Before</dt><dd className="text-[var(--text-secondary)]">Standard · Free</dd>
            <dt className="text-[var(--text-quiet)]">After</dt><dd className="text-[var(--text-primary)]">Express · £8</dd>
          </dl>
          <button type="button" onClick={() => setRecovered(true)} disabled={recovered} className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 border border-[var(--border-strong)] px-4 font-mono text-xs text-[var(--text-primary)] hover:border-[var(--text-secondary)] disabled:cursor-default disabled:text-[var(--text-quiet)]">
            <RotateCcw className="size-3.5" /> {recovered ? "Standard restored" : "Undo delivery"}
          </button>
        </div>
        {recovered ? (
          <div className="grid grid-cols-[22px_1fr_auto] items-center gap-3 border-t border-[var(--border-subtle)] px-5 py-4">
            <span className="grid size-[18px] place-items-center border border-[var(--success)] text-[var(--success)]"><Check className="size-3" /></span>
            <span className="text-sm">Delivery restored to standard</span>
            <span className="font-mono text-[9px] text-[var(--success)]">LINKED RECOVERY</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
