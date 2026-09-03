import type { Policy, PolicyDecision, PolicyRequest } from "./public-types";

export function decideAutonomyPolicy(request: PolicyRequest): PolicyDecision {
  const { action, actor, controls } = request;

  if (actor === "user") {
    return {
      outcome: "allow",
      reason: "The user requested this action directly in the application.",
    };
  }

  const missingGrant = action.requiredGrants.find(
    (grant) => !controls.grants.includes(grant),
  );
  if (missingGrant) {
    return {
      outcome: "require_approval",
      reason: `This action requires the ${missingGrant} grant.`,
    };
  }

  if (action.kind === "read") {
    return { outcome: "allow", reason: "This action does not change state." };
  }

  if (controls.paused) {
    return { outcome: "deny", reason: "New agent changes are paused." };
  }

  if (action.approval === "always") {
    return {
      outcome: "require_approval",
      reason: "The application requires approval for this action every time.",
    };
  }

  if (controls.autonomy === "preview") {
    return {
      outcome: "stage",
      reason: "Preview mode stages every state-changing action.",
    };
  }

  if (controls.autonomy === "ask") {
    return {
      outcome: "require_approval",
      reason: "Ask mode requires approval for every state-changing action.",
    };
  }

  if (controls.autonomy === "reversible") {
    const isLowEnoughRisk = action.risk !== "high";
    if (action.recovery === "exact" && isLowEnoughRisk) {
      return {
        outcome: "allow",
        reason: "This action has exact recovery and is within the risk limit.",
      };
    }
    if (
      action.recovery === "compensating" &&
      action.automaticCompensation &&
      isLowEnoughRisk
    ) {
      return {
        outcome: "allow",
        reason: "The application marked this compensation safe for automatic work.",
      };
    }
    return {
      outcome: "require_approval",
      reason: "This action is not safely recoverable under the current policy.",
    };
  }

  return {
    outcome: "allow",
    reason: "Trusted mode permits this application-defined action.",
  };
}

export function createAutonomyPolicy(): Policy {
  return decideAutonomyPolicy;
}
