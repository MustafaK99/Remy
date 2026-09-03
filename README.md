# Remy

Remy is an embedded action layer for applications that let AI agents change real state. One action definition drives preview, policy, execution, receipts, WebMCP exposure, and reversal.

This repository contains the Phase 0 challenge demonstrator: a developer-facing site, a fictional ecommerce returns portal, a protocol-neutral action engine, an imperative WebMCP adapter, an Action Center, and an alpha initializer CLI.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the product site or [http://localhost:3000/demo](http://localhost:3000/demo) for the working demonstrator.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## The 60-second demo

1. Open `/demo` and leave autonomy on **Reversible**.
2. Select **Run hero task**.
3. Watch the draft, reason, address, and collection changes complete without interruption.
4. Remy pauses at **Issue £84 refund** because it is irreversible.
5. Inspect the authoritative amount, mock payment destination, requester, and reversibility warning.
6. Select **Approve £84 refund**.
7. Open **Changed collection address** in the timeline and select **Undo this action**.
8. Observe that the address returns to 14 High Street, the original receipt remains marked Reverted, and a linked restoration receipt is appended.
9. Optionally cancel the booking to demonstrate compensation, or simulate a later address edit to demonstrate conflict-safe undo.

The manual run and WebMCP tools both call the same `RemyEngine.run()` path. The manual mode is not a separate animation.

## Architecture

```text
WebMCP / manual adapter
          │
          ▼
   Remy action engine
    ├─ runtime validation
    ├─ preview + policy
    ├─ idempotent execute
    ├─ append-only events
    └─ exact undo / compensation
          │
          ├──────────────┐
          ▼              ▼
  application state   Action Center
```

Important directories:

- `src/remy/core` — protocol-neutral types, deterministic policy, journal projection, engine, and tests.
- `src/remy/adapters` — client-only imperative WebMCP registration and cleanup.
- `src/remy/react` — the demo provider and observable UI boundary.
- `src/demo` — fictional order state and semantic action catalogue.
- `src/components/demo` — returns portal, timeline, approval, receipt detail, and reversal UI.
- `packages/cli` — the working alpha `init` command.

The core does not import React or WebMCP. Adapters depend on the core, while UI subscribes to the engine’s observable projection.

## WebMCP

The client adapter feature-detects `document.modelContext`, registers tools exactly once after mount, and passes an `AbortSignal` so they unregister during cleanup. Every handler validates input at runtime and returns concise JSON-serializable results only after application state and receipts have updated.

Expected tools:

- `get_order`
- `get_return_options`
- `create_return_draft`
- `add_return_reason`
- `update_collection_address`
- `book_collection`
- `prepare_refund`
- `issue_refund`
- `get_action_history`
- `revert_action`

In a browser that implements the imperative [WebMCP API](https://webmachinelearning.github.io/webmcp/), open `/demo` and inspect the page-scoped tools. In other browsers, a non-blocking compatibility message appears and the normal site remains usable.

## Initializer CLI

The intended public command is:

```bash
npx @remy-ai/cli init
```

The bare `remy` npm name already belongs to an unrelated utility, so the demonstrator deliberately uses a scoped package name.

Test the included CLI without changing files:

```bash
npm run cli -- init --dry-run
```

It detects a Next.js App Router project, respects `src/`, selects the existing package manager, avoids overwriting files by default, and scaffolds:

```text
src/remy/actions.ts
src/remy/provider.tsx
src/app/remy/page.tsx
```

The CLI package is implemented here but not published from this challenge repository. The generated imports describe the planned P1 package split: `@remy-ai/core`, `@remy-ai/react`, and `@remy-ai/webmcp`.

## Safety model

- Monetary values and eligibility come from application state, never agent input.
- `issue_refund` always requires approval under every autonomy setting.
- Exact undo checks resource versions before applying an inverse.
- Compensation creates a new corrective receipt; it never pretends history disappeared.
- Idempotency keys prevent duplicate effects and duplicate reversals.
- Refresh restores local state and receipts without replaying actions.
- Raw inverse data stays private; the primary UI renders domain-readable diffs.

## Honest limitations

- The ecommerce data, courier booking, and refund are fictional.
- Persistence uses local storage rather than a hosted journal.
- Receipts are append-only in the local engine but are not cryptographically signed.
- Undo is limited to the latest conflict-free state of each resource; arbitrary dependency graphs are out of scope.
- WebMCP is the first transport adapter, not a product dependency.
- The alpha CLI supports Next.js App Router projects only and its public packages are not yet published.
