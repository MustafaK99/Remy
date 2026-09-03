import { createMemoryJournalStore, createRemy, succeed, type AutonomyLevel } from "@remy-ai/core";
import { z } from "zod";

export type DocumentSnapshot = Readonly<{
  title: string;
  workspace: string;
  published: boolean;
}>;

const initialState: DocumentSnapshot = Object.freeze({
  title: "Untitled document",
  workspace: "My workspace",
  published: false,
});

function createDocumentStore() {
  let snapshot = initialState;
  const listeners = new Set<() => void>();
  const versions = new Map<string, number>([
    ["document:title", 1],
    ["document:workspace", 1],
    ["document:publication", 1],
  ]);

  const update = (patch: Partial<DocumentSnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialState,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    rename: (title: string) => update({ title }),
    move: (workspace: string) => update({ workspace }),
    publish: () => update({ published: true }),
    reset: () => {
      snapshot = initialState;
      versions.forEach((_, key) => versions.set(key, 1));
      listeners.forEach((listener) => listener());
    },
    resources: {
      getVersion: (resource: string) => versions.get(resource),
      bumpVersion: (resource: string) => {
        const next = (versions.get(resource) ?? 0) + 1;
        versions.set(resource, next);
        return next;
      },
    },
  };
}

export function createDocumentRuntime() {
  const store = createDocumentStore();
  const remy = createRemy({
    context: () => store,
    resources: store.resources,
    journal: createMemoryJournalStore(),
    defaultRunId: "landing-document-run",
    defaultTaskId: "prepare-launch-brief",
    controls: { autonomy: "reversible", paused: false, grants: [] },
  });

  const renameDocument = remy.defineAction({
    name: "rename_document",
    title: "Rename document",
    description: "Rename the current document with the application's existing function.",
    kind: "write",
    risk: "low",
    input: z.strictObject({ title: z.string().min(1).max(120) }),
    preview: ({ input, context }) => ({
      summary: `Rename document to “${input.title}”.`,
      resources: ["document:title"],
      changes: [{ label: "Document name", before: context.getSnapshot().title, after: input.title }],
      recovery: { title: context.getSnapshot().title },
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

  const moveDocument = remy.defineAction({
    name: "move_document",
    title: "Move document",
    description: "Move the current document to another workspace.",
    kind: "write",
    risk: "low",
    input: z.strictObject({ workspace: z.string().min(1).max(120) }),
    preview: ({ input, context }) => ({
      summary: `Move document to ${input.workspace}.`,
      resources: ["document:workspace"],
      changes: [{ label: "Workspace", before: context.getSnapshot().workspace, after: input.workspace }],
      recovery: { workspace: context.getSnapshot().workspace },
    }),
    execute: ({ input, context }) => {
      context.move(input.workspace);
      return succeed({ workspace: input.workspace });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        context.move(receipt.recovery.workspace);
        return succeed({ workspace: receipt.recovery.workspace });
      },
    },
  });

  const publishDocument = remy.defineAction({
    name: "publish_document",
    title: "Publish document",
    description: "Make the current document publicly available.",
    kind: "write",
    risk: "high",
    approval: "always",
    input: z.strictObject({}),
    preview: () => ({
      summary: "Publish the document.",
      resources: ["document:publication"],
      changes: [{ label: "Visibility", before: "Private", after: "Public" }],
    }),
    execute: ({ context }) => {
      context.publish();
      return succeed({ published: true });
    },
    recovery: { kind: "irreversible" },
  });

  remy.register(renameDocument);
  remy.register(moveDocument);
  remy.register(publishDocument);

  async function runScenario(autonomy: AutonomyLevel = "reversible") {
    remy.reset();
    store.reset();
    remy.setAutonomy(autonomy);
    const meta = {
      actor: "agent" as const,
      transport: "webmcp",
      principal: {
        id: "assistant:demo",
        name: "AI assistant",
        provider: "Demo",
        assurance: "self-reported" as const,
      },
    };
    const rename = await remy.run(renameDocument, { title: "Launch brief" }, meta);
    const move = await remy.run(moveDocument, { workspace: "Project Atlas" }, meta);
    const publish = await remy.run(publishDocument, {}, meta);
    return { rename, move, publish };
  }

  return {
    remy,
    store,
    actions: { renameDocument, moveDocument, publishDocument },
    runScenario,
  };
}

export type DocumentRuntime = ReturnType<typeof createDocumentRuntime>;
