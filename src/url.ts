import { createHash } from "node:crypto";

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
