/**
 * Shared design tokens. Plain strings — no build step, no dependency.
 *
 * These live in the color-picker package for now. Once a second block needs
 * them they move to a shared `@fern-ui/tokens`; extracting a shared module with
 * exactly one consumer is premature.
 */

/** Radius scale. Nested surfaces should step down by their parent's padding. */
export const RADIUS = {
  small: 8,
  medium: 12,
  large: 14,
} as const

/**
 * Elevation.
 *
 * Three layers each: a wide ambient haze, a tighter directional shadow, and a
 * 1px hairline that does the actual work of separating the surface from the
 * page. On dark surfaces that hairline flips to an *inset* white highlight —
 * a dark card on a dark page needs a lit top edge, not a darker outline,
 * because a shadow against near-black is invisible.
 */
export const SHADOW = {
  light: {
    small:
      "0 0 5px 0 rgb(0 0 0 / 0.02), 0 2px 10px 0 rgb(0 0 0 / 0.06), 0 0 1px 0 rgb(0 0 0 / 0.3)",
    medium:
      "0 0 15px 0 rgb(0 0 0 / 0.03), 0 2px 30px 0 rgb(0 0 0 / 0.08), 0 0 1px 0 rgb(0 0 0 / 0.3)",
    large:
      "0 0 30px 0 rgb(0 0 0 / 0.04), 0 30px 60px 0 rgb(0 0 0 / 0.12), 0 0 1px 0 rgb(0 0 0 / 0.3)",
  },
  dark: {
    small:
      "0 0 5px 0 rgb(0 0 0 / 0.05), 0 2px 10px 0 rgb(0 0 0 / 0.2), inset 0 0 1px 0 rgb(255 255 255 / 0.15)",
    medium:
      "0 0 15px 0 rgb(0 0 0 / 0.06), 0 2px 30px 0 rgb(0 0 0 / 0.22), inset 0 0 1px 0 rgb(255 255 255 / 0.15)",
    large:
      "0 0 30px 0 rgb(0 0 0 / 0.07), 0 30px 60px 0 rgb(0 0 0 / 0.26), inset 0 0 1px 0 rgb(255 255 255 / 0.15)",
  },
} as const

export const OPACITY = {
  disabled: 0.5,
  hover: 0.8,
} as const

/**
 * Focus ring, built on `outline` rather than `box-shadow`.
 *
 * outline follows border-radius in every current browser and never participates
 * in layout, so it cannot displace a neighbour the way an inset ring can. The
 * transparent base outline keeps the ring from shifting geometry when it
 * appears — only its colour changes.
 */
export const FOCUS_RING =
  "outline-2 outline-offset-2 outline-transparent focus-visible:outline-[#0485f7]"
