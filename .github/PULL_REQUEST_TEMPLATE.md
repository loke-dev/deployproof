## Summary

Describe the user-visible problem and the focused change.

## Verification

- [ ] `pnpm check`
- [ ] `git diff --check`
- [ ] Tests cover changed behavior
- [ ] User-facing behavior is documented

## Safety

- [ ] Preview and production receive the same request contract
- [ ] Requests remain read-only and bounded
- [ ] Reports and errors contain no response bodies or secret values
- [ ] Cross-origin redirects cannot forward custom headers
- [ ] The change does not erase a security-relevant difference

Mark safety items not applicable only when the change cannot affect comparison
or reporting behavior.
