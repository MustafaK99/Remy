import { beforeEach, describe, expect, it } from "vitest";
import { createDemoEngine } from "@/demo/create-engine";
import { RESOURCE_KEYS } from "@/demo/data";

describe("Remy shop demo engine", () => {
  let engine: ReturnType<typeof createDemoEngine>;

  beforeEach(() => {
    engine = createDemoEngine();
  });

  it("runs safe shopping actions and pauses before the purchase", async () => {
    await runToPurchase(engine);
    const snapshot = engine.getSnapshot();

    expect(snapshot.state.cart.line).toMatchObject({
      productId: "morrow-one",
      colour: "Charcoal",
      quantity: 1,
    });
    expect(snapshot.state.cart.delivery).toBe("express");
    expect(snapshot.state.cart.discount?.code).toBe("HELLO10");
    expect(snapshot.state.order.status).toBe("not_placed");
    expect(snapshot.receipts.at(-1)?.status).toBe("awaiting_approval");
    expect(snapshot.receipts.at(-1)?.title).toBe("Place the order");
  });

  it("uses authoritative cart state when the purchase is approved", async () => {
    await runToPurchase(engine);
    const pending = engine.getSnapshot().receipts.at(-1);
    const result = await engine.approve(pending!.id);

    expect(result.ok).toBe(true);
    expect(engine.getSnapshot().state.order).toEqual({
      id: "MO-2048",
      status: "placed",
    });
    expect(engine.getSnapshot().receipts.at(-1)?.status).toBe("committed");
  });

  it("allows an unattended purchase only after it is explicitly enabled", async () => {
    engine.setControls({
      autonomy: "trusted",
      paused: false,
      allowPurchases: true,
    });
    const result = await runToPurchase(engine);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("committed");
    expect(engine.getSnapshot().state.order.status).toBe("placed");
  });

  it("records a self-reported assistant identity on its actions", async () => {
    engine.identifyAgent({
      id: "claude:demo",
      name: "Claude",
      provider: "Anthropic",
    });
    await addHeadphones(engine);

    expect(engine.getSnapshot().receipts[0].agent).toMatchObject({
      id: "claude:demo",
      name: "Claude",
      selfReported: true,
    });
  });

  it("stages a request for more control until the user approves it", () => {
    const request = engine.requestControlChange({
      autonomy: "trusted",
      paused: false,
      allowPurchases: true,
    });

    expect(engine.getSnapshot().autonomy).toBe("reversible");
    expect(engine.getSnapshot().allowPurchases).toBe(false);
    expect(engine.approveControlChange(request.id)).toBe(true);
    expect(engine.getSnapshot().autonomy).toBe("trusted");
    expect(engine.getSnapshot().allowPurchases).toBe(true);
  });

  it("invalidates a purchase approval when the bag changes", async () => {
    await runToPurchase(engine);
    const pending = engine.getSnapshot().receipts.at(-1)!;
    await engine.run(
      "set_quantity",
      { productId: "morrow-one", quantity: 2 },
      { actor: "user", transport: "manual" },
    );
    const result = await engine.approve(pending.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("STALE_APPROVAL");
    expect(engine.getSnapshot().state.order.status).toBe("not_placed");
    expect(
      engine.getSnapshot().receipts.find((receipt) => receipt.id === pending.id)
        ?.status,
    ).toBe("failed");
  });

  it("does not repeat a mutation with the same idempotency key", async () => {
    const first = await engine.run(
      "add_to_cart",
      { productId: "morrow-one", colour: "Charcoal", quantity: 1 },
      { idempotencyKey: "same-add" },
    );
    const second = await engine.run(
      "add_to_cart",
      { productId: "morrow-one", colour: "Oat", quantity: 2 },
      { idempotencyKey: "same-add" },
    );

    expect(first.ok && second.ok && second.actionId).toBe(first.ok && first.actionId);
    expect(engine.getSnapshot().state.cart.line?.colour).toBe("Charcoal");
    expect(engine.getSnapshot().receipts).toHaveLength(1);
  });

  it("undoes an item addition with a linked append-only receipt", async () => {
    await addHeadphones(engine);
    const original = engine.getSnapshot().receipts[0];
    const result = await engine.revert(original.id);
    const receipts = engine.getSnapshot().receipts;

    expect(result.ok).toBe(true);
    expect(engine.getSnapshot().state.cart.line).toBeUndefined();
    expect(receipts).toHaveLength(2);
    expect(receipts[0].status).toBe("reverted");
    expect(receipts[1].reversesReceiptId).toBe(original.id);
  });

  it("restores the previous delivery choice", async () => {
    await addHeadphones(engine);
    await engine.run("choose_delivery", { method: "express" });
    const delivery = engine.getSnapshot().receipts.at(-1)!;
    await engine.revert(delivery.id);

    expect(engine.getSnapshot().state.cart.delivery).toBe("standard");
    expect(engine.getSnapshot().receipts.at(-1)?.reversesReceiptId).toBe(
      delivery.id,
    );
  });

  it("blocks unsafe undo after a resource version conflict", async () => {
    await addHeadphones(engine);
    await engine.run("choose_delivery", { method: "express" });
    const receipt = engine.getSnapshot().receipts.at(-1)!;
    engine.simulateVersionConflict(RESOURCE_KEYS.delivery);
    const result = await engine.revert(receipt.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VERSION_CONFLICT");
    expect(engine.getSnapshot().state.cart.delivery).toBe("express");
  });

  it("lets direct website interactions work under restrictive AI controls", async () => {
    engine.setPaused(true);
    const agentResult = await addHeadphones(engine);
    const userResult = await engine.run(
      "add_to_cart",
      { productId: "morrow-one", colour: "Oat", quantity: 1 },
      { actor: "user", transport: "manual" },
    );

    expect(agentResult.ok).toBe(false);
    expect(userResult.ok).toBe(true);
    expect(engine.getSnapshot().state.cart.line?.colour).toBe("Oat");
  });

  it("returns actionable validation errors", async () => {
    const result = await engine.run("add_to_cart", {
      productId: "morrow-one",
      colour: "Charcoal",
      quantity: 12,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_INPUT");
      expect(result.error).toContain("quantity");
    }
    expect(engine.getSnapshot().receipts[0].status).toBe("failed");
  });
});

function addHeadphones(engine: ReturnType<typeof createDemoEngine>) {
  return engine.run("add_to_cart", {
    productId: "morrow-one",
    colour: "Charcoal",
    quantity: 1,
  });
}

async function runToPurchase(engine: ReturnType<typeof createDemoEngine>) {
  await addHeadphones(engine);
  await engine.run("choose_delivery", { method: "express" });
  await engine.run("apply_discount", { code: "HELLO10" });
  await engine.run("prepare_checkout", {});
  return engine.run("place_order", {});
}
