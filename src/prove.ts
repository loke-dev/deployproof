import { captureSnapshot } from "./snapshot.js";
import { compareSnapshots } from "./compare.js";
import type { ProofConfig, ProofResult, RouteInput, RouteResult } from "./types.js";
import { redactUrlsInText, safeRoutePath } from "./url.js";

function errorMessage(value: unknown): string {
  return redactUrlsInText(value instanceof Error ? value.message : String(value));
}

function reportRoute(route: RouteInput): RouteResult["route"] {
  const { headers, ...safe } = route;
  return {
    ...safe,
    path: safeRoutePath(route.path),
    ...(headers ? { headerNames: Object.keys(headers).map((name) => name.toLowerCase()).sort() } : {}),
  };
}

export async function prove(config: ProofConfig): Promise<ProofResult> {
  const requestOptions = {
    timeoutMs: config.timeoutMs,
    maxRedirects: config.maxRedirects,
    maxBodyBytes: config.maxBodyBytes,
    ignoreHeaders: config.ignoreHeaders,
  };

  const routes: RouteResult[] = [];
  for (const routeValue of config.routes) {
    const route = routeValue as RouteInput;
    const [preview, production] = await Promise.allSettled([
      captureSnapshot(config.preview, route, requestOptions),
      captureSnapshot(config.production, route, requestOptions),
    ]);
    if (preview.status === "rejected" || production.status === "rejected") {
      const failure = [
        preview.status === "rejected" ? `preview: ${errorMessage(preview.reason)}` : undefined,
        production.status === "rejected" ? `production: ${errorMessage(production.reason)}` : undefined,
      ].filter(Boolean).join("; ");
      routes.push({
        route: reportRoute(route),
        differences: [{
          id: "DP000",
          severity: "error",
          route: safeRoutePath(route.path),
          field: "request",
          message: failure,
        }],
        error: failure,
      });
      continue;
    }
    routes.push({
      route: reportRoute(route),
      preview: preview.value,
      production: production.value,
      differences: compareSnapshots(route, preview.value, production.value),
    });
  }

  const all = routes.flatMap((route) => route.differences);
  return {
    previewBase: config.preview,
    productionBase: config.production,
    generatedAt: new Date().toISOString(),
    routes,
    summary: {
      errors: all.filter((item) => item.severity === "error").length,
      warnings: all.filter((item) => item.severity === "warning").length,
      notices: all.filter((item) => item.severity === "notice").length,
      matching: routes.filter((route) => route.differences.length === 0).length,
    },
  };
}
