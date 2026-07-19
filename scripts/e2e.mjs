/**
 * Installs the packages the way a stranger would, and builds a real app.
 *
 * Every check in verify-packages.mjs inspects a file. This one exercises the
 * artifact: it packs tarballs, installs them into a Next app that is *not* a
 * workspace member (so nothing resolves to local source), and builds it.
 *
 * Both bugs that shipped in 0.1.0 were invisible to typecheck and to a tarball
 * listing, and both would have failed here:
 *   - no client boundary → `next build` errors in a server component
 *   - no stylesheet → the page renders with correct markup and no styling,
 *     caught below by asserting the CSS actually reaches the built output
 *
 *   bun run e2e
 */

import { execSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const PACKAGES = ["button", "code-block", "color-picker", "country-picker"]
const CONSUMER = "e2e/consumer"
const TARBALLS = join(CONSUMER, "tarballs")

/**
 * A failing step here means the artifact is broken, which is the point — so it
 * reports the step that failed rather than an execSync stack trace, which says
 * nothing about what went wrong.
 */
function run(cmd, cwd = ".", label = cmd) {
  try {
    execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } })
  } catch {
    console.error(`\n✗ failed: ${label}`)
    console.error(`  in ${cwd}\n`)
    console.error("  This is the consumer path failing, not a flaky test — the")
    console.error("  packages as built cannot be installed and built by an app.\n")
    process.exit(1)
  }
}

const capture = (cmd, cwd = ".") =>
  execSync(cmd, { cwd, encoding: "utf8", env: { ...process.env, CI: "1" } })

console.log("\n▸ building packages")
run("bun run --filter '@fern-ui/*' build")

console.log("\n▸ packing tarballs")
rmSync(TARBALLS, { recursive: true, force: true })
mkdirSync(TARBALLS, { recursive: true })
for (const p of PACKAGES) {
  // --ignore-scripts: prepublishOnly would rebuild and recurse.
  capture(`npm pack --ignore-scripts --pack-destination ../../${TARBALLS}`, `packages/${p}`)
}
const packed = readdirSync(TARBALLS).filter((f) => f.endsWith(".tgz"))
if (packed.length !== PACKAGES.length) {
  console.error(`✗ expected ${PACKAGES.length} tarballs, got ${packed.length}`)
  process.exit(1)
}
console.log(`  ${packed.join("\n  ")}`)

console.log("\n▸ installing as a consumer would")
rmSync(join(CONSUMER, "node_modules"), { recursive: true, force: true })
rmSync(join(CONSUMER, ".next"), { recursive: true, force: true })
run("npm install --no-audit --no-fund", CONSUMER)
run(`npm install --no-audit --no-fund ${packed.map((f) => `./tarballs/${f}`).join(" ")}`, CONSUMER)

// Nothing may resolve to workspace source, or the test proves nothing.
for (const p of PACKAGES) {
  const real = capture(`node -p "require.resolve('@fern-ui/${p}/package.json')"`, CONSUMER).trim()
  if (!real.includes(join(CONSUMER, "node_modules"))) {
    console.error(`✗ @fern-ui/${p} resolved outside the consumer's node_modules:\n  ${real}`)
    process.exit(1)
  }
}
console.log("  all four resolve to installed copies, not workspace source")

console.log("\n▸ building the consumer app")
run("npm run build", CONSUMER, "next build in the consumer app")

console.log("\n▸ asserting the build output")
const failures = []

// The stylesheet has to actually reach the built CSS. A missing styles.css
// does not fail a Next build — the page just renders unstyled, which is
// exactly how it shipped.
// Walked rather than read from a fixed path: Next 16 emits CSS under
// static/chunks/, older versions under static/css/, and hardcoding either one
// makes this assertion pass by finding nothing.
function collect(dir, ext, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) collect(p, ext, out)
    else if (e.name.endsWith(ext)) out.push(p)
  }
  return out
}

const cssFiles = collect(join(CONSUMER, ".next/static"), ".css")
const css = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n")
if (!css) failures.push("no CSS emitted — the stylesheet imports produced nothing")
else {
  for (const cls of ["rounded-3xl", "touch-none", "tabular-nums"]) {
    if (!css.includes(cls)) failures.push(`built CSS is missing .${cls} — @source may have stopped matching`)
  }
  if (!css.includes("--fern-")) failures.push("built CSS references no --fern- variables")
}

// Server-rendered values prove the pure entries ran on the server rather than
// arriving as client references.
const htmlFile = join(CONSUMER, ".next/server/app/index.html")
if (!existsSync(htmlFile)) {
  console.error(`✗ no prerendered HTML at ${htmlFile} — the page did not statically render`)
  process.exit(1)
}
const html = readFileSync(htmlFile, "utf8")
for (const [key, expected] of [["hex", "#90d068"], ["countries", "198"], ["india", "India +91"]]) {
  if (!html.includes(expected)) {
    failures.push(`server-rendered HTML is missing ${key} (${expected}) — did a pure entry gain a client boundary?`)
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ${f}`)
  console.error("")
  process.exit(1)
}

console.log("\n✓ consumer app builds, styles reach the page, pure entries ran on the server\n")
