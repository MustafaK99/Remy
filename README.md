# Remy

**Control, receipts, and recovery for AI agent actions.**

Let reversible work happen automatically.

Pause what matters.

Give users a way back.

Remy is an open-source TypeScript action layer for developers building agents
into applications. Wrap an existing function once; Remy applies policy,
requests approval when needed, records a readable receipt, and exposes the
truthful recovery path. Your application keeps its state, authentication,
authorisation, business logic, and UI.

```text
4 changes
3 automatic
1 consequential approval
75% fewer interruptions in this demo
```

That result is specific to the Morrow journey. **Ask on changes** interrupts
four times. **Reversible actions** runs the three recoverable changes and pauses
the purchase once.

![The Morrow shop with Remy's Action Center open](./public/images/remy-demo.png)

> **Status:** reusable TypeScript alpha with a working WebMCP adapter. Public
> npm packages and a one-call installer are not published. See the
> [roadmap](./ROADMAP.md).

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev
```

Open:

- Product site: [http://localhost:3000](http://localhost:3000)
- Morrow demo: [http://localhost:3000/demo](http://localhost:3000/demo)
- Documentation: [http://localhost:3000/docs](http://localhost:3000/docs)

Every command above is verified from a clean checkout. Do not use
`npx @remy-ai/cli init`; those packages do not exist yet.

## Define once

The context is an adapter to functions and services the host already owns.
Input, output, and private recovery data are inferred from one definition.

```ts
const renameDocument = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Change the title of the open document.",
  kind: "write",
  input: z.strictObject({ title: z.string().trim().min(1).max(120) }),
  risk: "low",
  preview: ({ input, context }) => ({
    summary: `Rename the document to “${input.title}”.`,
    resources: ["document:title"],
    changes: [{
      label: "Document title",
      before: context.getTitle(),
      after: input.title,
    }],
    recovery: { previousTitle: context.getTitle() },
  }),
  execute: async ({ input, context }) => {
    await context.setTitle(input.title);
    return succeed({ title: context.getTitle() });
  },
  recovery: {
    kind: "exact",
    execute: async ({ receipt, context }) => {
      await context.setTitle(receipt.recovery.previousTitle);
      return succeed({ title: context.getTitle() });
    },
  },
});

remy.register(renameDocument);
await remy.run(renameDocument, { title: "Launch notes" });
```

See the complete, compilable [document example](./examples/minimal.ts) and the
[progressive documentation](./src/app/docs/page.tsx).

## What works in this alpha

- `defineAction()` with Standard Schema V1 input and full TypeScript inference.
- Read, exactly recoverable, compensating, and irreversible action definitions.
- Discriminated operational results with early configuration failures.
- Replaceable policy plus preview, ask, reversible, and trusted presets.
- Generic capabilities/grants; the core knows nothing about purchases.
- Approval, stale-preview checks, resource-version-safe recovery, and idempotency.
- Schema-versioned, append-only semantic receipts and journal events.
- Memory and safe, namespaced browser journal stores.
- Headless, generic WebMCP registration and complete abort cleanup.
- A small `useRemySnapshot(remy)` React external-store hook.
- Per-call run/task IDs and explicit principal assurance.
- The existing Morrow shopping journey and manual website controls.

WebMCP is the first adapter, not the product boundary. MCP and agent-framework
adapters are planned, not claimed as shipped.

## Architecture

```text
Application functions and services
              ↓
       Semantic actions
              ↓
    Protocol-neutral Remy core
              ↓
   WebMCP / future adapters
              ↓
 React hooks / optional UI / journal stores
```

- `src/remy/core` imports no React, Next.js, WebMCP, or demo code.
- `src/remy/adapters/webmcp.ts` uses only public core contracts.
- `src/remy/react` contains generic React primitives only.
- `src/demo` owns Morrow state, persistence, policy configuration, and actions.
- `src/components/demo` is optional example UI, not an imposed design system.

These boundaries are enforced by tests. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
for the dependency rules, execution sequence, and package extraction path.

## Persistence and privacy

Remy does not persist complete application state. The demo stores its small
fictional shop state separately from Remy's journal.

Durable receipts contain bounded semantic data: schema and action versions,
receipt/run/task IDs, actor and principal assurance, transport, policy outcome,
summary, allowlisted changes, resource versions, status, timestamps, duration,
error code, idempotency key, and recovery links.

Raw input, output, pending execution data, and private recovery material stay
in memory by default. Remy does not store prompts, transcripts, keystrokes,
browsing, DOM recordings, secrets, payment details, arbitrary state, or binary
payloads. A durable recovery integration must serialize and redact its own
minimal recovery material explicitly.

Browser storage is versioned and validated on restore. Corrupt, incompatible,
unavailable, or quota-limited storage fails safely. It is still inspectable
local demo storage—not a tamper-proof audit journal.

## Record the WebMCP demo

1. Open `/demo` in a browser with the imperative WebMCP API.
2. Use **Reset demo**, then briefly compare **Ask on changes** with
   **Reversible actions**.
3. Ask: `Add Morrow One in Charcoal, choose express delivery, and apply HELLO10.`
4. Show the three automatic agent actions in Remy's activity drawer.
5. Restore express delivery to standard and show the linked recovery receipt.
6. Ask: `Buy it.`
7. Approve the explicit **Approve £115 purchase** request.
8. Show order confirmation.

Manual shop interactions remain available but are not shown in the end-user
agent-activity feed. `summarizeActionRun()` remains a developer-facing,
action-only utility; it is not rendered as end-user analytics.

Unsupported browsers receive a compatibility message without breaking the
ordinary shop.

## Security boundary

- The owning server or service must authenticate and authorise every real
  state change and recompute authoritative values.
- Self-reported WebMCP identity is attribution only, never authority.
- Higher access requested through WebMCP waits for the person.
- Stale approvals and unsafe exact recovery fail closed.
- Idempotency must also exist at the durable side-effect boundary in production.
- Receipt allowlists and storage retention are application responsibilities.

Read [SECURITY.md](./SECURITY.md) before a production integration.

## Verify

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

GitHub Actions runs the same sequence after a clean `npm ci`.

## Project links

- [Documentation](./src/app/docs/page.tsx)
- [Architecture](./ARCHITECTURE.md)
- [Roadmap](./ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)
- [MIT licence](./LICENSE)

## License

[MIT](./LICENSE) — Copyright (c) 2026 Remy contributors.
