"use client";

import { useEffect, useState } from "react";
import type { DemoState } from "@/demo/data";
import type { RemyEngine } from "@/remy/core/engine";

export type WebMCPStatus = "checking" | "ready" | "unsupported" | "error";

function conciseResult(result: Awaited<ReturnType<RemyEngine<DemoState>["run"]>>) {
  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.error,
      actionId: result.actionId,
    };
  }
  return {
    ok: true,
    actionId: result.actionId,
    status: result.status,
    summary: result.summary,
    requiresApproval: result.requiresApproval ?? false,
    output: result.output,
  };
}

export function useWebMCPRegistration(engine: RemyEngine<DemoState>) {
  const [status, setStatus] = useState<WebMCPStatus>("checking");

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) {
      const statusTimer = window.setTimeout(() => setStatus("unsupported"), 0);
      return () => window.clearTimeout(statusTimer);
    }

    const lifecycle = new AbortController();
    const registrations = engine.listActions().map((action) =>
      Promise.resolve(
        context.registerTool(
          {
            name: action.name,
            title: action.title,
            description: action.description,
            inputSchema: action.inputJsonSchema,
            annotations: {
              readOnlyHint: action.kind === "read",
              untrustedContentHint: false,
            },
            async execute(rawInput: unknown) {
              const result = await engine.run(action.name, rawInput, {
                actor: "agent",
                transport: "webmcp",
              });
              return conciseResult(result);
            },
          },
          { signal: lifecycle.signal },
        ),
      ),
    );

    registrations.push(
      Promise.resolve(
        context.registerTool(
          {
            name: "get_action_history",
            title: "Read Remy action history",
            description:
              "Read concise receipts for this page. This does not change application state.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute() {
              return {
                receipts: engine.getSnapshot().receipts.map((receipt) => ({
                  id: receipt.id,
                  title: receipt.title,
                  status: receipt.status,
                  actor: receipt.actor,
                  reversibility: receipt.reversibility,
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ),
    );

    registrations.push(
      Promise.resolve(
        context.registerTool(
          {
            name: "revert_action",
            title: "Reverse a Remy action",
            description:
              "Request exact undo or a compensating action for a committed receipt. This mutates application state after Remy checks version safety.",
            inputSchema: {
              type: "object",
              properties: { receiptId: { type: "string", minLength: 1 } },
              required: ["receiptId"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            async execute(input: unknown) {
              if (
                !input ||
                typeof input !== "object" ||
                !("receiptId" in input) ||
                typeof input.receiptId !== "string"
              ) {
                return {
                  ok: false,
                  code: "INVALID_INPUT",
                  message: "receiptId must be a non-empty string.",
                };
              }
              const result = await engine.revert(input.receiptId);
              return conciseResult(result);
            },
          },
          { signal: lifecycle.signal },
        ),
      ),
    );

    void Promise.all(registrations)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));

    return () => lifecycle.abort();
  }, [engine]);

  return status;
}
