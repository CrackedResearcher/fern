/**
 * Tailwind v4 runs through PostCSS under Next. Without this file the whole
 * stylesheet is passed through untransformed: @import and @theme survive into
 * the output, no utilities are generated, and the page renders with no styles
 * at all — no build error, no warning. This is the failure CLAUDE.md records.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
