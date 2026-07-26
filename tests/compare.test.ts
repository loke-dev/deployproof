import { describe, expect, it } from "vitest";
import { compareSnapshots } from "../src/compare.js";
import type { Snapshot } from "../src/types.js";

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    requestedUrl: "https://preview.test/docs",
    finalUrl: "https://preview.test/docs",
    status: 200,
    durationMs: 20,
    redirects: [],
    headers: { "content-type": "text/html; charset=utf-8" },
    cookies: [],
    metadata: { title: "Docs", canonical: "https://example.com/docs" },
    bytesRead: 100,
    truncated: false,
    ...overrides,
  };
}

describe("compareSnapshots", () => {
  it("ignores hosts when final paths match", () => {
    const differences = compareSnapshots(
      { path: "/docs" },
      snapshot(),
      snapshot({ requestedUrl: "https://example.com/docs", finalUrl: "https://example.com/docs" }),
    );
    expect(differences).toEqual([]);
  });

  it("flags redirects that leave the compared origins", () => {
    const differences = compareSnapshots(
      { path: "/docs" },
      snapshot({ finalUrl: "https://accounts.example.net/login?next=%2Fdocs" }),
      snapshot({
        requestedUrl: "https://example.com/docs",
        finalUrl: "https://example.com/docs",
      }),
    );

    expect(differences).toContainEqual(
      expect.objectContaining({ id: "DP002", severity: "error" }),
    );
  });

  it("finds status, header, and metadata drift", () => {
    const differences = compareSnapshots(
      { path: "/docs" },
      snapshot({ status: 404, headers: { "content-type": "text/plain" }, metadata: { robots: "noindex" } }),
      snapshot(),
    );
    expect(differences.map((item) => item.id)).toEqual(["DP001", "DP004", "DP006", "DP006", "DP006"]);
  });

  it("ignores per-request CSP nonce rotation but preserves stable policy drift", () => {
    const matching = compareSnapshots(
      { path: "/docs" },
      snapshot({ headers: { "content-security-policy": "default-src 'self'; script-src 'nonce-preview123' https:" } }),
      snapshot({
        requestedUrl: "https://example.com/docs",
        finalUrl: "https://example.com/docs",
        headers: { "content-security-policy": "default-src 'self'; script-src 'nonce-production456' https:" },
      }),
    );
    expect(matching).toEqual([]);

    const drift = compareSnapshots(
      { path: "/docs" },
      snapshot({ headers: { "content-security-policy": "default-src 'self'; script-src 'nonce-preview123' https:" } }),
      snapshot({
        requestedUrl: "https://example.com/docs",
        finalUrl: "https://example.com/docs",
        headers: { "content-security-policy": "default-src 'none'; script-src 'nonce-production456' https:" },
      }),
    );
    expect(drift).toContainEqual(expect.objectContaining({ id: "DP004", severity: "warning" }));
  });

  it("detects SameSite cookie mode drift without cookie values", () => {
    const differences = compareSnapshots(
      { path: "/docs" },
      snapshot({ cookies: [{ name: "session", attributes: ["httponly", "samesite=none", "secure"] }] }),
      snapshot({
        requestedUrl: "https://example.com/docs",
        finalUrl: "https://example.com/docs",
        cookies: [{ name: "session", attributes: ["httponly", "samesite=lax", "secure"] }],
      }),
    );

    expect(differences).toContainEqual(
      expect.objectContaining({ id: "DP005", severity: "warning", field: "cookies" }),
    );
    expect(JSON.stringify(differences)).not.toContain("cookie-value");
  });

  it("enforces route expectations against preview", () => {
    const differences = compareSnapshots(
      { path: "/api", expect: { status: 204, contentType: "application/json" } },
      snapshot(),
      snapshot({ requestedUrl: "https://example.com/docs", finalUrl: "https://example.com/docs" }),
    );
    expect(differences.map((item) => item.id)).toContain("DP007");
    expect(differences.map((item) => item.id)).toContain("DP008");
  });
});
