import { z } from "zod";
import type {
  ActionDefinition,
  ActionPreview,
  ActionReceipt,
} from "@/remy/core/types";
import {
  RESOURCE_KEYS,
  getCartTotal,
  getDeliveryCost,
  getDiscount,
  getSubtotal,
  type CartLine,
  type DemoState,
} from "./data";

const emptySchema = z.object({}).strict();
const productSchema = z
  .object({ productId: z.literal("morrow-one") })
  .strict();

function updateState(
  context: { getState: () => DemoState; setState: (state: DemoState) => void },
  update: (state: DemoState) => DemoState,
) {
  context.setState(update(context.getState()));
}

function change(
  label: string,
  path: string,
  before: unknown,
  after: unknown,
  displayBefore: string,
  displayAfter: string,
): ActionPreview["diff"][number] {
  return {
    path,
    label,
    kind: before === undefined ? "add" : after === undefined ? "remove" : "replace",
    before,
    after,
    displayBefore,
    displayAfter,
  };
}

export const getProductAction: ActionDefinition<
  DemoState,
  { productId: "morrow-one" }
> = {
  name: "get_product",
  title: "Read product details",
  description:
    "Read the price, colours, and availability for Morrow One headphones. This does not change the shop.",
  kind: "read",
  inputSchema: productSchema,
  inputJsonSchema: {
    type: "object",
    properties: { productId: { type: "string", const: "morrow-one" } },
    required: ["productId"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "irreversible",
  preview: (_input, context) => ({
    summary: "Read the Morrow One product details.",
    resourceKeys: [],
    before: context.getState().product,
    after: context.getState().product,
    diff: [],
  }),
  execute: (_input, context) => ({
    ...context.getState().product,
    colours: ["Charcoal", "Oat"],
    inStock: true,
  }),
};

export const getCartAction: ActionDefinition<DemoState, Record<string, never>> = {
  name: "get_cart",
  title: "Read shopping bag",
  description:
    "Read the current bag, delivery choice, discount, and authoritative total. This does not change the shop.",
  kind: "read",
  inputSchema: emptySchema,
  inputJsonSchema: { type: "object", properties: {}, additionalProperties: false },
  risk: "low",
  reversibility: "irreversible",
  preview: (_input, context) => ({
    summary: "Read the current shopping bag.",
    resourceKeys: [],
    before: context.getState().cart,
    after: context.getState().cart,
    diff: [],
  }),
  execute: (_input, context) => {
    const state = context.getState();
    return {
      item: state.cart.line,
      delivery: state.cart.delivery,
      discountCode: state.cart.discount?.code,
      total: getCartTotal(state),
    };
  },
};

export const addToCartAction: ActionDefinition<
  DemoState,
  { productId: "morrow-one"; colour: "Charcoal" | "Oat"; quantity: number }
> = {
  name: "add_to_cart",
  title: "Added Morrow One to bag",
  description:
    "Add Morrow One headphones to the shopping bag in the selected colour and quantity. This can be undone exactly.",
  kind: "mutation",
  inputSchema: z
    .object({
      productId: z.literal("morrow-one"),
      colour: z.enum(["Charcoal", "Oat"]),
      quantity: z.number().int().min(1).max(3),
    })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      productId: { type: "string", const: "morrow-one" },
      colour: { type: "string", enum: ["Charcoal", "Oat"] },
      quantity: { type: "integer", minimum: 1, maximum: 3 },
    },
    required: ["productId", "colour", "quantity"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => {
    const before = context.getState().cart.line;
    const after: CartLine = {
      productId: "morrow-one",
      name: context.getState().product.name,
      price: context.getState().product.price,
      colour: input.colour,
      quantity: input.quantity,
    };
    return {
      summary: `Add ${input.quantity} Morrow One in ${input.colour} to the bag.`,
      resourceKeys: [RESOURCE_KEYS.cart],
      before,
      after,
      diff: [
        change(
          "Shopping bag",
          "cart.line",
          before,
          after,
          before ? `${before.quantity} × ${before.name}` : "Empty",
          `${input.quantity} × Morrow One · ${input.colour}`,
        ),
      ],
    };
  },
  execute: (input, context) => {
    const line: CartLine = {
      productId: "morrow-one",
      name: context.getState().product.name,
      price: context.getState().product.price,
      colour: input.colour,
      quantity: input.quantity,
    };
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, line },
    }));
    return { item: line, total: getCartTotal(context.getState()) };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, line: receipt.before as CartLine | undefined },
    }));
    return { item: receipt.before };
  },
};

