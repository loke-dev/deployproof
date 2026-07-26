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
});
