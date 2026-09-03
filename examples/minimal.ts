import { z } from "zod";
import { createRemy, succeed } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";

export type DocumentService = {
  readonly getTitle: () => string;
  readonly setTitle: (title: string) => Promise<void> | void;
};

export function createDocumentRemy(documentService: DocumentService) {
  const remy = createRemy({
    context: () => documentService,
    controls: { autonomy: "reversible", paused: false, grants: [] },
  });

  const renameDocument = remy.defineAction({
    name: "rename_document",
    title: "Rename document",
    description: "Change the title of the open document. This has exact recovery.",
    kind: "write",
    input: z.strictObject({ title: z.string().trim().min(1).max(120) }),
    risk: "low",
    preview: ({ input, context }) => {
      const previousTitle = context.getTitle();
      return {
        summary: `Rename the document to “${input.title}”.`,
        resources: ["document:title"],
        changes: [
          {
            label: "Document title",
            path: "document.title",
            before: previousTitle,
            after: input.title,
          },
        ],
        recovery: { previousTitle },
      };
    },
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
    redactInput: ({ title }) => ({ title }),
    exposeOutput: ({ title }) => ({ title }),
  });

  remy.register(renameDocument);
  return { remy, renameDocument };
}

export function exposeDocumentActions(
  runtime: ReturnType<typeof createDocumentRemy>,
  signal?: AbortSignal,
) {
  return registerWebMCP(runtime.remy, { signal });
}
