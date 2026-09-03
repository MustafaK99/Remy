import { describe, expect, it } from "vitest";
import { createDemoRuntime } from "./runtime";
import { createPrepareDemoOrderTool } from "./webmcp-tools";

describe("Morrow WebMCP convenience tools", () => {
  it("prepares the order in one call while keeping separate receipts", async () => {
    const runtime = createDemoRuntime();
    runtime.remy.identifyPrincipal({
      id: "chatgpt:test",
      name: "ChatGPT",
      provider: "OpenAI",
      assurance: "self-reported",
    });
    const tool = createPrepareDemoOrderTool(runtime.remy);

    const result = await tool.execute({
      productId: "morrow-one",
      colour: "Charcoal",
      quantity: 1,
      delivery: "express",
      discountCode: "HELLO10",
    });

    expect(result).toMatchObject({
      ok: true,
      status: "prepared",
      checkout: { total: 123 },
      nextTool: "place_order",
    });
    expect(runtime.remy.getSnapshot().receipts.map((receipt) => receipt.action.name)).toEqual([
      "add_to_cart",
      "choose_delivery",
      "apply_discount",
      "prepare_checkout",
    ]);
    expect(runtime.remy.getSnapshot().receipts.every((receipt) => receipt.principal?.name === "ChatGPT")).toBe(true);
  });

  it("does not collapse stepwise approval modes into a batch", async () => {
    const runtime = createDemoRuntime();
    runtime.remy.setControls({ autonomy: "ask", paused: false, grants: [] });
    const tool = createPrepareDemoOrderTool(runtime.remy);

    expect(await tool.execute({
      productId: "morrow-one",
      colour: "Oat",
      quantity: 1,
      delivery: "standard",
    })).toMatchObject({ ok: false, code: "STEPWISE_APPROVAL_REQUIRED" });
    expect(runtime.remy.getSnapshot().receipts).toHaveLength(0);
  });
});
