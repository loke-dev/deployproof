# Roadmap

DeployProof is an open-source preview-parity toolkit. Its job is narrow:
compare the observable HTTP contract of a preview deployment with production
before a change is merged.

## Product principles

1. **Compare, do not guess.** The same bounded request is sent to preview and
   production. Findings describe observed drift rather than speculative risk.
2. **Private by construction.** Reports never include response bodies, cookie
   values, custom request-header values, or raw query values.
3. **Useful without an account.** The CLI, library, and GitHub Action work
   locally or in a user's own CI environment.
4. **Low-noise defaults.** Behaviorally equivalent values are normalized before
   comparison.
5. **Provider-neutral core.** Deployment providers supply URLs; the comparison
   engine remains portable.

## Current focus

- Make the GitHub Action easy to adopt after any preview deployment.
- Maintain tested recipes for GitHub deployments, Vercel, Cloudflare, and
  Netlify.
- Expand deterministic normalization only when a real equivalent-behavior case
  is demonstrated by a fixture.
- Improve structured output for CI systems and library consumers.
- Publish threat-model, benchmarking, and integration documentation.

## Next

- Reusable workflow examples for common monorepo and multi-site layouts.
- Optional comparison policies that map stable rule IDs to severity without
  hiding findings.
- Machine-readable JSON Schema for configuration and results.
- A benchmark suite for bounded reads, redirect chains, and large route sets.
- More end-to-end fixtures covering provider-specific redirect and header
  behavior.

## Later, if adoption supports it

- Additional CI providers and deployment platforms.
- A plugin interface for new deterministic checks.
- Historical result comparison through user-owned artifacts.
- A separately evaluated hosted offering only if users demonstrate a need that
  cannot be met safely in their own CI.

## Non-goals

- Uptime or synthetic monitoring
- Browser automation and visual regression testing
- Mutation of preview or production targets
- Collection of response bodies or credentials
- AI-generated findings without deterministic evidence
- A hosted account, billing, or telemetry requirement for core functionality

Roadmap items are directional, not release commitments. Open a feature request
with a concrete use case before investing in a large implementation.
