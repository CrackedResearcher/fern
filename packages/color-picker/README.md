# @fern-ui/color-picker

An accessible color picker for React. No runtime dependencies beyond React itself.

```bash
bun add @fern-ui/color-picker
```

Import the stylesheet once, anywhere in your app:

```tsx
import "@fern-ui/color-picker/styles.css"
```

The component is built from Tailwind utilities. Without the stylesheet the
markup is correct and nothing is styled — it fails quietly rather than loudly,
so it is worth checking first if a block looks wrong.

Skip it only if you are copy-pasting the source into a Tailwind project of your
own, where your build generates the utilities already.

## Usage

```tsx
import { ColorPicker } from "@fern-ui/color-picker"

function Example() {
  const [color, setColor] = useState("#3b82f6")
  return <ColorPicker value={color} onChange={setColor} />
}
```

Uncontrolled works too — omit `value` and pass `defaultValue`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled value. Accepts `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. |
| `defaultValue` | `string` | `"#3b82f6"` | Initial value when uncontrolled. |
| `onChange` | `(value, color) => void` | — | Fires on every change, including each frame of a drag. |
| `onChangeComplete` | `(value, color) => void` | — | Fires once when an interaction settles. |
| `format` | `"hex" \| "rgb" \| "hsl"` | `"hex"` | Starting format. Affects both the displayed text and the string passed to callbacks. |
| `formatToggle` | `boolean` | `true` | Let the user cycle hex → rgb → hsl at runtime. |
| `alpha` | `boolean` | `false` | Show the opacity slider and include alpha in output. |
| `sliderLabels` | `boolean` | `true` | Name and live readout above each slider. In HEX and RGBA the readout is the only place the hue appears. |
| `eyedropper` | `boolean` | `false` | Offer the native screen eyedropper where supported. |
| `copyable` | `boolean` | — | Show the copy-to-clipboard button. |
| `disabled` | `boolean` | `false` | Block interaction and dim the control. |
| `label` | `string` | `"Color picker"` | Accessible name for the group. |

Any other prop (`className`, `id`, `data-*`, …) lands on the root element.

### The two callbacks

`onChange` fires continuously — good for live previews. `onChangeComplete` fires
once per settled interaction — use it for network writes and undo history.

```tsx
<ColorPicker
  onChange={(value) => setPreview(value)}       // every frame
  onChangeComplete={(value) => saveToServer(value)} // once
/>
```

### The `color` argument

Both callbacks receive the full color as a second argument, so you never have to
convert by hand:

```ts
interface Color {
  hex: string                        // "#3b82f6"
  rgb: { r: number; g: number; b: number }   // 0-255
  hsl: { h: number; s: number; l: number }   // h 0-360, s/l 0-1
  hsv: { h: number; s: number; v: number }   // h 0-360, s/v 0-1
  alpha: number                      // 0-1
}
```

## Color utilities

The conversion helpers are exported from a separate entry point, so importing
them never pulls the React component into your bundle:

```ts
import { parseHex, rgbToHex, hsvToRgb } from "@fern-ui/color-picker/color"
```

## Accessibility

- Every control is a labelled `role="slider"` with `aria-valuenow` and a
  human-readable `aria-valuetext`.
- Full keyboard support: arrows nudge by 1%, <kbd>Shift</kbd>+arrows by 10%,
  <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends.
- Slider hit areas are 40px tall to clear WCAG 2.5.5, while the visible track
  stays 20px.
- Settled values are announced through a polite live region. Intermediate drag
  frames are deliberately not announced, which would otherwise flood a reader.
- The field thumb switches between a light and dark ring based on the luminance
  underneath it, so it stays visible across the whole gamut.
- `prefers-reduced-motion` disables the thumb scale animation.

## Notes

Thumb positions are never CSS-transitioned. Easing them leaves the thumb
trailing the cursor, which reads as lag — the only eased property is the press
scale.

## License

MIT