export const removeFromCartAction: ActionDefinition<
  DemoState,
  { productId: "morrow-one" }
> = {
  name: "remove_from_cart",
  title: "Removed Morrow One from bag",
  description:
    "Remove Morrow One from the shopping bag. This can be undone exactly.",
  kind: "mutation",
  inputSchema: productSchema,
  inputJsonSchema: getProductAction.inputJsonSchema,
  risk: "low",
  reversibility: "exact",
  preview: (_input, context) => {
    const before = context.getState().cart.line;
    if (!before) throw new Error("Morrow One is not in the bag.");
    return {
      summary: "Remove Morrow One from the shopping bag.",
      resourceKeys: [RESOURCE_KEYS.cart],
      before,
      after: undefined,
      diff: [
        change(
          "Shopping bag",
          "cart.line",
          before,
          undefined,
          `${before.quantity} × ${before.name}`,
          "Empty",
        ),
      ],
    };
  },
  execute: (_input, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, line: undefined, discount: undefined },
    }));
    return { removed: true };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, line: receipt.before as CartLine },
    }));
    return { item: receipt.before };
  },
};

export const setQuantityAction: ActionDefinition<
  DemoState,
  { productId: "morrow-one"; quantity: number }
> = {
  name: "set_quantity",
  title: "Changed bag quantity",
  description:
    "Set the quantity of Morrow One in the shopping bag. This can be undone exactly.",
  kind: "mutation",
  inputSchema: z
    .object({
      productId: z.literal("morrow-one"),
      quantity: z.number().int().min(1).max(3),
    })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      productId: { type: "string", const: "morrow-one" },
      quantity: { type: "integer", minimum: 1, maximum: 3 },
    },
    required: ["productId", "quantity"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => {
    const before = context.getState().cart.line?.quantity;
    if (!before) throw new Error("Add Morrow One before changing its quantity.");
    return {
      summary: `Change the bag quantity from ${before} to ${input.quantity}.`,
      resourceKeys: [RESOURCE_KEYS.cart],
      before,
      after: input.quantity,
      diff: [
        change(
          "Quantity",
          "cart.line.quantity",
          before,
          input.quantity,
          String(before),
          String(input.quantity),
        ),
      ],
    };
  },
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: {
        ...state.cart,
        line: state.cart.line
          ? { ...state.cart.line, quantity: input.quantity }
          : undefined,
      },
    }));
    return { quantity: input.quantity, total: getCartTotal(context.getState()) };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: {
        ...state.cart,
        line: state.cart.line
          ? { ...state.cart.line, quantity: receipt.before as number }
          : undefined,
      },
    }));
    return { quantity: receipt.before };
  },
};

export const chooseDeliveryAction: ActionDefinition<
  DemoState,
  { method: "standard" | "express" }
> = {
  name: "choose_delivery",
  title: "Changed delivery",
  description:
    "Choose standard or express delivery for the current bag. This can be undone exactly.",
  kind: "mutation",
  inputSchema: z.object({ method: z.enum(["standard", "express"]) }).strict(),
  inputJsonSchema: {
    type: "object",
    properties: { method: { type: "string", enum: ["standard", "express"] } },
    required: ["method"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => {
    if (!context.getState().cart.line) {
      throw new Error("Add an item before choosing delivery.");
    }
    const before = context.getState().cart.delivery;
    return {
      summary: `Choose ${input.method} delivery.`,
      resourceKeys: [RESOURCE_KEYS.delivery],
      before,
      after: input.method,
      diff: [
        change(
          "Delivery",
          "cart.delivery",
          before,
          input.method,
          before === "express" ? "Express · £8" : "Standard · Free",
          input.method === "express" ? "Express · £8" : "Standard · Free",
        ),
      ],
    };
  },
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, delivery: input.method },
    }));
    return { method: input.method, cost: getDeliveryCost(context.getState()) };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: {
        ...state.cart,
        delivery: receipt.before as DemoState["cart"]["delivery"],
      },
    }));
    return { method: receipt.before };
  },
};

export const applyDiscountAction: ActionDefinition<
  DemoState,
  { code: "HELLO10" }
