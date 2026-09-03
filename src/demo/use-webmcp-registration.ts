"use client";

import { useEffect, useState } from "react";
import type { RemyClient } from "@remy-ai/core";
import { registerWebMCP, type WebMCPStatus } from "@remy-ai/webmcp";
import type { DemoStore } from "./store";
import { createPrepareDemoOrderTool } from "./webmcp-tools";

export function useWebMCPRegistration(remy: RemyClient<DemoStore>) {
  const [status, setStatus] = useState<WebMCPStatus>("checking");

  useEffect(() => {
    const lifecycle = new AbortController();
    void registerWebMCP(remy, {
      signal: lifecycle.signal,
      additionalTools: [createPrepareDemoOrderTool(remy)],
    }).then((registration) => {
      if (!lifecycle.signal.aborted) setStatus(registration.status);
    });
    return () => lifecycle.abort();
  }, [remy]);

  return status;
}
