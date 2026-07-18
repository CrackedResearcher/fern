"use client"

import { Button } from "@fern-ui/button"
import { useEffect, useRef, useState } from "react"

/** HeroUI's copy glyph — two overlapping rounded squares, filled. Fumadocs
 *  ships Lucide's stroked clipboard, which is a visibly different mark. */
const CopyIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5"
      clipRule="evenodd"
    />
  </svg>
)

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/**
 * Replaces Fumadocs' copy button, which ships a different size and a different
 * glyph (Lucide's clipboard) to HeroUI's. The code is read off the enclosing
 * block rather than passed as a prop — the Actions slot has no access to it.
 */
export function CodeActions({ className }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // Hold the handle so rapid presses reset one timer rather than stacking
  // several — otherwise the icon flickers as each stale timeout fires.
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    // Scopes to the figure when inline, or to the whole block when the button
    // sits in a filename bar outside it.
    const code = ref.current
      ?.closest("figure, .code-section")
      ?.querySelector("pre")?.textContent
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }

  return (
    <div className={className}>
      <Button
        ref={ref}
        size="sm"
        variant="ghost"
        isIconOnly
        onPress={copy}
        className="-mt-0.5 bg-transparent text-muted"
        aria-label={copied ? "Copied" : "Copy Text"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
