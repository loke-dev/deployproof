import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const options = {
  routes: [],
  format: "human" as const,
  strict: false,
};

describe("loadConfig", () => {
  it("works without a config file", async () => {
    const config = await loadConfig({
      ...options,
      preview: "https://preview.example.com",
      production: "https://example.com",
    });

    expect(config.routes).toEqual([{ path: "/", method: "GET" }]);
  });

  it("rejects credentials embedded in target URLs", async () => {
    await expect(loadConfig({
      ...options,
      preview: "https://user:secret@preview.example.com",
      production: "https://example.com",
    })).rejects.toThrow(/credentials/i);
  });

  it("rejects invalid runtime limits from configuration", async () => {
    const directory = await mkdtemp(join(tmpdir(), "deployproof-config-"));
    const config = join(directory, "deployproof.config.json");
    try {
      await writeFile(config, JSON.stringify({
        preview: "https://preview.example.com",
        production: "https://example.com",
        timeoutMs: -1,
      }));

      await expect(loadConfig({ ...options, config })).rejects.toThrow(
        /timeoutMs must be an integer between 100 and 120000/,
      );
    } finally {
      await rm(directory, { recursive: true });
    }
  });
});
