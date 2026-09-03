import {
  createBrowserJournalStore,
  createMemoryJournalStore,
  createRemy,
  type Clock,
  type IdGenerator,
  type Policy,
} from "@/remy/core";
import { registerDemoActions } from "./actions";
import { clearDemoState, loadDemoState, saveDemoState } from "./persistence";
import { createDemoStore } from "./store";

export function createDemoRuntime(options: {
  readonly persist?: boolean;
  readonly clock?: Clock;
  readonly idGenerator?: IdGenerator;
  readonly policy?: Policy;
} = {}) {
  const store = createDemoStore();
  const journal = options.persist
    ? createBrowserJournalStore({ namespace: "remy:morrow-demo" })
    : createMemoryJournalStore();
  const remy = createRemy({
    context: () => store,
    resources: store,
    journal,
    policy: options.policy,
    clock: options.clock,
    idGenerator: options.idGenerator,
    defaultRunId: "morrow-demo-run",
    defaultTaskId: "morrow-checkout",
    controls: { autonomy: "reversible", paused: false, grants: [] },
  });
  const actions = registerDemoActions(remy);
  let restored = false;

  return {
    remy,
    store,
    actions,
    restore() {
      if (restored || !options.persist || typeof window === "undefined") return;
      restored = true;
      const state = loadDemoState();
      if (state) store.setState(state);
      remy.restore();
      store.subscribe(() => saveDemoState(store.getSnapshot()));
    },
    reset() {
      remy.reset();
      store.reset();
      if (options.persist && typeof window !== "undefined") {
        clearDemoState();
        saveDemoState(store.getSnapshot());
      }
    },
  };
}

export type DemoRuntime = ReturnType<typeof createDemoRuntime>;
