# Deployment integrations

DeployProof needs two base URLs: the new preview deployment and the stable
production site. It does not create deployments or require a hosted account.
Run it after the provider reports that the preview is ready.

## Choose the smallest integration

| Deployment flow | Recommended recipe |
| --- | --- |
| Provider creates GitHub deployment statuses | [`deployment-status.yml`](../examples/github-actions/deployment-status.yml) |
| Vercel CLI deploys from GitHub Actions | [`vercel.yml`](../examples/github-actions/vercel.yml) |
| Cloudflare Wrangler Action deploys the preview | [`cloudflare.yml`](../examples/github-actions/cloudflare.yml) |
| Netlify CLI deploys the preview | [`netlify.yml`](../examples/github-actions/netlify.yml) |
| A custom deploy job exposes a URL output | Pass that output directly to `loke-dev/deployproof` |

The generic deployment-status recipe is the preferred option when available.
It consumes the standard `environment_url` reported by GitHub and avoids
coupling the check to a provider-specific API.

## Configuration

Store the production base URL as a non-secret GitHub Actions variable named
`PRODUCTION_URL`. Keep provider credentials in GitHub Actions secrets. A
minimal `deployproof.config.json` can define the behavioral contract:

```json
{
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

The Action's `routes` input is useful for simple setups. Routes from the input
are appended to routes in the configuration file.

## Protected previews

The GitHub-hosted runner must be able to reach both targets. If a provider
protects preview deployments, use the provider's documented automation bypass
mechanism. DeployProof can send custom headers declared in the route
configuration, but the same header set is intentionally sent to preview and
production so the comparison remains valid.

Never commit bypass tokens. Inject secrets at workflow runtime and avoid
printing configuration or command arguments containing secret values.

## Security model

- Requests are read-only and limited to `GET` and `HEAD`.
- Preview and production receive the same route, method, and custom headers.
- Custom headers are dropped when a redirect crosses origins.
- Response bodies are read only for bounded HTML metadata extraction and are
  never included in reports.
- Cookie values and custom request-header values are never reported.
- Query values are replaced with deterministic fingerprints.

Review the repository's [security policy](../.github/SECURITY.md) before using
private targets or sensitive automation credentials.
