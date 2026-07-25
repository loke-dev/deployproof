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

  it("finds status, header, and metadata drift", () => {
    const differences = compareSnapshots(
      { path: "/docs" },
      snapshot({ status: 404, headers: { "content-type": "text/plain" }, metadata: { robots: "noindex" } }),
      snapshot(),
    );
    expect(differences.map((item) => item.id)).toEqual(["DP001", "DP004", "DP006", "DP006", "DP006"]);
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
