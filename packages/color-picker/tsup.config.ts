import { defineConfig } from "tsup"

const shared = {
  format: ["esm", "cjs"] as const,
  dts: true,
  external: ["react", "react-dom"],
}

/**
 * Two passes, because the client boundary is per entry and tsup's `banner` is
 * per config. Bundling them together marks the colour maths as client code,
 * which hands a server component client references instead of the functions.
 */
export default defineConfig([
  {
    ...shared,
    entry: { index: "src/index.ts", "color-picker": "src/color-picker.tsx" },
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
    // Pure maths, no React, no banner — this entry exists to be importable
    // from anywhere, including a server component.
    entry: { color: "src/color.ts" },
    clean: false,
    splitting: false,
    treeshake: true,
  },
])
