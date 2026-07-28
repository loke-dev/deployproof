import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  splitting: false,
  clean: true,
  dts: true,
  noExternal: ["picocolors"],
});
