import { describe, expect, it } from "vitest";
import { parseOptions, UsageError } from "../src/options.js";

describe("parseOptions", () => {
  it("collects positional and named routes", () => {
    const options = parseOptions(["--preview", "https://preview.test", "--production", "https://prod.test", "-r", "/one", "/two"]);
    expect(options.routes).toEqual(["/one", "/two"]);
    expect(options.preview).toBe("https://preview.test");
  });

  it("validates output formats", () => {
    expect(() => parseOptions(["--format", "xml"])).toThrow(UsageError);
  });

  it("validates the timeout", () => {
    expect(() => parseOptions(["--timeout", "20"])).toThrow("at least 100ms");
  });
});

