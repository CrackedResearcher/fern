"use client"

import { Button, ButtonGroup } from "@heroui/react"
import { useEffect, useRef, useState } from "react"

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
 * "Copy Markdown", top-right of the page title — the same affordance their
 * docs put there so a page can be pasted straight into an LLM.
 */
export function CopyMarkdown({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // The timer handle is held so rapid presses reset it rather than stacking.
  // Without this the icon flickers between states as each stale timeout fires.
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }

  return (
    <ButtonGroup>
      <Button variant="tertiary" onPress={copy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy Markdown"}
      </Button>
    </ButtonGroup>
  )
}

export interface ResourceLink {
  label: string
  href: string
  icon?: React.ReactNode
}

/**
 * The row of resource chips under a page description — their Figma / Storybook
 * / Source row. Rendered as buttons rather than plain links because that is
 * what theirs are, down to the `dark:bg-default/70` wash.
 */
export function ResourceLinks({ links }: { links: ResourceLink[] }) {
  if (links.length === 0) return null
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {links.map((link) => (
        <Button
          key={link.href}
          size="sm"
          variant="tertiary"
          className="relative gap-2 dark:bg-default/70"
          onPress={() => window.open(link.href, "_blank", "noreferrer")}
        >
          {link.icon}
          {link.label}
        </Button>
      ))}
    </div>
  )
}
