import { useState, type ReactNode } from "react"
import { ColorPicker } from "@fern/color-picker"

/**
 * Every block is a data entry here. Adding a block to the docs means appending
 * to `REGISTRY` — the sidebar, routing, and page layout all derive from it.
 */

export interface PropDoc {
  name: string
  type: string
  defaultValue?: string
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
    install: "bun add @fern/color-picker",
    demos: [
      {
        name: "Default",
        code: `import { ColorPicker } from "@fern/color-picker"

function Example() {
  const [color, setColor] = useState("#3b82f6")
  return <ColorPicker value={color} onChange={setColor} />
}`,
        render: () => <ControlledPicker />,
      },
      {
        name: "Alpha",
        code: `<ColorPicker defaultValue="#8b5cf6cc" alpha />`,
        render: () => <ColorPicker defaultValue="#8b5cf6cc" alpha />,
      },
      {
        name: "Swatches",
        code: `<ColorPicker
  defaultValue="#22c55e"
  swatches={["#ef4444", "#f97316", "#eab308", "#22c55e"]}
/>`,
        render: () => <ColorPicker defaultValue="#22c55e" swatches={SWATCHES} />,
      },
      {
        name: "Full",
        code: `<ColorPicker
  defaultValue="#ec4899"
  alpha
  eyedropper
  copyable
  swatches={swatches}
/>`,
        render: () => (
          <ColorPicker
            defaultValue="#ec4899"
            alpha
            eyedropper
            copyable
            swatches={SWATCHES}
          />
        ),
      },
      {
        name: "HSL output",
        code: `<ColorPicker defaultValue="#14b8a6" format="hsl" copyable />`,
        render: () => (
          <ColorPicker defaultValue="#14b8a6" format="hsl" copyable />
        ),
      },
      {
        name: "Disabled",
        code: `<ColorPicker defaultValue="#f97316" disabled />`,
        render: () => <ColorPicker defaultValue="#f97316" disabled />,
      },
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
        description: "Format of the string passed to callbacks.",
      },
      {
        name: "alpha",
        type: "boolean",
        defaultValue: "false",
        description: "Show the opacity slider and include alpha in output.",
      },
      {
        name: "swatches",
        type: "string[]",
        description: "Preset colors rendered as a row below the controls.",
      },
      {
        name: "eyedropper",
        type: "boolean",
        defaultValue: "false",
        description:
          "Offer the native screen eyedropper where the browser supports it.",
      },
      {
        name: "copyable",
        type: "boolean",
        defaultValue: "false",
        description: "Show a copy-to-clipboard button beside the value.",
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
