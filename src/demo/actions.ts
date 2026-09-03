import { z } from "zod";
import type {
  ActionDefinition,
  ActionPreview,
  ActionReceipt,
} from "@/remy/core/types";
import { RESOURCE_KEYS, type DemoState } from "./data";

const emptySchema = z.object({}).strict();
const orderSchema = z.object({ orderId: z.literal("1842") }).strict();

function updateState(
  context: { getState: () => DemoState; setState: (state: DemoState) => void },
  update: (state: DemoState) => DemoState,
) {
  context.setState(update(context.getState()));
}

function textReplace(
  label: string,
  path: string,
  before: string | undefined,
  after: string | undefined,
): ActionPreview["diff"][number] {
  return {
    path,
    label,
    kind: before === undefined ? "add" : after === undefined ? "remove" : "replace",
    before,
    after,
    displayBefore: before ?? "Not set",
    displayAfter: after ?? "Not set",
  };
}

export const getOrderAction: ActionDefinition<DemoState, { orderId: "1842" }> = {
  name: "get_order",
  title: "Read order",
  description:
    "Read fictional order #1842 and its eligible items. This does not change application state.",
  kind: "read",
  inputSchema: orderSchema,
  inputJsonSchema: {
    type: "object",
    properties: { orderId: { type: "string", const: "1842" } },
    required: ["orderId"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "irreversible",
  preview: (_input, context) => ({
    summary: "Read order #1842 and its return eligibility.",
    resourceKeys: [RESOURCE_KEYS.order],
    before: context.getState().order,
    after: context.getState().order,
    diff: [],
  }),
  execute: (_input, context) => ({
    orderId: context.getState().order.id,
    items: context.getState().order.items.map(({ id, name, price }) => ({
      id,
      name,
      price,
    })),
    refundableTotal: context.getState().return.refund.amount,
  }),
};

export const getReturnOptionsAction: ActionDefinition<
  DemoState,
  { orderId: "1842" }
> = {
  name: "get_return_options",
  title: "Checked return options",
  description:
    "Read available return and collection options for order #1842. This does not make a booking.",
  kind: "read",
  inputSchema: orderSchema,
  inputJsonSchema: getOrderAction.inputJsonSchema,
  risk: "low",
  reversibility: "irreversible",
  preview: () => ({
    summary: "Checked return eligibility and next-Friday collection.",
    resourceKeys: [RESOURCE_KEYS.order],
    diff: [],
  }),
  execute: () => ({ eligible: true, collectionDays: ["next Friday"] }),
};

export const createReturnDraftAction: ActionDefinition<
  DemoState,
  { orderId: "1842"; itemIds: string[] }
> = {
  name: "create_return_draft",
  title: "Created return draft",
  description:
    "Create a return draft for selected items. This changes return state but can be undone exactly.",
  kind: "mutation",
  inputSchema: z
    .object({
      orderId: z.literal("1842"),
      itemIds: z.array(z.enum(["headphones", "case"])).min(1),
    })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      orderId: { type: "string", const: "1842" },
      itemIds: {
        type: "array",
        minItems: 1,
        items: { type: "string", enum: ["headphones", "case"] },
      },
    },
    required: ["orderId", "itemIds"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => ({
    summary: `Create a return draft for ${input.itemIds.length} items.`,
    resourceKeys: [RESOURCE_KEYS.returnDraft],
    before: context.getState().return.status,
    after: "draft",
    diff: [
      textReplace(
        "Return status",
        "return.status",
        context.getState().return.status,
        "Draft created",
      ),
    ],
  }),
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      return: { ...state.return, status: "draft" },
    }));
    return { returnId: "ret_1842", itemIds: input.itemIds };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        status: receipt.before as DemoState["return"]["status"],
      },
    }));
    return { status: receipt.before };
  },
};

export const addReturnReasonAction: ActionDefinition<
  DemoState,
  { orderId: "1842"; reason: string }
