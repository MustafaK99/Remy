import { describe, expect, it } from "vitest";
import { createDocumentRuntime } from "./document-runtime";

describe("homepage document action runtime", () => {
  it("runs recoverable work, pauses publishing, and keeps linked recovery history", async () => {
    const runtime = createDocumentRuntime();
    const results = await runtime.runScenario("reversible");

    expect(results.rename.status).toBe("committed");
    expect(results.move.status).toBe("committed");
    expect(results.publish.status).toBe("awaiting_approval");
    if (!results.rename.ok || !results.publish.ok) {
      throw new Error("The document scenario did not prepare correctly.");
    }
    expect(runtime.store.getSnapshot()).toEqual({
      title: "Launch brief",
      workspace: "Project Atlas",
      published: false,
    });

    const recovery = await runtime.remy.revert(results.rename.actionId, {
      actor: "user",
      transport: "test",
    });
    expect(recovery.ok).toBe(true);
    if (!recovery.ok) throw new Error(recovery.error);
    expect(runtime.store.getSnapshot().title).toBe("Untitled document");
    expect(runtime.remy.getSnapshot().receipts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: recovery.actionId,
          reversesReceiptId: results.rename.actionId,
          status: "committed",
        }),
      ]),
    );
    expect(runtime.remy.getReceipt(results.rename.actionId)?.reversedByReceiptId).toBe(recovery.actionId);

    const approval = await runtime.remy.approve(results.publish.actionId);
    expect(approval.status).toBe("committed");
    expect(runtime.store.getSnapshot().published).toBe(true);
  });
});
