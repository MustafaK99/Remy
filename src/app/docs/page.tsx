import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "SDK documentation",
  description:
    "Install Remy and add policy, readable receipts, approval, and recovery to agent actions.",
};

const installCommand = "npx @remy-ai/cli init";

const actionCode = `import { z } from "zod"
import { remy } from "@remy-ai/core"

export const changeCollectionAddress = remy.defineAction({
  name: "change_collection_address",
  title: "Change collection address",
  description: "Changes where a return will be collected.",
  kind: "mutation",
  inputSchema: z.object({ address: z.string().min(1) }),
  risk: "medium",
  reversibility: "exact",

  preview: async (input, context) => ({
    before: await context.returns.getCollectionAddress(),
    after: input.address,
  }),

  execute: async (input, context) =>
    context.returns.setCollectionAddress(input.address),

  undo: async (receipt, context) =>
    context.returns.setCollectionAddress(receipt.before),
})`;

const providerCode = `<RemyProvider engine={remy}>
  <WebMCPBridge />
  <YourApplication />
</RemyProvider>`;

const navigation = [
  ["Install", "#install"],
  ["Mental model", "#mental-model"],
  ["Define an action", "#define"],
  ["Autonomy and policy", "#policy"],
  ["Receipts", "#receipts"],
  ["Recovery", "#recovery"],
  ["WebMCP adapter", "#webmcp"],
  ["Connect your UI", "#ui"],
  ["Production guarantees", "#production"],
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#17241f]">
      <SiteHeader tone="paper" />

      <div className="mx-auto grid max-w-[1380px] border-x border-[#17241f]/10 px-5 py-14 sm:px-8 lg:grid-cols-[220px_minmax(0,860px)] lg:justify-center lg:gap-16 lg:px-12 lg:py-20">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#8a8e88]">
              SDK documentation
            </p>
            <nav className="mt-5 border-l border-[#17241f]/12" aria-label="Documentation sections">
              {navigation.map(([label, href], index) => (
                <a
                  key={href}
                  href={href}
                  className={`block border-l px-4 py-1.5 text-sm transition-colors ${
                    index === 0
                      ? "-ml-px border-[#d95839] font-medium text-[#17241f]"
                      : "border-transparent text-[#70776f] hover:text-[#17241f]"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-8 border-t border-[#17241f]/10 pt-5">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 text-xs font-medium text-[#53645c] hover:text-[#17241f]"
              >
                Open the live demo
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </aside>

        <article className="min-w-0 max-w-[860px]">
          <p className="font-mono text-[10px] text-[#767d77]">Remy SDK · alpha</p>
          <h1 className="mt-5 max-w-[780px] text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
            Control, receipts, and recovery for agent actions.
          </h1>
          <p className="mt-6 max-w-[700px] text-base leading-7 text-[#667069]">
            Define a semantic action once. Remy validates it, applies developer
            policy and user autonomy, records the outcome, and exposes the right
            approval or recovery path.
          </p>

          <div className="mt-8 max-w-[700px]">
            <CodeLine value={installCommand} />
            <p className="mt-3 text-xs leading-5 text-[#7c837d]">
              Current target: Next.js App Router with the WebMCP adapter.
              The core engine is protocol-neutral. Package publication is pending;
              inside this repository, run <InlineCode>npm run cli -- init</InlineCode>.
            </p>
          </div>

          <DocSection id="install" number="01" title="Install Remy">
            <p>
              Run the initializer from the root of a Next.js application. It
              detects your source layout and package manager, adds the SDK
              integration, and creates the smallest useful starting point.
            </p>
            <CodeLine value={installCommand} />
            <div className="mt-5 grid border-y border-[#17241f]/12 text-sm sm:grid-cols-2">
              <DocFact label="Creates" value="src/remy/actions.ts" />
              <DocFact label="Creates" value="src/remy/provider.tsx" />
              <DocFact label="Preserves" value="Your existing routes and UI" />
              <DocFact label="Safety" value="No overwrite without an explicit flag" />
            </div>
            <Callout tone="success">
              The initializer does not generate a Remy dashboard. Your product
              decides where approvals, history, and controls belong.
            </Callout>
          </DocSection>

          <DocSection id="mental-model" number="02" title="The mental model">
            <p>
              Remy sits between an agent adapter and the functions that mutate
              application state. It owns the execution contract—not your data,
              business logic, or visual design.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Your application" detail="Business state, handlers, eligibility, and UI" />
              <DocRow name="Remy" detail="Validation, preview, policy, receipt, approval, and recovery" />
              <DocRow name="Adapter" detail="WebMCP today; MCP and agent SDK adapters are planned" />
            </div>
          </DocSection>

          <DocSection id="define" number="03" title="Define a semantic action">
            <p>
              Model the user-visible operation, not a click or HTTP request. An
              action declares its input, risk, preview, execution, and honest
              recovery semantics in one place.
            </p>
            <CodeBlock value={actionCode} filename="src/remy/actions.ts" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="preview" detail="Describe the proposed before-and-after change without mutating state" />
              <DocRow name="execute" detail="Perform the real operation after policy allows it" />
              <DocRow name="undo" detail="Restore prior state only when exact reversal is truthful" />
              <DocRow name="compensate" detail="Run a new corrective action when exact undo is impossible" />
            </div>
          </DocSection>

          <DocSection id="policy" number="04" title="Autonomy and policy">
            <p>
              The final decision combines the developer&apos;s action policy with the
              user&apos;s current autonomy level. An agent may request more access,
              but only the person using the application can grant it.
            </p>
            <div className="mt-6 overflow-x-auto border-y border-[#17241f]/12">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#7a817b]">
                  <tr>
                    <th className="py-3 pr-4 font-medium">User mode</th>
                    <th className="py-3 pr-4 font-medium">Reversible action</th>
                    <th className="py-3 font-medium">Consequential action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17241f]/10">
                  <PolicyRow mode="Preview only" reversible="Preview" consequential="Preview" />
                  <PolicyRow mode="Ask on changes" reversible="Ask" consequential="Ask" />
                  <PolicyRow mode="Reversible actions" reversible="Run" consequential="Ask" />
                  <PolicyRow mode="Trusted run" reversible="Run" consequential="Policy decides" />
                </tbody>
              </table>
            </div>
            <Callout>
              Higher-risk actions can always require approval. In the shop demo,
              buying without asking is an additional permission even in Trusted run.
            </Callout>
          </DocSection>

          <DocSection id="receipts" number="05" title="Readable receipts">
            <p>
              Every attempted mutation produces an append-only record. UI should
              explain what happened in domain language while the engine keeps the
              structured data needed for policy and recovery.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Requester" detail="User, assistant label, transport, task, and run" />
              <DocRow name="Decision" detail="Allowed, waiting for approval, staged, or denied—with a reason" />
              <DocRow name="Change" detail="Human-readable before-and-after diff" />
              <DocRow name="Outcome" detail="Committed, failed, rejected, reversed, or compensated" />
              <DocRow name="Recovery" detail="Exact undo, compensation, or explicitly irreversible" />
            </div>
          </DocSection>

          <DocSection id="recovery" number="06" title="Recovery semantics">
            <p>
              Do not label every correction “undo.” Remy distinguishes three
              contracts and keeps corrective actions linked to the original receipt.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Exact undo" detail="Restore the prior state after checking resource versions" />
              <DocRow name="Compensation" detail="Append a new corrective action, such as cancelling a booking" />
              <DocRow name="Irreversible" detail="Expose no false recovery and require appropriate approval first" />
            </div>
            <Callout tone="success">
              Undo never deletes history. The original receipt changes status and
              a linked reversal receipt is appended.
            </Callout>
          </DocSection>

          <DocSection id="webmcp" number="07" title="WebMCP adapter">
            <p>
              The client bridge feature-detects <InlineCode>document.modelContext</InlineCode>,
              registers each action once, validates tool input at runtime, and
              unregisters cleanly when the component unmounts.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="get_remy_status" detail="Detect Remy and read the current user controls" code />
              <DocRow name="identify_assistant" detail="Add a plain-language, self-reported attribution label" code />
              <DocRow name="request_remy_controls" detail="Request preview, ask, reversible, or trusted; escalation waits for the user" code />
              <DocRow name="get_action_history" detail="Read concise receipts for actions attempted on this page" code />
              <DocRow name="revert_action" detail="Request a safe reversal by receipt ID" code />
            </div>
            <Callout>
              Assistant identity is attribution, not authentication. It never
              grants access or weakens policy.
            </Callout>
          </DocSection>

          <DocSection id="ui" number="08" title="Connect your existing UI">
            <p>
              The React provider exposes observable action state and receipts.
              Render them inside an existing drawer, toast, settings page, or
              account screen—or render no Remy UI at all.
            </p>
            <CodeBlock value={providerCode} filename="src/app/layout.tsx" />
            <p className="mt-5">
              Direct customer interactions through the normal application UI
              remain available under every AI autonomy setting.
            </p>
          </DocSection>

          <DocSection id="production" number="09" title="Production guarantees and current limits">
            <p>
              The alpha engine already protects execution invariants. The demo
              deliberately keeps persistence local so the behavior remains easy
              to inspect.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Idempotency" detail="Duplicate execute and reversal requests do not duplicate effects" />
              <DocRow name="Stale approval checks" detail="Pending approval is invalidated if relevant state changes" />
              <DocRow name="Version-safe undo" detail="Exact undo stops when a later change would make it unsafe" />
              <DocRow name="Persistence" detail="Refresh restores state and receipts without replaying actions" />
            </div>
            <Callout tone="warning">
              Current demo limits: fictional commerce data, local-storage
              persistence, unsigned receipts, and a WebMCP-first adapter. A hosted
              journal and additional protocol adapters are planned, not shipped.
            </Callout>
          </DocSection>

          <div className="mt-16 flex flex-col justify-between gap-6 border-t border-[#17241f]/12 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">See the execution model in a real interface.</p>
              <p className="mt-1 text-sm text-[#747c76]">The fictional shop makes no real payment or order.</p>
            </div>
            <Link
              href="/demo"
              className="group inline-flex h-11 w-fit items-center gap-2 bg-[#17241f] px-4 text-sm font-medium text-white hover:bg-[#294238]"
            >
              Open the live demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}

function DocSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-[#17241f]/12 pt-10 mt-16">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[9px] text-[#d95839]">{number}</span>
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
      </div>
      <div className="mt-5 max-w-[760px] text-sm leading-6 text-[#68716b]">
        {children}
      </div>
    </section>
  );
}

function CodeLine({ value }: { value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border border-[#17241f] bg-[#111714] p-2 pl-4 text-white">
      <code className="min-w-0 truncate font-mono text-xs sm:text-sm">
        <span className="mr-3 text-[#e66749]">$</span>
        {value}
      </code>
      <CopyButton value={value} tone="dark" />
    </div>
  );
}

function CodeBlock({ value, filename }: { value: string; filename: string }) {
  return (
    <div className="mt-6 overflow-hidden border border-[#17241f]/15 bg-[#111714] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[9px] text-white/38">{filename}</span>
        <CopyButton value={value} tone="dark" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-5 text-white/72 sm:p-5 sm:text-xs">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function DocFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 border-b border-[#17241f]/10 py-3 sm:odd:border-r sm:odd:pr-4 sm:even:pl-4">
      <span className="font-mono text-[9px] text-[#878d87]">{label}</span>
      <span className="text-xs font-medium text-[#3f5048]">{value}</span>
    </div>
  );
}

function DocRow({ name, detail, code = false }: { name: string; detail: string; code?: boolean }) {
  return (
    <div className="grid gap-2 border-b border-[#17241f]/12 py-4 sm:grid-cols-[190px_1fr]">
      {code ? (
        <code className="font-mono text-[11px] font-medium text-[#32483f]">{name}</code>
      ) : (
        <span className="text-sm font-medium text-[#304139]">{name}</span>
      )}
      <span className="text-sm leading-6 text-[#717a74]">{detail}</span>
    </div>
  );
}

function PolicyRow({ mode, reversible, consequential }: { mode: string; reversible: string; consequential: string }) {
  return (
    <tr>
      <th className="py-3 pr-4 font-medium text-[#31443b]">{mode}</th>
      <td className="py-3 pr-4 text-[#6f7872]">{reversible}</td>
      <td className="py-3 text-[#6f7872]">{consequential}</td>
    </tr>
  );
}

function Callout({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const isSuccess = tone === "success";
  const isWarning = tone === "warning";
  return (
    <div
      className={`mt-6 flex gap-3 border p-4 text-xs leading-5 ${
        isSuccess
          ? "border-[#6da585]/30 bg-[#dfebe3] text-[#345c49]"
          : isWarning
            ? "border-[#c7795f]/30 bg-[#f1ddd5] text-[#754735]"
            : "border-[#17241f]/12 bg-[#ebe6dc] text-[#5f6b64]"
      }`}
    >
      {isSuccess ? (
        <Check className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      )}
      <p>{children}</p>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="mx-1 bg-[#17241f]/6 px-1.5 py-0.5 font-mono text-[11px] text-[#3c4e45]">
      {children}
    </code>
  );
}
