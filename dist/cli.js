#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js"(exports, module) {
    "use strict";
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// src/cli.ts
import { readFile as readFile2 } from "fs/promises";
import { fileURLToPath } from "url";

// src/config.ts
import { readFile } from "fs/promises";
import { resolve } from "path";
var DEFAULT_FILES = ["deployproof.config.json", "deployproof.json"];
function normalizeBase(value2, name) {
  let url;
  try {
    url = new URL(value2);
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
function normalizeRoute(route) {
  const input = typeof route === "string" ? { path: route } : route;
  if (!isRecord(input)) throw new Error("Every route must be a path string or object");
  if (typeof input.path !== "string" || !input.path) throw new Error("Every route needs a path");
  if (input.method !== void 0 && input.method !== "GET" && input.method !== "HEAD") {
    throw new Error(`Route ${input.path} has an unsupported method`);
  }
  let headers;
  if (input.headers !== void 0) {
    if (!isRecord(input.headers)) {
      throw new Error(`Route ${input.path} headers must be an object`);
    }
    headers = {};
    for (const [name, value2] of Object.entries(input.headers)) {
      if (typeof value2 !== "string") {
        throw new Error(`Route ${input.path} headers must be string values`);
      }
      headers[name] = value2;
    }
  }
  let expect;
  if (input.expect !== void 0) {
    if (!isRecord(input.expect)) throw new Error(`Route ${input.path} expect must be an object`);
    const status = input.expect.status;
    const contentType = input.expect.contentType;
    if (status !== void 0 && (typeof status !== "number" || !Number.isInteger(status) || status < 100 || status > 599)) {
      throw new Error(`Route ${input.path} expected status must be between 100 and 599`);
    }
    if (contentType !== void 0 && typeof contentType !== "string") {
      throw new Error(`Route ${input.path} expected content type must be a string`);
    }
    expect = {
      ...status !== void 0 ? { status } : {},
      ...contentType !== void 0 ? { contentType } : {}
    };
  }
  const url = new URL(input.path, "https://deployproof.invalid");
  if (url.origin !== "https://deployproof.invalid") throw new Error(`Route must be relative: ${input.path}`);
  return {
    path: `${url.pathname}${url.search}`,
    method: input.method ?? "GET",
    ...headers ? { headers } : {},
    ...expect ? { expect } : {}
  };
}
function isRecord(value2) {
  return typeof value2 === "object" && value2 !== null && !Array.isArray(value2);
}
function validateInteger(value2, name, fallback, minimum, maximum) {
  if (value2 === void 0) return fallback;
  if (!Number.isInteger(value2) || value2 < minimum || value2 > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value2;
}
function validateConfig(value2) {
  if (!isRecord(value2)) throw new Error("Configuration root must be an object");
  if (value2.routes !== void 0 && !Array.isArray(value2.routes)) {
    throw new Error("routes must be an array");
  }
  if (value2.ignoreHeaders !== void 0 && (!Array.isArray(value2.ignoreHeaders) || value2.ignoreHeaders.some((header) => typeof header !== "string"))) {
    throw new Error("ignoreHeaders must be an array of header names");
  }
  if (value2.preview !== void 0 && typeof value2.preview !== "string") {
    throw new Error("preview must be a URL string");
  }
  if (value2.production !== void 0 && typeof value2.production !== "string") {
    throw new Error("production must be a URL string");
  }
  return value2;
}
async function findConfig(explicit) {
  if (explicit) return resolve(explicit);
  for (const file of DEFAULT_FILES) {
    try {
      await readFile(resolve(file), "utf8");
      return resolve(file);
    } catch {
    }
  }
  return void 0;
}
async function loadConfig(options) {
  const configPath = await findConfig(options.config);
  let fileConfig = {};
  if (configPath) {
    try {
      fileConfig = validateConfig(JSON.parse(await readFile(configPath, "utf8")));
    } catch (error) {
      throw new Error(`Could not parse ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const preview = options.preview ?? process.env.DEPLOYPROOF_PREVIEW ?? fileConfig.preview;
  const production = options.production ?? process.env.DEPLOYPROOF_PRODUCTION ?? fileConfig.production;
  if (!preview || !production) {
    throw new Error("Both preview and production URLs are required");
  }
  const routes = [...fileConfig.routes ?? [], ...options.routes].map(normalizeRoute);
  if (routes.length === 0) routes.push({ path: "/", method: "GET" });
  const ignoreHeaders = [...new Set((fileConfig.ignoreHeaders ?? []).map((header) => header.trim().toLowerCase()).filter(Boolean))];
  return {
    preview: normalizeBase(preview, "Preview"),
    production: normalizeBase(production, "Production"),
    routes,
    timeoutMs: validateInteger(options.timeoutMs ?? fileConfig.timeoutMs, "timeoutMs", 1e4, 100, 12e4),
    maxRedirects: validateInteger(fileConfig.maxRedirects, "maxRedirects", 5, 0, 20),
    maxBodyBytes: validateInteger(fileConfig.maxBodyBytes, "maxBodyBytes", 512e3, 0, 5e6),
    ignoreHeaders
  };
}

// src/options.ts
var help = `deployproof \u2014 prove a preview behaves like production

Usage:
  deployproof --preview <url> --production <url> [routes...]
  deployproof --config deployproof.config.json

Options:
  -p, --preview <url>       Preview deployment base URL
  -P, --production <url>    Production base URL
  -c, --config <path>       JSON configuration file
  -r, --route <path>        Add a route (repeatable)
  -f, --format <format>     human, json, github, or sarif
      --timeout <ms>        Per-request timeout
      --strict              Fail on warnings
      --no-strict           Fail only on errors
  -h, --help                Show help
  -v, --version             Show version`;
var UsageError = class extends Error {
};
function parseOptions(argv) {
  const options = {
    routes: [],
    format: process.env.GITHUB_ACTIONS ? "github" : "human",
    strict: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value2 = argv[index];
    const next = () => {
      const candidate = argv[index + 1];
      if (!candidate || candidate.startsWith("-")) throw new UsageError(`Missing value for ${value2}`);
      index += 1;
      return candidate;
    };
    if (value2 === "-h" || value2 === "--help") options.help = true;
    else if (value2 === "-v" || value2 === "--version") options.version = true;
    else if (value2 === "-p" || value2 === "--preview") options.preview = next();
    else if (value2 === "-P" || value2 === "--production") options.production = next();
    else if (value2 === "-c" || value2 === "--config") options.config = next();
    else if (value2 === "-r" || value2 === "--route") options.routes.push(next());
    else if (value2 === "-f" || value2 === "--format") {
      const format = next();
      if (!["human", "json", "github", "sarif"].includes(format)) {
        throw new UsageError(`Unsupported format: ${format}`);
      }
      options.format = format;
    } else if (value2 === "--timeout") {
      const timeout = Number(next());
      if (!Number.isInteger(timeout) || timeout < 100) throw new UsageError("Timeout must be at least 100ms");
      options.timeoutMs = timeout;
    } else if (value2 === "--strict") options.strict = true;
    else if (value2 === "--no-strict") options.strict = false;
    else if (value2.startsWith("-")) throw new UsageError(`Unknown option: ${value2}`);
    else options.routes.push(value2);
  }
  return options;
}
function helpText() {
  return help;
}

// src/url.ts
import { createHash } from "crypto";
function fingerprint(value2) {
  if (/^sha256:[0-9a-f]{12}$/.test(value2)) return value2;
  return `sha256:${createHash("sha256").update(value2).digest("hex").slice(0, 12)}`;
}
function safeSearch(url) {
  const entries = [...url.searchParams.entries()].map(([name, value2]) => [name, value2 ? fingerprint(value2) : ""]).sort(([leftName, leftValue], [rightName, rightValue]) => leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue));
  const parameters = new URLSearchParams();
  for (const [name, value2] of entries) parameters.append(name, value2);
  const search = parameters.toString();
  return search ? `?${search}` : "";
}
function safePath(url) {
  return `${url.pathname}${safeSearch(url)}`;
}
function safeAbsoluteUrl(url) {
  return `${url.origin}${safePath(url)}`;
}
function safeRoutePath(path) {
  return safePath(new URL(path, "https://deployproof.invalid"));
}

// src/snapshot.ts
var COMPARED_HEADERS = [
  "cache-control",
  "access-control-allow-credentials",
  "access-control-allow-methods",
  "access-control-allow-origin",
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
  "vary"
];
function selectedHeaders(headers, ignored) {
  return Object.fromEntries(
    COMPARED_HEADERS.filter((name) => !ignored.includes(name)).map((name) => [name, headers.get(name)]).filter((entry) => entry[1] !== null)
  );
}
function cookieShapes(headers) {
  const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  return values.map((value2) => {
    const segments = value2.split(";").map((segment) => segment.trim());
    const name = segments.shift()?.split("=", 1)[0]?.trim();
    if (!name) return void 0;
    const attributes = segments.map((segment) => {
      const separator = segment.indexOf("=");
      const attribute = (separator === -1 ? segment : segment.slice(0, separator)).trim().toLowerCase();
      if (attribute !== "samesite" || separator === -1) return attribute;
      const mode = segment.slice(separator + 1).trim().toLowerCase();
      return ["lax", "none", "strict"].includes(mode) ? `samesite=${mode}` : "samesite=invalid";
    }).filter(Boolean).sort();
    return { name, attributes };
  }).filter((value2) => value2 !== void 0).sort((a, b) => a.name.localeCompare(b.name) || a.attributes.join("\0").localeCompare(b.attributes.join("\0")));
}
function extractMetadata(body) {
  const content = (pattern) => body.match(pattern)?.[1]?.trim();
  const title = content(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonical = content(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i) ?? content(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i);
  const robots = content(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i) ?? content(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);
  return {
    ...title ? { title } : {},
    ...canonical ? { canonical } : {},
    ...robots ? { robots } : {}
  };
}
async function readBounded(response, maxBytes) {
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
async function captureSnapshot(base, route, options) {
  const requested = new URL(route.path, `${base}/`).toString();
  const requestedOrigin = new URL(requested).origin;
  let current = requested;
  let includeCustomHeaders = true;
  const redirects = [];
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    let response;
    for (let hop = 0; hop <= options.maxRedirects; hop += 1) {
      response = await fetch(current, {
        method: route.method ?? "GET",
        ...route.headers && includeCustomHeaders ? { headers: route.headers } : {},
        redirect: "manual",
        signal: controller.signal
      });
      const location = response.headers.get("location");
      if (response.status < 300 || response.status >= 400 || !location) break;
      if (hop === options.maxRedirects) {
        await response.body?.cancel();
        throw new Error(`Exceeded ${options.maxRedirects} redirects`);
      }
      let target;
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
      const normalizedLocation = target.origin === requestedOrigin ? safePath(target) : safeAbsoluteUrl(target);
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
      metadata: /html/i.test(contentType) ? extractMetadata(content.body) : {},
      bytesRead: content.bytes,
      truncated: content.truncated
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

// src/compare.ts
function stable(value2) {
  return JSON.stringify(value2);
}
function comparableHeader(name, value2) {
  if (name !== "content-security-policy" || value2 === void 0) return value2;
  return value2.replace(/'nonce-[^']+'/gi, "'nonce-<dynamic>'");
}
function difference(route, id, severity, field, preview, production, message) {
  return { route, id, severity, field, preview, production, message };
}
function comparableFinalTarget(snapshot) {
  const requested = new URL(snapshot.requestedUrl);
  const final = new URL(snapshot.finalUrl);
  return final.origin === requested.origin ? safePath(final) : safeAbsoluteUrl(final);
}
function compareSnapshots(route, preview, production) {
  const differences = [];
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
  const headerNames = /* @__PURE__ */ new Set([...Object.keys(preview.headers), ...Object.keys(production.headers)]);
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
  for (const field of ["title", "canonical", "robots"]) {
    if (preview.metadata[field] !== production.metadata[field]) {
      const severity = field === "canonical" || field === "robots" ? "warning" : "notice";
      differences.push(difference(path, "DP006", severity, `metadata.${field}`, preview.metadata[field], production.metadata[field], `${field} metadata differs`));
    }
  }
  if (route.expect?.status !== void 0 && preview.status !== route.expect.status) {
    differences.push(difference(path, "DP007", "error", "expect.status", preview.status, route.expect.status, `Preview did not return expected status ${route.expect.status}`));
  }
  if (route.expect?.contentType && !preview.headers["content-type"]?.includes(route.expect.contentType)) {
    differences.push(difference(path, "DP008", "error", "expect.contentType", preview.headers["content-type"], route.expect.contentType, `Preview content type did not include ${route.expect.contentType}`));
  }
  return differences;
}

// src/prove.ts
function errorMessage(value2) {
  return value2 instanceof Error ? value2.message : String(value2);
}
function reportRoute(route) {
  const { headers, ...safe } = route;
  return {
    ...safe,
    path: safeRoutePath(route.path),
    ...headers ? { headerNames: Object.keys(headers).map((name) => name.toLowerCase()).sort() } : {}
  };
}
async function prove(config) {
  const requestOptions = {
    timeoutMs: config.timeoutMs,
    maxRedirects: config.maxRedirects,
    maxBodyBytes: config.maxBodyBytes,
    ignoreHeaders: config.ignoreHeaders
  };
  const routes = [];
  for (const routeValue of config.routes) {
    const route = routeValue;
    const [preview, production] = await Promise.allSettled([
      captureSnapshot(config.preview, route, requestOptions),
      captureSnapshot(config.production, route, requestOptions)
    ]);
    if (preview.status === "rejected" || production.status === "rejected") {
      const failure = [
        preview.status === "rejected" ? `preview: ${errorMessage(preview.reason)}` : void 0,
        production.status === "rejected" ? `production: ${errorMessage(production.reason)}` : void 0
      ].filter(Boolean).join("; ");
      routes.push({
        route: reportRoute(route),
        differences: [{
          id: "DP000",
          severity: "error",
          route: route.path,
          field: "request",
          message: failure
        }],
        error: failure
      });
      continue;
    }
    routes.push({
      route: reportRoute(route),
      preview: preview.value,
      production: production.value,
      differences: compareSnapshots(route, preview.value, production.value)
    });
  }
  const all = routes.flatMap((route) => route.differences);
  return {
    previewBase: config.preview,
    productionBase: config.production,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    routes,
    summary: {
      errors: all.filter((item) => item.severity === "error").length,
      warnings: all.filter((item) => item.severity === "warning").length,
      notices: all.filter((item) => item.severity === "notice").length,
      matching: routes.filter((route) => route.differences.length === 0).length
    }
  };
}

// src/report.ts
var import_picocolors = __toESM(require_picocolors(), 1);
function value(input) {
  if (input === void 0) return "missing";
  if (typeof input === "string") return input;
  return JSON.stringify(input);
}
function symbol(severity) {
  if (severity === "error") return import_picocolors.default.red("\xD7");
  if (severity === "warning") return import_picocolors.default.yellow("!");
  return import_picocolors.default.cyan("i");
}
function humanReport(result) {
  const lines = [
    import_picocolors.default.bold("DeployProof"),
    `${import_picocolors.default.dim("preview")}     ${result.previewBase}`,
    `${import_picocolors.default.dim("production")}  ${result.productionBase}`,
    ""
  ];
  for (const route of result.routes) {
    const okay = route.differences.length === 0;
    lines.push(`${okay ? import_picocolors.default.green("\u2713") : import_picocolors.default.yellow("\u25CF")} ${import_picocolors.default.bold(route.route.path)}${okay ? import_picocolors.default.dim(" matches production") : ""}`);
    for (const item of route.differences) {
      lines.push(`  ${symbol(item.severity)} ${import_picocolors.default.bold(item.id)} ${item.message}`);
      if (item.preview !== void 0 || item.production !== void 0) {
        lines.push(`    ${import_picocolors.default.dim("preview")} ${value(item.preview)}`);
        lines.push(`    ${import_picocolors.default.dim("production")} ${value(item.production)}`);
      }
    }
  }
  lines.push(
    "",
    `${result.summary.matching} matching \xB7 ${result.summary.errors} errors \xB7 ${result.summary.warnings} warnings \xB7 ${result.summary.notices} notices`
  );
  return lines.join("\n");
}
function commandValue(input) {
  return value(input).slice(0, 500).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
function commandProperty(input) {
  return commandValue(input).replaceAll(":", "%3A").replaceAll(",", "%2C");
}
function githubReport(result) {
  const lines = [];
  for (const route of result.routes) {
    for (const item of route.differences) {
      const level = item.severity === "notice" ? "notice" : item.severity;
      const title = commandProperty(`${item.id} ${item.route}`);
      lines.push(`::${level} title=${title}::${commandValue(item.message)} (preview: ${commandValue(item.preview)}, production: ${commandValue(item.production)})`);
    }
  }
  lines.push(`DeployProof: ${result.summary.matching}/${result.routes.length} routes match production`);
  return lines.join("\n");
}
function sarifReport(result) {
  const differences = result.routes.flatMap((route) => route.differences);
  return JSON.stringify({
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{
      tool: {
        driver: {
          name: "DeployProof",
          informationUri: "https://deployproof.loke.dev",
          rules: [...new Map(differences.map((item) => [item.id, {
            id: item.id,
            shortDescription: { text: item.message }
          }])).values()]
        }
      },
      results: differences.map((item) => ({
        ruleId: item.id,
        level: item.severity === "error" ? "error" : item.severity === "warning" ? "warning" : "note",
        message: { text: `${item.route}: ${item.message}` }
      }))
    }]
  }, null, 2);
}

// src/cli.ts
async function version() {
  const packageFile = fileURLToPath(new URL("../package.json", import.meta.url));
  const parsed = JSON.parse(await readFile2(packageFile, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !("version" in parsed) || typeof parsed.version !== "string") {
    throw new Error("Package version is missing or invalid.");
  }
  return parsed.version;
}
async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }
  if (options.version) {
    console.log(await version());
    return;
  }
  const config = await loadConfig(options);
  const result = await prove(config);
  if (options.format === "json") console.log(JSON.stringify(result, null, 2));
  else if (options.format === "github") console.log(githubReport(result));
  else if (options.format === "sarif") console.log(sarifReport(result));
  else console.log(humanReport(result));
  if (result.summary.errors > 0 || options.strict && result.summary.warnings > 0) {
    process.exitCode = 1;
  }
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`deployproof: ${message}`);
  if (error instanceof UsageError) console.error("Run deployproof --help for usage.");
  process.exitCode = 2;
});
