import { afterEach, describe, expect, it, vi } from "vitest";
import { captureSnapshot } from "../src/snapshot.js";

afterEach(() => vi.unstubAllGlobals());

describe("captureSnapshot", () => {
  it("captures metadata without retaining body or cookie values", async () => {
    const headers = new Headers({
      "content-type": "text/html",
      "content-security-policy": "default-src 'self'",
      "set-cookie": "session=top-secret; Secure; HttpOnly; SameSite=Lax",
    });
    Object.defineProperty(headers, "getSetCookie", { value: () => ["session=top-secret; Secure; HttpOnly; SameSite=Lax"] });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      "<title>Preview</title><link rel=\"canonical\" href=\"https://example.com/\">",
      { status: 200, headers },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.metadata.title).toBe("Preview");
    expect(result.cookies).toEqual([{ name: "session", attributes: ["httponly", "samesite", "secure"] }]);
    expect(JSON.stringify(result)).not.toContain("top-secret");
    expect(result).not.toHaveProperty("body");
  });

  it("normalizes same-origin redirect locations to paths with queries", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 308, headers: { location: "https://preview.test/new?from=old" } }))
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { "content-type": "text/plain" } }));
    vi.stubGlobal("fetch", fetch);
    const result = await captureSnapshot("https://preview.test", { path: "/old" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });
    expect(result.redirects).toEqual([{ status: 308, location: "/new?from=old" }]);
    expect(result.finalUrl).toBe("https://preview.test/new?from=old");
  });

  it("keeps the origin for cross-origin redirects", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: "https://accounts.example.net/login?next=%2Fdocs" },
      }))
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetch);

    const result = await captureSnapshot("https://preview.test", { path: "/docs" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.redirects).toEqual([{
      status: 302,
      location: "https://accounts.example.net/login?next=%2Fdocs",
    }]);
  });

  it("does not read non-HTML response bodies", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      '{"token":"should-not-be-read"}',
      { status: 200, headers: { "content-type": "application/json" } },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/data" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.bytesRead).toBe(0);
    expect(result.metadata).toEqual({});
  });
});
