import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Run Remy locally and understand its semantic actions, policies, receipts, recovery, WebMCP adapter, and security boundary.",
};

const cloneCommand = "git clone https://github.com/MustafaK99/Remy.git";

const localCommands = `git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev`;

const actionCode = `import { z } from "zod"
import type { DemoState } from "@/demo/data"
import type { ActionDefinition } from "@/remy/core/types"

export const chooseDeliveryAction: ActionDefinition<
  DemoState,
  { method: "standard" | "express" }
> = {
  name: "choose_delivery",
  version: "1",
  title: "Changed delivery",
  description: "Choose delivery for the current bag.",
  kind: "mutation",
  inputSchema: z.object({
    method: z.enum(["standard", "express"]),
  }).strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      method: { type: "string", enum: ["standard", "express"] },
    },
    required: ["method"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: buildDeliveryPreview,
  execute: setDelivery,
  undo: restorePreviousDelivery,
}`;

const completeExample = `import { createDemoEngine } from "@/demo/create-engine"

const remy = createDemoEngine()

const added = await remy.run(
  "add_to_cart",
  { productId: "morrow-one", colour: "Charcoal", quantity: 1 },
  { actor: "agent", transport: "webmcp", idempotencyKey: "demo:add" },
)
if (!added.ok) throw new Error(added.error)

const delivery = await remy.run(
  "choose_delivery",
  { method: "express" },
  { actor: "agent", transport: "webmcp", idempotencyKey: "demo:delivery" },
)
if (!delivery.ok) throw new Error(delivery.error)

await remy.run(
  "apply_discount",
  { code: "HELLO10" },
  { actor: "agent", transport: "webmcp", idempotencyKey: "demo:discount" },
)

// Exact undo appends a linked recovery receipt.
await remy.revert(delivery.actionId, {
  actor: "user",
  transport: "manual",
})

// The purchase uses current application state and waits for approval.
const purchase = await remy.run(
  "place_order",
  {},
  { actor: "agent", transport: "webmcp", idempotencyKey: "demo:purchase" },
)

if (purchase.ok && purchase.requiresApproval) {
  await remy.approve(purchase.actionId)
}`;

const bridgeCode = `"use client"

import { useWebMCPRegistration } from "@/remy/adapters/webmcp"
import { useRemy } from "@/remy/react/provider"

export function WebMCPBridge() {
  const { engine } = useRemy()
  const status = useWebMCPRegistration(engine)

  return <p aria-live="polite">WebMCP: {status}</p>
}`;

const uiCode = `"use client"

const [open, setOpen] = useState(false)
const { engine } = useRemy()
const status = useWebMCPRegistration(engine)

return (
  <>
    <YourApplication />
    <ActionCenter
      connectionStatus={status}
      open={open}
      onOpenChange={setOpen}
    />
  </>
)`;

