# Remy roadmap

Remy is working toward one durable contract: define a semantic action once,
then expose the same policy, receipts, approvals, and recovery semantics across
protocols and agent runtimes. This roadmap has no promised dates; priorities
will follow the evidence from real integrations.

## Now

- Working WebMCP Morrow demonstration.
- Application-neutral, protocol-neutral semantic action engine.
- Inferred `defineAction()` API over Standard Schema V1.
- Policies and user-selectable autonomy modes.
- Replaceable application policies and generic capability grants.
- Explicit approvals for consequential actions.
- Append-only receipts and human-readable diffs.
- Exact reversal and compensation model.
- Versioned local action journal separated from application state.
- Generic headless WebMCP registration and React external-store hook.
- Publish-ready `@remy-ai/core`, `@remy-ai/webmcp`, and `@remy-ai/react` packages.
- Clean-fixture tarball verification for package declarations and runtime exports.
- MIT-licensed public release.

## Next

- Publish the verified alpha packages to npm and continuously verify the public quickstart.
- Add a future initializer only after it can configure a real application end to end.
- Add durable receipt stores with retention and redaction controls.
- Add framework-neutral Action Center primitives.
- Publish additional example applications beyond commerce.
- Run documentation snippets in CI.
- Resource-scoped permissions.
- Time-limited grants.
- Task and batch receipts.
- Native editor-history integration.
- Visual diff contracts.
- Publish, export, and delete approval-policy presets.

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

Future protocol and SDK adapter APIs are intentionally not documented as
shipped until they are implemented, packaged, and exercised in CI. Today, the
repository contains verified package artifacts for the generic core, WebMCP
adapter, and React hook; publishing them to npm is a manual release step.
