# @remy-ai/webmcp

Expose registered Remy actions through the browser WebMCP API.

> Alpha workspace package. It is prepared for publication but is not on npm yet. Run it from the [public repository](https://github.com/MustafaK99/Remy) today.

```ts
import type { RemyClient } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";

export async function exposeWebMCP(
  remy: RemyClient<unknown>,
  signal?: AbortSignal,
) {
  const registration = await registerWebMCP(remy, {
    signal,
    approvalTimeoutMs: 120_000,
  });

  if (registration.status === "unsupported") {
    console.info("WebMCP is unavailable; the application still works normally.");
  }

  return registration;
}
```

Call `registration.unregister()` when the page or integration is disposed.

Registration feature-detects `document.modelContext`, validates tool input through the action schema, reports partial failures, and supports `AbortSignal` cleanup. By default, an approval-gated tool promise remains pending until the underlying Remy action is approved or rejected, or until the bounded wait times out or is cancelled by the WebMCP host. The receipt is preserved in every case. Set `awaitApproval: false` only for a host that cannot keep tool executions open.

This behavior uses the protocol-neutral `remy.waitForAction()` lifecycle. WebMCP is an adapter, not the action system of record. Agent identity supplied through WebMCP is self-reported attribution, never authority.

MIT licensed. Alpha software.
