import { beforeEach, describe, expect, it } from "vitest";
import { createDemoEngine } from "@/demo/create-engine";
import { RESOURCE_KEYS } from "@/demo/data";

describe("Remy demo engine", () => {
  let engine: ReturnType<typeof createDemoEngine>;

  beforeEach(() => {
    engine = createDemoEngine();
  });

  it("runs safe actions and pauses an irreversible refund", async () => {
    await runToRefund(engine);
    const snapshot = engine.getSnapshot();

    expect(snapshot.state.return.collectionAddress).toBe("22 New Road");
    expect(snapshot.state.return.collection.status).toBe("booked");
    expect(snapshot.state.return.refund.status).toBe("not_prepared");
    expect(snapshot.receipts.at(-1)?.status).toBe("awaiting_approval");
    expect(snapshot.receipts.at(-1)?.title).toBe("Refund £84");
  });

  it("uses authoritative state when the refund is approved", async () => {
    await runToRefund(engine);
    const pending = engine.getSnapshot().receipts.at(-1);
    const result = await engine.approve(pending!.id);

    expect(result.ok).toBe(true);
    expect(engine.getSnapshot().state.return.refund).toEqual({
      amount: 84,
      status: "issued",
    });
    expect(engine.getSnapshot().receipts.at(-1)?.status).toBe("committed");
  });

  it("does not repeat a mutation with the same idempotency key", async () => {
    const first = await engine.run(
      "update_collection_address",
      { orderId: "1842", address: "22 New Road" },
      { idempotencyKey: "same-address" },
    );
    const second = await engine.run(
      "update_collection_address",
      { orderId: "1842", address: "99 Wrong Road" },
      { idempotencyKey: "same-address" },
    );

    expect(first.ok && second.ok && second.actionId).toBe(first.ok && first.actionId);
    expect(engine.getSnapshot().state.return.collectionAddress).toBe("22 New Road");
    expect(engine.getSnapshot().receipts).toHaveLength(1);
  });

  it("undoes an address with a linked append-only receipt", async () => {
    await engine.run("update_collection_address", {
      orderId: "1842",
      address: "22 New Road",
    });
    const original = engine.getSnapshot().receipts[0];
    const result = await engine.revert(original.id);
    const receipts = engine.getSnapshot().receipts;

    expect(result.ok).toBe(true);
    expect(engine.getSnapshot().state.return.collectionAddress).toBe("14 High Street");
    expect(receipts).toHaveLength(2);
    expect(receipts[0].status).toBe("reverted");
    expect(receipts[1].reversesReceiptId).toBe(original.id);
  });

  it("compensates a collection without erasing the booking", async () => {
    await engine.run("book_collection", { orderId: "1842", date: "Next Friday" });
    const booking = engine.getSnapshot().receipts[0];
    await engine.revert(booking.id);
    const receipts = engine.getSnapshot().receipts;

    expect(engine.getSnapshot().state.return.collection.status).toBe("cancelled");
    expect(receipts[0].status).toBe("compensated");
    expect(receipts[1].title).toBe("Cancelled collection");
  });

  it("blocks unsafe undo after a resource version conflict", async () => {
    await engine.run("update_collection_address", {
      orderId: "1842",
      address: "22 New Road",
    });
    const receipt = engine.getSnapshot().receipts[0];
    engine.simulateVersionConflict(RESOURCE_KEYS.address);
    const result = await engine.revert(receipt.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VERSION_CONFLICT");
    expect(engine.getSnapshot().state.return.collectionAddress).toBe("22 New Road");
  });

  it("returns actionable validation errors", async () => {
    const result = await engine.run("update_collection_address", {
      orderId: "1842",
      address: "x",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_INPUT");
      expect(result.error).toContain("address");
    }
    expect(engine.getSnapshot().receipts).toHaveLength(1);
    expect(engine.getSnapshot().receipts[0].status).toBe("failed");
  });
});

async function runToRefund(engine: ReturnType<typeof createDemoEngine>) {
  await engine.run("create_return_draft", {
    orderId: "1842",
    itemIds: ["headphones", "case"],
  });
  await engine.run("add_return_reason", {
    orderId: "1842",
    reason: "Incompatible with my laptop",
  });
  await engine.run("update_collection_address", {
    orderId: "1842",
    address: "22 New Road",
  });
  await engine.run("book_collection", {
    orderId: "1842",
    date: "Next Friday",
  });
  await engine.run("prepare_refund", { orderId: "1842" });
  return engine.run("issue_refund", { orderId: "1842" });
}
