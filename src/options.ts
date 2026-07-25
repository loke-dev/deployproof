import type { Options, OutputFormat } from "./types.js";

const help = `deployproof — prove a preview behaves like production

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

export class UsageError extends Error {}

export function parseOptions(argv: string[]): Options & { help?: boolean; version?: boolean } {
  const options: Options & { help?: boolean; version?: boolean } = {
    routes: [],
    format: process.env.GITHUB_ACTIONS ? "github" : "human",
    strict: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]!;
    const next = () => {
      const candidate = argv[index + 1];
      if (!candidate || candidate.startsWith("-")) throw new UsageError(`Missing value for ${value}`);
      index += 1;
      return candidate;
    };

    if (value === "-h" || value === "--help") options.help = true;
    else if (value === "-v" || value === "--version") options.version = true;
    else if (value === "-p" || value === "--preview") options.preview = next();
    else if (value === "-P" || value === "--production") options.production = next();
    else if (value === "-c" || value === "--config") options.config = next();
    else if (value === "-r" || value === "--route") options.routes.push(next());
    else if (value === "-f" || value === "--format") {
      const format = next();
      if (!["human", "json", "github", "sarif"].includes(format)) {
        throw new UsageError(`Unsupported format: ${format}`);
      }
      options.format = format as OutputFormat;
    } else if (value === "--timeout") {
      const timeout = Number(next());
      if (!Number.isInteger(timeout) || timeout < 100) throw new UsageError("Timeout must be at least 100ms");
      options.timeoutMs = timeout;
    } else if (value === "--strict") options.strict = true;
    else if (value === "--no-strict") options.strict = false;
    else if (value.startsWith("-")) throw new UsageError(`Unknown option: ${value}`);
    else options.routes.push(value);
  }

  return options;
}

export function helpText(): string {
  return help;
}

