"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ActionReceipt, RunResult } from "@remy-ai/core";
import { useRemySnapshot } from "@remy-ai/react";
import { createDemoRuntime, type DemoRuntime } from "./runtime";

export type ControlMode = "preview" | "ask" | "safe" | "full";

type DemoRemyContextValue = {
  readonly runtime: DemoRuntime;
  readonly remySnapshot: ReturnType<DemoRuntime["remy"]["getSnapshot"]>;
  readonly state: ReturnType<DemoRuntime["store"]["getSnapshot"]>;
  readonly controlMode: ControlMode;
  readonly lastError?: string;
  readonly approve: (actionId: string) => Promise<RunResult>;
  readonly reject: (actionId: string) => RunResult;
  readonly revert: (actionId: string) => Promise<RunResult>;
  readonly runUserAction: (name: string, input: unknown) => Promise<RunResult>;
  readonly setControlMode: (mode: ControlMode) => void;
  readonly reset: () => void;
};

const DemoRemyContext = createContext<DemoRemyContextValue | null>(null);

export function DemoRemyProvider({ children }: { readonly children: ReactNode }) {
  const [runtime] = useState(() => createDemoRuntime());
  const [lastError, setLastError] = useState<string>();
  const remySnapshot = useRemySnapshot(runtime.remy);
  const state = useSyncExternalStore(
    runtime.store.subscribe,
    runtime.store.getSnapshot,
    runtime.store.getServerSnapshot,
  );

  useEffect(() => {
    runtime.restore();
  }, [runtime]);

  const controlMode: ControlMode = remySnapshot.controls.paused ||
    remySnapshot.controls.autonomy === "preview"
    ? "preview"
    : remySnapshot.controls.autonomy === "ask"
      ? "ask"
      : remySnapshot.controls.autonomy === "trusted"
        ? "full"
        : "safe";
  const approve = useCallback(async (actionId: string) => {
    const result = await runtime.remy.approve(actionId);
    if (!result.ok) setLastError(result.error);
    return result;
  }, [runtime]);

  const reject = useCallback((actionId: string) => {
    const result = runtime.remy.reject(actionId);
    if (!result.ok) setLastError(result.error);
    return result;
  }, [runtime]);

  const revert = useCallback(async (actionId: string) => {
    const result = await runtime.remy.revert(actionId);
    if (!result.ok) setLastError(result.error);
    return result;
  }, [runtime]);

  const runUserAction = useCallback(async (name: string, input: unknown) => {
    setLastError(undefined);
    const result = await runtime.remy.runByName(name, input, {
      actor: "user",
      transport: "manual",
    });
    if (!result.ok) setLastError(result.error);
    return result;
  }, [runtime]);

  const setControlMode = useCallback((mode: ControlMode) => {
    setLastError(undefined);
    runtime.remy.setControls({
      autonomy: mode === "preview"
        ? "preview"
        : mode === "ask"
          ? "ask"
          : mode === "full"
            ? "trusted"
            : "reversible",
      paused: false,
      grants: runtime.remy.getSnapshot().controls.grants,
    });
  }, [runtime]);

  const value = useMemo<DemoRemyContextValue>(() => ({
    runtime,
    remySnapshot,
    state,
    controlMode,
    lastError,
    approve,
    reject,
    revert,
    runUserAction,
    setControlMode,
    reset: () => {
      runtime.reset();
      setLastError(undefined);
    },
  }), [
    approve,
    controlMode,
    lastError,
    reject,
    remySnapshot,
    revert,
    runUserAction,
    runtime,
    setControlMode,
    state,
  ]);

  return <DemoRemyContext.Provider value={value}>{children}</DemoRemyContext.Provider>;
}

export function useDemoRemy() {
  const value = useContext(DemoRemyContext);
  if (!value) throw new Error("useDemoRemy must be used inside DemoRemyProvider.");
  return value;
}

export function latestAwaitingReceipt(receipts: ReadonlyArray<ActionReceipt>) {
  return [...receipts].reverse().find((receipt) =>
    ["awaiting_approval", "staged"].includes(receipt.status));
}
