import { z } from "zod";
import { succeed, type ActionReceipt, type RemyClient } from "@remy-ai/core";
import { RESOURCE_KEYS, type DemoState } from "./data";
import type { DemoStore } from "./store";

const orderInput = z.strictObject({ orderId: z.literal("1842") });

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
  const getOrder = remy.defineAction({
    name: "get_order",
    title: "Read order #1842",
    description:
      "Read the items, payment method, and return status for order #1842. This changes nothing.",
    kind: "read",
    input: orderInput,
    preview: () => ({ summary: "Read order #1842.", changes: [] }),
    execute: ({ context }) =>
      succeed({
        order: context.getSnapshot().order,
        returnRequest: context.getSnapshot().returnRequest,
      }),
    redactInput: ({ orderId }) => ({ orderId }),
    exposeOutput: (output) => output,
  });

  const createReturn = remy.defineAction({
    name: "create_return",
    title: "Return created",
    description:
      "Create a return for selected items. The draft can be removed exactly.",
    kind: "write",
    input: z.strictObject({
      orderId: z.literal("1842"),
      itemIds: z.array(z.enum(["headphones", "case"])).min(1).max(2),
    }),
    risk: "low",
    preview: ({ input, context }) => {
      const before = context.getSnapshot().returnRequest;
      return {
        summary: `Create a return for ${input.itemIds.length} items.`,
        resources: [RESOURCE_KEYS.returnDraft],
        changes: [
          change("Return", "return.status", "Not started", "Draft created", "add"),
        ],
        recovery: {
          status: before.status,
          itemIds: [...before.itemIds],
          id: before.id,
        },
      };
    },
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        returnRequest: {
          ...state.returnRequest,
          id: "RET-1842",
          status: "draft",
          itemIds: [...input.itemIds],
        },
      }));
      return succeed({ returnId: "RET-1842", itemIds: input.itemIds });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          returnRequest: {
            ...state.returnRequest,
            id: receipt.recovery.id,
            status: receipt.recovery.status,
            itemIds: receipt.recovery.itemIds,
          },
        }));
        return succeed({ status: receipt.recovery.status });
      },
    },
    redactInput: ({ orderId, itemIds }) => ({
      orderId,
      itemCount: itemIds.length,
    }),
    exposeOutput: (output) => output,
  });

  const addReturnReason = remy.defineAction({
    name: "add_return_reason",
    title: "Return reason added",
    description:
      "Add a short reason to the return. The previous value can be restored exactly.",
    kind: "write",
    input: z.strictObject({
      orderId: z.literal("1842"),
      reason: z.string().min(3).max(160),
    }),
    risk: "low",
    preview: ({ input, context }) => ({
      summary: `Set the return reason to “${input.reason}”.`,
      resources: [RESOURCE_KEYS.returnReason],
      changes: [
        change(
          "Return reason",
          "return.reason",
          context.getSnapshot().returnRequest.reason ?? "Not set",
          input.reason,
          "add",
        ),
      ],
      recovery: { reason: context.getSnapshot().returnRequest.reason },
    }),
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        returnRequest: { ...state.returnRequest, reason: input.reason },
      }));
      return succeed({ reason: input.reason });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          returnRequest: {
            ...state.returnRequest,
            reason: receipt.recovery.reason,
          },
        }));
        return succeed({ reason: receipt.recovery.reason });
      },
    },
    redactInput: ({ orderId, reason }) => ({ orderId, reason }),
    exposeOutput: (output) => output,
  });

  const changeCollectionAddress = remy.defineAction({
    name: "change_collection_address",
    title: "Collection address changed",
    description:
      "Change the return collection address. The previous address can be restored exactly.",
    kind: "write",
    input: z.strictObject({
      orderId: z.literal("1842"),
      address: z.string().min(5).max(120),
    }),
    risk: "medium",
    preview: ({ input, context }) => {
      const before = context.getSnapshot().returnRequest.collectionAddress;
      return {
        summary: `Change the collection address from ${before} to ${input.address}.`,
        resources: [RESOURCE_KEYS.address],
        changes: [
          change(
            "Collection address",
            "return.collectionAddress",
            before,
            input.address,
          ),
        ],
        recovery: { address: before },
      };
    },
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        returnRequest: {
          ...state.returnRequest,
          collectionAddress: input.address,
        },
      }));
      return succeed({ collectionAddress: input.address });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        updateState(context, (state) => ({
          ...state,
          returnRequest: {
            ...state.returnRequest,
            collectionAddress: receipt.recovery.address,
          },
        }));
        return succeed({ collectionAddress: receipt.recovery.address });
      },
    },
    redactInput: ({ orderId, address }) => ({ orderId, address }),
    exposeOutput: (output) => output,
  });

  const bookCollection = remy.defineAction({
    name: "book_collection",
    title: "Collection booked",
    description:
      "Book a courier collection. Recovery is a new cancellation rather than an exact undo.",
    kind: "write",
    input: z.strictObject({
      orderId: z.literal("1842"),
      date: z.string().min(3).max(40),
    }),
    risk: "medium",
    preview: ({ input, context }) => ({
      summary: `Book collection ${input.date} from ${context.getSnapshot().returnRequest.collectionAddress}.`,
      resources: [RESOURCE_KEYS.collection],
      changes: [
        change(
          "Collection",
          "return.collection.status",
          "Not booked",
          `${input.date} · ${context.getSnapshot().returnRequest.collectionAddress}`,
          "add",
        ),
      ],
      recovery: { date: input.date },
    }),
    execute: ({ input, context }) => {
      updateState(context, (state) => ({
        ...state,
        returnRequest: {
          ...state.returnRequest,
          collection: {
            status: "booked",
            date: input.date,
            bookingId: "COL-7F4A",
          },
        },
      }));
      return succeed({
        bookingId: "COL-7F4A",
        status: "booked" as const,
        date: input.date,
      });
    },
    recovery: {
      kind: "compensating",
      automatic: true,
      execute: ({ context }) => {
        updateState(context, (state) => ({
          ...state,
          returnRequest: {
            ...state.returnRequest,
            collection: {
              ...state.returnRequest.collection,
              status: "cancelled",
            },
          },
        }));
        return succeed({
          bookingId: "COL-7F4A",
          status: "cancelled" as const,
        });
      },
    },
    redactInput: ({ orderId, date }) => ({ orderId, date }),
    exposeOutput: (output) => output,
  });

  const issueRefund = remy.defineAction({
    name: "issue_refund",
    title: "Refund £84",
    description:
      "Issue an £84 refund to the original payment method. This cannot be undone.",
    kind: "write",
    input: orderInput,
    risk: "high",
    preview: ({ context }) => ({
      summary: `Refund £84 to ${context.getSnapshot().order.paymentMethod}.`,
      resources: [RESOURCE_KEYS.refund],
      changes: [
        change(
          "Refund",
          "return.refund.status",
          "Not issued",
          "£84 issued",
          "status",
        ),
      ],
      details: {
        Amount: "£84",
        Destination: context.getSnapshot().order.paymentMethod,
        Order: "#1842",
      },
    }),
    execute: ({ context }) => {
      if (context.getSnapshot().returnRequest.refund.status === "issued") {
        throw new Error("The refund has already been issued.");
      }
      updateState(context, (state) => ({
        ...state,
        returnRequest: {
          ...state.returnRequest,
          status: "complete",
          refund: {
            ...state.returnRequest.refund,
            status: "issued",
            refundId: "RF-1842",
          },
        },
      }));
      return succeed({
        refundId: "RF-1842",
        amount: 84,
        status: "issued" as const,
      });
    },
    recovery: { kind: "irreversible" },
    redactInput: ({ orderId }) => ({ orderId }),
    exposeOutput: (output) => output,
  });

  const actions = {
    getOrder,
    createReturn,
    addReturnReason,
    changeCollectionAddress,
    bookCollection,
    issueRefund,
  } as const;
  remy.register(getOrder);
  remy.register(createReturn);
  remy.register(addReturnReason);
  remy.register(changeCollectionAddress);
  remy.register(bookCollection);
  remy.register(issueRefund);
  return actions;
}

export function isAddressReceipt(receipt: ActionReceipt) {
  return receipt.action.name === "change_collection_address";
}
