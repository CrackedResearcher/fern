"use client"

import * as React from "react"
import type { AnchoredPosition } from "./use-anchored-position"
import { EASE_OUT, ENTER_MS, EXIT_MS } from "./use-open-state"

const MARGIN = 12
/**
 * Only ever widens a narrow trigger — a pill in a config row would otherwise
 * open a 120px list. A standard trigger is wider than this, so the panel
 * matches it exactly; narrower than its own control reads as misaligned.
 */
const MIN_LIST_WIDTH = 292

export interface PanelGeometry {
  left: number
  /** The whole panel, list plus detail column. */
  width: number
  listWidth: number
  /** Whether the detail column fits beside the list at all. */
  withDetail: boolean
  vertical: React.CSSProperties
  surface: React.CSSProperties
}

/**
 * Where the panel sits, and how it arrives.
 *
 * The detail column is part of the panel, not a second card beside it: two
 * slabs with a gutter read as two windows, and the gutter has no radius for
 * them to be concentric with. When the pair does not fit, the panel is simply
 * the list and the descriptions fold into the rows.
 */
export function usePanelGeometry(
  position: AnchoredPosition | null,
  detailWidth: number,
  wantsDetail: boolean,
  shown: boolean,
  reducedMotion: boolean,
): PanelGeometry | null {
  return React.useMemo(() => {
    if (!position) return null

    const listWidth = Math.max(position.width, MIN_LIST_WIDTH)
    const available = position.viewportWidth - MARGIN * 2
    const withDetail = wantsDetail && listWidth + detailWidth <= available
    const width = listWidth + (withDetail ? detailWidth : 0)

    return {
      left: Math.max(
        MARGIN,
        Math.min(position.left, position.viewportWidth - MARGIN - width),
      ),
      width,
      listWidth,
      withDetail,
      vertical: {
        top: position.placement === "bottom" ? position.top : undefined,
        bottom:
          position.placement === "top"
            ? window.innerHeight - position.top
            : undefined,
        // The bound goes on the panel; the list inside is a flex child that
        // scrolls. Subtracting a guessed chrome height slices the last row the
        // moment the chrome grows a line.
        maxHeight: position.maxHeight,
      },
      surface: {
        boxShadow:
          "var(--fern-overlay-shadow, 0 14px 28px 0 rgb(0 0 0 / 0.08), 0 2px 8px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.06))",
        opacity: shown ? 1 : 0,
        // Never from scale(0) — nothing in the real world appears out of
        // nothing. 0.97 with a small rise reads as the panel arriving.
        transform: reducedMotion
          ? undefined
          : shown
            ? "scale(1) translateY(0)"
            : `scale(0.97) translateY(${position.placement === "top" ? 6 : -6}px)`,
        transitionProperty: reducedMotion ? "opacity" : "opacity, transform",
        transitionDuration: `${shown ? ENTER_MS : EXIT_MS}ms`,
        transitionTimingFunction: EASE_OUT,
      },
    }
  }, [position, detailWidth, wantsDetail, shown, reducedMotion])
}
