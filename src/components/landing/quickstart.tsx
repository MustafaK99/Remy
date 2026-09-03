import Link from "next/link";
import { CopyButton } from "@/components/copy-button";

const sourceCommand = "git clone https://github.com/MustafaK99/Remy.git && cd Remy && npm ci";

const actionCode = `const chooseDelivery = remy.defineAction({
  name: "choose_delivery",
  title: "Choose delivery",
  kind: "write",
  risk: "low",
  input: z.strictObject({
    method: z.enum(["standard", "express"]),
  }),
  preview: ({ input, context }) => ({
    summary: \`Choose \${input.method} delivery\`,
    changes: [{
      label: "Delivery",
      before: context.cart.delivery,
      after: input.method,
    }],
    recovery: { method: context.cart.delivery },
  }),
  execute: ({ input, context }) =>
    context.cart.setDelivery(input.method),
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) =>
      context.cart.setDelivery(receipt.recovery.method),
  },
})

remy.register(chooseDelivery)
await registerWebMCP(remy)`;

export function Quickstart() {
  return (
    <div className="min-w-0 bg-[var(--surface-1)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-8">
        <p className="font-mono text-[10px] text-[var(--text-quiet)]">RUN FROM SOURCE</p>
        <div className="mt-3 flex min-w-0 items-center gap-3 border border-[var(--border-strong)] bg-[var(--background)] p-2 pl-4">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--text-primary)]">{sourceCommand}</code>
          <CopyButton value={sourceCommand} tone="dark" />
        </div>
      </div>
      <div className="border-b border-[var(--border-subtle)]">
        <div className="flex h-11 items-center justify-between border-b border-[var(--border-subtle)] px-5 sm:px-8">
          <span className="font-mono text-[10px] text-[var(--text-quiet)]">choose-delivery.ts</span>
          <CopyButton value={actionCode} tone="dark" />
        </div>
        <pre className="max-h-[380px] overflow-auto px-5 py-5 font-mono text-[12px] leading-5 text-[var(--text-secondary)] sm:px-8">
          <code>{actionCode}</code>
        </pre>
      </div>
      <div className="flex min-h-14 items-center justify-between gap-4 px-5 sm:px-8">
        <span className="font-mono text-[10px] text-[var(--text-quiet)]">Node 20+ · npm 10+ · no environment variables</span>
        <Link href="/docs#quickstart" className="shrink-0 font-mono text-xs text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 hover:decoration-[var(--text-primary)]">
          Full quickstart
        </Link>
      </div>
    </div>
  );
}
