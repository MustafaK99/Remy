import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createRemy, succeed } from "@remy-ai/core";
import {
  registerWebMCP,
  type WebMCPModelContext,
  type WebMCPTool,
} from "./index";

function documentRemy() {
  let title = "Draft";
  const remy = createRemy({ context: () => ({ getTitle: () => title, setTitle: (next: string) => { title = next; } }) });
  const rename = remy.defineAction({
    name: "rename_document",
    title: "Rename document",
    description: "Rename a document through the host application's function.",
    kind: "write",
    input: z.strictObject({ title: z.string().min(1) }),
    risk: "low",
    preview: ({ input, context }) => ({
      summary: `Rename document to ${input.title}.`,
      resources: ["document:title"],
      changes: [{ label: "Title", before: context.getTitle(), after: input.title }],
      recovery: { previous: context.getTitle() },
    }),
    execute: ({ input, context }) => {
      context.setTitle(input.title);
      return succeed({ title: input.title });
    },
    recovery: {
      kind: "exact",
      execute: ({ receipt, context }) => {
        context.setTitle(receipt.recovery.previous);
        return succeed({ title: receipt.recovery.previous });
      },
    },
    exposeOutput: (output) => output,
  });
  remy.register(rename);
  return { remy, getTitle: () => title };
}

function registryMock() {
  const active = new Map<string, WebMCPTool>();
  let aborted = 0;
  const modelContext: WebMCPModelContext = {
    registerTool(tool, options) {
      if (active.has(tool.name)) throw new Error(`Duplicate tool: ${tool.name}`);
      active.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => {
        if (active.delete(tool.name)) aborted += 1;
      }, { once: true });
    },
  };
  return { active, modelContext, getAborted: () => aborted };
}

describe("generic WebMCP adapter", () => {
  it("exposes a non-commerce action with generated JSON Schema", async () => {
    const app = documentRemy();
    const registry = registryMock();
    const registration = await registerWebMCP(app.remy, { modelContext: registry.modelContext });
    expect(registration.status).toBe("ready");
    const tool = registry.active.get("rename_document")!;
    expect(tool.inputSchema).toMatchObject({
      type: "object",
      properties: { title: { type: "string" } },
      required: ["title"],
      additionalProperties: false,
    });
    expect(await tool.execute({ title: "Launch plan" })).toMatchObject({
      ok: true,
      status: "committed",
      output: { title: "Launch plan" },
    });
    expect(app.getTitle()).toBe("Launch plan");
  });

  it("cleans up every tool and does not leave Strict Mode duplicates", async () => {
    const app = documentRemy();
    const registry = registryMock();
    const first = await registerWebMCP(app.remy, { modelContext: registry.modelContext });
    const count = first.registered.length;
    first.unregister();
    expect(registry.active.size).toBe(0);
    expect(registry.getAborted()).toBe(count);

    const second = await registerWebMCP(app.remy, { modelContext: registry.modelContext });
    expect(second.status).toBe("ready");
    expect(registry.active.size).toBe(count);
    second.unregister();
    expect(registry.active.size).toBe(0);
  });

  it("keeps the external abort signal connected after registration", async () => {
    const app = documentRemy();
    const registry = registryMock();
    const external = new AbortController();
    const removeListener = vi.spyOn(external.signal, "removeEventListener");
    const registration = await registerWebMCP(app.remy, {
      modelContext: registry.modelContext,
      signal: external.signal,
    });
    const count = registration.registered.length;

    expect(registry.active.size).toBe(count);
    external.abort();
    expect(registry.active.size).toBe(0);
    expect(registry.getAborted()).toBe(count);
    expect(removeListener).toHaveBeenCalledTimes(1);

    registration.unregister();
    registration.unregister();
    expect(registry.getAborted()).toBe(count);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("registers nothing when the external signal is already aborted", async () => {
    const app = documentRemy();
    const registry = registryMock();
    const external = new AbortController();
    external.abort();

    const registration = await registerWebMCP(app.remy, {
      modelContext: registry.modelContext,
      signal: external.signal,
    });

    expect(registration.registered).toEqual([]);
    expect(registry.active.size).toBe(0);
    registration.unregister();
    registration.unregister();
    expect(registry.getAborted()).toBe(0);
  });

  it("exposes controls without treating self-reported identity as authority", async () => {
    const app = documentRemy();
    const registry = registryMock();
    await registerWebMCP(app.remy, { modelContext: registry.modelContext });

    const identified = await registry.active.get("identify_assistant")!.execute({
      name: "Claude",
      provider: "Anthropic",
    });
    expect(identified).toMatchObject({
      ok: true,
      principal: { name: "Claude", assurance: "self-reported" },
    });

    const requested = await registry.active.get("request_remy_controls")!.execute({
      mode: "trusted",
      grants: ["documents.publish"],
    });
    expect(requested).toMatchObject({ ok: true, status: "awaiting_user" });
    expect(app.remy.getSnapshot().controls).toMatchObject({
      autonomy: "reversible",
      grants: [],
    });
    expect(app.remy.getSnapshot().pendingControlRequest?.requestedBy).toMatchObject({
      assurance: "self-reported",
    });

    const restricted = await registry.active.get("request_remy_controls")!.execute({
      mode: "ask",
    });
    expect(restricted).toMatchObject({ ok: true, status: "applied" });
    expect(app.remy.getSnapshot().controls.autonomy).toBe("ask");
  });

  it("reports an unrepresentable action schema without weakening it", async () => {
    const remy = createRemy({ context: () => undefined });
    const action = remy.defineAction({
      name: "opaque_read",
      title: "Opaque read",
      description: "Read using a validator without JSON Schema support.",
      kind: "read",
      input: {
        "~standard": {
          version: 1 as const,
          vendor: "test",
          validate: () => ({ value: {} }),
        },
      },
      preview: () => ({ summary: "Read opaque data." }),
      execute: () => succeed({ ok: true }),
    });
    remy.register(action);
    const registration = await registerWebMCP(remy, { modelContext: registryMock().modelContext });
    expect(registration.status).toBe("partial");
    expect(registration.failures).toEqual([
      expect.objectContaining({ name: "opaque_read", error: expect.stringContaining("jsonSchema") }),
    ]);
  });
});
