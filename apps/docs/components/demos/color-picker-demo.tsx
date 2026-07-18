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

/** Starts in RGBA, so the channel row is the first thing you see. */
export function ColorPickerModel() {
  const [color, setColor] = useState("rgb(217 119 6)")
  return <ColorPicker format="rgb" value={color} onChange={setColor} />
}

/**
 * The two callbacks side by side.
 *
 * `onChange` fires every frame of a drag and drives the "live" swatch; the
 * counter only moves on `onChangeComplete`, which fires once when the
 * interaction settles. That gap is the whole point of having both — one is for
 * painting, the other is for anything you would not want to do sixty times a
 * second, like a network write or an undo entry.
 */
export function ColorPickerCommit() {
  const [color, setColor] = useState("#10b981")
  const [committed, setCommitted] = useState("#10b981")
  const [commits, setCommits] = useState(0)

  return (
    <div className="flex flex-col items-center gap-5">
      <ColorPicker
        value={color}
        onChange={setColor}
        onChangeComplete={(next) => {
          setCommitted(next)
          setCommits((n) => n + 1)
        }}
      />
      <div className="flex items-center gap-5 text-sm">
        <span className="flex items-center gap-2">
          <span
            className="size-5 rounded-full ring-1 ring-black/10"
            style={{ background: color }}
          />
          <span className="font-mono text-muted">live</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="size-5 rounded-full ring-1 ring-black/10"
            style={{ background: committed }}
          />
          <span className="font-mono text-muted">settled · {commits}</span>
        </span>
      </div>
    </div>
  )
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
