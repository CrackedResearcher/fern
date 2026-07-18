"use client"

import * as React from "react"
import { clamp } from "./color"


const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

/** Honours the OS "reduce motion" setting. Returns false during SSR. */
export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

/**
 * Pointer-capture drag. `trackRef` marks the element whose geometry defines
 * 0-1, while the handlers attach to a larger padded parent — that split is what
 * lets a 10px-tall slider carry a 40px touch target.
 */
export function useTrackDrag(
  onPosition: (x: number, y: number) => void,
  onEnd: () => void,
  disabled: boolean,
  /**
   * Horizontal inset, in px, of the usable range at each end — set it to the
   * thumb's radius on a 1D slider.
   *
   * A thumb is centred on its value, so at 0% and 100% half of it hangs off the
   * end of the rail. Insetting the range keeps the thumb inside the track it
   * belongs to, and because the same inset is applied to the pointer maths the
   * thumb still lands exactly under the cursor rather than drifting from it.
   *
   * Left at 0 for the 2D field, where reaching the true corner is the point —
   * that is where pure white and pure black live.
   */
  inset = 0,
) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const pointerId = React.useRef<number | null>(null)
  const [dragging, setDragging] = React.useState(false)

  const emit = (event: React.PointerEvent) => {
    const element = trackRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const usable = rect.width - inset * 2
    onPosition(
      usable > 0 ? clamp((event.clientX - rect.left - inset) / usable, 0, 1) : 0,
      rect.height ? clamp((event.clientY - rect.top) / rect.height, 0, 1) : 0,
    )
  }

  return {
    trackRef,
    dragging,
    handlers: disabled
      ? {}
      : {
          onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return
            // Multi-touch protection: once a drag owns a pointer, ignore every
            // other one. Without this, a second finger teleports the thumb.
            if (pointerId.current !== null) return
            event.preventDefault() // suppress text selection mid-drag
            event.currentTarget.setPointerCapture(event.pointerId)
            pointerId.current = event.pointerId
            setDragging(true)
            emit(event)
          },
          onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            emit(event)
          },
          onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            event.currentTarget.releasePointerCapture(event.pointerId)
            pointerId.current = null
            setDragging(false)
            onEnd()
          },
          onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            pointerId.current = null
            setDragging(false)
          },
        },
  }
}
