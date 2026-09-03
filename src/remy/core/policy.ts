import type {
  ActionDefinition,
  AutonomyLevel,
  PolicyDecision,
} from "./types";

export function decidePolicy<State>(
  action: ActionDefinition<State, unknown>,
  autonomy: AutonomyLevel,
  paused: boolean,
): PolicyDecision {
  if (action.kind === "read") {
    return { outcome: "allow", reason: "Read-only actions are safe to run." };
  }

  if (paused) {
    return {
      outcome: "deny",
      reason: "New changes are paused by the user.",
    };
  }

  if (action.alwaysRequireApproval) {
    return {
      outcome: "require_approval",
      reason: "The developer requires approval for this action every time.",
    };
  }

  if (autonomy === "preview") {
    return {
      outcome: "stage",
      reason: "Preview only stages every change for review.",
    };
  }

  if (autonomy === "ask") {
    return {
      outcome: "require_approval",
      reason: "Ask on changes requires approval for every mutation.",
    };
  }

  if (autonomy === "reversible") {
    if (action.reversibility === "exact" && action.risk !== "high") {
      return {
        outcome: "allow",
        reason: "This action is reversible and within the configured risk limit.",
      };
    }

    if (
      action.reversibility === "compensating" &&
      action.safeToCompensateAutomatically &&
      action.risk !== "high"
    ) {
      return {
        outcome: "allow",
        reason: "The developer marked this compensating action safe to run.",
      };
    }

    return {
      outcome: "require_approval",
      reason: "This action is not safely reversible within the current policy.",
    };
  }

  return {
    outcome: "allow",
    reason: "Trusted run permits this developer-defined action.",
  };
}

