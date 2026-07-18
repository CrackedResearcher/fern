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

/** Sliders and alpha subtracted, for a compact trigger-style picker. */
export function ColorPickerMinimal() {
  const [color, setColor] = useState("#10b981")
  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      sliderLabels={false}
      alpha={false}
    />
  )
}
