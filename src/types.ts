export type RouteMethod = "GET" | "HEAD";

export type Severity = "error" | "warning" | "notice";
export type OutputFormat = "human" | "json" | "github" | "sarif";

export type RouteInputMethod = RouteMethod | Lowercase<RouteMethod>;

export interface RouteInput {
  path: string;
  method?: RouteInputMethod;
  headers?: Record<string, string>;
  expect?: {
    status?: number;
    contentType?: string;
  };
}

export interface DeployProofConfig {
  preview?: string;
  production?: string;
  routes?: Array<string | RouteInput>;
  timeoutMs?: number;
  maxRedirects?: number;
  maxBodyBytes?: number;
  ignoreHeaders?: string[];
}

export interface Options {
  preview?: string;
  production?: string;
  config?: string;
  routes: string[];
  format: OutputFormat;
  strict: boolean;
  timeoutMs?: number;
}

export interface RedirectHop {
  status: number;
  location: string;
}

export type ReportRoute = Omit<RouteInput, "headers"> & {
  headerNames?: string[];
};

export interface Metadata {
  title?: string;
  canonical?: string;
  robots?: string;
}

export interface CookieShape {
  name: string;
  attributes: string[];
}

export interface Snapshot {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  durationMs: number;
  redirects: RedirectHop[];
  headers: Record<string, string>;
  cookies: CookieShape[];
  metadata: Metadata;
  bytesRead: number;
  truncated: boolean;
}

export interface Difference {
  id: string;
  severity: Severity;
  route: string;
  field: string;
  preview?: unknown;
  production?: unknown;
  message: string;
}

export interface RouteResult {
  route: ReportRoute;
  preview?: Snapshot;
  production?: Snapshot;
  differences: Difference[];
  error?: string;
}

export interface ProofResult {
  previewBase: string;
  productionBase: string;
  generatedAt: string;
  routes: RouteResult[];
  summary: {
    errors: number;
    warnings: number;
    notices: number;
    matching: number;
  };
}
