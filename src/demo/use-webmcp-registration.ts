"use client";

import { useEffect, useState } from "react";
import type { RemyClient } from "@remy-ai/core";
import { registerWebMCP, type WebMCPStatus } from "@remy-ai/webmcp";

export function useWebMCPRegistration<Context>(remy: RemyClient<Context>) {
  const [status, setStatus] = useState<WebMCPStatus>("checking");

  useEffect(() => {
    const lifecycle = new AbortController();
    void registerWebMCP(remy, { signal: lifecycle.signal }).then((registration) => {
      if (!lifecycle.signal.aborted) setStatus(registration.status);
    });
    return () => lifecycle.abort();
  }, [remy]);

  return status;
}
