import { afterEach, describe, expect, it, vi } from "vitest";
import { prove } from "../src/prove.js";
import { safeRoutePath } from "../src/url.js";

afterEach(() => vi.unstubAllGlobals());

describe("prove", () => {
  it("never includes custom request-header values in reports", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      "<title>Equivalent</title>",
      { status: 200, headers: { "content-type": "text/html" } },
    )));

    const result = await prove({
      preview: "https://preview.example.com",
      production: "https://example.com",
      routes: [{
        path: "/?token=route-secret",
        method: "GET",
        headers: { authorization: "Bearer super-secret" },
      }],
      timeoutMs: 1_000,
      maxRedirects: 3,
      maxBodyBytes: 32_000,
      ignoreHeaders: [],
    });

    expect(result.routes[0]?.route).toEqual({
      path: safeRoutePath("/?token=route-secret"),
      method: "GET",
      headerNames: ["authorization"],
    });
    expect(JSON.stringify(result)).not.toContain("super-secret");
    expect(JSON.stringify(result)).not.toContain("route-secret");
  });

  it("fingerprints query values when requests fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error(
        "network unavailable for https://preview.example.com/callback?token=failure-secret",
      );
    }));

    const result = await prove({
      preview: "https://preview.example.com",
      production: "https://example.com",
      routes: [{
        path: "/callback?token=failure-secret",
        method: "GET",
      }],
      timeoutMs: 1_000,
      maxRedirects: 3,
      maxBodyBytes: 32_000,
      ignoreHeaders: [],
    });

    expect(result.routes[0]?.differences[0]?.route).toBe(
      safeRoutePath("/callback?token=failure-secret"),
    );
    expect(result.routes[0]?.error).toContain(
      "https://preview.example.com/callback?token=sha256%3A",
    );
    expect(JSON.stringify(result)).not.toContain("failure-secret");
  });
});
