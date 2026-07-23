import { defineConfig } from "tsup"

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  external: ["react", "react-dom"],
}

/**
 * Two passes, because the client boundary is per entry and tsup's `banner` is
 * per config. Bundling them together marks the model record and its price
 * formatting as client code, which hands a server component a client reference
 * instead of the function.
 */
export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", "model-picker": "src/model-picker.tsx" },
    clean: false,
    splitting: true,
    /**
     * esbuild strips directives when it bundles, so the boundary is re-added
     * here — and `treeshake` stays off because it runs rollup over esbuild's
     * output afterwards, which drops the directive again and warns that it
     * "was ignored". That warning was the only sign nothing shipped a boundary.
     */
    treeshake: false,
    banner: { js: '"use client";' },
  },
  {
    ...shared,
    // Types, price formatting and the meter scale. No React, no banner —
    // importing them on the server is the reason this is a separate entry.
    entry: { model: "src/model.ts" },
    clean: false,
    splitting: false,
    treeshake: true,
  },
])