const navigation = [
  ["What Remy solves", "#solves"],
  ["Local quickstart", "#quickstart"],
  ["Working demo", "#demo"],
  ["Define an action", "#define"],
  ["Recovery model", "#recovery"],
  ["Autonomy policy", "#policy"],
  ["WebMCP", "#webmcp"],
  ["Action Center", "#ui"],
  ["Test the flow", "#testing"],
  ["Security checklist", "#security"],
  ["API reference", "#api"],
  ["Troubleshooting", "#troubleshooting"],
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#17241f]">
      <SiteHeader tone="paper" />

      <div className="mx-auto grid max-w-[1380px] border-x border-[#17241f]/10 px-5 py-14 sm:px-8 lg:grid-cols-[220px_minmax(0,860px)] lg:justify-center lg:gap-16 lg:px-12 lg:py-20">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#8a8e88]">
              Documentation
            </p>
            <nav className="mt-5 border-l border-[#17241f]/12" aria-label="Documentation sections">
              {navigation.map(([label, href], index) => (
                <a
                  key={href}
                  href={href}
                  className={`block border-l px-4 py-1.5 text-[13px] transition-colors ${
                    index === 0
                      ? "-ml-px border-[#d95839] font-medium text-[#17241f]"
                      : "border-transparent text-[#70776f] hover:text-[#17241f]"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-8 space-y-3 border-t border-[#17241f]/10 pt-5">
              <Link href="/demo" className="group flex items-center gap-2 text-xs font-medium text-[#53645c] hover:text-[#17241f]">
                Open the live demo
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="https://github.com/MustafaK99/Remy" target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-xs font-medium text-[#53645c] hover:text-[#17241f]">
                View source
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </aside>

        <article className="min-w-0 max-w-[860px]">
          <p className="font-mono text-[10px] text-[#767d77]">Remy · early WebMCP implementation</p>
          <h1 className="mt-5 max-w-[780px] text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
            Control, receipts, and recovery for agent actions.
          </h1>
          <p className="mt-6 max-w-[700px] text-base leading-7 text-[#667069]">
            This guide starts with the working Morrow repository, then explains
            the real engine contract and its current boundaries. Nothing here
            depends on unpublished packages.
          </p>

          <div className="mt-8 max-w-[700px]">
            <CodeLine value={cloneCommand} />
            <p className="mt-3 text-xs leading-5 text-[#7c837d]">
              The intended npm packages and one-call integration are roadmap
              items. For this release, clone and run the verified source.
            </p>
          </div>

          <DocSection id="solves" number="01" title="What Remy solves">
            <p>
              Agent products often choose between asking before every state
              change and granting opaque autonomy. Remy creates the middle:
              reversible work can run, consequential work pauses, and every
              meaningful attempt leaves a readable receipt.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Your application" detail="Owns business state, authentication, authorisation, eligibility, totals, and UI." />
              <DocRow name="Remy" detail="Validates, previews, applies policy, executes or pauses, journals, and exposes recovery." />
              <DocRow name="Adapter" detail="Exposes those semantic actions to WebMCP today; other runtimes are planned." />
            </div>
            <Callout tone="success">
              Remy is for applications where agents change real state. Read-only
              chatbots do not need this control layer.
            </Callout>
          </DocSection>

          <DocSection id="quickstart" number="02" title="Five-minute local quickstart">
            <p>Run these commands from a terminal with Node.js 20 or newer:</p>
            <CodeBlock value={localCommands} filename="Terminal" />
            <p className="mt-5">
              Open <InlineCode>http://localhost:3000/demo</InlineCode>. The shop
              works in every modern browser. WebMCP tool calls require a browser
              or evaluator that implements the imperative API.
            </p>
            <Callout>
              Do not run <InlineCode>npx @remy-ai/cli init</InlineCode>. The
              packages referenced by that prototype are not published.
            </Callout>
          </DocSection>

          <DocSection id="demo" number="03" title="Run the working demo">
            <p>
              Start clean with the always-visible <strong>Reset demo</strong>
              control. Select <strong>Reversible actions</strong>, then send the
              two prompts separately.
            </p>
            <div className="mt-6 space-y-3">
              <PromptLine label="First" value="Add Morrow One in Charcoal, choose express delivery, and apply HELLO10." />
              <PromptLine label="Then" value="Buy it." />
            </div>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Ask on changes" detail="Four state changes create four approval interruptions in this demo." />
              <DocRow name="Reversible actions" detail="The first three changes run automatically; the purchase creates one approval." />
              <DocRow name="Measured result" detail="75% fewer approval interruptions in this demo: four approvals become one." />
            </div>
            <Link href="/demo" className="group mt-6 inline-flex h-11 items-center gap-2 bg-[#17241f] px-4 text-sm font-medium text-white hover:bg-[#294238]">
              Open the Morrow demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </DocSection>

          <DocSection id="define" number="04" title="Define a semantic action">
            <p>
              Model the user-visible operation, not a click or raw request. The
              real Morrow action below declares strict input, risk, preview,
              execution, and exact recovery through the current
              <InlineCode>ActionDefinition</InlineCode> API.
            </p>
            <CodeBlock value={actionCode} filename="src/demo/actions.ts" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="inputSchema" detail="Runtime validation. Keep schemas strict and inputs compact." code />
              <DocRow name="preview" detail="Describe affected resources and before/after state without mutation." code />
              <DocRow name="execute" detail="Perform the authoritative application operation only after policy allows it." code />
              <DocRow name="undo / compensate" detail="Provide exactly one truthful recovery model when recovery exists." code />
            </div>
          </DocSection>

          <DocSection id="recovery" number="05" title="Choose the recovery model">
            <p>Recovery is a semantic contract, not a generic Undo button.</p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Exact undo" detail="Restore an earlier value after a resource-version check. Example: express delivery back to standard." />
              <DocRow name="Compensation" detail="Perform a new corrective action. Example: cancel a booking that already exists." />
              <DocRow name="Irreversible" detail="Expose no false reversal. Example: placing an order and charging a payment method." />
            </div>
            <Callout tone="success">
              Recovery never deletes history. The original receipt remains and
              a new receipt links back with <InlineCode>reversesReceiptId</InlineCode>.
            </Callout>
          </DocSection>

          <DocSection id="policy" number="06" title="Apply an autonomy policy">
            <p>
              The engine combines the developer&apos;s action definition with the
              user&apos;s current control setting. An assistant may request more
              access, but the person must approve any escalation.
            </p>
            <div className="mt-6 overflow-x-auto border-y border-[#17241f]/12">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#7a817b]">
                  <tr>
                    <th className="py-3 pr-4 font-medium">User mode</th>
                    <th className="py-3 pr-4 font-medium">Exact reversal</th>
                    <th className="py-3 font-medium">Irreversible action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17241f]/10">
                  <PolicyRow mode="Preview only" reversible="Preview" consequential="Preview" />
                  <PolicyRow mode="Ask on changes" reversible="Ask" consequential="Ask" />
                  <PolicyRow mode="Reversible actions" reversible="Run" consequential="Ask" />
                  <PolicyRow mode="Trusted run" reversible="Run" consequential="Developer policy" />
                </tbody>
              </table>
            </div>
            <Callout>
              In the demo, unattended purchases require Trusted run plus a
              separate user-granted purchase setting. They are never implied by
              selecting Reversible actions.
            </Callout>
          </DocSection>

          <DocSection id="webmcp" number="07" title="Expose actions through WebMCP">
            <p>
              The current hook feature-detects <InlineCode>document.modelContext</InlineCode>,
              registers tools once, validates input through each action schema,
              and unregisters them with an <InlineCode>AbortSignal</InlineCode>.
            </p>
            <CodeBlock value={bridgeCode} filename="Client component" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="get_remy_status" detail="Detect Remy and read current user controls." code />
              <DocRow name="identify_assistant" detail="Set self-reported attribution; never grants authorisation." code />
              <DocRow name="request_remy_controls" detail="Restrictions apply immediately; increased access waits for the user." code />
              <DocRow name="get_action_history" detail="Return concise action receipts, not prompts or browsing history." code />
              <DocRow name="revert_action" detail="Request version-safe recovery by receipt ID." code />
            </div>
            <Callout tone="warning">
              Current limitation: this adapter is coupled to Morrow&apos;s
              <InlineCode>DemoState</InlineCode>. A generic packaged adapter is
              on the roadmap and is not presented as shipped.
            </Callout>
          </DocSection>

          <DocSection id="ui" number="08" title="Embed the Action Center">
            <p>
              Remy&apos;s engine is headless. The Morrow drawer is one example of a
              control surface; applications may use a drawer, account page,
              inline approval, toast, or no Remy-branded UI.
            </p>
            <CodeBlock value={uiCode} filename="Demo workspace" />
            <p className="mt-5">
              The panel can open and close without covering the application on
              desktop. When hidden, its dock still reports waiting approvals and
              new agent changes. Ordinary site controls remain usable.
            </p>
          </DocSection>

          <DocSection id="testing" number="09" title="Test approvals and reversals">
            <p>Run the focused engine tests and then the full release checks:</p>
            <CodeBlock value={`npm run test:run
npm run lint
npm run typecheck
npm run build`} filename="Terminal" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Approval" detail="The order remains unplaced until its explicit approval executes." />
              <DocRow name="Stale approval" detail="Changing a referenced resource invalidates an old purchase preview." />
              <DocRow name="Exact reversal" detail="The prior value returns and a linked receipt is appended." />
              <DocRow name="Version conflict" detail="Undo fails closed if a later change makes the inverse unsafe." />
              <DocRow name="Idempotency" detail="Repeating the same key does not repeat the effect." />
            </div>
          </DocSection>

          <DocSection id="security" number="10" title="Production security checklist">
            <p>
              Remy&apos;s policy UI is not a substitute for enforcement at the
              system that owns the data or side effect.
            </p>
            <Checklist
              items={[
                "Authenticate and authorise every real state-changing endpoint on the server.",
                "Recompute prices, eligibility, and resource versions from authoritative application state.",
                "Use strict runtime schemas and explicitly allowlist or redact receipt input.",
                "Keep secrets, credentials, payment details, prompts, transcripts, and arbitrary state out of receipts.",
                "Protect cookie-authenticated writes against CSRF and rate-limit abuse-prone actions.",
                "Use idempotency at the real side-effect boundary, not only in browser memory.",
                "Fail closed when approval context or resource versions are stale.",
                "Set retention and deletion policy before connecting durable storage.",
                "Use production builds, HTTPS, and appropriate security headers at the deployment edge.",
              ]}
            />
            <Callout tone="warning">
              The demo stores fictional state and receipts in local storage.
              Local storage is inspectable and mutable; it is not an audit-grade
              or tamper-resistant journal.
            </Callout>
          </DocSection>

          <DocSection id="api" number="11" title="Current API reference">
            <p>
              These are the source APIs exercised by the repository today. They
              are not yet versioned npm package exports.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="new RemyEngine(store, options)" detail="Create the protocol-neutral action engine." code />
              <DocRow name="engine.register(action)" detail="Register one ActionDefinition; duplicate names throw." code />
              <DocRow name="engine.run(name, input, meta)" detail="Validate, preview, decide policy, and execute or pause." code />
              <DocRow name="engine.approve(actionId)" detail="Recheck resource versions before executing a waiting action." code />
              <DocRow name="engine.reject(actionId)" detail="Append a rejection without changing application state." code />
              <DocRow name="engine.revert(actionId, meta)" detail="Perform exact undo or compensation and append a linked receipt." code />
              <DocRow name="engine.getSnapshot()" detail="Read state, receipts, events, controls, agent identity, and pending access request." code />
              <DocRow name="summarizeActionRun(receipts)" detail="Count state-changing actions, automatic execution, approvals, recovery, and unresolved outcomes." code />
            </div>
            <CodeBlock value={completeExample} filename="Complete in-repository example" />
            <Callout>
              Read <a href="https://github.com/MustafaK99/Remy/blob/master/ROADMAP.md" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">ROADMAP.md</a> for the planned package split and adapter API. Future syntax is not shown here as current code.
            </Callout>
          </DocSection>

          <DocSection id="troubleshooting" number="12" title="Troubleshooting">
            <div className="border-t border-[#17241f]/12">
              <DocRow name="WebMCP unavailable" detail="Use a browser or evaluator with the imperative API. The normal shop should remain usable." />
              <DocRow name="No tools appear" detail="Open /demo, wait for WebMCP tools ready, and verify document.modelContext.registerTool exists." />
              <DocRow name="Approval is out of date" detail="Application state changed after preview. Ask the assistant to prepare the purchase again." />
              <DocRow name="Undo is blocked" detail="A later resource version conflicts with the original receipt; recover manually or define compensation." />
              <DocRow name="Old demo state remains" detail="Use Reset demo. It clears state, receipts, approvals, controls, and assistant identity." />
              <DocRow name="CLI install fails" detail="Expected for this release. Clone the repository; published packages are roadmap work." />
            </div>
          </DocSection>

          <div className="mt-16 flex flex-col justify-between gap-6 border-t border-[#17241f]/12 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Agents can act now. Remy lets them ask less—and gives users a way back.</p>
              <p className="mt-1 text-sm text-[#747c76]">The Morrow shop uses fictional data and creates no real payment.</p>
            </div>
            <Link href="/demo" className="group inline-flex h-11 w-fit items-center gap-2 bg-[#17241f] px-4 text-sm font-medium text-white hover:bg-[#294238]">
              Open the live demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}

function DocSection({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-16 scroll-mt-8 border-t border-[#17241f]/12 pt-10">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[9px] text-[#d95839]">{number}</span>
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
      </div>
      <div className="mt-5 max-w-[760px] text-sm leading-6 text-[#68716b]">{children}</div>
    </section>
  );
}

function CodeLine({ value }: { value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border border-[#17241f] bg-[#111714] p-2 pl-4 text-white">
      <code className="min-w-0 truncate font-mono text-xs sm:text-sm"><span className="mr-3 text-[#e66749]">$</span>{value}</code>
      <CopyButton value={value} tone="dark" />
    </div>
  );
}

function PromptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#17241f]/14 bg-[#ebe6dc] p-2 pl-4">
      <p className="min-w-0 text-xs"><span className="mr-3 font-mono text-[9px] uppercase text-[#8a6a5e]">{label}</span>{value}</p>
      <CopyButton value={value} label="Copy" />
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
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-5 text-white/72 sm:p-5 sm:text-xs"><code>{value}</code></pre>
    </div>
  );
}

function DocRow({ name, detail, code = false }: { name: string; detail: string; code?: boolean }) {
  return (
    <div className="grid gap-2 border-b border-[#17241f]/12 py-4 sm:grid-cols-[210px_1fr]">
      {code ? <code className="font-mono text-[11px] font-medium text-[#32483f]">{name}</code> : <span className="text-sm font-medium text-[#304139]">{name}</span>}
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

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 divide-y divide-[#17241f]/10 border-y border-[#17241f]/12">
      {items.map((item) => (
        <li key={item} className="flex gap-3 py-3"><Check className="mt-1 size-3.5 shrink-0 text-[#28735b]" /><span>{item}</span></li>
      ))}
    </ul>
  );
}

function Callout({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const isSuccess = tone === "success";
  const isWarning = tone === "warning";
  return (
    <div className={`mt-6 flex gap-3 border p-4 text-xs leading-5 ${isSuccess ? "border-[#6da585]/30 bg-[#dfebe3] text-[#345c49]" : isWarning ? "border-[#c7795f]/30 bg-[#f1ddd5] text-[#754735]" : "border-[#17241f]/12 bg-[#ebe6dc] text-[#5f6b64]"}`}>
      {isSuccess ? <Check className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}
      <p>{children}</p>
    </div>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="mx-1 bg-[#17241f]/6 px-1.5 py-0.5 font-mono text-[11px] text-[#3c4e45]">{children}</code>;
}
