import { describe, expect, it } from "vitest";
import { githubReport, sarifReport } from "../src/report.js";
import type { ProofResult } from "../src/types.js";

const result: ProofResult = {
  previewBase: "https://preview.test",
  productionBase: "https://example.com",
  generatedAt: "2026-07-25T00:00:00.000Z",
  routes: [{
    route: { path: "/" },
    differences: [{
      id: "DP001",
      severity: "error",
      route: "/",
      field: "status",
      preview: 404,
      production: 200,
      message: "HTTP status differs",
    }],
  }],
  summary: { errors: 1, warnings: 0, notices: 0, matching: 0 },
};

describe("reports", () => {
  it("emits GitHub commands", () => {
    expect(githubReport(result)).toContain("::error title=DP001 /::HTTP status differs");
  });

  it("escapes workflow command data", () => {
    const unsafe: ProofResult = structuredClone(result);
    unsafe.routes[0]!.differences[0]!.message = "line one%\nline two";

    expect(githubReport(unsafe)).toContain("line one%25%0Aline two");
  });

  it("emits valid SARIF", () => {
    const sarif = JSON.parse(sarifReport(result));
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].results[0].ruleId).toBe("DP001");
  });
});
