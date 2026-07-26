# DeployProof

[![CI](https://github.com/loke-dev/deployproof/actions/workflows/ci.yml/badge.svg)](https://github.com/loke-dev/deployproof/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/deployproof)](https://www.npmjs.com/package/deployproof)
[![license](https://img.shields.io/npm/l/deployproof)](LICENSE)

Prove that a preview deployment behaves like production before you merge it.
DeployProof sends the same bounded request to both environments, then compares
the behavior that commonly drifts between them: status codes, redirect chains,
final paths, cache and security headers, cookie attributes, canonical URLs,
robots directives, and titles.

It is read-only, does not need credentials, and never prints response bodies,
cookie values, or custom request-header values.

Custom request headers are sent only to the selected base origin and its
same-origin redirects. DeployProof drops them if a redirect leaves that origin.
Query-string values are represented by deterministic fingerprints in reports,
so differences remain detectable without printing the original values.

## Quick start

```bash
npx deployproof \
  --preview https://my-pr.example.workers.dev \
  --production https://example.com \
  / /docs /api/health
```

Exit code `0` means every route passed. Exit code `1` means a behavioral
difference was found. Exit code `2` means DeployProof could not run.

## Configuration

Create `deployproof.config.json`:

```json
{
  "production": "https://example.com",
  "routes": [
    "/",
    "/docs",
    {
      "path": "/api/health",
      "method": "GET",
      "expect": {
        "status": 200,
        "contentType": "application/json"
      }
    }
  ],
  "timeoutMs": 10000,
  "maxRedirects": 5,
  "maxBodyBytes": 512000
}
```

Pass the preview URL from CI:

```bash
DEPLOYPROOF_PREVIEW="$PREVIEW_URL" npx deployproof --strict
```

The CLI also reads `DEPLOYPROOF_PRODUCTION`, so URLs never have to live in the
configuration file.

## GitHub Action

```yaml
- uses: loke-dev/deployproof@v0.1.2
  with:
    preview: ${{ steps.deploy.outputs.deployment-url }}
    production: https://example.com
    strict: true
```

The Action emits native annotations for each route difference. It compares
cookie names and attributes such as `Secure`, `HttpOnly`, and `SameSite`, but
never exposes cookie values. It runs the reviewed CLI bundle from the selected
repository tag without downloading executable code from npm.

## Output formats

```bash
deployproof --format human   # readable terminal report
deployproof --format json    # automation and dashboards
deployproof --format github  # workflow annotations
deployproof --format sarif   # code scanning upload
```

Use `--strict` to make warnings fail the check. Errors always fail. Notices
remain informational.

## What DeployProof catches

| ID | Difference | Default severity |
| --- | --- | --- |
| `DP000` | Request failed or timed out | error |
| `DP001` | HTTP status | error |
| `DP002` | Final path and query | error |
| `DP003` | Redirect chain | warning |
| `DP004` | Cache, content, and security headers | notice or warning |
| `DP005` | Cookie names or security attributes | warning |
| `DP006` | Title, canonical, or robots metadata | notice or warning |
| `DP007` | Explicit status expectation | error |
| `DP008` | Explicit content type expectation | error |

Response bodies are read only for HTML metadata, capped at 500 KB by default,
and never included in output.

## Development

```bash
pnpm install
pnpm check
pnpm dev -- --preview http://localhost:4173 --production https://example.com
```

DeployProof is MIT licensed. Product documentation is at
[deployproof.loke.dev](https://deployproof.loke.dev).
