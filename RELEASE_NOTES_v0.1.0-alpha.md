# Remy v0.1.0-alpha

Remy is an open-source TypeScript SDK for permissions, approvals, receipts, and recovery around AI agent actions.

This alpha lets developers wrap existing application functions as typed actions. Reversible work can run automatically, consequential work can wait for explicit approval, and every attempt receives a bounded readable receipt with the correct recovery model.

## Included

- `@remy-ai/core`: action definitions, policy, approvals, receipts, journal stores, version checks, idempotency, and recovery.
- `@remy-ai/webmcp`: generic one-call WebMCP registration with runtime validation and cleanup.
- `@remy-ai/react`: optional `useRemySnapshot()` external-store hook.
- No-login Morrow WebMCP demo with three automatic shopping changes, an explicit purchase approval, exact delivery undo, and trusted execution.
- Dark product landing page with a working miniature approval and recovery flow.

## Alpha boundaries

- The host application remains responsible for authentication, authorisation, authoritative state, and durable side effects.
- WebMCP identity is self-reported attribution, not authority.
- Browser journal storage is local demo persistence, not a tamper-proof audit log.
- MCP and agent-framework adapters are planned, not shipped.
- Package APIs may change between alpha releases.

See the [quickstart](./README.md), [architecture](./ARCHITECTURE.md), [security guidance](./SECURITY.md), and [roadmap](./ROADMAP.md).
