# Remy roadmap

Remy is working toward one durable contract: define a semantic action once,
then expose the same policy, receipts, approvals, and recovery semantics across
protocols and agent runtimes. This roadmap has no promised dates; priorities
will follow the evidence from real integrations.

## Now

- Working WebMCP Morrow demonstration.
- Protocol-neutral semantic action engine.
- Policies and user-selectable autonomy modes.
- Explicit approvals for consequential actions.
- Append-only receipts and human-readable diffs.
- Exact reversal and compensation model.
- Local action history and persistence.
- MIT-licensed public release.

## Next

- Extract real packages:
  - `@remy-ai/core`
  - `@remy-ai/react`
  - `@remy-ai/webmcp`
  - `@remy-ai/cli`
- Publish and continuously verify an npm quickstart.
- Genericise the WebMCP adapter so it is not coupled to `DemoState`.
- Implement and test a one-call WebMCP integration.
- Add pluggable receipt storage with retention and redaction controls.
- Add framework-neutral Action Center primitives.
- Publish additional example applications beyond commerce.
- Run documentation snippets in CI.

## Later

- MCP adapter.
- OpenAI Agents SDK integration.
- Anthropic and Claude agent integrations.
- Vercel AI SDK integration.
- LangGraph and LangChain integrations.
- Other agent runtimes based on demonstrated developer demand.
- Hosted durable histories.
- Shared organisational policies.
- Approval routing.
- Monitoring and alerts for action outcomes.
- Evidence exports.
- Multi-environment and deployment support.

The future adapter API is intentionally not documented as shipped until it is
implemented, packaged, and exercised in CI. Today, the repository itself is the
working implementation and WebMCP is its first adapter.
