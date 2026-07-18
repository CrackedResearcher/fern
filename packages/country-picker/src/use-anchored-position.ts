"use client"

import * as React from "react"

export interface AnchoredPosition {
  top: number
  left: number
  width: number
  /** Which way it opened, so the panel can scale from the right edge. */
  placement: "top" | "bottom"
  maxHeight: number
}

const GAP = 8
const MARGIN = 12

/**
 * Positions a panel against a trigger, in viewport coordinates.
 *
 * The panel is portalled to `document.body`, so an ancestor with
 * `overflow: hidden` cannot clip it — inside a card, a preview box or a modal,
 * an absolutely-positioned dropdown gets cut off, and no amount of z-index
 * fixes it because clipping happens before stacking.
 *
 * Flips above the trigger when the space below cannot hold the panel, and
 * reports the height actually available so the list can scroll rather than
 * overflow the viewport.
 */
export function useAnchoredPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  desiredHeight: number,
): AnchoredPosition | null {
  const [position, setPosition] = React.useState<AnchoredPosition | null>(null)

  React.useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    if (!trigger) return

    const measure = () => {
      const rect = trigger.getBoundingClientRect()
      const below = window.innerHeight - rect.bottom - GAP - MARGIN
      const above = rect.top - GAP - MARGIN
      // Only flip when below genuinely cannot hold it and above is roomier —
      // flipping for a few pixels is more disorienting than a shorter list.
      const flip = below < Math.min(desiredHeight, 240) && above > below

      setPosition({
        top: flip ? rect.top - GAP : rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        placement: flip ? "top" : "bottom",
        maxHeight: Math.max(160, Math.min(desiredHeight, flip ? above : below)),
      })
    }

    measure()
    // Measuring once is not enough: the trigger can still be settling when the
    // panel opens — a badge or clear button arriving changes its width — and
    // the panel would sit a few pixels narrow until something else forced a
    // re-measure. Observing it keeps the two in step.
    const observer = new ResizeObserver(measure)
    observer.observe(trigger)
    // `capture` so it also fires for scrolls inside any ancestor container,
    // which is the case that silently leaves the panel behind.
    window.addEventListener("scroll", measure, true)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", measure, true)
      window.removeEventListener("resize", measure)
    }
  }, [open, desiredHeight, triggerRef])

  return position
}
