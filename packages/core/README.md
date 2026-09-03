# @remy-ai/core

Protocol-neutral permissions, approvals, receipts, and recovery for AI agent actions.

> Alpha workspace package. It is prepared for publication but is not on npm yet. Run it from the [public repository](https://github.com/MustafaK99/Remy) today.

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
```

Remy does not own your application state, authentication, or business logic. This is an alpha API; see the [documentation](https://github.com/MustafaK99/Remy/blob/master/README.md) and [security guidance](https://github.com/MustafaK99/Remy/blob/master/SECURITY.md) before production use.

MIT licensed.
