import { z } from "zod";
import { succeed, type ActionReceipt, type RemyClient } from "@/remy/core";
import {
  RESOURCE_KEYS,
  getCartTotal,
  getDeliveryCost,
  getDiscount,
  getSubtotal,
  type CartLine,
  type DemoState,
} from "./data";
import type { DemoStore } from "./store";

const emptyInput = z.strictObject({});
const productInput = z.strictObject({ productId: z.literal("morrow-one") });

function updateState(
  store: DemoStore,
  update: (state: DemoState) => DemoState,
) {
  store.setState(update(store.getSnapshot()));
}

function change(
  label: string,
  path: string,
  before: string | number | boolean | null | undefined,
  after: string | number | boolean | null | undefined,
  kind: "add" | "remove" | "replace" | "status" = "replace",
) {
  return { label, path, before, after, kind } as const;
}

export function registerDemoActions(remy: RemyClient<DemoStore>) {
  const getProduct = remy.defineAction({
    name: "get_product",
    title: "Read product details",
    description:
      "Read the price, colours, and availability for Morrow One. This does not change the shop.",
    kind: "read",
    input: productInput,
    preview: () => ({
      summary: "Read the Morrow One product details.",
      changes: [],
    }),
    execute: ({ context }) =>
      succeed({
        ...context.getSnapshot().product,
        colours: ["Charcoal", "Oat"] as const,
        inStock: true,
      }),
    exposeOutput: (output) => output,
    redactInput: ({ productId }) => ({ productId }),
  });

  const getCart = remy.defineAction({
    name: "get_cart",
    title: "Read shopping bag",
    description:
      "Read the current bag, delivery choice, discount, and authoritative total. This does not change the shop.",
    kind: "read",
    input: emptyInput,
    preview: () => ({ summary: "Read the current shopping bag.", changes: [] }),
    execute: ({ context }) => {
      const state = context.getSnapshot();
      return succeed({
        item: state.cart.line,
        delivery: state.cart.delivery,
        discountCode: state.cart.discount?.code,
        total: getCartTotal(state),
      });
    },
    exposeOutput: (output) => output,
  });

  const addToCart = remy.defineAction({
    name: "add_to_cart",
    title: "Added Morrow One to bag",
    description:
      "Add Morrow One to the shopping bag in the selected colour and quantity. This has exact recovery.",
    kind: "write",
    input: z.strictObject({
      productId: z.literal("morrow-one"),
      colour: z.enum(["Charcoal", "Oat"]),
      quantity: z.number().int().min(1).max(3),
    }),
    risk: "low",
    preview: ({ input, context }) => {
      const state = context.getSnapshot();
      const before = state.cart.line;
      return {
        summary: `Add ${input.quantity} Morrow One in ${input.colour} to the bag.`,
        resources: [RESOURCE_KEYS.cart],
        changes: [
          change(
            "Shopping bag",
            "cart.line",
            before ? `${before.quantity} × ${before.name} · ${before.colour}` : "Empty",
            `${input.quantity} × Morrow One · ${input.colour}`,
            before ? "replace" : "add",
          ),
        ],
        recovery: { line: before },
      };
    },
    execute: ({ input, context }) => {
      const state = context.getSnapshot();
      const line: CartLine = {
        productId: "morrow-one",
        name: state.product.name,
        price: state.product.price,
        colour: input.colour,
        quantity: input.quantity,
      };
      updateState(context, (current) => ({
        ...current,
        cart: { ...current.cart, line },
      }));
      return succeed({ item: line, total: getCartTotal(context.getSnapshot()) });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          cart: { ...state.cart, line: receipt.recovery.line },
        }));
        return succeed({ item: receipt.recovery.line });
      },
    },
    redactInput: ({ productId, colour, quantity }) => ({ productId, colour, quantity }),
    exposeOutput: (output) => output,
  });

  const removeFromCart = remy.defineAction({
    name: "remove_from_cart",
    title: "Removed Morrow One from bag",
    description:
      "Remove Morrow One from the shopping bag. This has exact recovery.",
    kind: "write",
    input: productInput,
    risk: "low",
    preview: ({ context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("Morrow One is not in the bag.");
      return {
        summary: "Remove Morrow One from the shopping bag.",
        resources: [RESOURCE_KEYS.cart, RESOURCE_KEYS.discount],
        changes: [
          change(
            "Shopping bag",
            "cart.line",
            `${state.cart.line.quantity} × ${state.cart.line.name}`,
            "Empty",
            "remove",
          ),
        ],
        recovery: { line: state.cart.line, discount: state.cart.discount },
      };
    },
    execute: ({ context }) => {
      updateState(context, (state) => ({
        ...state,
        cart: { ...state.cart, line: undefined, discount: undefined },
      }));
      return succeed({ removed: true });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          cart: {
            ...state.cart,
            line: receipt.recovery.line,
            discount: receipt.recovery.discount,
          },
        }));
        return succeed({ item: receipt.recovery.line });
      },
    },
    redactInput: ({ productId }) => ({ productId }),
    exposeOutput: (output) => output,
  });

  const setQuantity = remy.defineAction({
    name: "set_quantity",
    title: "Changed bag quantity",
    description:
      "Set the quantity of Morrow One in the bag. This has exact recovery.",
    kind: "write",
    input: z.strictObject({
      productId: z.literal("morrow-one"),
      quantity: z.number().int().min(1).max(3),
    }),
    risk: "low",
    preview: ({ input, context }) => {
      const before = context.getSnapshot().cart.line?.quantity;
      if (!before) throw new Error("Add Morrow One before changing its quantity.");
      return {
        summary: `Change the bag quantity from ${before} to ${input.quantity}.`,
        resources: [RESOURCE_KEYS.cart],
        changes: [change("Quantity", "cart.line.quantity", before, input.quantity)],
        recovery: { quantity: before },
      };
    },
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        cart: {
          ...state.cart,
          line: state.cart.line
            ? { ...state.cart.line, quantity: input.quantity }
            : undefined,
        },
      }));
      return succeed({ quantity: input.quantity, total: getCartTotal(context.getSnapshot()) });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          cart: {
            ...state.cart,
            line: state.cart.line
              ? { ...state.cart.line, quantity: receipt.recovery.quantity }
              : undefined,
          },
        }));
        return succeed({ quantity: receipt.recovery.quantity });
      },
    },
    redactInput: ({ productId, quantity }) => ({ productId, quantity }),
    exposeOutput: (output) => output,
  });

  const chooseDelivery = remy.defineAction({
    name: "choose_delivery",
    title: "Changed delivery",
    description:
      "Choose standard or express delivery for the current bag. This has exact recovery.",
    kind: "write",
    input: z.strictObject({ method: z.enum(["standard", "express"]) }),
    risk: "low",
    preview: ({ input, context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("Add an item before choosing delivery.");
      const before = state.cart.delivery;
      const display = (method: "standard" | "express") =>
        method === "express" ? "Express · £8" : "Standard · Free";
      return {
        summary: `Choose ${input.method} delivery.`,
        resources: [RESOURCE_KEYS.delivery],
        changes: [change("Delivery", "cart.delivery", display(before), display(input.method))],
        recovery: { method: before },
      };
    },
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        cart: { ...state.cart, delivery: input.method },
      }));
      return succeed({ method: input.method, cost: getDeliveryCost(context.getSnapshot()) });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          cart: { ...state.cart, delivery: receipt.recovery.method },
        }));
        return succeed({ method: receipt.recovery.method });
      },
    },
    redactInput: ({ method }) => ({ method }),
    exposeOutput: (output) => output,
  });

  const applyDiscount = remy.defineAction({
    name: "apply_discount",
    title: "Applied 10% discount",
    description:
      "Apply the HELLO10 discount code to the current bag. This has exact recovery.",
    kind: "write",
    input: z.strictObject({ code: z.literal("HELLO10") }),
    risk: "low",
    preview: ({ input, context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("Add an item before applying a discount.");
      return {
        summary: `Apply ${input.code} for 10% off.`,
        resources: [RESOURCE_KEYS.discount],
        changes: [
          change(
            "Discount",
            "cart.discount",
            state.cart.discount?.code ?? "None",
            `${input.code} · 10% off`,
            state.cart.discount ? "replace" : "add",
          ),
        ],
        recovery: { discount: state.cart.discount },
      };
    },
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        cart: { ...state.cart, discount: { code: input.code } },
      }));
      return succeed({
        code: input.code,
        amountSaved: getDiscount(context.getSnapshot()),
        total: getCartTotal(context.getSnapshot()),
      });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          cart: { ...state.cart, discount: receipt.recovery.discount },
        }));
        return succeed({ discount: receipt.recovery.discount });
      },
    },
    redactInput: ({ code }) => ({ code }),
    exposeOutput: (output) => output,
  });

  const prepareCheckout = remy.defineAction({
    name: "prepare_checkout",
    title: "Read checkout total",
    description:
      "Read the authoritative checkout total and destination. This does not place an order.",
    kind: "read",
    input: emptyInput,
    preview: ({ context }) => ({
      summary: `Prepare a £${getCartTotal(context.getSnapshot())} checkout preview.`,
      changes: [],
    }),
    execute: ({ context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("The shopping bag is empty.");
      return succeed({
        subtotal: getSubtotal(state),
        delivery: getDeliveryCost(state),
        discount: getDiscount(state),
        total: getCartTotal(state),
        paymentMethod: state.customer.paymentMethod,
        deliveryAddress: state.customer.deliveryAddress,
      });
    },
    exposeOutput: (output) => output,
  });

  const placeOrder = remy.defineAction({
    name: "place_order",
    title: "Place the order",
    description:
      "Place the order and charge the saved payment method. This is irreversible and requires the commerce.purchase grant for unattended execution.",
    kind: "write",
    input: emptyInput,
    risk: "high",
    requiredGrants: ["commerce.purchase"],
    preview: ({ context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("The shopping bag is empty.");
      if (state.order.status === "placed") throw new Error("This order is already placed.");
      const total = getCartTotal(state);
      return {
        summary: `Place the order for £${total}.`,
        resources: [
          RESOURCE_KEYS.cart,
          RESOURCE_KEYS.delivery,
          RESOURCE_KEYS.discount,
          RESOURCE_KEYS.order,
        ],
        changes: [change("Purchase", "order.status", "Not purchased", `Charge £${total}`, "status")],
        details: {
          Item: `${state.cart.line.quantity} × ${state.cart.line.name}`,
          Total: `£${total}`,
          Payment: state.customer.paymentMethod,
          Delivery: state.customer.deliveryAddress,
        },
      };
    },
    execute: ({ context }) => {
      const state = context.getSnapshot();
      if (!state.cart.line) throw new Error("The shopping bag is empty.");
      if (state.order.status === "placed") throw new Error("This order is already placed.");
      const total = getCartTotal(state);
      updateState(context, (current) => ({
        ...current,
        order: { status: "placed", id: "MO-2048" },
      }));
      return succeed({ orderId: "MO-2048", status: "placed" as const, total });
    },
    recovery: { kind: "irreversible" },
    exposeOutput: (output) => output,
  });

  const actions = {
    getProduct,
    getCart,
    addToCart,
    removeFromCart,
    setQuantity,
    chooseDelivery,
    applyDiscount,
    prepareCheckout,
    placeOrder,
  } as const;
  remy.register(getProduct);
  remy.register(getCart);
  remy.register(addToCart);
  remy.register(removeFromCart);
  remy.register(setQuantity);
  remy.register(chooseDelivery);
  remy.register(applyDiscount);
  remy.register(prepareCheckout);
  remy.register(placeOrder);
  return actions;
}

export function isCartReceipt(receipt: ActionReceipt) {
  return ["add_to_cart", "remove_from_cart", "set_quantity"].includes(
    receipt.action.name,
  );
}
