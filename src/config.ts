import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { DeployProofConfig, Options, RouteInput } from "./types.js";

const DEFAULT_FILES = ["deployproof.config.json", "deployproof.json"];

function normalizeBase(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`${name} must use http or https`);
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function normalizeRoute(route: string | RouteInput): RouteInput {
  const input = typeof route === "string" ? { path: route } : route;
  if (!input.path) throw new Error("Every route needs a path");
  const url = new URL(input.path, "https://deployproof.invalid");
  if (url.origin !== "https://deployproof.invalid") throw new Error(`Route must be relative: ${input.path}`);
  return {
    ...input,
    path: `${url.pathname}${url.search}`,
    method: input.method ?? "GET",
  };
}

async function findConfig(explicit?: string): Promise<string | undefined> {
  if (explicit) return resolve(explicit);
  for (const file of DEFAULT_FILES) {
    try {
      await readFile(resolve(file), "utf8");
      return resolve(file);
    } catch {
      // Try the next conventional file.
    }
  }
  return undefined;
}

export async function loadConfig(options: Options): Promise<Required<Omit<DeployProofConfig, "preview" | "production">> & {
  preview: string;
  production: string;
}> {
  const configPath = await findConfig(options.config);
  let fileConfig: DeployProofConfig = { routes: [] };
  if (configPath) {
    try {
      fileConfig = JSON.parse(await readFile(configPath, "utf8")) as DeployProofConfig;
    } catch (error) {
      throw new Error(`Could not parse ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const preview = options.preview ?? process.env.DEPLOYPROOF_PREVIEW ?? fileConfig.preview;
  const production = options.production ?? process.env.DEPLOYPROOF_PRODUCTION ?? fileConfig.production;
  if (!preview || !production) {
    throw new Error("Both preview and production URLs are required");
  }

  const routes = [...(fileConfig.routes ?? []), ...options.routes].map(normalizeRoute);
  if (routes.length === 0) routes.push({ path: "/", method: "GET" });

  return {
    preview: normalizeBase(preview, "Preview"),
    production: normalizeBase(production, "Production"),
    routes,
    timeoutMs: options.timeoutMs ?? fileConfig.timeoutMs ?? 10_000,
    maxRedirects: fileConfig.maxRedirects ?? 5,
    maxBodyBytes: fileConfig.maxBodyBytes ?? 512_000,
    ignoreHeaders: (fileConfig.ignoreHeaders ?? []).map((header) => header.toLowerCase()),
  };
}

