export type ProductColour = "Charcoal" | "Oat";
export type DeliveryMethod = "standard" | "express";

export type CartLine = {
  productId: "morrow-one";
  name: string;
  price: number;
  colour: ProductColour;
  quantity: number;
};

export type DemoState = {
  product: {
    id: "morrow-one";
    name: string;
    price: number;
    description: string;
  };
  cart: {
    line?: CartLine;
    delivery: DeliveryMethod;
    discount?: { code: "HELLO10" };
  };
  customer: {
    deliveryAddress: string;
    paymentMethod: string;
  };
  order: {
    status: "not_placed" | "placed";
    id?: string;
  };
  versions: Record<string, number>;
};

export const RESOURCE_KEYS = {
  cart: "cart:morrow-one",
  quantity: "cart:morrow-one:quantity",
  delivery: "cart:delivery",
  discount: "cart:discount",
  order: "order:checkout",
} as const;

export function createInitialDemoState(): DemoState {
  return {
    product: {
      id: "morrow-one",
      name: "Morrow One",
      price: 128,
      description:
        "Soft-cushion wireless headphones with 40-hour battery life and a canvas travel case.",
    },
    cart: {
      delivery: "standard",
    },
    customer: {
      deliveryAddress: "14 High Street, London",
      paymentMethod: "Visa ending 4242",
    },
    order: {
      status: "not_placed",
    },
    versions: {
      [RESOURCE_KEYS.cart]: 1,
      [RESOURCE_KEYS.quantity]: 1,
      [RESOURCE_KEYS.delivery]: 1,
      [RESOURCE_KEYS.discount]: 1,
      [RESOURCE_KEYS.order]: 1,
    },
  };
}

export function getSubtotal(state: DemoState) {
  return state.cart.line
    ? state.cart.line.price * state.cart.line.quantity
    : 0;
}

export function getDeliveryCost(state: DemoState) {
  return state.cart.line && state.cart.delivery === "express" ? 8 : 0;
}

export function getDiscount(state: DemoState) {
  return state.cart.discount ? Math.round(getSubtotal(state) * 0.1) : 0;
}

export function getCartTotal(state: DemoState) {
  return getSubtotal(state) + getDeliveryCost(state) - getDiscount(state);
}
