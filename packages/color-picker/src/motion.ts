/**
 * Motion tokens. No dependencies — every curve here is a plain CSS
 * `cubic-bezier`, so springy motion costs nothing at runtime.
 *
 * These live in the color-picker package for now. Once a second block needs
 * them they move to a shared `@fern-ui/tokens` package; extracting a shared
 * module with exactly one consumer is premature.
 */

export const EASING = {
  /**
   * Strong ease-out. Moves immediately, which is what makes a control feel
   * like it heard you. Default for anything entering or responding to input.
   */
  out: "cubic-bezier(0.23, 1, 0.32, 1)",

  /** Natural acceleration and deceleration, for things moving on screen. */
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",

  /**
   * A spring without a physics engine. The y-values exceed 1, so the curve
   * overshoots its target and settles back — the same overshoot a real spring
   * produces. Use for tactile feedback like a thumb grabbing under the cursor.
   */
  spring: "cubic-bezier(0.155, 1.105, 0.295, 1.12)",

  /** Same idea, gentler overshoot. For larger or heavier elements. */
  softSpring: "cubic-bezier(0.16, 1.11, 0.3, 1.02)",

  /**
   * A slightly slower, more elegant general-purpose curve. Reaches for a
   * softer landing than `out` — good for colour and background changes where
   * urgency would feel twitchy.
   */
  soft: "cubic-bezier(0.36, 0.66, 0.4, 1)",
} as const

/**
 * Durations in milliseconds.
 *
 * Exits are deliberately faster than enters. An element leaving should get out
 * of the way immediately; taking as long to leave as it did to arrive reads as
 * the interface being reluctant. Everything stays under 300ms — past that, UI
 * motion starts to feel like latency rather than polish.
 */
export const DURATION = {
  /** Press feedback. Must be near-instant to register as a response. */
  press: 120,
  /** Something appearing or growing. */
  enter: 200,
  /** Something leaving. Half the enter, by design. */
  exit: 100,
  /** Larger surfaces that would feel abrupt at enter speed. */
  slow: 300,
} as const
