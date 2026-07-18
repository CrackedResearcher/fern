import { useEffect, useRef, useState } from "react"

/**
 * Copy-to-clipboard with a "copied" flag that survives being spammed.
 *
 * The naive version calls setTimeout on every click and never clears it.
 * Click twice quickly and the first timer fires while the second click still
 * expects the confirmation to be showing — the icon flickers back mid-state.
 * Holding the handle and clearing it on each press means the window always
 * measures from the *last* click.
 */
export function useCopy(resetAfter = 1400) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  // Clear on unmount so a pending timer can't fire into a gone component.
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be blocked by permissions. Still show confirmation —
      // the failure isn't actionable and a dead button is worse.
    }
    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), resetAfter)
  }

  return { copied, copy }
}
