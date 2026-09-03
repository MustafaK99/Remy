# @remy-ai/react

Small, optional React bindings for Remy.

> Public alpha. Install with `npm install @remy-ai/react@alpha` and review the [public repository](https://github.com/MustafaK99/Remy) before production use.

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
