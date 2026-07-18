import { createMDX } from "fumadocs-mdx/next"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const withMDX = createMDX()

/**
 * tw-animate-css publishes *only* a `style` export condition and no `default`,
 * and its `exports` map blocks deep paths. Turbopack resolves neither, so
 * `@import "tw-animate-css"` fails — and it cannot simply be dropped, because
 * @heroui/styles' component layer `@apply`s its utilities (`fade-in-0` and
 * friends), which is a hard build error rather than a missing animation.
 *
 * Resolving the real file here and aliasing the bare specifier to it keeps
 * their stylesheet intact without vendoring anything into the repo.
 *
 * Located by walking up for node_modules rather than with require.resolve,
 * because that package does not export ./package.json either — there is no
 * specifier Node will resolve.
 */
function findTwAnimateCss(from) {
  let dir = from
  while (true) {
    const candidate = join(dir, "node_modules/tw-animate-css/dist/tw-animate.css")
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error(
        "tw-animate-css not found. It is a transitive dependency of @heroui/styles, " +
          "whose component layer @applies its utilities — the build cannot proceed without it.",
      )
    }
    dir = parent
  }
}

const twAnimateCss = findTwAnimateCss(dirname(fileURLToPath(import.meta.url)))

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /**
   * The blocks are consumed from source rather than from a built dist, so the
   * docs site stays a live harness: editing packages/color-picker/src shows up
   * on the next render with no build step in between.
   */
  transpilePackages: ["@fern-ui/color-picker"],
  /**
   * Moving content into root folders to generate the tab row changed every
   * page URL and left /docs itself with nothing behind it. These keep the old
   * paths working instead of 404ing.
   */
  async redirects() {
    return [
      { source: "/docs", destination: "/docs/getting-started", permanent: false },
      {
        source: "/docs/color-picker",
        destination: "/docs/components/color-picker",
        permanent: false,
      },
      {
        source: "/docs/country-picker",
        destination: "/docs/components/country-picker",
        permanent: false,
      },
    ]
  },
  turbopack: {
    resolveAlias: {
      "tw-animate-css": twAnimateCss,
    },
  },
}

export default withMDX(config)
