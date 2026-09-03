import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createMemoryJournalStore,
  createRemy,
  fail,
  succeed,
  type IdGenerator,
  type JournalStore,
  type Policy,
} from "./index";

type DocumentContext = {
  readonly getTitle: () => string;
  readonly rename: (title: string) => void;
  readonly version: () => number;
  readonly bump: () => number;
};

function ids(): IdGenerator {
  let sequence = 0;
  return (kind) => `${kind}-${++sequence}`;
}

function documentRuntime(options: { journal?: JournalStore; policy?: Policy } = {}) {
  let title = "Alpha brief";
  let version = 1;
  const context: DocumentContext = {
    getTitle: () => title,
    rename: (next) => {
      title = next;
    },
    version: () => version,
    bump: () => ++version,
  };
  const remy = createRemy({
    context: () => context,
    resources: { getVersion: context.version, bumpVersion: context.bump },
    journal: options.journal,
    policy: options.policy,
    idGenerator: ids(),
    defaultRunId: "document-run",
    defaultTaskId: "rename-document",
  });
  const renameDocument = remy.defineAction({
    name: "rename_document",
    title: "Rename document",
    description: "Rename the current document using its native editing function.",
    kind: "write",
    input: z.strictObject({ documentId: z.string(), title: z.string().min(1) }),
    risk: "low",
    preview: ({ input, context: document }) => ({
      summary: `Rename the document to ${input.title}.`,
      resources: ["document:title"],
      changes: [{ label: "Title", before: document.getTitle(), after: input.title }],
      recovery: { previousTitle: document.getTitle() },
    }),
    execute: ({ input, context: document }) => {
      if (input.title === "LOCKED") return fail("DOCUMENT_LOCKED", "The document is locked.");
      document.rename(input.title);
      return succeed({ documentId: input.documentId, title: input.title });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context: document }) => {
        document.rename(receipt.recovery.previousTitle);
        return succeed({ title: receipt.recovery.previousTitle });
      },
    },
    redactInput: ({ documentId }) => ({ documentId }),
    exposeOutput: (output) => output,
  });
  remy.register(renameDocument);
  return { remy, renameDocument, getTitle: () => title };
}

