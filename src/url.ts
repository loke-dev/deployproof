import { createHash } from "node:crypto";

export function normalizeBase(value: string, name: string): string {
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

function fingerprint(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function safeSearch(url: URL): string {
  const entries = [...url.searchParams.entries()]
    .map(([name, value]) => [name, value ? fingerprint(value) : ""] as const)
    .sort(([leftName, leftValue], [rightName, rightValue]) =>
      leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue));
  const parameters = new URLSearchParams();
  for (const [name, value] of entries) parameters.append(name, value);
  const search = parameters.toString();
  return search ? `?${search}` : "";
}

export function safePath(url: URL): string {
  return `${url.pathname}${safeSearch(url)}`;
}

export function safeAbsoluteUrl(url: URL): string {
  return `${url.origin}${safePath(url)}`;
}

export function safeRoutePath(path: string): string {
  return safePath(new URL(path, "https://deployproof.invalid"));
}

export function redactUrlsInText(value: string): string {
  return value.replace(/https?:\/\/[^\s<>"']+/gi, (candidate) => {
    const match = /^(.*?)([),.;!?]*)$/.exec(candidate);
    const urlValue = match?.[1] ?? candidate;
    const trailing = match?.[2] ?? "";

    try {
      return `${safeAbsoluteUrl(new URL(urlValue))}${trailing}`;
    } catch {
      return `[redacted URL]${trailing}`;
    }
  });
}
