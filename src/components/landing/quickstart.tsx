import { CopyButton } from "@/components/copy-button";

const localCommands = `git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev`;

const actionCode = `const chooseDelivery = remy.defineAction({
  name: "choose_delivery",
  title: "Choose delivery",
  description: "Choose delivery for the current bag.",
  kind: "write",
  input: z.strictObject({
    method: z.enum(["standard", "express"]),
  }),
  risk: "low",
  preview: ({ input, context }) => {
    const before = context.cart.delivery
    return {
      summary: "Choose " + input.method + " delivery.",
      resources: ["cart:delivery"],
      changes: [{
        label: "Delivery",
        before,
        after: input.method,
      }],
      recovery: { method: before },
    }
  },
  execute: async ({ input, context }) => {
    await context.cart.setDelivery(input.method)
    return succeed({ method: input.method })
  },
  recovery: {
    kind: "exact",
    execute: async ({ receipt, context }) => {
      await context.cart.setDelivery(receipt.recovery.method)
      return succeed({ method: receipt.recovery.method })
    },
  },
})

remy.register(chooseDelivery)`;

const steps = [
  ["01", "Clone", "Run the current source; no package is published yet."],
  ["02", "Define", "Wrap an existing application function with one typed action."],
  ["03", "Expose", "Register the same action with the headless WebMCP adapter."],
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
