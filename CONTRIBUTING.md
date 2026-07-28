# Contributing to DeployProof

Thanks for helping make preview deployments safer to review.

## Before opening an issue

- Search existing issues and the [roadmap](ROADMAP.md).
- Remove credentials, private URLs, cookie values, response bodies, and other
  sensitive data from reproductions.
- Reduce unexpected behavior to the smallest public or local fixture possible.
- Use [private vulnerability reporting](https://github.com/loke-dev/deployproof/security/advisories/new)
  for security issues.

## Development

DeployProof requires Node.js 20 or newer and uses the package-manager version
declared in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs TypeScript validation, the test suite, the distributable CLI
and library build, and the product-site build.

## Pull requests

Keep each pull request focused. Add or update tests for behavior changes and
document user-facing changes. Before submitting:

```bash
pnpm check
git diff --check
```

Changes to comparison behavior must preserve these invariants:

- The same route, method, and custom headers are used for both targets.
- Requests remain read-only and bounded by explicit time, redirect, and body
  limits.
- Response bodies, cookie values, custom request-header values, and raw query
  values never enter reports or errors.
- Custom headers are removed when a redirect crosses origins.
- Normalization must not erase a security-relevant difference.
- Every finding keeps a stable rule ID or includes a documented migration.

Generated `dist/cli.js` changes are committed because the composite GitHub
Action executes that reviewed bundle directly. Run the full check after editing
source so the bundle stays synchronized.

## Adding an integration recipe

Use official provider documentation as the source of truth. Keep workflow
permissions minimal, avoid printing secrets, pin CLI versions, and validate the
YAML. Explain any provider-specific prerequisites in
[`docs/integrations.md`](docs/integrations.md).

## Review

Maintainers may ask for a smaller scope, a public fixture, stronger redaction,
or evidence that two values are behaviorally equivalent. This protects the
tool's signal quality and privacy guarantees.
