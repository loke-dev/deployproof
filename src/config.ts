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
  if (url.username || url.password) throw new Error(`${name} must not include URL credentials`);
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function normalizeRoute(route: string | RouteInput): RouteInput {
  const input: unknown = typeof route === "string" ? { path: route } : route;
  if (!isRecord(input)) throw new Error("Every route must be a path string or object");
  if (typeof input.path !== "string" || !input.path) throw new Error("Every route needs a path");
  if (input.method !== undefined && input.method !== "GET" && input.method !== "HEAD") {
    throw new Error(`Route ${input.path} has an unsupported method`);
  }
  let headers: Record<string, string> | undefined;
  if (input.headers !== undefined) {
    if (!isRecord(input.headers)) {
      throw new Error(`Route ${input.path} headers must be an object`);
    }
    headers = {};
    for (const [name, value] of Object.entries(input.headers)) {
      if (typeof value !== "string") {
        throw new Error(`Route ${input.path} headers must be string values`);
      }
      try {
        new Headers([[name, value]]);
      } catch {
        throw new Error(`Route ${input.path} has an invalid header named "${name}"`);
      }
      headers[name] = value;
    }
  }
  let expect: RouteInput["expect"];
  if (input.expect !== undefined) {
    if (!isRecord(input.expect)) throw new Error(`Route ${input.path} expect must be an object`);
    const status = input.expect.status;
    const contentType = input.expect.contentType;
    if (status !== undefined && (
      typeof status !== "number"
      || !Number.isInteger(status)
      || status < 100
      || status > 599
    )) {
      throw new Error(`Route ${input.path} expected status must be between 100 and 599`);
    }
    if (contentType !== undefined && (
      typeof contentType !== "string"
      || contentType.trim().length === 0
    )) {
      throw new Error(`Route ${input.path} expected content type must be a non-empty string`);
    }
    expect = {
      ...(status !== undefined ? { status } : {}),
      ...(contentType !== undefined ? { contentType: contentType.trim() } : {}),
    };
  }
  const url = new URL(input.path, "https://deployproof.invalid");
  if (url.origin !== "https://deployproof.invalid") throw new Error(`Route must be relative: ${input.path}`);
  return {
    path: `${url.pathname}${url.search}`,
    method: input.method ?? "GET",
    ...(headers ? { headers } : {}),
    ...(expect ? { expect } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateInteger(
  value: unknown,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value as number;
}

function validateConfig(value: unknown): DeployProofConfig {
  if (!isRecord(value)) throw new Error("Configuration root must be an object");
  if (value.routes !== undefined && !Array.isArray(value.routes)) {
    throw new Error("routes must be an array");
  }
  if (value.ignoreHeaders !== undefined && (
    !Array.isArray(value.ignoreHeaders)
    || value.ignoreHeaders.some((header) => typeof header !== "string")
  )) {
    throw new Error("ignoreHeaders must be an array of header names");
  }
  if (value.preview !== undefined && typeof value.preview !== "string") {
    throw new Error("preview must be a URL string");
  }
  if (value.production !== undefined && typeof value.production !== "string") {
    throw new Error("production must be a URL string");
  }
  return value as DeployProofConfig;
}

async function findConfig(explicit?: string): Promise<string | undefined> {
  if (explicit) return resolve(explicit);
  for (const file of DEFAULT_FILES) {
    const path = resolve(file);
    try {
      await readFile(path, "utf8");
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw new Error(`Could not read ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return undefined;
}

export async function loadConfig(options: Options): Promise<Required<Omit<DeployProofConfig, "preview" | "production">> & {
  preview: string;
  production: string;
}> {
  const configPath = await findConfig(options.config);
  let fileConfig: DeployProofConfig = {};
  if (configPath) {
    let source: string;
    try {
      source = await readFile(configPath, "utf8");
    } catch (error) {
      throw new Error(`Could not read ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(source) as unknown;
    } catch {
      throw new Error(`Could not parse ${configPath}: invalid JSON configuration`);
    }
    fileConfig = validateConfig(parsed);
  }

  const preview = options.preview ?? process.env.DEPLOYPROOF_PREVIEW ?? fileConfig.preview;
  const production = options.production ?? process.env.DEPLOYPROOF_PRODUCTION ?? fileConfig.production;
  if (!preview || !production) {
    throw new Error("Both preview and production URLs are required");
  }

  const routes = [...(fileConfig.routes ?? []), ...options.routes].map(normalizeRoute);
  if (routes.length === 0) routes.push({ path: "/", method: "GET" });
  const ignoreHeaders = [...new Set((fileConfig.ignoreHeaders ?? []).map((header) => header.trim().toLowerCase()).filter(Boolean))];

  return {
    preview: normalizeBase(preview, "Preview"),
    production: normalizeBase(production, "Production"),
    routes,
    timeoutMs: validateInteger(options.timeoutMs ?? fileConfig.timeoutMs, "timeoutMs", 10_000, 100, 120_000),
    maxRedirects: validateInteger(fileConfig.maxRedirects, "maxRedirects", 5, 0, 20),
    maxBodyBytes: validateInteger(fileConfig.maxBodyBytes, "maxBodyBytes", 512_000, 0, 5_000_000),
    ignoreHeaders,
  };
}
