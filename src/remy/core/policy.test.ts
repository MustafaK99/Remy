import { describe, expect, it } from "vitest";
import { z } from "zod";
import { decidePolicy } from "./policy";
import type { ActionDefinition, AutonomyLevel, Reversibility } from "./types";

function mutation(
  reversibility: Reversibility,
  options: { always?: boolean; safeCompensation?: boolean } = {},
): ActionDefinition<Record<string, never>, unknown> {
  return {
    name: "test_action",
    title: "Test action",
    description: "Mutates test state.",
    kind: "mutation",
    inputSchema: z.unknown(),
    inputJsonSchema: {},
    risk: reversibility === "irreversible" ? "high" : "medium",
    reversibility,
    alwaysRequireApproval: options.always,
    safeToCompensateAutomatically: options.safeCompensation,
    preview: () => ({ summary: "Test", resourceKeys: [], diff: [] }),
    execute: () => ({}),
  };
}

describe("autonomy policy", () => {
  const levels: AutonomyLevel[] = ["preview", "ask", "reversible", "trusted"];

  it("stages or asks under the two strict modes", () => {
    expect(decidePolicy(mutation("exact"), "preview", false).outcome).toBe("stage");
    expect(decidePolicy(mutation("exact"), "ask", false).outcome).toBe("require_approval");
  });

  it("allows exact and explicitly safe compensation in reversible mode", () => {
    expect(decidePolicy(mutation("exact"), "reversible", false).outcome).toBe("allow");
    expect(
      decidePolicy(
        mutation("compensating", { safeCompensation: true }),
        "reversible",
        false,
      ).outcome,
    ).toBe("allow");
  });

  it("keeps developer hard stops across every autonomy level", () => {
    for (const level of levels) {
      expect(
        decidePolicy(mutation("irreversible", { always: true }), level, false)
          .outcome,
      ).toBe("require_approval");
    }
  });

  it("denies new mutations while paused", () => {
    expect(decidePolicy(mutation("exact"), "trusted", true).outcome).toBe("deny");
  });
});

