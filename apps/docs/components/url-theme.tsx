"use client"

import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * Applies `?theme=light|dark` from the URL.
 *
 * This exists for headless screenshots. Dark-mode bugs — invisible
 * checkerboards, panels that collapse into the page — do not show up in light,
 * so verifying a visual change means capturing both, and a headless browser has
 * no way to click a theme switch.
 *
 * A real effect, not derived state: it synchronises an outside-React store
 * (next-themes' localStorage + the class on <html>) with the URL.
 */
export function UrlTheme() {
  const params = useSearchParams()
  const { setTheme } = useTheme()
  const requested = params.get("theme")

  useEffect(() => {
    if (requested === "light" || requested === "dark") setTheme(requested)
  }, [requested, setTheme])

  return null
}
