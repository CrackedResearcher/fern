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
