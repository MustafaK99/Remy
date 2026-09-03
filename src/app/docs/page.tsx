import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, FileCode2, Terminal } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Quickstart",
  description:
    "Add visible WebMCP actions, approval, and reversal to a Next.js application.",
};

const actionCode = `import { z } from "zod"
import { remy } from "@remy-ai/core"

export const updateAddress = remy.defineAction({
  name: "update_collection_address",
  title: "Change collection address",
  description: "Changes an existing return collection address.",
  inputSchema: z.object({ returnId: z.string(), address: z.string() }),
  risk: "medium",
  reversibility: "exact",
  preview: async (input, context) => ({
    before: context.returns[input.returnId].address,
    after: input.address,
  }),
  execute: async (input, context) => context.returns.updateAddress(input),
  undo: async (receipt, context) =>
    context.returns.updateAddress({
      returnId: receipt.input.returnId,
      address: receipt.before,
    }),
})`;

const providerCode = `<RemyProvider engine={remy}>
  <YourApplication />
  <ActionCenter />
</RemyProvider>`;

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f2f0e7] text-[#111510]">
      <SiteHeader tone="paper" />
      <div className="mx-auto grid max-w-[1360px] border-x border-black/12 px-5 py-14 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-12 lg:py-20">
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#918a7f]">Start here</p>
              <nav className="mt-3 space-y-2 text-sm">
                <a href="#install" className="block font-semibold text-[#155e48]">Quickstart</a>
                <a href="#define" className="block text-[#746e64] hover:text-[#26231f]">Define an action</a>
                <a href="#render" className="block text-[#746e64] hover:text-[#26231f]">Render the UI</a>
                <a href="#webmcp" className="block text-[#746e64] hover:text-[#26231f]">WebMCP</a>
              </nav>
            </div>
            <div className="border-t border-black/8 pt-5 text-xs leading-5 text-[#827b70]">
              <p>Building the challenge demo?</p>
              <Link href="/demo" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#155e48]">Open live demo <ArrowRight className="size-3" /></Link>
            </div>
          </div>
        </aside>

        <article className="max-w-[820px]">
          <p className="technical-label text-[#816d63]">Documentation / Quickstart</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Trustworthy actions in two minutes.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f685e]">Your handlers and state stay yours. Remy connects them to WebMCP, checks what an assistant may do, shows customers every change, and waits for approval when needed.</p>

          <section id="install" className="scroll-mt-8 border-t border-black/10 pt-10 mt-14">
            <div className="flex items-start gap-4">
              <span className="grid size-9 shrink-0 place-items-center border border-[#155e48]/30 text-[#155e48]"><Terminal className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">1. Initialize Remy</h2>
                <p className="mt-2 text-sm leading-6 text-[#746d63]">Run this from a Next.js project. The CLI detects your source layout, installs the SDK packages, and writes the smallest useful integration.</p>
                <CodeLine value="npx @remy-ai/cli init" />
                <div className="mt-4 flex gap-2 text-xs leading-5 text-[#676057]"><Check className="mt-0.5 size-3.5 shrink-0 text-[#19825e]" /> Safe by default: existing files are never overwritten without an explicit flag.</div>
              </div>
            </div>
          </section>

          <section id="define" className="scroll-mt-8 border-t border-black/10 pt-10 mt-14">
            <div className="flex items-start gap-4">
              <span className="grid size-9 shrink-0 place-items-center border border-[#d44d2d]/35 text-[#d44d2d]"><FileCode2 className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">2. Define a meaningful action</h2>
                <p className="mt-2 text-sm leading-6 text-[#746d63]">Describe business meaning rather than clicks or HTTP calls. The preview and inverse live next to the mutation they explain.</p>
                <CodeBlock value={actionCode} filename="src/remy/actions.ts" />
              </div>
            </div>
          </section>

          <section id="render" className="scroll-mt-8 border-t border-black/10 pt-10 mt-14">
            <div className="flex items-start gap-4">
              <span className="grid size-9 shrink-0 place-items-center border border-[#155e48]/30 text-[#155e48]"><Check className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">3. Drop in the Action Center</h2>
                <p className="mt-2 text-sm leading-6 text-[#746d63]">The generated provider keeps application state, assistant results, and the customer&apos;s change history synchronized.</p>
                <CodeBlock value={providerCode} filename="src/app/layout.tsx" />
              </div>
            </div>
          </section>

          <section id="webmcp" className="scroll-mt-8 border-t border-black/10 pt-10 mt-14">
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">WebMCP is an adapter, not the boundary</h2>
            <p className="mt-3 text-sm leading-6 text-[#746d63]">The generated client integration registers each action once through <code className="bg-black/5 px-1.5 py-0.5 font-mono text-xs">document.modelContext.registerTool</code>, validates input at runtime, delegates to <code className="bg-black/5 px-1.5 py-0.5 font-mono text-xs">remy.run()</code>, and unregisters with an AbortSignal on unmount.</p>
            <div className="mt-5 flex gap-3 border border-[#b17b2f]/30 bg-[#ead8b8]/55 p-4 text-xs leading-5 text-[#684a24]">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p>Browsers without WebMCP keep the normal application fully usable. Use the manual adapter to test the exact same action path.</p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

function CodeLine({ value }: { value: string }) {
  return <div className="mt-5 flex items-center justify-between gap-4 border border-[#111510] bg-[#102d25] p-3 pl-4 text-white"><code className="font-mono text-xs sm:text-sm"><span className="mr-3 text-[#70d5aa]">$</span>{value}</code><CopyButton value={value} tone="dark" /></div>;
}

function CodeBlock({ value, filename }: { value: string; filename: string }) {
  return <div className="mt-5 overflow-hidden border border-black/15 bg-[#111510] text-white"><div className="flex items-center justify-between border-b border-white/12 px-4 py-2.5"><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">{filename}</span><CopyButton value={value} tone="dark" /></div><pre className="overflow-x-auto p-4 font-mono text-[11px] leading-5 text-white/75 sm:p-5 sm:text-xs"><code>{value}</code></pre></div>;
}
