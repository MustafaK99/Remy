import { z } from "zod";
import type { DemoState } from "./data";

const DEMO_STATE_KEY = "remy:morrow-state:v1";

const demoStateSchema = z.strictObject({
  product: z.strictObject({
    id: z.literal("morrow-one"),
    name: z.string(),
    price: z.number(),
    description: z.string(),
  }),
  cart: z.strictObject({
    line: z.strictObject({
      productId: z.literal("morrow-one"),
      name: z.string(),
      price: z.number(),
      colour: z.enum(["Charcoal", "Oat"]),
      quantity: z.number().int().min(1).max(3),
    }).optional(),
    delivery: z.enum(["standard", "express"]),
    discount: z.strictObject({ code: z.literal("HELLO10") }).optional(),
  }),
  customer: z.strictObject({
    deliveryAddress: z.string(),
    paymentMethod: z.string(),
  }),
  order: z.strictObject({
    status: z.enum(["not_placed", "placed"]),
    id: z.string().optional(),
  }),
  versions: z.record(z.string(), z.number().int().nonnegative()),
});

export function loadDemoState(storage: Storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(DEMO_STATE_KEY);
    if (raw === null) return undefined;
    const parsed = demoStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data satisfies DemoState) : undefined;
  } catch {
    return undefined;
  }
}

export function saveDemoState(
  state: DemoState,
  storage: Storage = globalThis.localStorage,
) {
  try {
    storage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearDemoState(storage: Storage = globalThis.localStorage) {
  try {
    storage.removeItem(DEMO_STATE_KEY);
    return true;
  } catch {
    return false;
  }
}
