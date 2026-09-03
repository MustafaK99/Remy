# @remy-ai/react

Small, optional React bindings for Remy.

```bash
npm install @remy-ai/core @remy-ai/react
```

```tsx
"use client";

import { useRemySnapshot } from "@remy-ai/react";
import type { RemyClient } from "@remy-ai/core";

export function PendingActions({
  remy,
}: {
  readonly remy: RemyClient<unknown>;
}) {
  const snapshot = useRemySnapshot(remy);
  return <span>{snapshot.receipts.length} recorded actions</span>;
}
```

`useRemySnapshot` uses React's external-store contract and preserves referentially stable snapshots between changes. React is a peer dependency; Remy does not require a provider or any styling system.

MIT licensed. Alpha software.
