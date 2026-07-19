/**
 * Deliberately a server component — no "use client" anywhere in this file.
 *
 * This is the check that a script cannot make. `next build` resolves the
 * packages as a consumer would, so it fails if a block does not carry its own
 * client boundary, and it fails if a pure entry carries one it should not.
 *
 * The 0.1.0 packages passed typecheck, passed a tarball inspection, and would
 * have failed here.
 */

import { Button } from "@fern-ui/button"
import { ColorPicker } from "@fern-ui/color-picker"
import { CountryPicker } from "@fern-ui/country-picker"
import { CodeBlock } from "@fern-ui/code-block"

import "@fern-ui/button/styles.css"
import "@fern-ui/color-picker/styles.css"
import "@fern-ui/country-picker/styles.css"
import "@fern-ui/code-block/styles.css"

// Imported at the top level of a server component on purpose. If these entries
// ever ship a client boundary, these become client references and calling them
// here is a build error rather than a silent regression.
import { parseColor, rgbToHex, luminance } from "@fern-ui/color-picker/color"
import { COUNTRIES } from "@fern-ui/country-picker/countries"

export default function Page() {
  const parsed = parseColor("#90d068")
  const roundTripped = parsed ? rgbToHex(parsed.rgb) : "parse failed"
  const lum = parsed ? luminance(parsed.rgb).toFixed(3) : "-"
  const india = COUNTRIES.find((c) => c.code === "IN")

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", display: "grid", gap: 24 }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>fern e2e consumer</h1>

      {/* Values the assertions in scripts/e2e.mjs look for in the served HTML.
          If a pure entry regressed to a client reference, these would not be
          here to find. */}
      <ul data-testid="server-values" style={{ fontSize: 13 }}>
        <li data-key="hex">{roundTripped}</li>
        <li data-key="luminance">{lum}</li>
        <li data-key="countries">{COUNTRIES.length}</li>
        <li data-key="india">{india ? `${india.name} ${india.dial}` : "not found"}</li>
      </ul>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="primary">Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button isIconOnly aria-label="Add">+</Button>
      </div>

      <ColorPicker defaultValue="#90d068" alpha />
      <CountryPicker defaultValue="IN" />

      <CodeBlock label="install.sh" lang="bash" copyable standalone>
        <pre>bun add @fern-ui/color-picker</pre>
      </CodeBlock>
    </main>
  )
}
