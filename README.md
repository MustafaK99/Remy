# Remy

Remy is an open-source TypeScript SDK for permissions, approvals, receipts and recovery around AI agent actions.

[Documentation](./src/app/docs/page.tsx) · [Working examples](./examples) · [Roadmap](./ROADMAP.md) · [MIT licence](./LICENSE)

> **Alpha:** the three npm packages are built, packed, and tested outside this repository. Public npm publication is the remaining release-owner step, so the install command below will return 404 until that publish is complete.

## Run the live demo locally

Devpost judges and contributors can run the submitted source today:

```bash
git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Cloning is the source-review path, not the future library integration method.

## Install the library after publication

```bash
npm install @remy-ai/core @remy-ai/webmcp
```

The example below uses Zod 4 as its Standard Schema validator:

```bash
npm install zod
```

## Minimal example

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

// Clean up every registered tool when the integration is disposed.
registration.unregister();
```

The complete typechecked example is [examples/minimal.ts](./examples/minimal.ts).

## What works in this alpha

- Fully inferred action input, output, and recovery data from one Standard Schema definition.
- Replaceable policy with preview, ask, reversible, and trusted presets.
- Explicit approvals, stale-approval detection, resource-version checks, and idempotency.
- Readable, schema-versioned receipts with append-only linked recovery history.
- Exact recovery, compensating actions, and explicitly irreversible actions.
- Bounded memory and browser journal stores that exclude application state and private payloads.
- Headless `registerWebMCP(remy)` with feature detection, partial-failure reporting, and cleanup.
- Optional `useRemySnapshot(remy)` React integration with stable external-store snapshots.
- The complete Morrow WebMCP flow at `/demo`, while the homepage uses a non-commerce document example.

Remy wraps your existing functions. Your application keeps its database, authentication, authorisation, business logic, editor history, and UI.

## Demo result

The Morrow journey contains four state-changing actions. In **Reversible actions** mode, three recoverable changes run automatically and the purchase waits for one explicit approval:

```text
4 actions · 3 automatic · 1 approval
```

This describes the demo only; it is not a general benchmark. Manual shop interactions remain available, and unsupported WebMCP browsers keep working as ordinary websites.

## Packages

| Package | Purpose |
| --- | --- |
| `@remy-ai/core` | Protocol-neutral actions, policy, receipts, journal, and recovery. |
| `@remy-ai/webmcp` | Generic browser WebMCP registration. |
| `@remy-ai/react` | Optional React external-store hook. |

Verify the exact publish artifacts in a separate temporary fixture:

```bash
npm run verify:packages
```

That command builds all packages, runs `npm pack`, installs the tarballs outside the monorepo, typechecks their declarations, invokes a non-commerce action through a mock WebMCP registry, checks cleanup, and imports the React package.

## Documentation

- [Five-minute quickstart and API guide](./src/app/docs/page.tsx)
- [Architecture and package boundaries](./ARCHITECTURE.md)
- [Security and production responsibilities](./SECURITY.md)
- [Roadmap](./ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
- [Release checklist](./RELEASE_CHECKLIST.md)
- [Changelog](./CHANGELOG.md)

Clone and development setup instructions live only in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

[MIT](./LICENSE) — Copyright (c) 2026 Remy contributors.
