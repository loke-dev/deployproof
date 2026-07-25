import pc from "picocolors";
import type { Difference, ProofResult } from "./types.js";

function value(input: unknown): string {
  if (input === undefined) return "missing";
  if (typeof input === "string") return input;
  return JSON.stringify(input);
}

function symbol(severity: Difference["severity"]): string {
  if (severity === "error") return pc.red("×");
  if (severity === "warning") return pc.yellow("!");
  return pc.cyan("i");
}

export function humanReport(result: ProofResult): string {
  const lines = [
    pc.bold("DeployProof"),
    `${pc.dim("preview")}     ${result.previewBase}`,
    `${pc.dim("production")}  ${result.productionBase}`,
    "",
  ];

  for (const route of result.routes) {
    const okay = route.differences.length === 0;
    lines.push(`${okay ? pc.green("✓") : pc.yellow("●")} ${pc.bold(route.route.path)}${okay ? pc.dim(" matches production") : ""}`);
    for (const item of route.differences) {
      lines.push(`  ${symbol(item.severity)} ${pc.bold(item.id)} ${item.message}`);
      if (item.preview !== undefined || item.production !== undefined) {
        lines.push(`    ${pc.dim("preview")} ${value(item.preview)}`);
        lines.push(`    ${pc.dim("production")} ${value(item.production)}`);
      }
    }
  }

  lines.push(
    "",
    `${result.summary.matching} matching · ${result.summary.errors} errors · ${result.summary.warnings} warnings · ${result.summary.notices} notices`,
  );
  return lines.join("\n");
}

function commandValue(input: unknown): string {
  return value(input).replaceAll("\r", " ").replaceAll("\n", " ").slice(0, 500);
}

export function githubReport(result: ProofResult): string {
  const lines: string[] = [];
  for (const route of result.routes) {
    for (const item of route.differences) {
      const level = item.severity === "notice" ? "notice" : item.severity;
      const title = encodeURIComponent(`${item.id} ${item.route}`);
      lines.push(`::${level} title=${title}::${commandValue(item.message)} (preview: ${commandValue(item.preview)}, production: ${commandValue(item.production)})`);
    }
  }
  lines.push(`DeployProof: ${result.summary.matching}/${result.routes.length} routes match production`);
  return lines.join("\n");
}

export function sarifReport(result: ProofResult): string {
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
            shortDescription: { text: item.message },
          }])).values()],
        },
      },
      results: differences.map((item) => ({
        ruleId: item.id,
        level: item.severity === "error" ? "error" : item.severity === "warning" ? "warning" : "note",
        message: { text: `${item.route}: ${item.message}` },
      })),
    }],
  }, null, 2);
}

