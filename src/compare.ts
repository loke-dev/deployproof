import type { Difference, RouteInput, Snapshot } from "./types.js";
import { safeRoutePath } from "./url.js";

function stable(value: unknown): string {
  return JSON.stringify(value);
}

const COMMA_LIST_HEADERS = new Map<string, (value: string) => string>([
  ["access-control-allow-headers", (value) => value.toLowerCase()],
  ["access-control-allow-methods", (value) => value.toUpperCase()],
  ["access-control-expose-headers", (value) => value.toLowerCase()],
  ["vary", (value) => value.toLowerCase()],
]);

const WARNING_HEADERS = new Set([
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
  "access-control-allow-origin",
  "access-control-expose-headers",
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
]);

function comparableHeader(name: string, value: string | undefined): string | undefined {
  if (value === undefined) return value;
  if (name === "content-security-policy") {
    return value.replace(/'nonce-[^']+'/gi, "'nonce-<dynamic>'");
  }
  if (name === "cache-control") {
    return cacheControlDirectives(value)
      .map((directive) => {
        const separator = directive.indexOf("=");
        return separator === -1
          ? directive.toLowerCase()
          : `${directive.slice(0, separator).trim().toLowerCase()}=${directive.slice(separator + 1).trim()}`;
      })
      .sort()
      .join(", ");
  }
  const normalize = COMMA_LIST_HEADERS.get(name);
  if (!normalize) return value;
  return [...new Set(
    value
      .split(",")
      .map((item) => normalize(item.trim()))
      .filter(Boolean),
  )].sort().join(", ");
}

function cacheControlDirectives(value: string): string[] {
  const directives: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\" && quoted) {
      escaped = true;
    } else if (character === "\"") {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      const directive = value.slice(start, index).trim();
      if (directive) directives.push(directive);
      start = index + 1;
    }
  }

  const directive = value.slice(start).trim();
  if (directive) directives.push(directive);
  return directives;
}

function difference(
  route: string,
  id: string,
  severity: Difference["severity"],
  field: string,
  preview: unknown,
  production: unknown,
  message: string,
): Difference {
  return { route, id, severity, field, preview, production, message };
}

function comparableFinalTarget(snapshot: Snapshot): string {
  const requested = new URL(snapshot.requestedUrl);
  const final = new URL(snapshot.finalUrl);
  return final.origin === requested.origin
    ? `${final.pathname}${final.search}`
    : snapshot.finalUrl;
}

function mediaType(value: string | undefined): string | undefined {
  return value?.split(";", 1)[0]?.trim().toLowerCase();
}

export function compareSnapshots(route: RouteInput, preview: Snapshot, production: Snapshot): Difference[] {
  const differences: Difference[] = [];
  const path = safeRoutePath(route.path);

  if (preview.status !== production.status) {
    differences.push(difference(path, "DP001", "error", "status", preview.status, production.status, "HTTP status differs"));
  }
  const previewTarget = comparableFinalTarget(preview);
  const productionTarget = comparableFinalTarget(production);
  if (previewTarget !== productionTarget) {
    differences.push(difference(path, "DP002", "error", "finalUrl", previewTarget, productionTarget, "Final route or external origin differs"));
  }
  if (stable(preview.redirects) !== stable(production.redirects)) {
    differences.push(difference(path, "DP003", "warning", "redirects", preview.redirects, production.redirects, "Redirect chain differs"));
  }

  const headerNames = new Set([...Object.keys(preview.headers), ...Object.keys(production.headers)]);
  for (const name of [...headerNames].sort()) {
    const previewValue = comparableHeader(name, preview.headers[name]);
    const productionValue = comparableHeader(name, production.headers[name]);
    if (previewValue !== productionValue) {
      const severity = WARNING_HEADERS.has(name) ? "warning" : "notice";
      differences.push(difference(path, "DP004", severity, `headers.${name}`, previewValue, productionValue, `${name} header differs`));
    }
  }

  if (stable(preview.cookies) !== stable(production.cookies)) {
    differences.push(difference(path, "DP005", "warning", "cookies", preview.cookies, production.cookies, "Cookie names or security attributes differ"));
  }

  for (const field of ["title", "canonical", "robots"] as const) {
    if (preview.metadata[field] !== production.metadata[field]) {
      const severity = field === "canonical" || field === "robots" ? "warning" : "notice";
      differences.push(difference(path, "DP006", severity, `metadata.${field}`, preview.metadata[field], production.metadata[field], `${field} metadata differs`));
    }
  }

  if (route.expect?.status !== undefined && preview.status !== route.expect.status) {
    differences.push(difference(path, "DP007", "error", "expect.status", preview.status, route.expect.status, `Preview did not return expected status ${route.expect.status}`));
  }
  if (
    route.expect?.contentType
    && mediaType(preview.headers["content-type"]) !== mediaType(route.expect.contentType)
  ) {
    differences.push(difference(path, "DP008", "error", "expect.contentType", preview.headers["content-type"], route.expect.contentType, `Preview media type did not match ${route.expect.contentType}`));
  }

  return differences;
}
