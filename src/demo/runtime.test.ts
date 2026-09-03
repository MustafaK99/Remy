import { beforeEach, describe, expect, it } from "vitest";
import { summarizeActionRun } from "@remy-ai/core";
import { RESOURCE_KEYS } from "./data";
import { createDemoRuntime } from "./runtime";

describe("return demo on the generic Remy client", () => {
  let runtime: ReturnType<typeof createDemoRuntime>;

  beforeEach(() => {
    runtime = createDemoRuntime();
  });

  it("runs recoverable return work and pauses before the refund", async () => {
    await runToRefund(runtime);
    const state = runtime.store.getSnapshot();
    const receipts = runtime.remy.getSnapshot().receipts;
    expect(state.returnRequest).toMatchObject({
      status: "draft",
      itemIds: ["headphones", "case"],
      reason: "Incompatible with my laptop",
      collectionAddress: "22 New Road",
      collection: { status: "booked", date: "next Friday" },
      refund: { status: "not_issued", amount: 84 },
    });
    expect(receipts.at(-1)?.status).toBe("awaiting_approval");
    expect(receipts.at(-1)?.action.title).toBe("Refund £84");
  });

  it("issues the authoritative refund after explicit approval", async () => {
    await runToRefund(runtime);
    const pending = runtime.remy.getSnapshot().receipts.at(-1)!;
    expect((await runtime.remy.approve(pending.id)).ok).toBe(true);
    expect(runtime.store.getSnapshot().returnRequest).toMatchObject({
      status: "complete",
      refund: { status: "issued", amount: 84, refundId: "RF-1842" },
    });
  });

  it("lets trusted mode run the irreversible refund without another approval", async () => {
    runtime.remy.setControls({ autonomy: "trusted", paused: false, grants: [] });
    const result = await runToRefund(runtime);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("committed");
    expect(runtime.store.getSnapshot().returnRequest.refund.status).toBe("issued");
  });

  it.each([
    ["preview", "staged"],
    ["ask", "awaiting_approval"],
    ["reversible", "committed"],
    ["trusted", "committed"],
  ] as const)("applies %s mode to a recoverable action", async (autonomy, status) => {
    runtime.remy.setControls({ autonomy, paused: false, grants: [] });
    const result = await createReturn(runtime);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe(status);
  });

  it("records self-reported principal assurance explicitly", async () => {
    runtime.remy.identifyPrincipal({
      id: "claude:demo",
      name: "Claude",
      provider: "Anthropic",
      assurance: "self-reported",
    });
    await createReturn(runtime);
    expect(runtime.remy.getSnapshot().receipts[0].principal).toMatchObject({
      id: "claude:demo",
      name: "Claude",
      assurance: "self-reported",
    });
  });

  it("stages requests for trusted access until the user approves", () => {
    const request = runtime.remy.requestControlChange({
      autonomy: "trusted",
      paused: false,
      grants: [],
    });
    expect(runtime.remy.getSnapshot().controls.autonomy).toBe("reversible");
    expect(runtime.remy.approveControlChange(request.id)).toBe(true);
    expect(runtime.remy.getSnapshot().controls.autonomy).toBe("trusted");
  });

  it("records rejection without changing the application", async () => {
    runtime.remy.setAutonomy("ask");
    const result = await createReturn(runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(runtime.remy.reject(result.actionId).ok).toBe(true);
    expect(runtime.store.getSnapshot().returnRequest.status).toBe("not_started");
    expect(runtime.remy.getSnapshot().receipts[0].status).toBe("rejected");
  });

  it("invalidates refund approval after the protected resource changes", async () => {
    await runToRefund(runtime);
    const pending = runtime.remy.getSnapshot().receipts.at(-1)!;
    runtime.store.bumpVersion?.(RESOURCE_KEYS.refund);
    const result = await runtime.remy.approve(pending.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("STALE_APPROVAL");
    expect(runtime.store.getSnapshot().returnRequest.refund.status).toBe("not_issued");
  });

  it("does not repeat a mutation with the same idempotency key", async () => {
    const input = { orderId: "1842", itemIds: ["headphones", "case"] } as const;
    const first = await runtime.remy.runByName("create_return", input, {
      idempotencyKey: "same-return",
    });
    const second = await runtime.remy.runByName("create_return", input, {
      idempotencyKey: "same-return",
    });
    expect(first.ok && second.ok && second.actionId).toBe(first.ok && first.actionId);
    expect(runtime.remy.getSnapshot().receipts).toHaveLength(1);
  });

  it("restores the collection address with a linked append-only receipt", async () => {
    await runtime.remy.runByName("change_collection_address", {
      orderId: "1842",
      address: "22 New Road",
    });
    const original = runtime.remy.getSnapshot().receipts[0];
    expect((await runtime.remy.revert(original.id)).ok).toBe(true);
    const receipts = runtime.remy.getSnapshot().receipts;
    expect(runtime.store.getSnapshot().returnRequest.collectionAddress).toBe("14 High Street");
    expect(receipts).toHaveLength(2);
    expect(receipts[0].status).toBe("reverted");
    expect(receipts[1].reversesReceiptId).toBe(original.id);
  });

  it("cancels a collection through compensation and keeps the booking receipt", async () => {
    await runtime.remy.runByName("book_collection", {
      orderId: "1842",
      date: "next Friday",
    });
    const booking = runtime.remy.getSnapshot().receipts[0];
    expect((await runtime.remy.revert(booking.id)).ok).toBe(true);
    const receipts = runtime.remy.getSnapshot().receipts;
    expect(runtime.store.getSnapshot().returnRequest.collection.status).toBe("cancelled");
    expect(receipts[0].status).toBe("compensated");
    expect(receipts[1].reversesReceiptId).toBe(booking.id);
  });

  it("summarizes only the state-changing return actions", async () => {
    await runToRefund(runtime);
    const address = runtime.remy
      .getSnapshot()
      .receipts.find((receipt) => receipt.action.name === "change_collection_address")!;
    await runtime.remy.revert(address.id);
    const refund = runtime.remy.getSnapshot().receipts.find(
      (receipt) => receipt.action.name === "issue_refund",
    )!;
    await runtime.remy.approve(refund.id);
    expect(summarizeActionRun([...runtime.remy.getSnapshot().receipts])).toEqual({
      changes: 5,
      automatic: 4,
      approvals: 1,
      recovered: 1,
      unresolved: 0,
    });
  });

  it("blocks recovery after a resource-version conflict", async () => {
    await runtime.remy.runByName("change_collection_address", {
      orderId: "1842",
      address: "22 New Road",
    });
    const receipt = runtime.remy.getSnapshot().receipts[0];
    runtime.store.bumpVersion?.(RESOURCE_KEYS.address);
    const result = await runtime.remy.revert(receipt.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VERSION_CONFLICT");
    expect(runtime.store.getSnapshot().returnRequest.collectionAddress).toBe("22 New Road");
  });

  it("keeps direct website actions usable under restrictive agent controls", async () => {
    runtime.remy.setPaused(true);
    const agentResult = await createReturn(runtime);
    const userResult = await runtime.remy.runByName(
      "create_return",
      { orderId: "1842", itemIds: ["headphones", "case"] },
      { actor: "user", transport: "manual" },
    );
    expect(agentResult.ok).toBe(false);
    expect(userResult.ok).toBe(true);
    expect(runtime.store.getSnapshot().returnRequest.status).toBe("draft");
  });

  it("returns validation errors without storing raw private input", async () => {
    const result = await runtime.remy.runByName("change_collection_address", {
      orderId: "1842",
      address: "x",
      secret: "must-not-persist",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
    const receipt = runtime.remy.getSnapshot().receipts[0];
    expect(receipt.status).toBe("failed");
    expect(JSON.stringify(receipt)).not.toContain("must-not-persist");
  });
});

function createReturn(runtime: ReturnType<typeof createDemoRuntime>) {
  return runtime.remy.runByName("create_return", {
    orderId: "1842",
    itemIds: ["headphones", "case"],
  });
}

async function runToRefund(runtime: ReturnType<typeof createDemoRuntime>) {
  await createReturn(runtime);
  await runtime.remy.runByName("add_return_reason", {
    orderId: "1842",
    reason: "Incompatible with my laptop",
  });
  await runtime.remy.runByName("change_collection_address", {
    orderId: "1842",
    address: "22 New Road",
  });
  await runtime.remy.runByName("book_collection", {
    orderId: "1842",
    date: "next Friday",
  });
  return runtime.remy.runByName("issue_refund", { orderId: "1842" });
}
