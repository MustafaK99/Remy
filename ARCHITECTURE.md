# Remy architecture

Remy is a headless action layer. It wraps operations an application already
owns; it does not become the application's database, authentication system,
editor history, transport, or interface.

## Dependency direction

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

The arrows describe use, not ownership. A host service can also notify its own
UI and persist its own state while an action executes.

The repository enforces these boundaries:

- `packages/core/src` imports no React, Next.js, WebMCP, or demo modules.
- `packages/webmcp/src` imports only the curated core package entry point.
- `packages/react/src` imports only React and public core contracts.
- `src/demo` may compose the core, adapter, React hook, and fictional shop services.
- Package-oriented code has no Tailwind or Next.js dependency.

`src/remy/architecture.test.ts` fails when one of these boundaries is crossed.

## Public surface

`packages/core/src/index.ts` is the core entry point. The principal alpha API is:

- `createRemy(options)`
- `remy.defineAction(definition)`
- `remy.register(action)`
- `remy.run(action, input, meta?)`
- `remy.approve(receiptId)` and `remy.reject(receiptId)`
- `remy.revert(receiptId, meta?)`
- `registerWebMCP(remy, options?)`
- `useRemySnapshot(remy)`
- memory and browser journal stores

The only erased action boundary is the internal registry used for string-based
protocol dispatch. Application calls remain typed by the action object.

## Execution sequence

1. The adapter or application calls a registered action.
2. Remy validates input with the action's Standard Schema V1 validator.
3. `preview` reads host context and describes resources and semantic changes.
4. The selected policy returns `allow`, `require_approval`, `stage`, or `deny`.
5. Allowed work calls the host's existing function in `execute`; paused work
   retains private execution data in memory until approval.
6. Remy appends bounded receipts and events and publishes a cached snapshot.
7. Exact or compensating recovery calls the declared host recovery function
   after resource-version checks, then appends a linked recovery receipt.

Adapters translate protocols. They do not decide policy or implement business
logic. UI reads snapshots and invokes the same core methods; it is never an
alternative execution path.

## Host-owned state

The context passed to `createRemy` is a function so it can return current host
services or state adapters without Remy retaining a stale copy. The host owns:

- application and database state;
- authentication and authorisation;
- authoritative totals, permissions, and eligibility;
- durable idempotency at the side-effect boundary;
- native undo/editor history;
- UI and accessibility choices.

The Morrow demo follows this rule with a separate `DemoStore` and separate,
versioned demo-state persistence.

## Journal and private execution data

The public journal stores `PersistedJournal` version 1: bounded semantic
receipts and append-only status events. It intentionally excludes full
application state, arbitrary raw input/output, and recovery payloads.

Validated input, pending execution data, outputs, and typed recovery material
are private and in memory by default. After a reload, a receipt remains useful
as history, but Remy does not pretend it can execute or reverse work whose
private material was not explicitly persisted. A future durable integration
can implement an application-specific, redacted serializer at that extension
point.

The browser store uses a namespaced, versioned key, validates restored data,
bounds record sizes, and returns discriminated errors for unavailable or
quota-limited storage.

## Policy and identity

The built-in autonomy policy is a preset, not a fixed engine rule. A host can
inject any `Policy` with the same four outcomes. Capabilities are opaque grant
strings owned by the application.

Agent principals model assurance explicitly:

- `self-reported` is attribution only;
- `authenticated` means a trusted integration authenticated the principal;
- `verified` is reserved for stronger host-defined verification.

The WebMCP adapter can only self-report identity and cannot grant itself more
authority.

## React store contract

`RemyClient` caches its snapshot. `getSnapshot()` returns the identical object
until a state transition emits; `subscribe` and `getServerSnapshot` have stable
identities. `useRemySnapshot()` is a thin `useSyncExternalStore` wrapper. Engine
creation remains in host/demo code so React Strict Mode cannot silently create
or register a second runtime.

## Published-package shape

The source now matches the intended package boundaries:

- `packages/core` → `@remy-ai/core`
- `packages/react` → `@remy-ai/react`
- `packages/webmcp` → `@remy-ai/webmcp`

Each package builds ESM and declarations, contains no site alias, and is tested
from packed tarballs in a temporary project. npm publication remains a manual
release-owner step.

MCP and agent-SDK adapters should consume the same action descriptors and
string-dispatch boundary. They should not require action definitions or host
business functions to change.
