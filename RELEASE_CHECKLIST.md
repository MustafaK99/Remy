# Remy alpha release checklist

## Code and artifacts

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:run`
- [ ] `npm run build`
- [ ] `npm run verify:packages`
- [ ] `npm run test:browser`
- [ ] Inspect the three tarballs under `artifacts/packages/`.
- [ ] Complete desktop and mobile browser smoke tests for `/`, `/docs`, and `/demo`.

## npm

- [ ] Confirm access to the `@remy-ai` npm organisation or scope.
- [ ] Run `npm whoami` and enable the account’s required two-factor authentication.
- [ ] Confirm package names are available with `npm view @remy-ai/core`, `npm view @remy-ai/webmcp`, and `npm view @remy-ai/react`.
- [ ] Publish core first, then WebMCP and React, using the `alpha` dist-tag.
- [ ] Install from the public registry in a new directory and repeat the smoke example.

## GitHub

- [ ] Review tracked files and the secret scan; do not publish local environment files or private data.
- [ ] Push the release commit and wait for the CI status check to pass.
- [ ] Add the recommended repository description and topics.
- [x] Repository visibility is public (verified through the GitHub API).
- [ ] Create tag `v0.1.0-alpha` from the verified commit.
- [ ] Create a GitHub prerelease using `RELEASE_NOTES_v0.1.0-alpha.md`.

## Documentation

- [ ] Remove the npm-publication-pending note only after the registry install succeeds.
- [ ] Add the real npm package links after publication.
- [ ] Confirm the demo and documentation deployment URLs.

## Deployment

- [ ] Connect the repository to Vercel (no local Vercel project or credentials are currently configured).
- [ ] Use the repository root, Node.js 20+, `npm run build`, and the default Next.js output.
- [ ] Verify `/`, `/demo`, `/demo?judge=1`, and `/docs` on the HTTPS production origin.
- [ ] Run the browser smoke test with `REMY_BASE_URL` set to the HTTPS production origin.
