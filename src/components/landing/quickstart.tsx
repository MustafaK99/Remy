import { CopyButton } from "@/components/copy-button";

const actionCode = `import { z } from "zod"
import { remy } from "@remy-ai/core"

export const changeAddress = remy.defineAction({
  name: "change_collection_address",
  kind: "mutation",
  inputSchema: z.object({ address: z.string() }),
  risk: "medium",
  reversibility: "exact",
  preview: previewAddressChange,
  execute: updateAddress,
  undo: restorePreviousAddress,
})`;

const steps = [
  ["01", "Install", "The CLI detects the app and adds the WebMCP adapter."],
  ["02", "Define", "Put risk, preview, execution, and recovery beside the action."],
  ["03", "Connect", "Wrap the app with the generated provider. Your existing UI stays unchanged."],
];

export function Quickstart() {
  return (
    <div className="mt-12 grid overflow-hidden border border-white/14 bg-[#101010] lg:grid-cols-[0.72fr_1.28fr]">
      <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 p-5 sm:p-7">
          <p className="font-mono text-[10px] text-white/33">Terminal</p>
          <div className="mt-4 flex h-12 items-center justify-between gap-4 border border-white/12 bg-[#0a0a0a] pl-4 pr-2">
            <code className="truncate font-mono text-[12px] text-white/72">
              <span className="mr-2 text-[#e66749]">$</span>
              npx @remy-ai/cli init
            </code>
            <CopyButton value="npx @remy-ai/cli init" tone="dark" />
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {steps.map(([number, title, text]) => (
            <div key={number} className="grid grid-cols-[34px_84px_1fr] gap-2 px-5 py-5 text-sm sm:px-7">
              <span className="font-mono text-[9px] text-[#e66749]">{number}</span>
              <span className="font-medium text-white/78">{title}</span>
              <span className="text-xs leading-5 text-white/38">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex h-11 items-center justify-between border-b border-white/10 px-5 sm:px-7">
          <span className="font-mono text-[10px] text-white/36">src/remy/actions.ts</span>
          <CopyButton value={actionCode} tone="dark" />
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[11px] leading-6 text-white/62 sm:p-7 sm:text-xs">
          <code>{actionCode}</code>
        </pre>
      </div>
    </div>
  );
}
