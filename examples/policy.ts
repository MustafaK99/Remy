import type { Policy } from "@remy-ai/core";

export const documentPolicy: Policy = ({ action, controls }) => {
  if (controls.paused) {
    return { outcome: "deny", reason: "Agent changes are paused." };
  }
  const missingGrant = action.requiredGrants.find(
    (grant) => !controls.grants.includes(grant),
  );
  if (missingGrant) {
    return {
      outcome: "require_approval",
      reason: `The ${missingGrant} grant is missing.`,
    };
  }
  return { outcome: "allow", reason: "Application policy allows it." };
};
