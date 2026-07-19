import { defineConfig } from "tsup"

export default defineConfig({
  // Separate entries rather than one bundle, so importing `@fern-ui/color-picker/color`
  // never drags the React component into a consumer's graph.
  entry: {
    index: "src/index.ts",
    color: "src/color.ts",
    "color-picker": "src/color-picker.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: false,
  splitting: true,
  external: ["react", "react-dom"],
  // esbuild strips directives during bundling, so the client boundary has to be
  // re-added. It lands on every chunk; `color` is pure math and would ideally
  // stay server-importable — revisit with a preserve-directives plugin.
  banner: { js: '"use client";' },
})
