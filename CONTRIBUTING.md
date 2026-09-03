# Contributing to Remy

Thanks for helping make agent actions easier to trust.

## Start locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/MustafaK99/Remy.git
cd Remy
npm ci
npm run dev
```

Open `http://localhost:3000/demo`. Browsers without the imperative WebMCP API
can still use the shop and inspect Remy; use `scripts/webmcp-browser-mock.js`
when testing agent tool registration locally.

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Keep changes focused. Add or update tests for engine and policy behaviour. Do
not weaken approval, stale-state, idempotency, history, or reversal guarantees.
Documentation and UI claims must describe code that works in a clean checkout.

By contributing, you agree that your contribution is licensed under the MIT
License in this repository.
