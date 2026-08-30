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
    const equalsIndex = value.indexOf("=");
    const option = equalsIndex > 0 ? value.slice(0, equalsIndex) : value;
    let inlineValue = equalsIndex > 0 ? value.slice(equalsIndex + 1) : undefined;
    const next = () => {
      const candidate = inlineValue ?? argv[index + 1];
      if (!candidate || candidate.startsWith("-")) throw new UsageError(`Missing value for ${value}`);
      if (inlineValue === undefined) index += 1;
      inlineValue = undefined;
      return candidate;
    };

    if (option === "-h" || option === "--help") options.help = true;
    else if (option === "-v" || option === "--version") options.version = true;
    else if (option === "-p" || option === "--preview") options.preview = next();
    else if (option === "-P" || option === "--production") options.production = next();
    else if (option === "-c" || option === "--config") options.config = next();
    else if (option === "-r" || option === "--route") options.routes.push(next());
    else if (option === "-f" || option === "--format") {
      const format = next();
      if (!["human", "json", "github", "sarif"].includes(format)) {
        throw new UsageError(`Unsupported format: ${format}`);
      }
      options.format = format as OutputFormat;
    } else if (option === "--timeout") {
      const timeout = Number(next());
      if (!Number.isInteger(timeout) || timeout < 100) throw new UsageError("Timeout must be at least 100ms");
      options.timeoutMs = timeout;
    } else if (option === "--strict") options.strict = true;
    else if (option === "--no-strict") options.strict = false;
    else if (option.startsWith("-")) throw new UsageError(`Unknown option: ${value}`);
    else options.routes.push(value);
  }

  return options;
}

export function helpText(): string {
  return help;
}
