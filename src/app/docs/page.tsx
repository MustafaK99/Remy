import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Define typed Remy actions, apply policy and recovery, and expose them through WebMCP.",
};

const localCommands = `git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev`;

const quickstartCode = `const remy = createRemy({ context: () => documentService })

const renameDocument = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Change the open document title.",
  kind: "write",
  input: z.strictObject({ title: z.string().min(1).max(120) }),
  risk: "low",
  preview: previewRename,
  execute: renameWithExistingService,
  recovery: { kind: "exact", execute: restorePreviousTitle },
})

remy.register(renameDocument)
await registerWebMCP(remy, { signal })`;

const minimalAction = `import { z } from "zod"
import { createRemy, succeed } from "@/remy/core"

const remy = createRemy({
  context: () => documentService,
})

const renameDocument = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Change the open document title.",
  kind: "write",
  input: z.strictObject({
    title: z.string().trim().min(1).max(120),
  }),
  risk: "low",
  preview: ({ input, context }) => ({
    summary: \`Rename the document to “\${input.title}”.\`,
    resources: ["document:title"],
    changes: [{
      label: "Document title",
      before: context.getTitle(),
      after: input.title,
    }],
    recovery: { previousTitle: context.getTitle() },
  }),
  execute: async ({ input, context }) => {
    await context.setTitle(input.title)
    return succeed({ title: context.getTitle() })
  },
  recovery: {
    kind: "exact",
    execute: async ({ receipt, context }) => {
      await context.setTitle(receipt.recovery.previousTitle)
      return succeed({ title: context.getTitle() })
    },
  },
})

remy.register(renameDocument)`;

const typedRun = `const result = await remy.run(
  renameDocument,
  { title: "Launch notes" },
  {
    actor: "agent",
    transport: "webmcp",
    runId: "run-42",
    taskId: "edit-launch-doc",
  },
)

if (!result.ok) {
  console.error(result.code, result.error)
}`;

const policyCode = `import type { Policy } from "@/remy/core"

export const documentPolicy: Policy = ({ action, controls }) => {
  if (controls.paused) {
    return { outcome: "deny", reason: "Agent changes are paused." }
  }
  const missingGrant = action.requiredGrants.find(
    (grant) => !controls.grants.includes(grant),
  )
  if (missingGrant) {
    return { outcome: "require_approval", reason: "A grant is missing." }
  }
  return { outcome: "allow", reason: "Application policy allows it." }
}`;

const compensationCode = `recovery: {
  kind: "compensating",
  execute: async ({ output, context }) => {
    const cancellation = await context.cancelBooking(output.id)
    return cancellation.ok
      ? succeed({ bookingId: output.id, cancelled: true })
      : fail("CANCEL_FAILED", cancellation.message)
  },
}`;

const irreversibleCode = `const publishDocument = remy.defineAction({
  name: "publish_document",
  title: "Publish document",
  description: "Publish the current document publicly.",
  kind: "write",
  input: z.strictObject({}),
  risk: "high",
  approval: "always",
  preview: () => ({
    summary: "Publish this document publicly.",
    changes: [{ label: "Visibility", before: "Draft", after: "Public" }],
  }),
  execute: async ({ context }) => succeed(await context.publishDocument()),
  recovery: { kind: "irreversible" },
})`;

const webMcpCode = `import { registerWebMCP } from "@/remy/adapters/webmcp"

const lifecycle = new AbortController()
const registration = await registerWebMCP(remy, {
  signal: lifecycle.signal,
})

if (registration.status === "partial") {
  console.error(registration.failures)
}

// Unregister every tool when this integration unmounts.
lifecycle.abort()`;

const reactCode = `"use client"

import type { RemyClient } from "@/remy/core"
import { useRemySnapshot } from "@/remy/react"

export function AgentActivity({
  remy,
}: {
  readonly remy: RemyClient<unknown>
}) {
  const snapshot = useRemySnapshot(remy)
  const agentReceipts = snapshot.receipts.filter(
    (receipt) => receipt.actor === "agent" || receipt.reversesReceiptId,
  )

  return (
    <ol aria-label="Agent activity">
      {agentReceipts.map((receipt) => (
        <li key={receipt.id}>
          {receipt.summary} — {receipt.status}
        </li>
      ))}
    </ol>
  )
}`;

