import type { Difference, RouteInput, Snapshot } from "./types.js";

function stable(value: unknown): string {
  return JSON.stringify(value);
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

function pathsMatch(previewUrl: string, productionUrl: string): boolean {
  const preview = new URL(previewUrl);
  const production = new URL(productionUrl);
  return preview.pathname === production.pathname && preview.search === production.search;
}

export function compareSnapshots(route: RouteInput, preview: Snapshot, production: Snapshot): Difference[] {
  const differences: Difference[] = [];
  const path = route.path;

  if (preview.status !== production.status) {
    differences.push(difference(path, "DP001", "error", "status", preview.status, production.status, "HTTP status differs"));
  }
  if (!pathsMatch(preview.finalUrl, production.finalUrl)) {
    differences.push(difference(path, "DP002", "error", "finalUrl", new URL(preview.finalUrl).pathname, new URL(production.finalUrl).pathname, "Final route differs"));
  }
  if (stable(preview.redirects) !== stable(production.redirects)) {
    differences.push(difference(path, "DP003", "warning", "redirects", preview.redirects, production.redirects, "Redirect chain differs"));
  }

  const headerNames = new Set([...Object.keys(preview.headers), ...Object.keys(production.headers)]);
  for (const name of [...headerNames].sort()) {
    if (preview.headers[name] !== production.headers[name]) {
      const severity = ["content-type", "content-security-policy", "x-frame-options"].includes(name) ? "warning" : "notice";
      differences.push(difference(path, "DP004", severity, `headers.${name}`, preview.headers[name], production.headers[name], `${name} header differs`));
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

