# @remy-ai/webmcp

Expose registered Remy actions through the browser WebMCP API.

```bash
npm install @remy-ai/core @remy-ai/webmcp
```

```ts
import type { RemyClient } from "@remy-ai/core";
import { registerWebMCP } from "@remy-ai/webmcp";

export async function exposeWebMCP(
  remy: RemyClient<unknown>,
  signal?: AbortSignal,
) {
  const registration = await registerWebMCP(remy, { signal });

  if (registration.status === "unsupported") {
    console.info("WebMCP is unavailable; the application still works normally.");
  }

  return registration;
}
```

Call `registration.unregister()` when the page or integration is disposed.

Registration feature-detects `document.modelContext`, validates tool input through the action schema, reports partial failures, and supports `AbortSignal` cleanup. Agent identity supplied through WebMCP is self-reported attribution, never authority.

MIT licensed. Alpha software.