describe("protocol-neutral Remy client", () => {
  it("runs and exactly recovers a non-commerce document action", async () => {
    const runtime = documentRuntime();
    const result = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "Launch brief",
    });
    expect(result.ok && result.output?.title).toBe("Launch brief");
    expect(runtime.getTitle()).toBe("Launch brief");

    const original = runtime.remy.getSnapshot().receipts[0];
    expect((await runtime.remy.revert(original.id)).ok).toBe(true);
    expect(runtime.getTitle()).toBe("Alpha brief");
    expect(runtime.remy.getSnapshot().receipts[1].reversesReceiptId).toBe(original.id);
  });

  it("returns expected operational failures as discriminated results", async () => {
    const runtime = documentRuntime();
    const result = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "LOCKED",
    });
    expect(result).toMatchObject({ ok: false, code: "DOCUMENT_LOCKED", status: "failed" });
  });

  it("accepts an application-supplied policy", async () => {
    const policy: Policy = ({ action }) => action.name === "rename_document"
      ? { outcome: "deny", reason: "Document is frozen for review." }
      : { outcome: "allow", reason: "Allowed." };
    const runtime = documentRuntime({ policy });
    const result = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "Launch brief",
    });
    expect(result).toMatchObject({ ok: false, code: "POLICY_DENIED" });
    expect(runtime.getTitle()).toBe("Alpha brief");
  });

  it("carries per-run identifiers into receipts", async () => {
    const runtime = documentRuntime();
    await runtime.remy.run(
      runtime.renameDocument,
      { documentId: "doc-1", title: "Launch brief" },
      { runId: "run-99", taskId: "task-rename" },
    );
    expect(runtime.remy.getSnapshot().receipts[0]).toMatchObject({
      runId: "run-99",
      taskId: "task-rename",
    });
  });

  it("passes typed execution output to compensating recovery", async () => {
    let cancelledId: string | undefined;
    const remy = createRemy({
      context: () => ({
        book: () => ({ bookingId: "booking-7" }),
        cancel: (bookingId: string) => {
          cancelledId = bookingId;
        },
      }),
    });
    const bookReview = remy.defineAction({
      name: "book_review",
      title: "Book review",
      description: "Book a review with compensating cancellation.",
      kind: "write",
      input: z.strictObject({}),
      risk: "low",
      preview: () => ({ summary: "Book a review.", recovery: {} }),
      execute: ({ context }) => succeed(context.book()),
      recovery: {
        kind: "compensating",
        automatic: true,
        execute: ({ output, context }) => {
          context.cancel(output.bookingId);
          return succeed({ cancelled: output.bookingId });
        },
      },
    });
    remy.register(bookReview);
    const result = await remy.run(bookReview, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((await remy.revert(result.actionId)).ok).toBe(true);
    expect(cancelledId).toBe("booking-7");
    expect(remy.getSnapshot().receipts[0].status).toBe("compensated");
  });

  it("keeps snapshots referentially stable until Remy state changes", () => {
    const { remy } = documentRuntime();
    const first = remy.getSnapshot();
    expect(remy.getSnapshot()).toBe(first);
    remy.setPaused(true);
    const changed = remy.getSnapshot();
    expect(changed).not.toBe(first);
    expect(remy.getSnapshot()).toBe(changed);
  });

  it("lets any adapter wait for a recorded action to settle", async () => {
    const runtime = documentRuntime();
    runtime.remy.setControls({ autonomy: "ask", paused: false, grants: [] });
    const started = await runtime.remy.run(
      runtime.renameDocument,
      { documentId: "doc-1", title: "Launch brief" },
      { actor: "agent", transport: "mcp" },
    );
    expect(started).toMatchObject({
      ok: true,
      status: "awaiting_approval",
      requiresApproval: true,
    });
    if (!started.ok) return;

    const settled = runtime.remy.waitForAction(started.actionId, {
      timeoutMs: 1_000,
    });
    expect(runtime.getTitle()).toBe("Alpha brief");
    await runtime.remy.approve(started.actionId);

    expect(await settled).toMatchObject({
      ok: true,
      actionId: started.actionId,
      status: "committed",
      output: { documentId: "doc-1", title: "Launch brief" },
    });
    expect(runtime.remy.getReceipt(started.actionId)?.transport).toBe("mcp");
  });

  it("cancels a wait without deleting or changing the pending receipt", async () => {
    const runtime = documentRuntime();
    runtime.remy.setControls({ autonomy: "ask", paused: false, grants: [] });
    const started = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "Launch brief",
    });
    if (!started.ok) return;
    const cancellation = new AbortController();
    const settled = runtime.remy.waitForAction(started.actionId, {
      signal: cancellation.signal,
      timeoutMs: 1_000,
    });

    cancellation.abort();

    expect(await settled).toMatchObject({
      ok: false,
      code: "WAIT_ABORTED",
      status: "awaiting_approval",
    });
    expect(runtime.remy.getReceipt(started.actionId)?.status).toBe("awaiting_approval");
  });

  it("times out a wait without expiring the pending action", async () => {
    const runtime = documentRuntime();
    runtime.remy.setControls({ autonomy: "ask", paused: false, grants: [] });
    const started = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "Launch brief",
    });
    if (!started.ok) return;

    expect(await runtime.remy.waitForAction(started.actionId, {
      timeoutMs: 1,
    })).toMatchObject({
      ok: false,
      code: "WAIT_TIMEOUT",
      status: "awaiting_approval",
    });
    expect(runtime.remy.getReceipt(started.actionId)?.status).toBe("awaiting_approval");
  });

  it("reports a failed approved action through the same pending wait", async () => {
    const runtime = documentRuntime();
    runtime.remy.setControls({ autonomy: "ask", paused: false, grants: [] });
    const started = await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "LOCKED",
    });
    if (!started.ok) return;

    const settled = runtime.remy.waitForAction(started.actionId, {
      timeoutMs: 1_000,
    });
    await runtime.remy.approve(started.actionId);

    expect(await settled).toMatchObject({
      ok: false,
      actionId: started.actionId,
      status: "failed",
      code: "DOCUMENT_LOCKED",
    });
    expect(runtime.remy.getReceipt(started.actionId)?.status).toBe("failed");
  });

  it("persists only versioned, bounded semantic journal data", async () => {
    const store = createMemoryJournalStore();
    const runtime = documentRuntime({ journal: store });
    await runtime.remy.run(runtime.renameDocument, {
      documentId: "doc-1",
      title: "Private launch body must not be stored as raw input",
    });
    const loaded = store.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const serialized = JSON.stringify(loaded.value);
    expect(loaded.value).toMatchObject({ schemaVersion: 1 });
    expect(serialized).toContain("doc-1");
    expect(serialized).not.toContain("rawInput");
    expect(serialized).not.toContain("privateExecutions");
  });

  it("does not persist raw private input or execution output", async () => {
    const store = createMemoryJournalStore();
    const remy = createRemy({ context: () => undefined, journal: store });
    const archive = remy.defineAction({
      name: "archive_document",
      title: "Archive document",
      description: "Archive a document using a private host credential.",
      kind: "write",
      input: z.strictObject({ documentId: z.string(), privateToken: z.string() }),
      risk: "low",
      preview: ({ input }) => ({
        summary: "Archive the selected document.",
        changes: [{ label: "Document status", before: "Active", after: "Archived" }],
        recovery: { documentId: input.documentId },
      }),
      execute: ({ input }) => succeed({ privateResult: input.privateToken }),
      recovery: {
        kind: "exact",
        execute: () => succeed({ restored: true }),
      },
      redactInput: ({ documentId }) => ({ documentId }),
    });
    remy.register(archive);
    await remy.run(archive, {
      documentId: "doc-private",
      privateToken: "secret-input-and-output",
    });
    const loaded = store.load();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(JSON.stringify(loaded.value)).not.toContain("secret-input-and-output");
    }
  });

  it("validates restored journal data and fails closed", () => {
    const invalid = createMemoryJournalStore({ schemaVersion: 99, applicationState: { secret: true } });
    const result = documentRuntime({ journal: invalid }).remy.restore();
    expect(result).toMatchObject({ ok: false, code: "INVALID_JOURNAL_VERSION" });
  });

  it("rejects unknown fields instead of restoring arbitrary state", () => {
    const invalid = createMemoryJournalStore({
      schemaVersion: 1,
      controls: { autonomy: "reversible", paused: false, grants: [] },
      receipts: [],
      events: [],
      applicationState: { secret: true },
    });
    expect(documentRuntime({ journal: invalid }).remy.restore()).toMatchObject({
      ok: false,
      code: "INVALID_JOURNAL",
    });
  });

  it("restores valid receipts without pretending private recovery survived", async () => {
    const store = createMemoryJournalStore();
    const first = documentRuntime({ journal: store });
    await first.remy.run(first.renameDocument, { documentId: "doc-1", title: "Launch brief" });
    const second = documentRuntime({ journal: store });
    expect(second.remy.restore()).toEqual({ ok: true, restored: 1 });
    const receipt = second.remy.getSnapshot().receipts[0];
    expect(receipt.schemaVersion).toBe(1);
    expect(second.remy.canRevert(receipt)).toMatchObject({ allowed: false });
  });
});
