import { beforeEach, describe, expect, it } from "vitest";
import { summarizeActionRun } from "@remy-ai/core";
import { RESOURCE_KEYS } from "./data";
import { createDemoRuntime } from "./runtime";

describe("Morrow demo on the generic Remy client", () => {
  let runtime: ReturnType<typeof createDemoRuntime>;

  beforeEach(() => {
    runtime = createDemoRuntime();
  });

  it("runs reversible work and pauses before the purchase", async () => {
    await runToPurchase(runtime);
    const state = runtime.store.getSnapshot();
    const receipts = runtime.remy.getSnapshot().receipts;
    expect(state.cart.line).toMatchObject({ productId: "morrow-one", colour: "Charcoal", quantity: 1 });
    expect(state.cart.delivery).toBe("express");
    expect(state.cart.discount?.code).toBe("HELLO10");
    expect(state.order.status).toBe("not_placed");
    expect(receipts.at(-1)?.status).toBe("awaiting_approval");
    expect(receipts.at(-1)?.action.title).toBe("Place the demo order");
  });

  it("uses authoritative cart state when the purchase is approved", async () => {
    await runToPurchase(runtime);
    const pending = runtime.remy.getSnapshot().receipts.at(-1)!;
    expect((await runtime.remy.approve(pending.id)).ok).toBe(true);
    expect(runtime.store.getSnapshot().order).toEqual({ id: "MO-2048", status: "placed" });
  });

  it("allows unattended purchase only with a generic grant", async () => {
    runtime.remy.setControls({ autonomy: "trusted", paused: false, grants: ["commerce.purchase"] });
    const result = await runToPurchase(runtime);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("committed");
    expect(runtime.store.getSnapshot().order.status).toBe("placed");
  });

  it("records principal assurance explicitly", async () => {
    runtime.remy.identifyPrincipal({ id: "claude:demo", name: "Claude", provider: "Anthropic", assurance: "self-reported" });
    await addHeadphones(runtime);
    expect(runtime.remy.getSnapshot().receipts[0].principal).toMatchObject({ id: "claude:demo", name: "Claude", assurance: "self-reported" });
  });

  it("stages requests for more access until the user approves", () => {
    const request = runtime.remy.requestControlChange({ autonomy: "trusted", paused: false, grants: ["commerce.purchase"] });
    expect(runtime.remy.getSnapshot().controls.autonomy).toBe("reversible");
    expect(runtime.remy.getSnapshot().controls.grants).toEqual([]);
    expect(runtime.remy.approveControlChange(request.id)).toBe(true);
    expect(runtime.remy.getSnapshot().controls.grants).toEqual(["commerce.purchase"]);
  });

  it("invalidates a purchase approval when the bag changes", async () => {
    await runToPurchase(runtime);
    const pending = runtime.remy.getSnapshot().receipts.at(-1)!;
    await runtime.remy.runByName("set_quantity", { productId: "morrow-one", quantity: 2 }, { actor: "user", transport: "manual" });
    const result = await runtime.remy.approve(pending.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("STALE_APPROVAL");
    expect(runtime.store.getSnapshot().order.status).toBe("not_placed");
  });

  it("does not repeat a mutation with the same idempotency key", async () => {
    const first = await runtime.remy.runByName("add_to_cart", { productId: "morrow-one", colour: "Charcoal", quantity: 1 }, { idempotencyKey: "same-add" });
    const second = await runtime.remy.runByName("add_to_cart", { productId: "morrow-one", colour: "Oat", quantity: 2 }, { idempotencyKey: "same-add" });
    expect(first.ok && second.ok && second.actionId).toBe(first.ok && first.actionId);
    expect(runtime.store.getSnapshot().cart.line?.colour).toBe("Charcoal");
    expect(runtime.remy.getSnapshot().receipts).toHaveLength(1);
  });

  it("recovers an item addition with a linked append-only receipt", async () => {
    await addHeadphones(runtime);
    const original = runtime.remy.getSnapshot().receipts[0];
    expect((await runtime.remy.revert(original.id)).ok).toBe(true);
    const receipts = runtime.remy.getSnapshot().receipts;
    expect(runtime.store.getSnapshot().cart.line).toBeUndefined();
    expect(receipts).toHaveLength(2);
    expect(receipts[0].status).toBe("reverted");
    expect(receipts[1].reversesReceiptId).toBe(original.id);
  });

  it("restores the previous delivery choice", async () => {
    await addHeadphones(runtime);
    await runtime.remy.runByName("choose_delivery", { method: "express" });
    const delivery = runtime.remy.getSnapshot().receipts.at(-1)!;
    await runtime.remy.revert(delivery.id);
    expect(runtime.store.getSnapshot().cart.delivery).toBe("standard");
    expect(runtime.remy.getSnapshot().receipts.at(-1)?.reversesReceiptId).toBe(delivery.id);
  });

  it("summarizes state-changing actions for developer tooling", async () => {
    await addHeadphones(runtime);
    await runtime.remy.runByName("choose_delivery", { method: "express" });
    const delivery = runtime.remy.getSnapshot().receipts.at(-1)!;
    await runtime.remy.runByName("apply_discount", { code: "HELLO10" });
    await runtime.remy.runByName("prepare_checkout", {});
    await runtime.remy.revert(delivery.id);
    const purchase = await runtime.remy.runByName("place_order", {});
    if (purchase.ok) await runtime.remy.approve(purchase.actionId);
    expect(summarizeActionRun([...runtime.remy.getSnapshot().receipts])).toEqual({ changes: 4, automatic: 3, approvals: 1, recovered: 1, unresolved: 0 });
  });

  it("blocks unsafe recovery after a resource-version conflict", async () => {
    await addHeadphones(runtime);
    await runtime.remy.runByName("choose_delivery", { method: "express" });
    const receipt = runtime.remy.getSnapshot().receipts.at(-1)!;
    runtime.store.bumpVersion?.(RESOURCE_KEYS.delivery);
    const result = await runtime.remy.revert(receipt.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VERSION_CONFLICT");
    expect(runtime.store.getSnapshot().cart.delivery).toBe("express");
  });

  it("lets direct website interactions work under restrictive agent controls", async () => {
    runtime.remy.setPaused(true);
    const agentResult = await addHeadphones(runtime);
    const userResult = await runtime.remy.runByName("add_to_cart", { productId: "morrow-one", colour: "Oat", quantity: 1 }, { actor: "user", transport: "manual" });
    expect(agentResult.ok).toBe(false);
    expect(userResult.ok).toBe(true);
    expect(runtime.store.getSnapshot().cart.line?.colour).toBe("Oat");
  });

  it("returns actionable validation errors without storing raw input", async () => {
    const result = await runtime.remy.runByName("add_to_cart", { productId: "morrow-one", colour: "Charcoal", quantity: 12, secret: "must-not-persist" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_INPUT");
    const receipt = runtime.remy.getSnapshot().receipts[0];
    expect(receipt.status).toBe("failed");
    expect(JSON.stringify(receipt)).not.toContain("must-not-persist");
  });
});

function addHeadphones(runtime: ReturnType<typeof createDemoRuntime>) {
  return runtime.remy.runByName("add_to_cart", { productId: "morrow-one", colour: "Charcoal", quantity: 1 });
}

async function runToPurchase(runtime: ReturnType<typeof createDemoRuntime>) {
  await addHeadphones(runtime);
  await runtime.remy.runByName("choose_delivery", { method: "express" });
  await runtime.remy.runByName("apply_discount", { code: "HELLO10" });
  await runtime.remy.runByName("prepare_checkout", {});
  return runtime.remy.runByName("place_order", {});
}
