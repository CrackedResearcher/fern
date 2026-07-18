import { useState, type ReactNode } from "react"
import { ColorPicker } from "@fern-ui/color-picker"

/**
 * Every block is a data entry here. Adding a block to the docs means appending
 * to `REGISTRY` — the sidebar, routing, and page layout all derive from it.
 */

export interface PropDoc {
  name: string
  type: string
  defaultValue?: string
  required?: boolean
  description: string
}

export interface DemoDoc {
  name: string
  code: string
  render: () => ReactNode
}

export interface BlockDoc {
  slug: string
  name: string
  category: string
  description: string
  status: "ready" | "planned"
  install?: string
  demos?: DemoDoc[]
  /** Structural shape of the block, so consumers can see what they're getting. */
  anatomy?: { description: string; code: string }
  /** Concrete accessibility guarantees, not a checkbox claim. */
  accessibility?: string[]
  props?: PropDoc[]
}

const SWATCHES = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

function ControlledPicker() {
  const [color, setColor] = useState("#3b82f6")
  return <ColorPicker value={color} onChange={setColor} />
}

export const REGISTRY: BlockDoc[] = [
  {
    slug: "color-picker",
    name: "Color Picker",
    category: "Inputs",
    status: "ready",
    description:
      "A saturation field, hue and opacity sliders, and a text input — with full keyboard support and no runtime dependencies beyond React.",
    install: "bun add @fern-ui/color-picker",
    demos: [
      {
        name: "Default",
        code: `import { ColorPicker } from "@fern-ui/color-picker"

const [color, setColor] = useState("#3b82f6")

// One picker, everything included. Every capability is
// reachable without configuration — subtract with props
// only if you need less.
<ColorPicker value={color} onChange={setColor} />`,
        render: () => <ControlledPicker />,
      },
    ],
    anatomy: {
      description:
        "One component, no composition required. Each capability is a prop rather than a subcomponent, so the default import is already the complete picker.",
      code: `<ColorPicker
  // Saturation and brightness field
  // Hue slider
  // Opacity slider          — alpha
  // Hex and opacity inputs
  // Format switcher         — formatToggle
  // Preset swatches         — swatches
  // Screen eyedropper       — eyedropper
  // Copy to clipboard       — copyable
  // Before/after comparison — comparison
/>`,
    },
    accessibility: [
      "Every control is a labelled role=\"slider\" carrying aria-valuenow and a human-readable aria-valuetext.",
      "Arrow keys nudge by 1%, Shift+arrows by 10%, and Home/End jump to the ends — matching native range inputs.",
      "Slider hit areas are 40px tall while the visible track stays 24px, clearing the WCAG 2.5.5 target minimum.",
      "Settled values are announced through a polite live region; intermediate drag frames are deliberately not, which would otherwise flood a screen reader.",
      "The field thumb switches between a light and dark ring based on the luminance beneath it, so it stays visible across the whole gamut.",
      "prefers-reduced-motion removes the thumb scale and icon transitions.",
      "A drag owns a single pointer id, so a second finger cannot hijack it mid-gesture.",
    ],
    props: [
      {
        name: "value",
        type: "string",
        description:
          "Controlled value. Accepts #rgb, #rgba, #rrggbb, or #rrggbbaa.",
      },
      {
        name: "defaultValue",
        type: "string",
        defaultValue: '"#3b82f6"',
        description: "Initial value when uncontrolled.",
      },
      {
        name: "onChange",
        type: "(value, color) => void",
        description:
          "Fires on every change, including each frame of a drag. Use for live previews.",
      },
      {
        name: "onChangeComplete",
        type: "(value, color) => void",
        description:
          "Fires once when an interaction settles. Use for network writes and undo history.",
      },
      {
        name: "format",
        type: '"hex" | "rgb" | "hsl"',
        defaultValue: '"hex"',
        description:
          "Starting output format. Users can cycle it at runtime unless formatToggle is false.",
      },
      {
        name: "formatToggle",
        type: "boolean",
        defaultValue: "true",
        description:
          "Let the user cycle hex → rgb → hsl by pressing the format label.",
      },
      {
        name: "alpha",
        type: "boolean",
        defaultValue: "true",
        description: "Show the opacity slider and include alpha in output.",
      },
      {
        name: "swatches",
        type: "string[] | false",
        defaultValue: "8 presets",
        description:
          "Preset colors. Pass false to hide the row, or an array to replace the palette.",
      },
      {
        name: "eyedropper",
        type: "boolean",
        defaultValue: "true",
        description:
          "Offer the native screen eyedropper where the browser supports it.",
      },
      {
        name: "copyable",
        type: "boolean",
        defaultValue: "true",
        description: "Show the copy-to-clipboard button.",
      },
      {
        name: "comparison",
        type: "boolean",
        defaultValue: "true",
        description:
          "Show the starting color beside the current one. Pressing it reverts.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "Block interaction and dim the control.",
      },
      {
        name: "label",
        type: "string",
        defaultValue: '"Color picker"',
        description: "Accessible name for the group.",
      },
    ],
  },
  {
    slug: "country-picker",
    name: "Country Picker",
    category: "Inputs",
    status: "planned",
    description:
      "A searchable country select with flags, dial codes, and keyboard filtering.",
  },
]

export const CATEGORIES = [...new Set(REGISTRY.map((block) => block.category))]
