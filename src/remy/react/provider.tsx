"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createDemoEngine } from "@/demo/create-engine";
import type { DemoState } from "@/demo/data";
import type {
  ActionReceipt,
  AutonomyLevel,
  EngineSnapshot,
  RunResult,
} from "@/remy/core/types";
import type { RemyEngine } from "@/remy/core/engine";

type DemoRunStatus = "idle" | "running" | "waiting" | "complete" | "stopped";

type RemyContextValue = {
  engine: RemyEngine<DemoState>;
  snapshot: EngineSnapshot<DemoState>;
  runStatus: DemoRunStatus;
  lastError?: string;
  runDemo: () => Promise<void>;
  approve: (actionId: string) => Promise<RunResult>;
  reject: (actionId: string) => RunResult;
  revert: (actionId: string) => Promise<RunResult>;
  setAutonomy: (level: AutonomyLevel) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
  simulateAddressConflict: () => void;
};

const RemyContext = createContext<RemyContextValue | null>(null);

const HERO_STEPS: Array<[string, unknown]> = [
  ["get_order", { orderId: "1842" }],
  ["get_return_options", { orderId: "1842" }],
  [
    "create_return_draft",
    { orderId: "1842", itemIds: ["headphones", "case"] },
  ],
  [
    "add_return_reason",
    { orderId: "1842", reason: "Incompatible with my laptop" },
  ],
  [
    "update_collection_address",
    { orderId: "1842", address: "22 New Road" },
  ],
  ["book_collection", { orderId: "1842", date: "Next Friday" }],
  ["prepare_refund", { orderId: "1842" }],
  ["issue_refund", { orderId: "1842" }],
];

const delay = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Demo stopped", "AbortError"));
      },
      { once: true },
    );
  });

export function RemyProvider({ children }: { children: ReactNode }) {
  const [engine] = useState(() => createDemoEngine({ persist: true }));
  const [snapshot, setSnapshot] = useState<EngineSnapshot<DemoState>>(
    engine.getSnapshot(),
  );
  const [runStatus, setRunStatus] = useState<DemoRunStatus>("idle");
  const [lastError, setLastError] = useState<string>();
  const nextStepRef = useRef(0);
  const heroActiveRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => setSnapshot(engine.getSnapshot()));
    return () => {
      unsubscribe();
      controllerRef.current?.abort();
    };
  }, [engine]);

  const continueDemo = useCallback(async (startIndex: number) => {
    const controller = controllerRef.current ?? new AbortController();
    controllerRef.current = controller;
    setRunStatus("running");

    try {
      for (let index = startIndex; index < HERO_STEPS.length; index += 1) {
        const [name, input] = HERO_STEPS[index];
        while (engine.getSnapshot().paused) {
          await delay(120, controller.signal);
        }
        await delay(index === 0 ? 260 : 480, controller.signal);
        const result = await engine.run(name, input, {
          actor: "agent",
          transport: "webmcp",
          idempotencyKey: `hero:${name}`,
        });
        if (!result.ok) {
          setLastError(result.error);
          setRunStatus("stopped");
          return;
        }
        nextStepRef.current = index + 1;
        if (result.requiresApproval || result.status === "staged") {
          setRunStatus("waiting");
          return;
        }
      }
      heroActiveRef.current = false;
      setRunStatus("complete");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setLastError(error instanceof Error ? error.message : "The demo stopped.");
        setRunStatus("stopped");
      }
    }
  }, [engine]);

  const runDemo = useCallback(async () => {
    controllerRef.current?.abort();
    const selectedAutonomy = engine.getSnapshot().autonomy;
    engine.reset();
    engine.setAutonomy(selectedAutonomy);
    setLastError(undefined);
    nextStepRef.current = 0;
    heroActiveRef.current = true;
    controllerRef.current = new AbortController();
    await continueDemo(0);
  }, [continueDemo, engine]);

  const approve = useCallback(
    async (actionId: string) => {
      const result = await engine.approve(actionId);
      if (result.ok) {
        if (heroActiveRef.current && nextStepRef.current < HERO_STEPS.length) {
          await continueDemo(nextStepRef.current);
        } else {
          heroActiveRef.current = false;
          setRunStatus("complete");
        }
      } else setLastError(result.error);
      return result;
    },
    [continueDemo, engine],
  );

  const reject = useCallback(
    (actionId: string) => {
      const result = engine.reject(actionId);
      heroActiveRef.current = false;
      setRunStatus("stopped");
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

  const value = useMemo<RemyContextValue>(
    () => ({
      engine,
      snapshot,
      runStatus,
      lastError,
      runDemo,
      approve,
      reject,
      revert,
      setAutonomy: (level) => engine.setAutonomy(level),
      setPaused: (paused) => engine.setPaused(paused),
      reset: () => {
        controllerRef.current?.abort();
        heroActiveRef.current = false;
        nextStepRef.current = 0;
        engine.reset();
        setRunStatus("idle");
        setLastError(undefined);
      },
      simulateAddressConflict: () =>
        engine.simulateVersionConflict("return:1842:address"),
    }),
    [
      approve,
      engine,
      lastError,
      reject,
      revert,
      runDemo,
      runStatus,
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
