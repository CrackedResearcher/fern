"use client"

import * as React from "react"

/**
 * A softer ease-out than the usual (0.23, 1, 0.32, 1) — it decelerates over a
 * longer tail, so the panel settles instead of snapping to a stop.
 *
 * Still ease-out, not ease-in. ease-in withholds movement for the first
 * frames, which is precisely when the user is watching for a response, so it
 * reads as lag however smooth the rest of the curve is.
 */
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"
/** Enter has room to settle; exits stay quick, or leaving reads as reluctance. */
export const ENTER_MS = 220
export const EXIT_MS = 130

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia(REDUCED_MOTION)
      q.addEventListener("change", cb)
      return () => q.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

/**
 * Open/close with an exit transition.
 *
 * `rendered` keeps the panel in the DOM through its exit; `shown` drives the
 * transition. Without the split there is no exit animation, because React
 * unmounts before it can play.
 */
export function useOpenState(open: boolean) {
  const reducedMotion = usePrefersReducedMotion()
  const [rendered, setRendered] = React.useState(false)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    setShown(false)
    const timer = window.setTimeout(
      () => setRendered(false),
      reducedMotion ? 0 : EXIT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [open, reducedMotion])

  /**
   * Attach to the panel. A ref callback runs with the node already in the DOM,
   * so reading a layout property here forces the closed style to be committed
   * before the open one is applied — which is what gives the transition a start
   * state. Scheduling that with requestAnimationFrame instead is fragile: the
   * frame can be cancelled by an effect re-run and the panel then mounts stuck
   * at its closed style, invisible.
   */
  const panelRef = React.useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      void node.offsetHeight
      setShown(true)
    },
    [],
  )

  return { rendered, shown, reducedMotion, panelRef }
}


/**
 * Which scroll edges have content beyond them.
 *
 * A fade that shows when there is nothing to scroll to is not a hint, it is a
 * wash over the first row — so each edge reports independently and the fade
 * only appears once it means something.
 */
export function useScrollEdges(
  ref: React.RefObject<HTMLElement | null>,
  /**
   * True only once the scroller is in the DOM. `rendered` alone is a render too
   * early — the panel waits for its anchor to resolve — so the effect runs
   * against a null ref and never re-runs.
   */
  active: boolean,
) {
  const [edges, setEdges] = React.useState({ top: false, bottom: false })

  const measure = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const top = scrollTop > 1
    const bottom = scrollTop + clientHeight < scrollHeight - 1
    // Bail out when nothing changed. A fresh object is a new reference, so
    // React re-renders, and the observer below re-measures after every render —
    // an infinite loop, not a wasted render.
    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    )
  }, [ref])

  /**
   * Observed, not measured once after mount: a single measurement reads the
   * list before flex has bounded it, `scrollHeight === clientHeight`, and no
   * edge ever reports overflow. Nothing re-measures afterwards, because the
   * only other trigger is a scroll on a list that looks complete.
   */
  React.useEffect(() => {
    const el = ref.current
    if (!active || !el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // The scroller's own box stops changing once it is bounded; it is the
    // content inside that grows and shrinks as results filter.
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [active, measure, ref])

  return { edges, measure }
}
