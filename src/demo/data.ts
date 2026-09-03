export type DemoState = {
  readonly order: {
    readonly id: "1842";
    readonly status: "delivered";
    readonly deliveredAt: string;
    readonly items: ReadonlyArray<{
      readonly id: "headphones" | "case";
      readonly name: string;
      readonly detail: string;
      readonly price: number;
    }>;
    readonly paymentMethod: string;
  };
  readonly returnRequest: {
    readonly id?: "RET-1842";
    readonly status: "not_started" | "draft" | "complete";
    readonly itemIds: ReadonlyArray<"headphones" | "case">;
    readonly reason?: string;
    readonly collectionAddress: string;
    readonly collection: {
      readonly status: "not_booked" | "booked" | "cancelled";
      readonly date?: string;
      readonly bookingId?: string;
    };
    readonly refund: {
      readonly status: "not_issued" | "issued";
      readonly amount: 84;
      readonly refundId?: string;
    };
  };
  readonly versions: Readonly<Record<string, number>>;
};

export const RESOURCE_KEYS = {
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
      deliveredAt: "28 August 2026",
      items: [
        {
          id: "headphones",
          name: "Morrow One headphones",
          detail: "Charcoal",
          price: 64,
        },
        {
          id: "case",
          name: "Canvas travel case",
          detail: "Olive",
          price: 20,
        },
      ],
      paymentMethod: "Visa ending 4242",
    },
    returnRequest: {
      status: "not_started",
      itemIds: [],
      collectionAddress: "14 High Street",
      collection: { status: "not_booked" },
      refund: { status: "not_issued", amount: 84 },
    },
    versions: {
      [RESOURCE_KEYS.returnDraft]: 1,
      [RESOURCE_KEYS.returnReason]: 1,
      [RESOURCE_KEYS.address]: 1,
      [RESOURCE_KEYS.collection]: 1,
      [RESOURCE_KEYS.refund]: 1,
    },
  };
}
