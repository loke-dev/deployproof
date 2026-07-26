import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

  it("reports unreadable conventional config paths", async () => {
    const directory = await mkdtemp(join(tmpdir(), "deployproof-config-"));
    const previousDirectory = process.cwd();
    try {
      await mkdir(join(directory, "deployproof.config.json"));
      process.chdir(directory);

      await expect(loadConfig({
        ...options,
        preview: "https://preview.example.com",
        production: "https://example.com",
      })).rejects.toThrow(/Could not read .*deployproof\.config\.json/);
    } finally {
      process.chdir(previousDirectory);
      await rm(directory, { recursive: true });
    }
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

  it("keeps only supported route fields", async () => {
    const directory = await mkdtemp(join(tmpdir(), "deployproof-config-"));
    const config = join(directory, "deployproof.config.json");
    try {
      await writeFile(config, JSON.stringify({
        preview: "https://preview.example.com",
        production: "https://example.com",
        routes: [{ path: "/health", note: "must-not-enter-reports" }],
      }));

      const loaded = await loadConfig({ ...options, config });

      expect(loaded.routes).toEqual([{ path: "/health", method: "GET" }]);
      expect(JSON.stringify(loaded)).not.toContain("must-not-enter-reports");
    } finally {
      await rm(directory, { recursive: true });
    }
  });

  it("rejects empty content type expectations", async () => {
    const directory = await mkdtemp(join(tmpdir(), "deployproof-config-"));
    const config = join(directory, "deployproof.config.json");
    try {
      await writeFile(config, JSON.stringify({
        preview: "https://preview.example.com",
        production: "https://example.com",
        routes: [{ path: "/health", expect: { contentType: " " } }],
      }));

      await expect(loadConfig({ ...options, config })).rejects.toThrow(
        /expected content type must be a non-empty string/,
      );
    } finally {
      await rm(directory, { recursive: true });
    }
  });
});
