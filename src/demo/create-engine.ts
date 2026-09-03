import { RemyEngine } from "@/remy/core/engine";
import type { PersistedEngineSnapshot } from "@/remy/core/types";
import { demoActions } from "./actions";
import { createInitialDemoState, type DemoState } from "./data";
import { createDemoStateAdapter } from "./store";

const STORAGE_KEY = "remy-demo-v1";

function loadPersisted(): PersistedEngineSnapshot<DemoState> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedEngineSnapshot<DemoState>) : undefined;
  } catch {
    return undefined;
  }
}

export function createDemoEngine(options: { persist?: boolean } = {}) {
  const persisted = options.persist ? loadPersisted() : undefined;
  const adapter = createDemoStateAdapter(persisted?.state ?? createInitialDemoState());
  const engine = new RemyEngine(adapter, {
    autonomy: "reversible",
    onPersist: options.persist
      ? (snapshot) => {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
          } catch {
            // The demo remains fully usable when storage is unavailable.
          }
        }
      : undefined,
  });

  demoActions.forEach((action) => engine.register(action));
  if (persisted) engine.restore(persisted);
  return engine;
}