const navigation = [
  ["Introduction", "#introduction"],
  ["Five-minute quickstart", "#quickstart"],
  ["Core concepts", "#concepts"],
  ["Define an action", "#define"],
  ["Policy and capabilities", "#policy"],
  ["Exact recovery", "#exact"],
  ["Compensation", "#compensation"],
  ["Irreversible actions", "#irreversible"],
  ["WebMCP adapter", "#webmcp"],
  ["React integration", "#react"],
  ["Persistence and privacy", "#persistence"],
  ["Testing", "#testing"],
  ["Production checklist", "#security"],
  ["API reference", "#api"],
  ["Troubleshooting", "#troubleshooting"],
  ["Roadmap and versioning", "#roadmap"],
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#17241f]">
      <SiteHeader tone="paper" />

      <div className="mx-auto grid max-w-[1380px] border-x border-[#17241f]/10 px-5 py-14 sm:px-8 lg:grid-cols-[220px_minmax(0,860px)] lg:justify-center lg:gap-16 lg:px-12 lg:py-20">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#8a8e88]">
              Alpha documentation
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
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#d95839]">
            Open-source TypeScript alpha · WebMCP today
          </p>
          <h1 className="mt-5 max-w-[780px] text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
            Add control and recovery to actions—not model responses.
          </h1>
          <p className="mt-6 max-w-[700px] text-base leading-7 text-[#667069]">
            Define an application action once. Remy adds policy, approval,
            receipts, and recovery, then exposes it through WebMCP today and
            other adapters later.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#quickstart" className="inline-flex h-11 items-center gap-2 bg-[#17241f] px-4 text-sm font-medium text-white hover:bg-[#294238]">
              Start locally <ArrowRight className="size-4" />
            </Link>
            <a href="https://github.com/MustafaK99/Remy/blob/master/examples/minimal.ts" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 border border-[#17241f]/20 px-4 text-sm font-medium hover:border-[#17241f]/45">
              Complete example <ArrowRight className="size-4" />
            </a>
          </div>

          <DocSection id="introduction" number="01" title="Introduction">
            <p>
              Remy wraps the functions and services an application already
              uses. Your application continues to own its data, authentication,
              authorisation, editor history, side effects, and interface.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Safe work" detail="Low-risk, recoverable actions can run without an interruption." />
              <DocRow name="Consequential work" detail="Policy pauses the action and returns an explicit approval state." />
              <DocRow name="After execution" detail="A bounded semantic receipt explains what changed and how it can be recovered." />
            </div>
            <Callout tone="success">
              Remy controls state-changing actions. It does not record prompts,
              browse the DOM, or govern model responses.
            </Callout>
          </DocSection>

          <DocSection id="quickstart" number="02" title="Five-minute quickstart">
            <p>
              Packages are not published yet. Run the verified source with
              Node.js 20 or newer:
            </p>
            <CodeBlock value={localCommands} filename="Terminal" />
            <p className="mt-5">
              Open <InlineCode>http://localhost:3000/demo</InlineCode>. Then read
              the complete, compilable <a href="https://github.com/MustafaK99/Remy/blob/master/examples/minimal.ts" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">document example</a>.
              The whole setup is this shape:
            </p>
            <CodeBlock value={quickstartCode} filename="Five-minute shape" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Run" detail="Clone the alpha source; no package install is claimed yet." />
              <DocRow name="Define" detail="Pass one schema and wrap existing preview, execute, and recovery functions." />
              <DocRow name="Expose" detail="registerWebMCP creates imperative tools and uses the same runtime validation." />
              <DocRow name="Approve" detail="A paused run returns awaiting_approval; render that receipt in your own UI." />
              <DocRow name="Recover" detail="Exact or compensating handlers receive typed recovery data and execution output." />
              <DocRow name="Enforce" detail="Keep authentication, authorisation, and side effects authoritative in the host service." />
            </div>
            <Callout>
              Do not run <InlineCode>npx @remy-ai/cli init</InlineCode>. The
              one-call install and public packages are planned, not shipped.
            </Callout>
          </DocSection>

          <DocSection id="concepts" number="03" title="Core concepts">
            <div className="border-t border-[#17241f]/12">
              <DocRow name="Application context" detail="A function returning your existing services. Remy never owns application state." />
              <DocRow name="Action" detail="A typed semantic operation with input, preview, execution, risk, and truthful recovery." />
              <DocRow name="Policy" detail="A replaceable function that allows, stages, denies, or asks for approval." />
              <DocRow name="Receipt" detail="A bounded, human-readable record of the decision and state change." />
              <DocRow name="Journal" detail="Append-only receipt and event persistence, independent from application persistence." />
              <DocRow name="Adapter" detail="A protocol translator. It exposes actions but does not contain business policy." />
            </div>
          </DocSection>

          <DocSection id="define" number="04" title="Define an action">
            <p>
              Call <InlineCode>remy.defineAction()</InlineCode> so the context,
              schema input, execution output, and recovery material are inferred.
              Pass one Standard Schema V1 validator. Zod 4 provides runtime
              validation and WebMCP JSON Schema from that same object.
            </p>
            <CodeBlock value={minimalAction} filename="examples/minimal.ts (abridged)" />
            <CodeBlock value={typedRun} filename="Run with inferred input and output" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="input" detail="One strict schema. Use jsonSchema only when the validator cannot expose a representable schema." code />
              <DocRow name="preview" detail="Describe bounded resources and human-readable changes without mutating state." code />
              <DocRow name="execute" detail="Call the existing application function and return succeed(value) or fail(code, message)." code />
              <DocRow name="redactInput" detail="Explicitly allowlist compact receipt fields; raw input is private by default." code />
              <DocRow name="exposeOutput" detail="Explicitly select the JSON-safe output returned through protocol adapters." code />
            </div>
            <Callout tone="warning">
              Authentication, authorisation, prices, permissions, and durable
              idempotency must still be enforced by the authoritative server.
            </Callout>
          </DocSection>

          <DocSection id="policy" number="05" title="Policy and capabilities">
            <p>
              Built-in preview, ask, reversible, and trusted modes are presets.
              Supply a custom policy when the application needs different rules.
              Capabilities are generic strings such as
              <InlineCode>documents.publish</InlineCode> or
              <InlineCode>commerce.purchase</InlineCode>.
            </p>
            <CodeBlock value={policyCode} filename="Custom policy" />
            <p className="mt-5">
              Agent principals include an assurance level. The WebMCP identity
              tool creates <InlineCode>self-reported</InlineCode> attribution and
              never grants authority. Authenticated or verified principals must
              come from a trusted host integration.
            </p>
            <p className="mt-4 text-xs">
              Compilable source: <a href="https://github.com/MustafaK99/Remy/blob/master/examples/policy.ts" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">examples/policy.ts</a>
            </p>
          </DocSection>

          <DocSection id="exact" number="06" title="Exact recovery">
            <p>
              Exact recovery restores the previous state. The preview returns
              typed private recovery material; the recovery handler consumes it.
              Remy checks declared resource versions first and appends a linked
              receipt instead of deleting the original.
            </p>
            <Callout tone="success">
              In an editor, a native history token can be the recovery material.
              The host editor still owns and validates that history.
            </Callout>
          </DocSection>

          <DocSection id="compensation" number="07" title="Compensation">
            <p>
              Some effects cannot be rewound. A compensating recovery performs a
              new corrective action, such as cancelling a booking.
            </p>
            <CodeBlock value={compensationCode} filename="Compensating recovery" />
            <p className="mt-5">
              Label this as cancellation or compensation in the interface—not
              “undo.” Both the original and corrective receipts remain visible.
            </p>
            <p className="mt-4 text-xs">
              Compilable source: <a href="https://github.com/MustafaK99/Remy/blob/master/examples/action-variants.ts" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">examples/action-variants.ts</a>
            </p>
          </DocSection>

          <DocSection id="irreversible" number="08" title="Irreversible actions">
            <p>
              Irreversible definitions expose no recovery handler. TypeScript
              rejects a fake undo on this branch of the action union. Use an
              explicit approval for genuinely consequential work.
            </p>
            <CodeBlock value={irreversibleCode} filename="Irreversible action" />
            <p className="mt-4 text-xs">
              Compilable source: <a href="https://github.com/MustafaK99/Remy/blob/master/examples/action-variants.ts" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">examples/action-variants.ts</a>
            </p>
          </DocSection>

          <DocSection id="webmcp" number="09" title="WebMCP adapter">
            <p>
              The headless adapter imports only public core contracts. It feature
              detects <InlineCode>document.modelContext</InlineCode>, converts the
              action schema, registers each tool once, validates input again at
              execution, and reports partial registration failures.
            </p>
            <CodeBlock value={webMcpCode} filename="Headless registration" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="get_remy_status" detail="Read controls and attribution without changing application state." code />
              <DocRow name="identify_assistant" detail="Attach self-reported identity for receipts; never authorisation." code />
              <DocRow name="request_remy_controls" detail="Restrictions apply; requests for more authority wait for the person." code />
              <DocRow name="get_action_history" detail="Return compact agent-action receipts, not browsing or transcripts." code />
              <DocRow name="revert_action" detail="Request version-safe exact or compensating recovery." code />
            </div>
            <Callout>
              Unsupported browsers return <InlineCode>unsupported</InlineCode>.
              The application and manual controls continue to work normally.
            </Callout>
          </DocSection>

          <DocSection id="react" number="10" title="React integration">
            <p>
              React is optional. <InlineCode>useRemySnapshot(remy)</InlineCode>
              uses the engine as a proper external store with stable subscriptions
              and referentially stable snapshots. Build any accessible approval
              surface your product needs.
            </p>
            <CodeBlock value={reactCode} filename="Client component" />
            <p className="mt-5">
              The Morrow drawer is demo UI, not a required Remy design. Agent
              activity excludes ordinary user clicks; developer run summaries
              belong in developer tooling, not the end-user action panel.
            </p>
            <p className="mt-4 text-xs">
              Compilable source: <a href="https://github.com/MustafaK99/Remy/blob/master/examples/react-action-center.tsx" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">examples/react-action-center.tsx</a>
            </p>
          </DocSection>

          <DocSection id="persistence" number="11" title="Persistence and privacy">
            <p>
              The application and Remy have separate persistence boundaries.
              Remy stores schema-versioned semantic receipts and journal events;
              the Morrow demo stores its fictional shop state separately.
            </p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Stored" detail="Action/version, IDs, bounded actor, decision, summary, allowlisted changes, resource versions, status, time, duration, error code, and recovery links." />
              <DocRow name="Private in memory" detail="Validated input, execution output, pending execution data, and recovery material." />
              <DocRow name="Never by default" detail="Application state, raw input/output, prompts, transcripts, DOM recordings, secrets, payment details, or binary payloads." />
            </div>
            <p className="mt-5">
              Use <InlineCode>createMemoryJournalStore()</InlineCode> or the safe,
              namespaced <InlineCode>createBrowserJournalStore()</InlineCode>.
              Browser restore validates version 1 data and fails closed on corrupt
              or incompatible payloads. Durable recovery needs an explicit,
              redacted application serializer in a future store integration.
            </p>
          </DocSection>

          <DocSection id="testing" number="12" title="Testing">
            <p>Run the same checks used in CI:</p>
            <CodeBlock value={`npm run lint
npm run typecheck
npm run test:run
npm run build`} filename="Terminal" />
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="Types" detail="Check inferred input/output and invalid recovery combinations with @ts-expect-error assertions." />
              <DocRow name="Policy" detail="Test allow, stage, deny, approvals, capabilities, and custom policy injection." />
              <DocRow name="State safety" detail="Test stale approvals, version conflicts, idempotency, linked recovery, and safe restoration." />
              <DocRow name="Adapters" detail="Register a non-commerce action, execute it, and abort every registration during cleanup." />
            </div>
          </DocSection>

          <DocSection id="security" number="13" title="Production checklist">
            <Checklist
              items={[
                "Authenticate and authorise each state-changing operation at the server or owning service.",
                "Recompute totals, eligibility, permissions, and versions from authoritative state.",
                "Use strict schemas and allowlist only receipt fields safe for operators and users.",
                "Keep credentials, payment details, prompts, transcripts, and application snapshots out of the journal.",
                "Apply CSRF protection to cookie-authenticated writes and rate-limit abuse-prone operations.",
                "Enforce idempotency at the real side-effect boundary, not only inside a browser tab.",
                "Fail closed when approval context, recovery material, or resource versions are stale.",
                "Set retention, export, and deletion rules before connecting durable storage.",
                "Treat self-reported WebMCP identity as attribution only.",
              ]}
            />
          </DocSection>

          <DocSection id="api" number="14" title="API reference">
            <p>These alpha exports are curated from <InlineCode>@/remy/core</InlineCode> in this repository.</p>
            <div className="mt-6 border-t border-[#17241f]/12">
              <DocRow name="createRemy(options)" detail="Create a generic client around a host-owned context, policy, resources, and journal." code />
              <DocRow name="remy.defineAction(definition)" detail="Infer context, input, output, and recovery types and validate configuration early." code />
              <DocRow name="remy.register(action)" detail="Register one definition. Duplicate action names throw an actionable error." code />
              <DocRow name="remy.run(action, input, meta?)" detail="Typed application execution. Input and success output follow the action." code />
              <DocRow name="remy.runByName(name, unknown, meta?)" detail="Runtime-validated string dispatch for protocol adapters." code />
              <DocRow name="remy.approve(id) / reject(id)" detail="Resolve staged or waiting work after validating its current state." code />
              <DocRow name="remy.revert(id, meta?)" detail="Run exact or compensating recovery and append a linked receipt." code />
              <DocRow name="registerWebMCP(remy, options?)" detail="Register generic tools and return ready, partial, unsupported, or error status." code />
              <DocRow name="useRemySnapshot(remy)" detail="Subscribe to cached external-store snapshots from a client component." code />
              <DocRow name="summarizeActionRun(receipts)" detail="Derive action-only developer metrics; it is not required end-user UI." code />
            </div>
          </DocSection>

          <DocSection id="troubleshooting" number="15" title="Troubleshooting">
            <div className="border-t border-[#17241f]/12">
              <DocRow name="WebMCP unsupported" detail="The browser does not expose document.modelContext. Manual application use should still work." />
              <DocRow name="Schema registration failed" detail="Use a Standard Schema implementation with JSON Schema support or pass a restrictive jsonSchema override." />
              <DocRow name="ACTION_NOT_REGISTERED" detail="Call remy.register(action), then pass that same action object to remy.run()." />
              <DocRow name="STALE_APPROVAL" detail="A referenced resource changed after preview. Prepare the action again." />
              <DocRow name="VERSION_CONFLICT" detail="Later state makes exact recovery unsafe. Use an application-specific corrective path." />
              <DocRow name="RECOVERY_DATA_UNAVAILABLE" detail="Private recovery material is not persisted by default. Prepare a corrective action after reload." />
              <DocRow name="CLI install fails" detail="Expected in this alpha. Clone the repository; public packages are roadmap work." />
            </div>
          </DocSection>

          <DocSection id="roadmap" number="16" title="Roadmap and versioning">
            <p>
              Receipts carry <InlineCode>schemaVersion: 1</InlineCode>; action
              definitions have their own version. The source API is alpha and may
              still change before the packages are published. The boundary is
              intentionally stable: host services → semantic actions → Remy core
              → adapters and optional UI.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="https://github.com/MustafaK99/Remy/blob/master/ARCHITECTURE.md" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">Architecture</a>
              <a href="https://github.com/MustafaK99/Remy/blob/master/ROADMAP.md" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">Roadmap</a>
              <a href="https://github.com/MustafaK99/Remy/blob/master/SECURITY.md" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">Security policy</a>
            </div>
          </DocSection>

          <div className="mt-16 flex flex-col justify-between gap-6 border-t border-[#17241f]/12 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Ship agents users aren&apos;t afraid to trust.</p>
              <p className="mt-1 text-sm text-[#747c76]">Try policy, approval, receipts, and recovery in the Morrow demo.</p>
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
    <div className="grid gap-2 border-b border-[#17241f]/12 py-4 sm:grid-cols-[220px_1fr]">
      {code ? <code className="font-mono text-[11px] font-medium text-[#32483f]">{name}</code> : <span className="text-sm font-medium text-[#304139]">{name}</span>}
      <span className="text-sm leading-6 text-[#717a74]">{detail}</span>
    </div>
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
