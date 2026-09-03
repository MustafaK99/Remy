import type { RemyClient, RunResult } from "@remy-ai/core";
import type { WebMCPTool } from "@remy-ai/webmcp";
import type { DemoStore } from "./store";

type PrepareOrderInput = {
  readonly productId: "morrow-one";
  readonly colour: "Charcoal" | "Oat";
  readonly quantity: number;
  readonly delivery: "standard" | "express";
  readonly discountCode?: "HELLO10";
};

const allowedInputKeys = new Set([
  "productId",
  "colour",
  "quantity",
  "delivery",
  "discountCode",
]);

function parseInput(input: unknown): PrepareOrderInput | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => !allowedInputKeys.has(key))) return undefined;
  if (value.productId !== "morrow-one") return undefined;
  if (value.colour !== "Charcoal" && value.colour !== "Oat") return undefined;
  if (!Number.isInteger(value.quantity) || Number(value.quantity) < 1 || Number(value.quantity) > 3) {
    return undefined;
  }
  if (value.delivery !== "standard" && value.delivery !== "express") return undefined;
  if (value.discountCode !== undefined && value.discountCode !== "HELLO10") return undefined;
  return value as PrepareOrderInput;
}

function stoppedAt(step: string, result: RunResult, receiptIds: string[]) {
  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.error,
      stoppedAt: step,
      receiptIds,
    };
  }
  return {
    ok: true,
    status: result.status,
    requiresApproval: result.requiresApproval ?? false,
    message: `${step} did not complete automatically. Resolve it in Remy before continuing.`,
    stoppedAt: step,
    actionId: result.actionId,
    receiptIds,
  };
}

/**
 * Demo-only convenience tool. It reduces host round trips while every underlying
 * state change still runs through Remy and receives its own semantic receipt.
 */
export function createPrepareDemoOrderTool(
  remy: RemyClient<DemoStore>,
): WebMCPTool {
  return {
    name: "prepare_demo_order",
    title: "Prepare the demo order",
    description:
      "Demo only. In one request, add Morrow One to the bag, choose delivery, optionally apply HELLO10, and read the final total. Every change runs through Remy and leaves its own receipt. This does not place an order or charge payment.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", const: "morrow-one" },
        colour: { type: "string", enum: ["Charcoal", "Oat"] },
        quantity: { type: "integer", minimum: 1, maximum: 3 },
        delivery: { type: "string", enum: ["standard", "express"] },
        discountCode: { type: "string", const: "HELLO10" },
      },
      required: ["productId", "colour", "quantity", "delivery"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (rawInput) => {
      const input = parseInput(rawInput);
      if (!input) {
        return {
          ok: false,
          code: "INVALID_INPUT",
          message: "Choose Morrow One, a valid colour, quantity from 1 to 3, and a delivery method.",
        };
      }

      const controls = remy.getSnapshot().controls;
      if (controls.paused || controls.autonomy === "preview" || controls.autonomy === "ask") {
        return {
          ok: false,
          code: "STEPWISE_APPROVAL_REQUIRED",
          message: "This shortcut is available in Reversible actions or Trusted run. Use the individual tools when every change must be previewed or approved.",
        };
      }

      const steps: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ["add_to_cart", {
          productId: input.productId,
          colour: input.colour,
          quantity: input.quantity,
        }],
        ["choose_delivery", { method: input.delivery }],
        ...(input.discountCode
          ? [["apply_discount", { code: input.discountCode }] as const]
          : []),
        ["prepare_checkout", {}],
      ];
      const receiptIds: string[] = [];
      let checkoutOutput: unknown;

      for (const [step, stepInput] of steps) {
        const result = await remy.runByName(step, stepInput, {
          actor: "agent",
          transport: "webmcp",
        });
        if (result.actionId) receiptIds.push(result.actionId);
        if (!result.ok || result.status !== "committed") {
          return stoppedAt(step, result, receiptIds);
        }
        if (step === "prepare_checkout" && result.output !== undefined) {
          checkoutOutput = remy.exposeOutput(step, result.output);
        }
      }

      return {
        ok: true,
        status: "prepared",
        summary: "The fictional Morrow order is ready for the purchase decision.",
        checkout: checkoutOutput,
        receiptIds,
        nextTool: "place_order",
      };
    },
  };
}
