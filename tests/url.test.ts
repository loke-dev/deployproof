import { describe, expect, it } from "vitest";
import { safeAbsoluteUrl, safeRoutePath } from "../src/url.js";

describe("safe URL reporting", () => {
  it("fingerprints query values and normalizes their order", () => {
    const left = safeRoutePath("/callback?token=top-secret&next=%2Fdocs");
    const right = safeRoutePath("/callback?next=%2Fdocs&token=top-secret");

    expect(left).toBe(right);
    expect(left).toContain("sha256%3A");
    expect(left).not.toContain("top-secret");
    expect(left).not.toContain("%2Fdocs");
  });

  it("keeps origins and paths readable", () => {
    expect(safeAbsoluteUrl(new URL("https://example.com/docs"))).toBe(
      "https://example.com/docs",
    );
  });

  it("fingerprints values that already resemble internal fingerprints", () => {
    const protectedValue = safeRoutePath("/callback?token=top-secret");
    const fingerprint = new URL(
      protectedValue,
      "https://deployproof.invalid",
    ).searchParams.get("token");

    expect(fingerprint).toMatch(/^sha256:[0-9a-f]{12}$/);
    expect(
      safeRoutePath(`/callback?token=${encodeURIComponent(fingerprint!)}`),
    ).not.toBe(protectedValue);
  });
});
