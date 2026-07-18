"use client"

import { Button } from "@heroui/react"
import { ThemePicker } from "@/components/theme-picker"
import { useEffect, useState } from "react"

/**
 * The right-hand header cluster.
 *
 * These are HeroUI's real React components, not markup wearing their class
 * names. Their docs' own header renders `data-rac` elements — React Aria
 * Components — so press handling, focus-visible, disabled state and the
 * pending affordance all come from the same implementation theirs uses.
 * Hand-writing `class="button button--sm"` reproduced the paint and none of
 * the behaviour.
 */
export function HeaderActions() {
  const [stars, setStars] = useState<string | null>(null)

  // Star count is decoration. If the request fails the button renders without
  // a number rather than showing a zero, which would look like a real value.
  useEffect(() => {
    let active = true
    fetch("https://api.github.com/repos/CrackedResearcher/fern")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (!active || !data?.stargazers_count) return
        const count = data.stargazers_count
        setStars(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex items-center gap-3">
      <ThemePicker />
      <Button
        size="sm"
        variant="tertiary"
        className="h-[34px] border-none bg-default/80"
        onPress={() =>
          window.open(
            "https://github.com/CrackedResearcher/fern",
            "_blank",
            "noreferrer",
          )
        }
        aria-label="fern on GitHub"
      >
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
          <path d="M12 2.5a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5 0-.19-.01-.82-.01-1.49-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.1-1.46-1.1-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85 0 1.33-.01 2.41-.01 2.74 0 .27.16.59.67.5A10 10 0 0 0 22 12.5a10 10 0 0 0-10-10Z" />
        </svg>
        {stars && (
          <span className="pt-px text-xs font-medium text-muted tabular-nums">
            {stars}
          </span>
        )}
      </Button>
    </div>
  )
}
