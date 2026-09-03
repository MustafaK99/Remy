# Remy

Remy is a protocol-neutral action layer for applications that let AI agents change real state. It gives developers the middle ground between approving everything and granting opaque autonomy: reversible work can run, consequential work can wait, and every attempt leaves a readable receipt.

One semantic action definition drives preview, policy, execution, append-only history, adapter exposure, and honest recovery. WebMCP is the first adapter and demonstration environment; the host application still owns its business logic, interface, and styling.

This repository contains the Phase 0 challenge demonstrator: a developer-facing site, a fictional ecommerce shop, a protocol-neutral action engine, an imperative WebMCP adapter, an optional Remy activity panel, and an alpha initializer CLI.

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

1. Open `/demo` in a browser with the imperative WebMCP API and leave the control slider on **Reversible actions**.
2. Ask an external assistant to add Morrow One in Charcoal, choose express delivery, apply `HELLO10`, and buy it.
3. Watch the shop update as the assistant calls `add_to_cart`, `choose_delivery`, and `apply_discount`.
4. Remy pauses at `place_order` because purchases default to **Ask first**.
5. Inspect the authoritative item, total, payment method, and delivery address.
6. Approve the £123 purchase or choose **Don’t buy**.
7. Hide Remy and repeat a safe action to show that its compact bar still reports new activity.
8. Move the slider through **Preview**, **Ask**, **Reversible**, and **Trusted** to show how the same WebMCP action follows a different policy.
9. In **Trusted run**, switch on **Buy without asking** to demonstrate a separately granted high-consequence permission.

The shop’s normal buttons and WebMCP tools use the same `RemyEngine.run()` path. Explicit clicks by the customer remain usable under every AI control mode.

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
  application state   your UI (optional panel in this demo)
```

Important directories:

- `src/remy/core` — protocol-neutral types, deterministic policy, journal projection, engine, and tests.
- `src/remy/adapters` — client-only imperative WebMCP registration and cleanup.
- `src/remy/react` — the demo provider and observable UI boundary.
- `src/demo` — fictional order state and semantic action catalogue.
- `src/components/demo` — fictional shop plus one example activity and approval interface.
- `packages/cli` — the working alpha `init` command.

The core does not import React or WebMCP. Adapters depend on the core, while UI subscribes to the engine’s observable projection.

## WebMCP

The client adapter feature-detects `document.modelContext`, registers tools exactly once after mount, and passes an `AbortSignal` so they unregister during cleanup. Every handler validates input at runtime and returns concise JSON-serializable results only after application state and receipts have updated.

Expected tools:

- `get_product`
- `get_cart`
- `add_to_cart`
- `remove_from_cart`
- `set_quantity`
- `choose_delivery`
- `apply_discount`
- `prepare_checkout`
- `place_order`
- `get_remy_status`
- `identify_assistant`
- `request_remy_controls`
- `get_action_history`
- `revert_action`

`get_remy_status` makes Remy discoverable from the assistant. An assistant can
identify itself for plain-language attribution and request different controls.
More restrictive settings apply immediately; increased access and unattended
purchases wait for the person to confirm. Assistant identity is self-reported
because the current WebMCP execute callback does not provide authenticated caller
identity.

In a browser that implements the imperative [WebMCP API](https://webmachinelearning.github.io/webmcp/), open `/demo` and inspect the page-scoped tools. In other browsers, a non-blocking compatibility message appears and the normal site remains usable.

## Initializer CLI

The intended public command is:

```bash
npx @remy-ai/cli init
```

The bare `remy` npm name already belongs to an unrelated utility, so the demonstrator deliberately uses a scoped package name.

Test the included CLI without changing files:

```bash
node packages/cli/bin/remy.mjs init --dry-run
```

It detects a Next.js App Router project, respects `src/`, selects the existing package manager, avoids overwriting files by default, and scaffolds:

```text
src/remy/actions.ts
src/remy/provider.tsx
```

The initializer deliberately does not generate a Remy page or impose an activity component. Applications can render Remy state inside their existing drawers, receipts, toasts, account pages, or other product UI.

The CLI package is implemented here but not published from this challenge repository. The generated imports describe the planned P1 package split: `@remy-ai/core`, `@remy-ai/react`, and `@remy-ai/webmcp`.

## Safety model

- Monetary values and eligibility come from application state, never agent input.
- Purchases require approval by default. They run unattended only when the user selects **Full** and explicitly enables **Buy without asking**.
- An assistant cannot grant itself more access through the Remy WebMCP tools; increased access is staged for user confirmation.
- Assistant labels are recorded for attribution only and never used as authorization.
- Direct customer interactions through the normal website UI remain available under every AI control setting.
- A waiting approval becomes invalid if any resource included in its preview changes.
- Exact undo checks resource versions before applying an inverse.
- Compensation creates a new corrective receipt; it never pretends history disappeared.
- Idempotency keys prevent duplicate effects and duplicate reversals.
- Refresh restores local state and receipts without replaying actions.
- Raw inverse data stays private; the primary UI renders domain-readable diffs.

## Honest limitations

- The ecommerce data, payment, and order are fictional.
- Persistence uses local storage rather than a hosted journal.
- Receipts are append-only in the local engine but are not cryptographically signed.
- Undo is limited to the latest conflict-free state of each resource; arbitrary dependency graphs are out of scope.
- WebMCP is the first transport adapter, not a product dependency.
- The alpha CLI supports Next.js App Router projects only and its public packages are not yet published.