> = {
  name: "apply_discount",
  title: "Applied 10% discount",
  description:
    "Apply the valid HELLO10 discount code to the current bag. This can be undone exactly.",
  kind: "mutation",
  inputSchema: z.object({ code: z.literal("HELLO10") }).strict(),
  inputJsonSchema: {
    type: "object",
    properties: { code: { type: "string", const: "HELLO10" } },
    required: ["code"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => {
    if (!context.getState().cart.line) {
      throw new Error("Add an item before applying a discount.");
    }
    const before = context.getState().cart.discount;
    return {
      summary: `Apply ${input.code} for 10% off.`,
      resourceKeys: [RESOURCE_KEYS.discount],
      before,
      after: { code: input.code },
      diff: [
        change(
          "Discount",
          "cart.discount",
          before,
          { code: input.code },
          before?.code ?? "None",
          `${input.code} · 10% off`,
        ),
      ],
    };
  },
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: { ...state.cart, discount: { code: input.code } },
    }));
    return {
      code: input.code,
      amountSaved: getDiscount(context.getState()),
      total: getCartTotal(context.getState()),
    };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      cart: {
        ...state.cart,
        discount: receipt.before as DemoState["cart"]["discount"],
      },
    }));
    return { discount: receipt.before };
  },
};

export const prepareCheckoutAction: ActionDefinition<
  DemoState,
  Record<string, never>
> = {
  name: "prepare_checkout",
  title: "Read checkout total",
  description:
    "Calculate the authoritative checkout total and payment destination. This does not place an order.",
  kind: "read",
  inputSchema: emptySchema,
  inputJsonSchema: getCartAction.inputJsonSchema,
  risk: "low",
  reversibility: "irreversible",
  preview: (_input, context) => ({
    summary: `Prepare a £${getCartTotal(context.getState())} checkout preview.`,
    resourceKeys: [],
    diff: [],
  }),
  execute: (_input, context) => {
    const state = context.getState();
    if (!state.cart.line) throw new Error("The shopping bag is empty.");
    return {
      subtotal: getSubtotal(state),
      delivery: getDeliveryCost(state),
      discount: getDiscount(state),
      total: getCartTotal(state),
      paymentMethod: state.customer.paymentMethod,
      deliveryAddress: state.customer.deliveryAddress,
    };
  },
};

export const placeOrderAction: ActionDefinition<
  DemoState,
  Record<string, never>
> = {
  name: "place_order",
  title: "Place the order",
  description:
    "Place the order and charge the saved payment method. This spends money and cannot be undone. Remy requires approval unless the user has explicitly enabled unattended purchases.",
  kind: "mutation",
  inputSchema: emptySchema,
  inputJsonSchema: getCartAction.inputJsonSchema,
  risk: "high",
  reversibility: "irreversible",
  requiresPurchasePermission: true,
  preview: (_input, context) => {
    const state = context.getState();
    if (!state.cart.line) throw new Error("The shopping bag is empty.");
    if (state.order.status === "placed") throw new Error("This order is already placed.");
    const total = getCartTotal(state);
    return {
      summary: `Place the order for £${total}.`,
      resourceKeys: [
        RESOURCE_KEYS.cart,
        RESOURCE_KEYS.delivery,
        RESOURCE_KEYS.discount,
        RESOURCE_KEYS.order,
      ],
      before: state.order,
      after: { status: "placed", id: "MO-2048" },
      diff: [
        {
          path: "order.status",
          label: "Purchase",
          kind: "status",
          before: "not_placed",
          after: "placed",
          displayBefore: "Not purchased",
          displayAfter: `Charge £${total}`,
        },
      ],
      detail: {
        Item: `${state.cart.line.quantity} × ${state.cart.line.name}`,
        Total: `£${total}`,
        Payment: state.customer.paymentMethod,
        Delivery: state.customer.deliveryAddress,
        "Can this be undone?": "No",
      },
    };
  },
  execute: (_input, context) => {
    const state = context.getState();
    const total = getCartTotal(state);
    if (!state.cart.line) throw new Error("The shopping bag is empty.");
    if (state.order.status === "placed") throw new Error("This order is already placed.");
    updateState(context, (current) => ({
      ...current,
      order: { status: "placed", id: "MO-2048" },
    }));
    return { orderId: "MO-2048", status: "placed", total };
  },
};

export const demoActions = [
  getProductAction,
  getCartAction,
  addToCartAction,
  removeFromCartAction,
  setQuantityAction,
  chooseDeliveryAction,
  applyDiscountAction,
  prepareCheckoutAction,
  placeOrderAction,
] as const;

export function isCartReceipt(receipt: ActionReceipt) {
  return ["add_to_cart", "remove_from_cart", "set_quantity"].includes(
    receipt.actionName,
  );
}

export const emptyActionSchema = emptySchema;
