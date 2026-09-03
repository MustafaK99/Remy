"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createDemoEngine } from "@/demo/create-engine";
import type { DemoState } from "@/demo/data";
import type {
  ActionReceipt,
  EngineSnapshot,
  RunResult,
} from "@/remy/core/types";
import type { RemyEngine } from "@/remy/core/engine";

export type ControlMode = "preview" | "ask" | "safe" | "full";

type RemyContextValue = {
  engine: RemyEngine<DemoState>;
  snapshot: EngineSnapshot<DemoState>;
  controlMode: ControlMode;
  lastError?: string;
  approve: (actionId: string) => Promise<RunResult>;
  reject: (actionId: string) => RunResult;
  revert: (actionId: string) => Promise<RunResult>;
  runUserAction: (name: string, input: unknown) => Promise<RunResult>;
  setControlMode: (mode: ControlMode) => void;
  setAllowPurchases: (allow: boolean) => void;
  reset: () => void;
};

const RemyContext = createContext<RemyContextValue | null>(null);

export function RemyProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => createDemoEngine({ persist: true }));
  const [snapshot, setSnapshot] = useState<EngineSnapshot<DemoState>>(
    engine.getSnapshot(),
  );
  const [lastError, setLastError] = useState<string>();

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => setSnapshot(engine.getSnapshot()));
    return unsubscribe;
  }, [engine]);

  const controlMode: ControlMode = snapshot.paused || snapshot.autonomy === "preview"
    ? "preview"
    : snapshot.autonomy === "ask"
      ? "ask"
      : snapshot.autonomy === "trusted"
        ? "full"
        : "safe";

  const approve = useCallback(
    async (actionId: string) => {
      const result = await engine.approve(actionId);
      if (!result.ok) setLastError(result.error);
      return result;
    },
    [engine],
  );

  const reject = useCallback(
    (actionId: string) => {
      const result = engine.reject(actionId);
      if (!result.ok) setLastError(result.error);
      return result;
    },
    [engine],
  );

  const revert = useCallback(
    async (actionId: string) => {
      const result = await engine.revert(actionId);
      if (!result.ok) setLastError(result.error);
      return result;
    },
    [engine],
  );

  const runUserAction = useCallback(
    async (name: string, input: unknown) => {
      setLastError(undefined);
      const result = await engine.run(name, input, {
        actor: "user",
        transport: "manual",
      });
      if (!result.ok) setLastError(result.error);
      return result;
    },
    [engine],
  );

  const setControlMode = useCallback(
    (mode: ControlMode) => {
      setLastError(undefined);
      engine.setControls({
        autonomy:
          mode === "preview"
            ? "preview"
            : mode === "ask"
              ? "ask"
              : mode === "full"
                ? "trusted"
                : "reversible",
        paused: false,
        allowPurchases: mode === "full" ? snapshot.allowPurchases : false,
      });
    },
    [engine, snapshot.allowPurchases],
  );

  const setAllowPurchases = useCallback(
    (allow: boolean) => {
      if (controlMode !== "full") return;
      engine.setAllowPurchases(allow);
    },
    [controlMode, engine],
  );

  const value = useMemo<RemyContextValue>(
    () => ({
      engine,
      snapshot,
      controlMode,
      lastError,
      approve,
      reject,
      revert,
      runUserAction,
      setControlMode,
      setAllowPurchases,
      reset: () => {
        engine.reset();
        setLastError(undefined);
      },
    }),
    [
      approve,
      controlMode,
      engine,
      lastError,
      reject,
      revert,
      runUserAction,
      setControlMode,
      setAllowPurchases,
      snapshot,
    ],
  );

  return <RemyContext.Provider value={value}>{children}</RemyContext.Provider>;
}

export function useRemy() {
  const value = useContext(RemyContext);
  if (!value) throw new Error("useRemy must be used inside RemyProvider.");
  return value;
}

export function latestAwaitingReceipt(receipts: ActionReceipt[]) {
  return [...receipts]
    .reverse()
    .find((receipt) =>
      ["awaiting_approval", "staged"].includes(receipt.status),
    );
}
