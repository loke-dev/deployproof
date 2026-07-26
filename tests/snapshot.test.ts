import { afterEach, describe, expect, it, vi } from "vitest";
import { captureSnapshot } from "../src/snapshot.js";
import { safeAbsoluteUrl, safePath } from "../src/url.js";

afterEach(() => vi.unstubAllGlobals());

describe("captureSnapshot", () => {
  it("captures metadata without retaining body or cookie values", async () => {
    const headers = new Headers({
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-expose-headers": "ETag",
      "access-control-max-age": "600",
      "content-type": "text/html",
      "content-security-policy": "default-src 'self'",
    });
    headers.append("set-cookie", "session=top-secret; Secure; HttpOnly; SameSite=Lax");
    headers.append("set-cookie", "unsafe=another-secret; SameSite=private-mode");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      "<title>Preview</title><link rel=\"canonical\" href=\"https://example.com/?token=top-secret\">",
      { status: 200, headers },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.metadata.title).toBe("Preview");
    expect(result.metadata.canonical).toBe(
      safeAbsoluteUrl(new URL("https://example.com/?token=top-secret")),
    );
    expect(result.headers).toMatchObject({
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-expose-headers": "ETag",
      "access-control-max-age": "600",
    });
    expect(result.cookies).toEqual([
      { name: "session", attributes: ["httponly", "samesite=lax", "secure"] },
      { name: "unsafe", attributes: ["samesite=invalid"] },
    ]);
    expect(JSON.stringify(result)).not.toContain("top-secret");
    expect(JSON.stringify(result)).not.toContain("another-secret");
    expect(JSON.stringify(result)).not.toContain("private-mode");
    expect(result).not.toHaveProperty("body");
  });

  it("normalizes volatile cookie expiration timestamps", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response("", {
        headers: {
          "set-cookie": "session=preview-secret; Expires=Sun, 26 Jul 2026 16:00:00 GMT; Secure",
        },
      }))
      .mockResolvedValueOnce(new Response("", {
        headers: {
          "set-cookie": "session=production-secret; Expires=Sun, 26 Jul 2026 16:00:01 GMT; Secure",
        },
      }));
    vi.stubGlobal("fetch", fetch);

    const options = {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    };
    const preview = await captureSnapshot("https://preview.test", { path: "/" }, options);
    const production = await captureSnapshot("https://production.test", { path: "/" }, options);

    expect(preview.cookies).toEqual([
      { name: "session", attributes: ["expires", "secure"] },
    ]);
    expect(production.cookies).toEqual(preview.cookies);
    expect(JSON.stringify([preview, production])).not.toContain("16:00:");
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
    expect(result.redirects).toEqual([{
      status: 308,
      location: safePath(new URL("https://preview.test/new?from=old")),
    }]);
    expect(result.finalUrl).toBe(
      safeAbsoluteUrl(new URL("https://preview.test/new?from=old")),
    );
  });

  it("preserves relative canonical URLs while fingerprinting query values", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      "<link rel=\"canonical\" href=\"/docs?draft=top-secret\">",
      { status: 200, headers: { "content-type": "text/html" } },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/docs" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.metadata.canonical).toBe(
      safePath(new URL("https://preview.test/docs?draft=top-secret")),
    );
    expect(JSON.stringify(result)).not.toContain("top-secret");
  });

  it("matches canonical as an exact link relation token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      [
        "<link rel=\"notcanonical\" href=\"/wrong\">",
        "<link href=\"/docs?draft=top-secret\" rel=\"alternate CANONICAL stylesheet\">",
      ].join(""),
      { status: 200, headers: { "content-type": "text/html" } },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/docs" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.metadata.canonical).toBe(
      safePath(new URL("https://preview.test/docs?draft=top-secret")),
    );
    expect(result.metadata.canonical).not.toContain("/wrong");
  });

  it("does not follow non-redirect 3xx responses with Location headers", async () => {
    const fetch = vi.fn(async () => new Response(null, {
      status: 304,
      headers: { location: "https://preview.test/not-a-redirect" },
    }));
    vi.stubGlobal("fetch", fetch);

    const result = await captureSnapshot("https://preview.test", { path: "/cached" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(fetch).toHaveBeenCalledOnce();
    expect(result.status).toBe(304);
    expect(result.redirects).toEqual([]);
    expect(result.finalUrl).toBe("https://preview.test/cached");
  });

  it("preserves the base URL path when resolving routes", async () => {
    const fetch = vi.fn(async () => new Response("", {
      status: 200,
      headers: { "content-type": "text/plain" },
    }));
    vi.stubGlobal("fetch", fetch);

    const result = await captureSnapshot(
      "https://preview.test/deployments/123",
      { path: "/health?token=top-secret" },
      {
        timeoutMs: 1000,
        maxRedirects: 3,
        maxBodyBytes: 1000,
        ignoreHeaders: [],
      },
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://preview.test/deployments/123/health?token=top-secret",
      expect.any(Object),
    );
    expect(result.requestedUrl).toBe(
      safeAbsoluteUrl(new URL("https://preview.test/deployments/123/health?token=top-secret")),
    );
    expect(result.requestedUrl).not.toContain("top-secret");
  });

  it("keeps the origin and drops custom headers for cross-origin redirects", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: "https://accounts.example.net/login?next=%2Fdocs" },
      }))
      .mockResolvedValueOnce(new Response("", { status: 200, headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetch);

    const result = await captureSnapshot("https://preview.test", {
      path: "/docs",
      headers: {
        authorization: "Bearer top-secret",
        "x-request-id": "comparison-1",
      },
    }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.redirects).toEqual([{
      status: 302,
      location: safeAbsoluteUrl(
        new URL("https://accounts.example.net/login?next=%2Fdocs"),
      ),
    }]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://preview.test/docs",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer top-secret" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://accounts.example.net/login?next=%2Fdocs",
      expect.not.objectContaining({ headers: expect.anything() }),
    );
  });

  it("rejects redirect targets with embedded credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "https://user:top-secret@accounts.example.net/login" },
    })));

    await expect(captureSnapshot("https://preview.test", { path: "/" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    })).rejects.toThrow("Redirect target must not include URL credentials");
  });

  it("does not read bodies when HTML appears only in a media type parameter", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      '{"title":"<title>Should not be metadata</title>"}',
      {
        status: 200,
        headers: { "content-type": "application/json; profile=\"text/html\"" },
      },
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

  it("reads XHTML response bodies for metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      "<html><head><title>XHTML document</title></head></html>",
      {
        status: 200,
        headers: { "content-type": "Application/XHTML+XML; charset=utf-8" },
      },
    )));

    const result = await captureSnapshot("https://preview.test", { path: "/docs" }, {
      timeoutMs: 1000,
      maxRedirects: 3,
      maxBodyBytes: 1000,
      ignoreHeaders: [],
    });

    expect(result.bytesRead).toBeGreaterThan(0);
    expect(result.metadata).toEqual({ title: "XHTML document" });
  });
});
