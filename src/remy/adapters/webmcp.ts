"use client";

import { useEffect, useState } from "react";
import type { DemoState } from "@/demo/data";
import type { RemyEngine } from "@/remy/core/engine";
import type { ControlSettings, EngineSnapshot } from "@/remy/core/types";

export type WebMCPStatus = "checking" | "ready" | "unsupported" | "error";
type PublicControlMode = "preview" | "ask" | "reversible" | "trusted";
type PurchaseSetting = "ask" | "allow";

const controlRank: Record<PublicControlMode, number> = {
  preview: 0,
  ask: 1,
  reversible: 2,
  trusted: 3,
};

function getMode(snapshot: EngineSnapshot<DemoState>): PublicControlMode {
  if (snapshot.paused || snapshot.autonomy === "preview") return "preview";
  if (snapshot.autonomy === "ask") return "ask";
  return snapshot.autonomy === "trusted" ? "trusted" : "reversible";
}

function toControls(
  mode: PublicControlMode,
  purchases: PurchaseSetting,
): ControlSettings {
  return {
    autonomy:
      mode === "preview"
        ? "preview"
        : mode === "ask"
          ? "ask"
          : mode === "trusted"
            ? "trusted"
            : "reversible",
    paused: false,
    allowPurchases: mode === "trusted" && purchases === "allow",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

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
            name: "get_remy_status",
            title: "Read Remy controls",
            description:
              "Detect Remy on this page and read the current AI access, purchase setting, active assistant label, and pending requests. This does not change anything.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute() {
              const snapshot = engine.getSnapshot();
              return {
                remy: { present: true, version: "0.1", headless: true },
                controls: {
                  mode: getMode(snapshot),
                  purchases: snapshot.allowPurchases ? "allow" : "ask",
                },
                assistant: snapshot.activeAgent ?? null,
                pendingControlRequest: snapshot.pendingControlRequest ?? null,
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
            name: "identify_assistant",
            title: "Identify this assistant to Remy",
            description:
              "Set the plain-language assistant label shown beside future actions. Call once before changing the page. This identity is self-reported for attribution only and never grants access.",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1, maxLength: 48 },
                provider: { type: "string", minLength: 1, maxLength: 48 },
                sessionId: { type: "string", minLength: 1, maxLength: 96 },
              },
              required: ["name"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              if (!isRecord(input) || typeof input.name !== "string") {
                return { ok: false, code: "INVALID_INPUT", message: "name is required." };
              }
              const name = input.name.trim().slice(0, 48);
              if (!name) {
                return { ok: false, code: "INVALID_INPUT", message: "name is required." };
              }
              const provider =
                typeof input.provider === "string"
                  ? input.provider.trim().slice(0, 48)
                  : undefined;
              const id =
                typeof input.sessionId === "string" && input.sessionId.trim()
                  ? input.sessionId.trim().slice(0, 96)
                  : `${provider ?? "assistant"}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              engine.identifyAgent({ id, name, provider: provider || undefined });
              return {
                ok: true,
                assistant: engine.getSnapshot().activeAgent,
                note: "Self-reported identity is used for attribution, not authorization.",
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
            name: "request_remy_controls",
            title: "Request different Remy controls",
            description:
              "Request a Remy autonomy mode: preview, ask, reversible, or trusted. You may also request whether purchases always ask or may run unattended. Restrictions apply immediately; increased access waits for the user to confirm in Remy.",
            inputSchema: {
              type: "object",
              properties: {
                mode: {
                  type: "string",
                  enum: ["preview", "ask", "reversible", "trusted"],
                },
                purchases: { type: "string", enum: ["ask", "allow"] },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input: unknown) {
              if (!isRecord(input)) {
                return { ok: false, code: "INVALID_INPUT", message: "Expected an object." };
              }
              const before = engine.getSnapshot();
              const currentMode = getMode(before);
              const requestedMode =
                typeof input.mode === "string" && input.mode in controlRank
                  ? (input.mode as PublicControlMode)
                  : currentMode;
              const requestedPurchases =
                input.purchases === "allow" || input.purchases === "ask"
                  ? input.purchases
                  : before.allowPurchases
                    ? "allow"
                    : "ask";

              if (requestedPurchases === "allow" && requestedMode !== "trusted") {
                return {
                  ok: false,
                  code: "INVALID_COMBINATION",
                  message: "Unattended purchases are only available in trusted mode.",
                };
              }

              const controls = toControls(requestedMode, requestedPurchases);
              const increasesAccess =
                controlRank[requestedMode] > controlRank[currentMode] ||
                (controls.allowPurchases && !before.allowPurchases);

              if (increasesAccess) {
                const request = engine.requestControlChange(controls);
                return {
                  ok: true,
                  status: "awaiting_user",
                  requestId: request.id,
                  message: "The request is visible in Remy and has not been applied.",
                };
              }

              engine.setControls(controls);
              return {
                ok: true,
                status: "applied",
                controls: {
                  mode: getMode(engine.getSnapshot()),
                  purchases: controls.allowPurchases ? "allow" : "ask",
                },
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
            name: "get_action_history",
            title: "Read Remy action history",
            description:
              "Read concise receipts for actions attempted on this page. This does not change application state.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute() {
              return {
                receipts: engine.getSnapshot().receipts.map((receipt) => ({
                  id: receipt.id,
                  title: receipt.title,
                  status: receipt.status,
                  actor: receipt.actor,
                  assistant: receipt.agent?.name,
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
              "Reverse one committed, reversible action by receipt ID. This changes the page only after Remy checks the current access mode and version safety.",
            inputSchema: {
              type: "object",
              properties: { receiptId: { type: "string", minLength: 1 } },
              required: ["receiptId"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            async execute(input: unknown) {
              if (
                !isRecord(input) ||
                typeof input.receiptId !== "string" ||
                !input.receiptId.trim()
              ) {
                return {
                  ok: false,
                  code: "INVALID_INPUT",
                  message: "receiptId must be a non-empty string.",
                };
              }
              const result = await engine.revert(input.receiptId, {
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

    void Promise.all(registrations)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));

    return () => lifecycle.abort();
  }, [engine]);

  return status;
}
