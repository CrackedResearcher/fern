"use client"

import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * Applies `?theme=light|dark` from the URL, so headless screenshots can capture
 * both themes without clicking a switch. A real effect: it synchronises an
 * outside-React store with the URL.
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