> = {
  name: "add_return_reason",
  title: "Added return reason",
  description:
    "Add a reason to the return draft. This changes return state and can be undone exactly.",
  kind: "mutation",
  inputSchema: z
    .object({ orderId: z.literal("1842"), reason: z.string().min(3).max(160) })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      orderId: { type: "string", const: "1842" },
      reason: { type: "string", minLength: 3, maxLength: 160 },
    },
    required: ["orderId", "reason"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => ({
    summary: `Set the return reason to “${input.reason}”`,
    resourceKeys: [RESOURCE_KEYS.returnReason],
    before: context.getState().return.reason,
    after: input.reason,
    diff: [
      textReplace(
        "Return reason",
        "return.reason",
        context.getState().return.reason,
        input.reason,
      ),
    ],
  }),
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      return: { ...state.return, reason: input.reason },
    }));
    return { reason: input.reason };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        reason: receipt.before as string | undefined,
      },
    }));
    return { reason: receipt.before };
  },
};

export const updateCollectionAddressAction: ActionDefinition<
  DemoState,
  { orderId: "1842"; address: string }
> = {
  name: "update_collection_address",
  title: "Changed collection address",
  description:
    "Change the collection address for return #1842. This mutates application state and can be undone exactly if the address has not changed again.",
  kind: "mutation",
  inputSchema: z
    .object({ orderId: z.literal("1842"), address: z.string().min(5).max(120) })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      orderId: { type: "string", const: "1842" },
      address: { type: "string", minLength: 5, maxLength: 120 },
    },
    required: ["orderId", "address"],
    additionalProperties: false,
  },
  risk: "medium",
  reversibility: "exact",
  preview: (input, context) => ({
    summary: `Change collection from ${context.getState().return.collectionAddress} to ${input.address}.`,
    resourceKeys: [RESOURCE_KEYS.address],
    before: context.getState().return.collectionAddress,
    after: input.address,
    diff: [
      textReplace(
        "Collection address",
        "return.collectionAddress",
        context.getState().return.collectionAddress,
        input.address,
      ),
    ],
  }),
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      return: { ...state.return, collectionAddress: input.address },
    }));
    return { collectionAddress: input.address };
  },
  undo: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        collectionAddress: receipt.before as string,
      },
    }));
    return { collectionAddress: receipt.before };
  },
};

export const bookCollectionAction: ActionDefinition<
  DemoState,
  { orderId: "1842"; date: string }
> = {
  name: "book_collection",
  title: "Booked Friday collection",
  description:
    "Book a fictional courier collection. This creates a booking; it can be compensated by a separate cancellation, but the booking remains in history.",
  kind: "mutation",
  inputSchema: z
    .object({ orderId: z.literal("1842"), date: z.string().min(3).max(40) })
    .strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      orderId: { type: "string", const: "1842" },
      date: { type: "string", minLength: 3, maxLength: 40 },
    },
    required: ["orderId", "date"],
    additionalProperties: false,
  },
  risk: "medium",
  reversibility: "compensating",
  safeToCompensateAutomatically: true,
  preview: (input, context) => ({
    summary: `Book ${input.date} collection from ${context.getState().return.collectionAddress}.`,
    resourceKeys: [RESOURCE_KEYS.collection],
    before: context.getState().return.collection.status,
    after: "booked",
    diff: [
      textReplace(
        "Collection",
        "return.collection.status",
        "Not booked",
        `${input.date} · ${context.getState().return.collectionAddress}`,
      ),
    ],
  }),
  execute: (input, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        collection: {
          status: "booked",
          date: input.date,
          bookingId: "col_7F4A",
        },
      },
    }));
    return { bookingId: "col_7F4A", status: "booked", date: input.date };
  },
  compensate: (_receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        collection: { ...state.return.collection, status: "cancelled" },
      },
    }));
    return { bookingId: "col_7F4A", status: "cancelled" };
  },
};

export const cancelCollectionAction: ActionDefinition<
  DemoState,
  { orderId: "1842" }
