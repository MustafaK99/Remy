import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

const installCommand = "npm install @remy-ai/core @remy-ai/webmcp";

const actionCode = `import { createRemy, succeed } from "@remy-ai/core"
import { registerWebMCP } from "@remy-ai/webmcp"
import { z } from "zod"

const remy = createRemy({ context: () => documents })

const rename = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Rename the current document.",
  kind: "write",
  risk: "low",
  input: z.strictObject({ title: z.string() }),
  preview: ({ input, context }) => ({
    summary: \`Rename document to \${input.title}.\`,
    changes: [{
      label: "Title",
      before: context.title,
      after: input.title,
    }],
    recovery: { title: context.title },
  }),
  execute: ({ input, context }) => {
    context.rename(input.title)
    return succeed({ title: input.title })
  },
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) => {
      context.rename(receipt.recovery.title)
      return succeed({ title: receipt.recovery.title })
    },
  },
})

remy.register(rename)
const registration = await registerWebMCP(remy)

// Later: registration.unregister()`;

export function Quickstart() {
  return (
    <div className="mt-12 overflow-hidden border border-[var(--line-strong)] bg-[var(--paper-strong)]">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-sm font-semibold">Prepared alpha packages</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Tarballs are verified; npm publication is the remaining release step.</p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <code className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-xs text-[var(--ink-soft)]">{installCommand}</code>
          <CopyButton value={installCommand} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
        <ol className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r sm:p-7">
          {[
            ["01", "Create Remy"],
            ["02", "Wrap a function"],
            ["03", "Register WebMCP"],
            ["04", "Clean up"],
          ].map(([number, label]) => (
            <li key={number} className="flex gap-3 border-b border-[var(--line)] py-4 text-sm last:border-b-0">
              <span className="font-mono text-xs font-semibold text-[var(--accent)]">{number}</span>
              <span className="font-semibold">{label}</span>
            </li>
          ))}
          <Link href="/docs#quickstart" className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:text-[var(--accent-hover)]">
            Complete quickstart
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </ol>

        <div className="min-w-0 bg-[var(--code)] text-white">
          <div className="flex min-h-12 items-center justify-between border-b border-white/10 px-5 sm:px-7">
            <span className="font-mono text-xs text-white/55">rename-document.ts</span>
            <CopyButton value={actionCode} tone="dark" />
          </div>
          <pre className="max-h-[38rem] overflow-auto p-5 font-mono text-[13px] leading-6 text-white/75 sm:p-7">
            <code>{actionCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
