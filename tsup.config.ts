import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  dts: true,
  noExternal: ["picocolors"],
});
