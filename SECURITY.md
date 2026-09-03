# Security policy

Remy is an early, protocol-neutral TypeScript implementation with a WebMCP
adapter. It is not a hosted security boundary. The demo uses fictional commerce
data and local browser storage.

## Report a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting for this repository. Include the affected
version or commit, reproduction steps, impact, and any suggested mitigation.

## Security expectations for integrations

- Treat agent identity as self-reported attribution, not authentication.
- Enforce authentication, authorisation, eligibility, and monetary totals in
  the host application or server.
- Validate all action input at runtime and allowlist persisted fields.
- Treat pending execution input, outputs, and recovery material as private;
  serialize only an explicitly redacted minimum when durable recovery is needed.
- Keep secrets, credentials, payment details, prompts, and transcripts out of
  receipts.
- Require explicit approval for irreversible or high-consequence actions.
- Treat approval UI inside an agent-controllable page as interaction friction, not
  proof of human identity. The demo's press-and-hold blocks routine clicks; a
  production integration facing unrestricted UI automation should use a
  host-native confirmation, re-authentication, passkey, or out-of-band approval.
- Use idempotency keys and resource-version checks at the real system boundary.
- Configure retention and redaction before using durable storage.
- Protect production state-changing endpoints against CSRF, replay, and abuse.
- Treat browser journals as inspectable and mutable, not audit-grade evidence.

See the [architecture](./ARCHITECTURE.md),
[production security checklist](./src/app/docs/page.tsx), and
[roadmap](./ROADMAP.md) for the current boundary and planned hardening.
