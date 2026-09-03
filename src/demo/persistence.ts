import { z } from "zod";
import type { DemoState } from "./data";

const DEMO_STATE_KEY = "remy:return-demo:v1";

const demoStateSchema = z.strictObject({
  order: z.strictObject({
    id: z.literal("1842"),
    status: z.literal("delivered"),
    deliveredAt: z.string(),
    items: z.array(
      z.strictObject({
        id: z.enum(["headphones", "case"]),
        name: z.string(),
        detail: z.string(),
        price: z.number(),
      }),
    ),
    paymentMethod: z.string(),
  }),
  returnRequest: z.strictObject({
    id: z.literal("RET-1842").optional(),
    status: z.enum(["not_started", "draft", "complete"]),
    itemIds: z.array(z.enum(["headphones", "case"])),
    reason: z.string().optional(),
    collectionAddress: z.string(),
    collection: z.strictObject({
      status: z.enum(["not_booked", "booked", "cancelled"]),
      date: z.string().optional(),
      bookingId: z.string().optional(),
    }),
    refund: z.strictObject({
      status: z.enum(["not_issued", "issued"]),
      amount: z.literal(84),
      refundId: z.string().optional(),
    }),
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
