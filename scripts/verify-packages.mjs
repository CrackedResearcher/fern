/**
 * Asserts the invariants that broke in the 0.1.0 → 0.1.1 round.
 *
 * ESLint cannot catch most of these: a stripped "use client", a missing .d.ts
 * and an absent styles.css are all properties of *build output*, and every one
 * of them shipped while the source looked correct and typecheck passed. So
 * this runs against dist, not src.
 *
 * Wired into `prepublishOnly`, which npm runs before publishing — a package
 * that fails cannot be published, rather than being caught afterwards by
 * someone reading a tarball listing.
 *
 *   bun run verify
 */

import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const PACKAGES = ["button", "code-block", "color-picker", "country-picker", "model-picker"]

/**
 * Entries that must NOT carry a client boundary. They exist so a consumer can
 * import data or maths without React, and a "use client" on them hands a
 * server component a client reference instead of the value.
 *
 * Every export subpath must appear here or in the client set — an unclassified
 * entry is an error, so adding one forces the decision to be made explicitly.
 */
const PURE_ENTRIES = {
  "color-picker": ["./color"],
  "country-picker": ["./countries"],
  "model-picker": ["./model"],
  button: [],
  "code-block": [],
}

const failures = []
const fail = (pkg, msg) => failures.push(`${pkg}: ${msg}`)

for (const pkg of PACKAGES) {
  const dir = join("packages", pkg)
  const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))

  // 1. Zero runtime dependencies. The whole thesis, and a one-line regression.
  const deps = Object.keys(pj.dependencies ?? {})
  if (deps.length) fail(pkg, `has runtime dependencies: ${deps.join(", ")}`)

  // 2. npm renders a blank page without these, and only includes them if present.
  for (const f of ["README.md", "LICENSE"]) {
    if (!existsSync(join(dir, f))) fail(pkg, `missing ${f}`)
  }

  // 3. Every exports target resolves. A two-config tsup build silently dropped
  //    color.d.ts and countries.d.ts while the .js shipped fine.
  const subpaths = []
  for (const [key, val] of Object.entries(pj.exports ?? {})) {
    if (typeof val !== "object") continue
    subpaths.push(key)
    for (const target of [val.types, val.import, val.require]) {
      if (!target) continue
      if (!existsSync(join(dir, target))) fail(pkg, `exports ${key} → ${target} does not exist`)
    }
  }

  // 4. The client boundary, per entry and in both directions.
  const pure = PURE_ENTRIES[pkg] ?? []
  for (const key of subpaths) {
    const val = pj.exports[key]
    if (!val.import || !existsSync(join(dir, val.import))) continue
    const first = readFileSync(join(dir, val.import), "utf8").split("\n")[0]
    const hasBoundary = first.includes("use client")
    const shouldBePure = pure.includes(key)

    if (key !== "." && !pure.includes(key) && !subpaths.includes(key)) {
      fail(pkg, `entry ${key} is unclassified — add it to PURE_ENTRIES or confirm it is a client entry`)
    }
    if (shouldBePure && hasBoundary) {
      fail(pkg, `${key} is a pure entry but ships "use client" — a server component would get a client reference`)
    }
    if (!shouldBePure && !hasBoundary) {
      fail(pkg, `${key} is missing "use client" — it will fail in a server component`)
    }
  }

  // 5. The stylesheet. Without it the markup is right and nothing is styled.
  const css = join(dir, "dist/styles.css")
  if (!existsSync(css)) fail(pkg, "missing dist/styles.css")
  else {
    const s = readFileSync(css, "utf8")
    if (s.length < 500) fail(pkg, `dist/styles.css is ${s.length} bytes — did @source match anything?`)
    // Preflight resets the *host's* margins, headings and form controls.
    if (s.includes("box-sizing:border-box") && s.includes("margin:0") && s.includes("h1,h2")) {
      fail(pkg, "dist/styles.css looks like it includes preflight — it must not reset the host")
    }
  }

  // 6. Bare variables collide with the host. create-next-app defines
  //    --foreground, which turned every label white on a white surface.
  const srcDir = join(dir, "src")
  for (const file of readdirSync(srcDir)) {
    if (!/\.tsx?$/.test(file)) continue
    const text = readFileSync(join(srcDir, file), "utf8")
    for (const m of text.matchAll(/var\(--([a-z][a-z-]*)/g)) {
      const name = m[1]
      if (name.startsWith("fern-") || name.startsWith("tw-") || name === "spacing") continue
      fail(pkg, `src/${file} reads bare var(--${name}) — namespace it as --fern-${name}`)
    }
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ${f}`)
  console.error("")
  process.exit(1)
}

console.log(`✓ ${PACKAGES.length} packages verified — deps, licence, exports, boundaries, styles, variables`)
