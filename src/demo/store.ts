import type { EngineStateAdapter } from "@/remy/core/types";
import { createInitialDemoState, type DemoState } from "./data";

export function createDemoStateAdapter(
  initialState = createInitialDemoState(),
): EngineStateAdapter<DemoState> {
  let state = initialState;

  return {
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    getVersion: (resourceKey) => state.versions[resourceKey] ?? 0,
    bumpVersion: (resourceKey) => {
      const nextVersion = (state.versions[resourceKey] ?? 0) + 1;
      state = {
        ...state,
        versions: { ...state.versions, [resourceKey]: nextVersion },
      };
      return nextVersion;
    },
    reset: () => {
      state = createInitialDemoState();
    },
  };
}

