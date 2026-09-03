# @remy-ai/core

Protocol-neutral permissions, approvals, receipts, and recovery for AI agent actions.

> Public alpha. Install with `npm install @remy-ai/core@alpha` and review the [public repository](https://github.com/MustafaK99/Remy) before production use.

```ts
import { createRemy, succeed } from "@remy-ai/core";
import { z } from "zod";

let title = "Draft";
const remy = createRemy({ context: () => ({
  getTitle: () => title,
  setTitle: (next: string) => { title = next; },
}) });

const renameDocument = remy.defineAction({
  name: "rename_document",
  title: "Rename document",
  description: "Rename the current document.",
  kind: "write",
  risk: "low",
  input: z.strictObject({ title: z.string().min(1) }),
  preview: ({ input, context }) => ({
    summary: `Rename document to ${input.title}.`,
    resources: ["document:title"],
    changes: [{ label: "Title", before: context.getTitle(), after: input.title }],
    recovery: { title: context.getTitle() },
  }),
  execute: ({ input, context }) => {
    context.setTitle(input.title);
    return succeed({ title: input.title });
  },
  recovery: {
    kind: "exact",
    execute: ({ receipt, context }) => {
      context.setTitle(receipt.recovery.title);
      return succeed({ title: receipt.recovery.title });
    },
  },
});

remy.register(renameDocument);

const started = await remy.runByName("rename_document", {
  title: "Launch plan",
}, { actor: "agent", transport: "your-adapter" });

if (started.ok && started.requiresApproval) {
  // The host renders the recorded approval. Any protocol adapter can await
  // the same action lifecycle and resume after the person decides.
  const settled = await remy.waitForAction(started.actionId, {
    timeoutMs: 120_000,
  });
}
```

`waitForAction()` is protocol-neutral. Cancellation or timeout ends only the caller's wait; the append-only action receipt remains available for approval, rejection, recovery, and later inspection.

Remy does not own your application state, authentication, or business logic. This is an alpha API; see the [documentation](https://github.com/MustafaK99/Remy/blob/master/README.md) and [security guidance](https://github.com/MustafaK99/Remy/blob/master/SECURITY.md) before production use.

MIT licensed.
