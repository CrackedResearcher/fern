/** Presentation constants shared by the picker shell and its parts. */

import { hsvToRgb, type ColorFormat } from "./color"
import { EASING } from "./motion"

/**
 * Alpha checkerboard, inlined so the component ships without an asset.
 *
 * Mid-grey rather than black: a black-on-transparent checker is invisible
 * against a dark card, which is exactly where the opacity track needs to read.
 * A neutral grey holds contrast on both light and dark surfaces.
 */
export const CHECKERBOARD =
  "repeating-conic-gradient(rgba(140,140,140,0.55) 0% 25%, rgba(255,255,255,0.9) 0% 50%) 50% / 9px 9px"

/**
 * Hue ramp at full chroma, always — it is a *selector*, not a preview.
 *
 * An earlier pass drew it at the current saturation and brightness, reasoning
 * that a vivid rainbow over-promises the outcome. It does, but the cost is far
 * worse than the benefit: at brightness 0 every stop evaluates to rgb(0,0,0)
 * and the rail becomes a solid black bar you cannot pick a hue from. That is
 * precisely where this picker makes a point of *preserving* hue, so the one
 * place the behaviour matters most is the place the control stopped showing it.
 *
 * A hue rail's job is to let you find a hue. Anything that makes two hues
 * indistinguishable has broken it, however honest the preview.
 */
export const HUE_GRADIENT = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
  .map((h) => {
    const { r, g, b } = hsvToRgb({ h: h % 360, s: 1, v: 1 })
    return `rgb(${r} ${g} ${b}) ${Math.round((h / 360) * 100)}%`
  })
  .join(", ")})`

/** Half the slider thumb's width. Insets both its travel and the drag maths. */
export const THUMB_RADIUS = 10

// ease-in is never used here — starting slow reads as lag at exactly the
// moment the user is watching hardest.
export const EASE_OUT = EASING.out

/**
 * Depth comes from one consistent rule: tracks and wells are *recessed* with an
 * inset shadow, thumbs and the card are *raised* with a cast shadow plus a
 * highlight along the top edge. Reversing that on any single element is what
 * makes a dimensional UI read as muddled.
 */
export const RECESSED =
  "inset 0 1px 2px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.09)"
/**
 * The white ring alone vanishes against a white card, leaving the thumb looking
 * like a floating dot. The hairline outside it re-establishes the edge on light
 * surfaces without darkening the thumb on dark ones.
 */
export const RAISED =
  "0 0 0 3px #fff, 0 0 0 4px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.3), 0 3px 8px -2px rgba(0,0,0,0.22)"

/**
 * The colour models offered by the select. `rgb` is labelled RGBA because the
 * row it produces includes an alpha field — naming it RGB would promise three
 * fields and deliver four.
 */
export const MODELS: { value: ColorFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGBA" },
  { value: "hsl", label: "HSL" },
]

/**
 * One editable channel. `min`/`max` are real bounds, not display hints: input
 * outside them reverts rather than clamping, so a typo reads as "nothing
 * happened" instead of silently becoming a different colour.
 */
export interface ChannelSpec {
  key: string
  short: string
  name: string
  value: number
  min: number
  max: number
}
