import { CopyButton } from "@/components/copy-button";

const localCommands = `git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev`;

const actionCode = `import { z } from "zod"
import type { ActionDefinition } from "@/remy/core/types"
import type { DemoState } from "@/demo/data"

export const chooseDelivery: ActionDefinition<
  DemoState,
  { method: "standard" | "express" }
> = {
  name: "choose_delivery",
  version: "1",
  title: "Changed delivery",
  description: "Choose delivery for the current bag.",
  kind: "mutation",
  inputSchema: z.object({
    method: z.enum(["standard", "express"]),
  }).strict(),
  inputJsonSchema: {
    type: "object",
    properties: {
      method: { enum: ["standard", "express"] },
    },
    required: ["method"],
    additionalProperties: false,
  },
  risk: "low",
  reversibility: "exact",
  preview: (input, context) => {
    const before = context.getState().cart.delivery
    return {
      summary: "Choose " + input.method + " delivery.",
      resourceKeys: ["cart:delivery"],
      before,
      after: input.method,
      diff: [{
        path: "cart.delivery",
        label: "Delivery",
        kind: "replace",
        before,
        after: input.method,
      }],
    }
  },
  execute: (input, context) => context.setState({
    ...context.getState(),
    cart: { ...context.getState().cart, delivery: input.method },
  }),
  undo: (receipt, context) => context.setState({
    ...context.getState(),
    cart: { ...context.getState().cart, delivery: receipt.before },
  }),
}`;

const steps = [
  ["01", "Clone", "Run the current source; no package is published yet."],
  ["02", "Inspect", "The Morrow actions show the real engine contract."],
  ["03", "Adapt", "Keep your business logic and UI; define semantic operations around it."],
];

export function Quickstart() {
  return (
    <div className="mt-12 grid overflow-hidden border border-white/14 bg-[#101010] lg:grid-cols-[0.72fr_1.28fr]">
      <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] text-white/33">Run locally</p>
            <CopyButton value={localCommands} label="Copy all" tone="dark" />
          </div>
          <pre className="mt-4 overflow-x-auto border border-white/12 bg-[#0a0a0a] p-4 font-mono text-[11px] leading-6 text-white/72">
            <code>{localCommands}</code>
          </pre>
        </div>

        <div className="divide-y divide-white/10">
          {steps.map(([number, title, text]) => (
            <div key={number} className="grid grid-cols-[34px_72px_1fr] gap-2 px-5 py-5 text-sm sm:px-7">
              <span className="font-mono text-[9px] text-[#e66749]">{number}</span>
              <span className="font-medium text-white/78">{title}</span>
              <span className="text-xs leading-5 text-white/38">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex h-11 items-center justify-between border-b border-white/10 px-5 sm:px-7">
          <span className="font-mono text-[10px] text-white/36">src/demo/actions.ts</span>
          <CopyButton value={actionCode} tone="dark" />
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-6 text-white/62 sm:p-7 sm:text-xs">
          <code>{actionCode}</code>
        </pre>
      </div>
    </div>
  );
}
