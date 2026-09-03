"use client";

import { Check } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

const actionCode = `const updateAddress = remy.defineAction({
  name: "update_collection_address",
  risk: "medium",
  reversibility: "exact",
  preview: showAddressChange,
  execute: updateAddress,
  undo: restoreAddress,
})`;

export function Quickstart() {
  return (
    <div>
      <div className="grid border-b border-[#111510]/14 lg:grid-cols-[0.34fr_0.66fr]">
        <div className="px-5 py-8 sm:px-9 lg:border-r lg:border-[#111510]/14 lg:px-12 lg:py-12">
          <h3 className="text-2xl font-medium tracking-[-0.035em]">
            Run one command
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#74776f]">
            Remy sets up the pieces your site needs.
          </p>
        </div>
        <div className="px-5 pb-10 sm:px-9 lg:px-12 lg:py-12 xl:px-16">
          <div className="flex items-center justify-between gap-4 border border-[#111510] bg-[#102d25] p-3 pl-4 text-white">
            <code className="min-w-0 truncate font-mono text-xs font-medium sm:text-base">
              <span className="mr-3 text-[#70d5aa]">$</span>
              npx @remy-ai/cli init
            </code>
            <CopyButton value="npx @remy-ai/cli init" tone="dark" />
          </div>
          <div className="grid border-x border-b border-[#111510]/16 sm:grid-cols-2">
            <p className="border-b border-[#111510]/12 p-4 text-sm leading-6 text-[#5e625b] sm:border-r sm:border-b-0">
              Adds Remy to your Next.js app and creates your first website
              action.
            </p>
            <p className="flex items-center gap-2 p-4 text-sm font-medium text-[#1a5b45]">
              <Check className="size-4" /> Your code stays in your repository.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.34fr_0.66fr]">
        <div className="px-5 py-8 sm:px-9 lg:border-r lg:border-[#111510]/14 lg:px-12 lg:py-12">
          <h3 className="text-2xl font-medium tracking-[-0.035em]">
            Describe each action once
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#74776f]">
            Remy handles the safety checks and customer-facing change history.
          </p>
        </div>
        <div className="px-5 pb-10 sm:px-9 lg:px-12 lg:py-12 xl:px-16">
          <div className="border border-[#111510] bg-[#111510] text-[#f2f0e7]">
            <div className="flex items-center justify-between border-b border-white/14 px-4 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/42">
                src/remy/actions.ts
              </span>
              <CopyButton value={actionCode} tone="dark" />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-5 text-white/72 sm:p-5 sm:text-xs sm:leading-6">
              <code>{actionCode}</code>
            </pre>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm font-medium leading-6 text-[#1b5140]">
            <Check className="mt-1 size-4 shrink-0" />
            The same action works in WebMCP, appears to the customer, and can
            ask for approval or be reversed.
          </p>
        </div>
      </div>
    </div>
  );
}
