# Remy

**Control, receipts and recovery for AI agent actions.**

Remy is an open-source TypeScript SDK that wraps the functions an AI agent can call in your application. Recoverable work can run automatically, consequential work can wait for approval, and every change leaves a readable receipt and recovery path.

[Run the live demo locally](#five-minute-local-quick-start) · [Documentation](./src/app/docs/page.tsx) · [WebMCP adapter](./packages/webmcp/src/index.ts) · [![MIT licence](https://img.shields.io/badge/licence-MIT-171713.svg)](./LICENSE)

> **Public alpha:** WebMCP support works from this repository today. The `@remy-ai` packages are built and verified as tarballs, but are not published to npm yet.

## Why Remy exists

Agent-enabled applications usually force a poor choice: interrupt the user for every state change, or give the agent broad authority and inspect the result later. Remy provides the middle ground. Application policy can let recoverable work run, pause consequential actions, and retain an append-only record of every outcome.

## What it does

- Applies preview, ask, reversible, or trusted autonomy policy to agent actions.
- Shows explicit approvals with human-readable before-and-after changes.
- Records bounded receipts without prompts, transcripts, DOM recordings, or application state.
- Supports exact undo, compensating recovery, and explicitly irreversible actions.
- Exposes the same registered actions through WebMCP.
- Leaves authentication, authorisation, state, and business logic with the host application.

## Five-minute local quick start

Requirements: Node.js 20 or later and npm 10 or later. No environment variables or local services are required.

```bash
git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the product site, [http://localhost:3000/demo](http://localhost:3000/demo) for the return demo, or [http://localhost:3000/demo?judge=1](http://localhost:3000/demo?judge=1) for concise evaluator instructions.

Cloning is the judge and contributor path today. Library users will install the scoped packages after they are published; the README does not advertise an npm command that currently returns 404.

## Minimal integration

This example uses the real workspace API and Zod 4 as its Standard Schema validator. The complete typechecked source is [examples/minimal.ts](./examples/minimal.ts).

```ts
import { createRemy, succeed } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";
import { z } from "zod";

let title = "Draft";
const documents = {
  getTitle: () => title,
  rename: (next: string) => { title = next; },
};

const remy = createRemy({ context: () => documents });
const renameDocument = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Rename the current document.",
  kind: "write",
  risk: "low",
  input: z.strictObject({ title: z.string().min(1) }),
  preview: ({ input, context }) => ({
    summary: `Rename document to ${input.title}.`,
    changes: [{ label: "Title", before: context.getTitle(), after: input.title }],
    recovery: { title: context.getTitle() },
  }),
  execute: ({ input, context }) => {
    context.rename(input.title);
    return succeed({ title: input.title });
  },
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) => {
      context.rename(receipt.recovery.title);
      return succeed({ title: receipt.recovery.title });
    },
  },
});

remy.register(renameDocument);
const registration = await registerWebMCP(remy);

// Removes every registered tool when this integration is disposed.
registration.unregister();
```

## Running the demo

The no-login demo uses fictional order #1842:

- Morrow One headphones: £64
- Canvas travel case: £20
- Refund total: £84
- Collection address: 14 High Street, changed to 22 New Road

In **Reversible actions** mode, Remy creates the return, records the reason, changes the address, and books the collection automatically. The irreversible £84 refund waits for explicit approval. Reversing the address restores 14 High Street and appends a linked recovery receipt without deleting the original.

**Trusted run** is deliberately different: when the user selects that mode, the registered refund action may run without a second approval. An agent that requests broader controls through `request_remy_controls` cannot grant that authority to itself; the request remains pending until the person accepts it.

Reset demo clears application state, receipts, pending approvals, controls, and self-reported agent identity.

## Testing with WebMCP

1. Run `npm run dev` and open `http://localhost:3000/demo?judge=1` in a browser that implements `document.modelContext`.
2. Confirm the page says **WebMCP ready**.
3. Ask the browser agent to return both items from order #1842 because they are incompatible with a laptop, collect them next Friday from 22 New Road, and refund the original payment method.
4. Open Remy. Check the four completed recoverable actions and the pending £84 refund.
5. Open the collection-address receipt and restore 14 High Street. Both the original and recovery receipt remain.
6. Approve or reject the refund and confirm the order page updates accordingly.

The implementation calls [`document.modelContext.registerTool(...)`](./packages/webmcp/src/index.ts) imperatively. Unsupported browsers show a clear status and keep the ordinary order page usable.

## Core concepts

| Concept | Meaning |
| --- | --- |
| Policy | A replaceable decision function that allows, stages, denies, or requests approval. |
| Autonomy | Four built-in modes: preview only, ask on changes, reversible actions, and trusted run. |
| Receipt | A bounded, human-readable record of an action, decision, outcome, and resource versions. |
| Exact undo | Restores a recorded previous value when resource-version checks still pass. |
| Compensation | Runs a new corrective action, such as cancelling a courier booking. |
| Irreversible | Declares that no recovery handler exists and lets policy require approval. |

Receipts contain semantic action information only. Remy does not store prompts, chat transcripts, browsing, keystrokes, DOM recordings, secrets, payment details, arbitrary application state, or raw payloads by default.

## Architecture and packages

```text
Application functions and services
              ↓
       Typed Remy actions
              ↓
     Protocol-neutral core
              ↓
     WebMCP adapter / React hook
```

| Workspace package | Purpose | npm status |
| --- | --- | --- |
| `@remy-ai/core` | Typed actions, policy, receipts, journal, approvals, and recovery. | Prepared; unpublished |
| `@remy-ai/webmcp` | Headless WebMCP registration, validation, invocation, and cleanup. | Prepared; unpublished |
| `@remy-ai/react` | Optional `useRemySnapshot(remy)` external-store hook. | Prepared; unpublished |

See [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md), and the package READMEs under [`packages/`](./packages).

## Verified development commands

```bash
npm ci                  # clean dependency installation
npm run dev             # local Next.js development server
npm run lint            # ESLint
npm run typecheck       # standalone TypeScript check
npm run test:run        # unit and integration tests
npm run build           # package builds and production Next.js build
npm run verify:packages # pack and install all packages in a clean fixture
npm run test:browser    # production browser smoke test
git diff --check        # whitespace/formatting check
```

The same non-browser checks run on pushes to `master` or `main` and on pull requests through [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## WebMCP challenge implementation

The return demo registers application-neutral action definitions through the real WebMCP adapter. It demonstrates runtime schema validation, self-reported agent attribution, four autonomy modes, human permission escalation, approval and rejection, exact address recovery, compensating collection cancellation, append-only receipts, stale-approval checks, resource-version protection, idempotency, reset, registration cleanup, and a graceful unsupported-browser path.

WebMCP is the first adapter, not the entire product. Planned adapters are not represented as shipped.

## Roadmap

Next steps are package publication, framework-neutral UI extraction, pluggable durable receipt storage, and more examples. MCP and agent-framework adapters remain later work based on developer demand. See [ROADMAP.md](./ROADMAP.md) for the maintained Now / Next / Later plan.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for repository setup and contribution expectations. Report security issues through [SECURITY.md](./SECURITY.md).

## Licence

[MIT](./LICENSE) — Copyright (c) 2026 Remy contributors.
