import { describe, expect, it } from "vitest";
import { decideAutonomyPolicy } from "./policy";
import type { ActionDescriptor, AutonomyLevel, PolicyRequest } from "./public-types";

function request(
  recovery: ActionDescriptor["recovery"],
  autonomy: AutonomyLevel,
  options: { approval?: "always"; automaticCompensation?: boolean; grants?: string[] } = {},
): PolicyRequest {
  return {
    action: {
      name: "edit_document",
      version: "1",
      title: "Edit document",
      description: "Edit a document.",
      kind: "write",
      risk: recovery === "irreversible" ? "high" : "medium",
      recovery,
      automaticCompensation: options.automaticCompensation ?? false,
      approval: options.approval ?? "policy",
      requiredGrants: options.grants ?? [],
      metadata: {},
      input: { "~standard": { version: 1, vendor: "test", validate: (value) => ({ value }) } },
    },
    actor: "agent",
    transport: "test",
    controls: { autonomy, paused: false, grants: [] },
    runId: "run",
    taskId: "task",
  };
}

describe("built-in autonomy policy", () => {
  it("stages or asks under strict modes", () => {
    expect(decideAutonomyPolicy(request("exact", "preview")).outcome).toBe("stage");
    expect(decideAutonomyPolicy(request("exact", "ask")).outcome).toBe("require_approval");
  });

  it("allows exact and explicitly automatic compensation", () => {
    expect(decideAutonomyPolicy(request("exact", "reversible")).outcome).toBe("allow");
    expect(decideAutonomyPolicy(request("compensating", "reversible", { automaticCompensation: true })).outcome).toBe("allow");
  });

  it("keeps application hard stops across every mode", () => {
    for (const autonomy of ["preview", "ask", "reversible", "trusted"] as const) {
      expect(decideAutonomyPolicy(request("irreversible", autonomy, { approval: "always" })).outcome).toBe("require_approval");
    }
  });

  it("requires missing generic grants", () => {
    expect(decideAutonomyPolicy(request("irreversible", "trusted", { grants: ["documents.publish"] })).outcome).toBe("require_approval");
  });
});
