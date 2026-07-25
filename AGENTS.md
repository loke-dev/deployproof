# DeployProof repository guidance

- DeployProof is a TypeScript CLI, npm package, composite GitHub Action, and static product site.
- Keep comparisons deterministic and bounded: enforce timeouts, response-size limits, and explicit redirect limits.
- Never print authorization headers, cookie values, or response bodies. Reports may include cookie names and normalized attributes only.
- A comparison must make the same request against preview and production.
- Keep default behavior read-only. DeployProof must never mutate either target.
- Run `pnpm check` before release and browser-inspect user-facing changes when feasible.

