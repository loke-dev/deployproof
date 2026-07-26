import type { Difference, RouteInput, Snapshot } from "./types.js";
import { safeAbsoluteUrl, safePath, safeRoutePath } from "./url.js";

function stable(value: unknown): string {
  return JSON.stringify(value);
}

function comparableHeader(name: string, value: string | undefined): string | undefined {
  if (name !== "content-security-policy" || value === undefined) return value;
  return value.replace(/'nonce-[^']+'/gi, "'nonce-<dynamic>'");
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
  return final.origin === requested.origin ? safePath(final) : safeAbsoluteUrl(final);
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
      const severity = ["content-type", "content-security-policy", "x-frame-options"].includes(name) ? "warning" : "notice";
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
  if (route.expect?.contentType && !preview.headers["content-type"]?.includes(route.expect.contentType)) {
    differences.push(difference(path, "DP008", "error", "expect.contentType", preview.headers["content-type"], route.expect.contentType, `Preview content type did not include ${route.expect.contentType}`));
  }

  return differences;
}
