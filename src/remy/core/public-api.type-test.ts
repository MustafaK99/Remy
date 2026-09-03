import { z } from "zod";
import { createRemy, defineAction, succeed, type ActionInput, type ActionOutput } from "./index";

const readTitle = defineAction({
  name: "read_title",
  title: "Read title",
  description: "Read a document title.",
  kind: "read",
  input: z.strictObject({ documentId: z.string() }),
  preview: () => ({ summary: "Read title." }),
  execute: ({ input }) => succeed({ id: input.documentId, title: "Draft" }),
});

const validInput: ActionInput<typeof readTitle> = { documentId: "doc-1" };
const validOutput: ActionOutput<typeof readTitle> = { id: "doc-1", title: "Draft" };
void validInput;
void validOutput;
void readTitle;

// @ts-expect-error documentId is inferred as required from the schema.
const invalidInput: ActionInput<typeof readTitle> = {};
void invalidInput;

const remy = createRemy({ context: () => ({ documentTitle: "Draft" }) });
const exact = remy.defineAction({
  name: "edit_title",
  title: "Edit title",
  description: "Edit the document title.",
  kind: "write",
  input: z.strictObject({ title: z.string() }),
  risk: "low",
  preview: ({ input, context }) => ({
    summary: `Rename to ${input.title}`,
    changes: [{ label: "Title", before: context.documentTitle, after: input.title }],
    recovery: { previousTitle: context.documentTitle },
  }),
  execute: ({ input }) => succeed({ title: input.title }),
  recovery: {
    kind: "exact",
    execute: ({ receipt }) => succeed({ title: receipt.recovery.previousTitle }),
  },
});
remy.register(exact);
void remy.run(exact, { title: "Published" });

// @ts-expect-error input remains inferred at the typed run boundary.
void remy.run(exact, { title: 42 });

defineAction({
  name: "publish_document",
  title: "Publish document",
  description: "Publish the document permanently.",
  kind: "write",
  input: z.strictObject({ id: z.string() }),
  risk: "high",
  preview: () => ({ summary: "Publish document." }),
  execute: ({ input }) => succeed({ id: input.id, published: true }),
  recovery: { kind: "irreversible" },
});

defineAction({
  name: "book_review",
  title: "Book review",
  description: "Book a document review that can be cancelled.",
  kind: "write",
  input: z.strictObject({ reviewerId: z.string() }),
  risk: "medium",
  preview: ({ input }) => ({
    summary: `Book a review with ${input.reviewerId}.`,
    recovery: { bookingId: `booking:${input.reviewerId}` },
  }),
  execute: ({ input }) => succeed({ reviewerId: input.reviewerId }),
  recovery: {
    kind: "compensating",
    execute: ({ receipt, output }) => succeed({
      cancelled: receipt.recovery.bookingId,
      reviewerId: output.reviewerId,
    }),
  },
});

defineAction({
  name: "invalid_irreversible",
  title: "Invalid irreversible",
  description: "Compile-time invalid example.",
  kind: "write",
  input: z.strictObject({ id: z.string() }),
  risk: "high",
  preview: () => ({ summary: "Invalid." }),
  execute: ({ input }) => succeed({ id: input.id }),
  // @ts-expect-error irreversible recovery cannot define a fake execute handler.
  recovery: { kind: "irreversible", execute: () => succeed(undefined) },
});
