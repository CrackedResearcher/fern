"use client"

import { useState } from "react"
import { ColorPicker } from "@fern-ui/color-picker"

/**
 * Controlled on purpose. An uncontrolled picker would demo fine but would not
 * exercise the value round-trip, and the docs site is also the test harness for
 * this block.
 */
export function ColorPickerDemo() {
  const [color, setColor] = useState("#3b82f6")
  return <ColorPicker value={color} onChange={setColor} />
}

/** Presets beneath the controls — the kit's `swatches` variant. */
export function ColorPickerSwatches() {
  const [color, setColor] = useState("#f59e0b")
  return <ColorPicker variant="swatches" value={color} onChange={setColor} />
}

/** Field only: presets and alpha off, for a compact trigger-style picker. */
export function ColorPickerMinimal() {
  const [color, setColor] = useState("#10b981")
  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      swatches={false}
      alpha={false}
    />
  )
}