> = {
  name: "cancel_collection",
  title: "Cancel collection",
  description:
    "Cancel the current fictional courier collection. This creates a compensating business action and does not erase the original booking.",
  kind: "mutation",
  inputSchema: orderSchema,
  inputJsonSchema: getOrderAction.inputJsonSchema,
  risk: "medium",
  reversibility: "compensating",
  safeToCompensateAutomatically: true,
  preview: (_input, context) => ({
    summary: "Cancel the current collection while retaining its booking history.",
    resourceKeys: [RESOURCE_KEYS.collection],
    before: context.getState().return.collection.status,
    after: "cancelled",
    diff: [
      textReplace(
        "Collection",
        "return.collection.status",
        context.getState().return.collection.status === "booked"
          ? `${context.getState().return.collection.date} · booked`
          : context.getState().return.collection.status,
        "Cancelled",
      ),
    ],
  }),
  execute: (_input, context) => {
    if (context.getState().return.collection.status !== "booked") {
      throw new Error("There is no active collection to cancel.");
    }
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        collection: { ...state.return.collection, status: "cancelled" },
      },
    }));
    return { bookingId: "col_7F4A", status: "cancelled" };
  },
  compensate: (receipt, context) => {
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        collection: {
          ...state.return.collection,
          status: receipt.before === "booked" ? "booked" : "not_booked",
        },
      },
    }));
    return { bookingId: "col_7F4A", status: receipt.before };
  },
};

export const prepareRefundAction: ActionDefinition<
  DemoState,
  { orderId: "1842" }
> = {
  name: "prepare_refund",
  title: "Prepared refund",
  description:
    "Calculate an authoritative refund preview from application state. This does not issue money or change refund status.",
  kind: "read",
  inputSchema: orderSchema,
  inputJsonSchema: getOrderAction.inputJsonSchema,
  risk: "low",
  reversibility: "irreversible",
  preview: (_input, context) => ({
    summary: `Prepare an £${context.getState().return.refund.amount} refund preview.`,
    resourceKeys: [RESOURCE_KEYS.refund],
    before: context.getState().return.refund,
    after: context.getState().return.refund,
    diff: [],
    detail: {
      Amount: `£${context.getState().return.refund.amount}`,
      Destination: context.getState().order.paymentMethod,
    },
  }),
  execute: (_input, context) => ({
    orderId: "1842",
    amount: context.getState().return.refund.amount,
    destination: context.getState().order.paymentMethod,
    canIssue: true,
  }),
};

export const issueRefundAction: ActionDefinition<
  DemoState,
  { orderId: "1842" }
> = {
  name: "issue_refund",
  title: "Refund £84",
  description:
    "Refund a fictional £84 to the original payment method. This cannot be undone, so Remy always asks first.",
  kind: "mutation",
  inputSchema: orderSchema,
  inputJsonSchema: getOrderAction.inputJsonSchema,
  risk: "high",
  reversibility: "irreversible",
  alwaysRequireApproval: true,
  preview: (_input, context) => ({
    summary: `Refund £${context.getState().return.refund.amount} to ${context.getState().order.paymentMethod}.`,
    resourceKeys: [RESOURCE_KEYS.refund],
    before: context.getState().return.refund.status,
    after: "issued",
    diff: [
      {
        path: "return.refund.status",
        label: "Refund",
        kind: "status",
        before: context.getState().return.refund.status,
        after: "issued",
        displayBefore: "Not issued",
        displayAfter: `£${context.getState().return.refund.amount} issued`,
      },
    ],
    detail: {
      Amount: `£${context.getState().return.refund.amount}`,
      Destination: context.getState().order.paymentMethod,
      Order: "#1842",
      "Can this be undone?": "No",
      "Requested by": "Your browser assistant",
    },
  }),
  execute: (_input, context) => {
    const authoritativeAmount = context.getState().return.refund.amount;
    if (context.getState().return.refund.status === "issued") {
      throw new Error("The refund has already been issued.");
    }
    updateState(context, (state) => ({
      ...state,
      return: {
        ...state.return,
        status: "ready",
        refund: { ...state.return.refund, status: "issued" },
      },
    }));
    return {
      refundId: "rf_mock_1842",
      amount: authoritativeAmount,
      status: "issued",
    };
  },
};

export const demoActions = [
  getOrderAction,
  getReturnOptionsAction,
  createReturnDraftAction,
  addReturnReasonAction,
  updateCollectionAddressAction,
  bookCollectionAction,
  cancelCollectionAction,
  prepareRefundAction,
  issueRefundAction,
] as const;

export function isAddressReceipt(receipt: ActionReceipt) {
  return receipt.actionName === "update_collection_address";
}

export const emptyActionSchema = emptySchema;
