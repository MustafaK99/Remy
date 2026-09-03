"use client";

import { useSyncExternalStore } from "react";
import type { RemyClient } from "@remy-ai/core";

export function useRemySnapshot<Context>(remy: RemyClient<Context>) {
  return useSyncExternalStore(
    remy.subscribe,
    remy.getSnapshot,
    remy.getServerSnapshot,
  );
}
