#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { parseOptions, helpText, UsageError } from "./options.js";
import { prove } from "./prove.js";
import { githubReport, humanReport, sarifReport } from "./report.js";

async function version(): Promise<string> {
  const packageFile = fileURLToPath(new URL("../package.json", import.meta.url));
  const parsed = JSON.parse(await readFile(packageFile, "utf8")) as { version: string };
  return parsed.version;
}

async function main(): Promise<void> {
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

  if (result.summary.errors > 0 || (options.strict && result.summary.warnings > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`deployproof: ${message}`);
  if (error instanceof UsageError) console.error("Run deployproof --help for usage.");
  process.exitCode = 2;
});

