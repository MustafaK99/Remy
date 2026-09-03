import type { ResourceVersionProvider } from "@/remy/core";
import { createInitialDemoState, type DemoState } from "./data";

type Listener = () => void;

export type DemoStore = ResourceVersionProvider & {
  readonly getSnapshot: () => DemoState;
  readonly getServerSnapshot: () => DemoState;
  readonly subscribe: (listener: Listener) => () => void;
  readonly setState: (next: DemoState) => void;
  readonly reset: () => void;
};

export function createDemoStore(initialState = createInitialDemoState()): DemoStore {
  let state = initialState;
  const serverState = createInitialDemoState();
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => serverState,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState: (next) => {
      state = next;
      emit();
    },
    getVersion: (resource) => state.versions[resource],
    bumpVersion: (resource) => {
      const nextVersion = (state.versions[resource] ?? 0) + 1;
      state = {
        ...state,
        versions: { ...state.versions, [resource]: nextVersion },
      };
      emit();
      return nextVersion;
    },
    reset: () => {
      state = createInitialDemoState();
      emit();
    },
  };
}
