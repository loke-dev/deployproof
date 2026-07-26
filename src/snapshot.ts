import type { CookieShape, Metadata, RedirectHop, RouteInput, Snapshot } from "./types.js";
import { safeAbsoluteUrl, safePath } from "./url.js";

const COMPARED_HEADERS = [
  "cache-control",
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
  "access-control-allow-origin",
  "access-control-expose-headers",
  "access-control-max-age",
  "content-encoding",
  "content-language",
  "content-security-policy",
  "content-type",
  "cross-origin-embedder-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "permissions-policy",
  "referrer-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "vary",
];

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function selectedHeaders(headers: Headers, ignored: string[]): Record<string, string> {
  return Object.fromEntries(
    COMPARED_HEADERS
      .filter((name) => !ignored.includes(name))
      .map((name) => [name, headers.get(name)])
      .filter((entry): entry is [string, string] => entry[1] !== null),
  );
}

function cookieShapes(headers: Headers): CookieShape[] {
  const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  return values
    .map((value) => {
      const segments = value.split(";").map((segment) => segment.trim());
      const name = segments.shift()?.split("=", 1)[0]?.trim();
      if (!name) return undefined;
      const attributes = segments
        .map((segment) => {
          const separator = segment.indexOf("=");
          const attribute = (separator === -1 ? segment : segment.slice(0, separator))
            .trim()
            .toLowerCase();
          if (attribute !== "samesite" || separator === -1) return attribute;
          const mode = segment.slice(separator + 1).trim().toLowerCase();
          return ["lax", "none", "strict"].includes(mode)
            ? `samesite=${mode}`
            : "samesite=invalid";
        })
        .filter(Boolean)
        .sort();
      return { name, attributes };
    })
    .filter((value): value is CookieShape => value !== undefined)
    .sort((a, b) =>
      a.name.localeCompare(b.name)
      || a.attributes.join("\0").localeCompare(b.attributes.join("\0")));
}

function safeCanonical(value: string, responseUrl: string): string {
  try {
    const canonical = new URL(value, responseUrl);
    if (!["http:", "https:"].includes(canonical.protocol)) {
      return "[unsupported canonical URL]";
    }
    return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)
      ? safeAbsoluteUrl(canonical)
      : safePath(canonical);
  } catch {
    return "[invalid canonical URL]";
  }
}

function extractMetadata(body: string, responseUrl: string): Metadata {
  const content = (pattern: RegExp) => body.match(pattern)?.[1]?.trim();
  const title = content(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonical = content(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? content(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i);
  const robots = content(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? content(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
  return {
    ...(title ? { title } : {}),
    ...(canonical ? { canonical: safeCanonical(canonical, responseUrl) } : {}),
    ...(robots ? { robots } : {}),
  };
}

async function readBounded(response: Response, maxBytes: number): Promise<{ body: string; bytes: number; truncated: boolean }> {
  if (!response.body) return { body: "", bytes: 0, truncated: false };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  let truncated = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const remaining = maxBytes - bytes;
      if (remaining <= 0) {
        truncated = true;
        await reader.cancel();
        break;
      }
      const slice = chunk.value.byteLength > remaining ? chunk.value.slice(0, remaining) : chunk.value;
      bytes += slice.byteLength;
      body += decoder.decode(slice, { stream: true });
      if (slice.byteLength < chunk.value.byteLength) {
        truncated = true;
        await reader.cancel();
        break;
      }
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return { body, bytes, truncated };
}

export async function captureSnapshot(
  base: string,
  route: RouteInput,
  options: { timeoutMs: number; maxRedirects: number; maxBodyBytes: number; ignoreHeaders: string[] },
): Promise<Snapshot> {
  const requested = new URL(route.path.replace(/^\/+/, ""), `${base}/`).toString();
  const requestedOrigin = new URL(requested).origin;
  let current = requested;
  let includeCustomHeaders = true;
  const redirects: RedirectHop[] = [];
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    let response: Response | undefined;
    for (let hop = 0; hop <= options.maxRedirects; hop += 1) {
      response = await fetch(current, {
        method: route.method ?? "GET",
        ...(route.headers && includeCustomHeaders ? { headers: route.headers } : {}),
        redirect: "manual",
        signal: controller.signal,
      });
      const location = response.headers.get("location");
      if (!REDIRECT_STATUSES.has(response.status) || !location) break;
      if (hop === options.maxRedirects) {
        await response.body?.cancel();
        throw new Error(`Exceeded ${options.maxRedirects} redirects`);
      }
      let target: URL;
      try {
        target = new URL(location, current);
      } catch {
        await response.body?.cancel();
        throw new Error("Redirect target is not a valid URL");
      }
      if (!["http:", "https:"].includes(target.protocol)) {
        await response.body?.cancel();
        throw new Error("Redirect target must use http or https");
      }
      if (target.username || target.password) {
        await response.body?.cancel();
        throw new Error("Redirect target must not include URL credentials");
      }
      if (target.origin !== new URL(current).origin) includeCustomHeaders = false;
      const normalizedLocation = target.origin === requestedOrigin
        ? safePath(target)
        : safeAbsoluteUrl(target);
      redirects.push({ status: response.status, location: normalizedLocation });
      await response.body?.cancel();
      current = target.toString();
    }
    if (!response) throw new Error("No response received");
    const contentType = response.headers.get("content-type") ?? "";
    const readable = route.method !== "HEAD" && /(?:text\/html|application\/xhtml\+xml)/i.test(contentType);
    const content = readable ? await readBounded(response, options.maxBodyBytes) : { body: "", bytes: 0, truncated: false };
    if (!readable) await response.body?.cancel();

    return {
      requestedUrl: safeAbsoluteUrl(new URL(requested)),
      finalUrl: safeAbsoluteUrl(new URL(current)),
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      redirects,
      headers: selectedHeaders(response.headers, options.ignoreHeaders),
      cookies: cookieShapes(response.headers),
      metadata: /html/i.test(contentType) ? extractMetadata(content.body, current) : {},
      bytesRead: content.bytes,
      truncated: content.truncated,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out after ${options.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
