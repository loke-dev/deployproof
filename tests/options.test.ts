import { describe, expect, it } from "vitest";
import { parseOptions, UsageError } from "../src/options.js";

describe("parseOptions", () => {
  it("collects positional and named routes", () => {
    const options = parseOptions(["--preview", "https://preview.test", "--production", "https://prod.test", "-r", "/one", "/two"]);
    expect(options.routes).toEqual(["/one", "/two"]);
    expect(options.preview).toBe("https://preview.test");
  });

  it("accepts equals syntax for value options", () => {
    const options = parseOptions([
      "--preview=https://preview.test/?token=redacted",
      "--production=https://prod.test",
      "--config=deployproof.config.json",
      "--route=/one",
      "--format=json",
      "--timeout=250",
    ]);

    expect(options.preview).toBe("https://preview.test/?token=redacted");
    expect(options.production).toBe("https://prod.test");
    expect(options.config).toBe("deployproof.config.json");
    expect(options.routes).toEqual(["/one"]);
    expect(options.format).toBe("json");
    expect(options.timeoutMs).toBe(250);
  });

  it("validates output formats", () => {
    expect(() => parseOptions(["--format", "xml"])).toThrow(UsageError);
  });

  it("validates the timeout", () => {
    expect(() => parseOptions(["--timeout", "20"])).toThrow("at least 100ms");
  });
});
