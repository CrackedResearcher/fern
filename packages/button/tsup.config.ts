import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts", button: "src/button.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: false,
  splitting: true,
  external: ["react", "react-dom"],
  // esbuild strips directives during bundling, so the client boundary has to
  // be re-added.
  banner: { js: '"use client";' },
})
