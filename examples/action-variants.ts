import { z } from "zod";
import { createRemy, fail, succeed } from "@remy-ai/core";

type Services = {
  readonly bookReview: (reviewerId: string) => Promise<{ readonly id: string }>;
  readonly cancelBooking: (
    bookingId: string,
  ) => Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }>;
  readonly publishDocument: () => Promise<{ readonly url: string }>;
};

export function defineActionVariants(services: Services) {
  const remy = createRemy({ context: () => services });

  const bookReview = remy.defineAction({
    name: "book_review",
    title: "Book review",
    description: "Book a document review. Recovery cancels the booking.",
    kind: "write",
    input: z.strictObject({ reviewerId: z.string() }),
    risk: "medium",
    preview: ({ input }) => ({
      summary: `Book a review with ${input.reviewerId}.`,
      recovery: { reviewerId: input.reviewerId },
    }),
    execute: async ({ input, context }) => {
      const booking = await context.bookReview(input.reviewerId);
      return succeed(booking);
    },
    recovery: {
      kind: "compensating",
      execute: async ({ output, context }) => {
        const cancellation = await context.cancelBooking(output.id);
        return cancellation.ok
          ? succeed({ bookingId: output.id, cancelled: true })
          : fail("CANCEL_FAILED", cancellation.message);
      },
    },
  });

  const publishDocument = remy.defineAction({
    name: "publish_document",
    title: "Publish document",
    description: "Publish the current document publicly.",
    kind: "write",
    input: z.strictObject({}),
    risk: "high",
    approval: "always",
    preview: () => ({
      summary: "Publish this document publicly.",
      changes: [
        { label: "Visibility", before: "Draft", after: "Public" },
      ],
    }),
    execute: async ({ context }) => succeed(await context.publishDocument()),
    recovery: { kind: "irreversible" },
  });

  remy.register(bookReview).register(publishDocument);
  return { remy, bookReview, publishDocument };
}
