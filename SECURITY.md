# Security policy

Remy is an early WebMCP implementation and is not yet a hosted security
boundary. The demo uses fictional commerce data and local browser storage.

## Report a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting for this repository. Include the affected
version or commit, reproduction steps, impact, and any suggested mitigation.

## Security expectations for integrations

- Treat agent identity as self-reported attribution, not authentication.
- Enforce authentication, authorisation, eligibility, and monetary totals in
  the host application or server.
- Validate all action input at runtime and allowlist persisted fields.
- Keep secrets, credentials, payment details, prompts, and transcripts out of
  receipts.
- Require explicit approval for irreversible or high-consequence actions.
- Use idempotency keys and resource-version checks at the real system boundary.
- Configure retention and redaction before using durable storage.
- Protect production state-changing endpoints against CSRF, replay, and abuse.

See the [production security checklist](./src/app/docs/page.tsx) and the
[roadmap](./ROADMAP.md) for the current boundary and planned hardening.
