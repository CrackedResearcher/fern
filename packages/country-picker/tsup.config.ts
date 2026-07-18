import { defineConfig } from "tsup"

export default defineConfig({
  // Separate entries so importing `@fern-ui/country-picker/countries` never
  // drags the React component into a consumer's graph.
  entry: {
    index: "src/index.ts",
    countries: "src/countries.ts",
    "country-picker": "src/country-picker.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: true,
  external: ["react", "react-dom"],
  // esbuild strips directives during bundling, so the client boundary has to be
  // re-added. It lands on every chunk; `countries` is plain data and would
  // ideally stay server-importable — revisit with a preserve-directives plugin.
  banner: { js: '"use client";' },
})
