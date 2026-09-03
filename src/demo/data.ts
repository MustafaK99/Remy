export type DemoState = {
  order: {
    id: "1842";
    status: "delivered";
    items: Array<{ id: string; name: string; price: number }>;
    paymentMethod: string;
  };
  return: {
    status: "not_started" | "draft" | "ready";
    reason?: string;
    collectionAddress: string;
    collection: {
      status: "not_booked" | "booked" | "cancelled";
      date?: string;
      bookingId?: string;
    };
    refund: {
      status: "not_prepared" | "prepared" | "issued";
      amount: number;
    };
  };
  versions: Record<string, number>;
};

export const RESOURCE_KEYS = {
  order: "order:1842",
  returnDraft: "return:1842:draft",
  returnReason: "return:1842:reason",
  address: "return:1842:address",
  collection: "return:1842:collection",
  refund: "return:1842:refund",
} as const;

export function createInitialDemoState(): DemoState {
  return {
    order: {
      id: "1842",
      status: "delivered",
      items: [
        { id: "headphones", name: "Studio headphones", price: 64 },
        { id: "case", name: "Travel case", price: 20 },
      ],
      paymentMethod: "Visa ending 4242",
    },
    return: {
      status: "not_started",
      collectionAddress: "14 High Street",
      collection: { status: "not_booked" },
      refund: { status: "not_prepared", amount: 84 },
    },
    versions: {
      [RESOURCE_KEYS.order]: 1,
      [RESOURCE_KEYS.returnDraft]: 1,
      [RESOURCE_KEYS.returnReason]: 1,
      [RESOURCE_KEYS.address]: 1,
      [RESOURCE_KEYS.collection]: 1,
      [RESOURCE_KEYS.refund]: 1,
    },
  };
}

export const HERO_PROMPT =
  "Return both items from order #1842, say they are incompatible with my laptop, collect them next Friday from 22 New Road, and refund the original payment method.";

