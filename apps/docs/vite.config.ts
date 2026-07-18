import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Point at source so docs hot-reload without a build step.
      "@fern-ui/color-picker": fileURLToPath(
        new URL("../../packages/color-picker/src/index.ts", import.meta.url),
      ),
    },
  },
})
