import { useEffect, useState } from "react"
import { cn } from "../lib/cn"

export interface TocEntry {
  id: string
  label: string
  depth: 1 | 2
}

/**
 * Right rail. Tracks the heading currently in view so the active item follows
 * the reader rather than only updating on click.
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // IntersectionObserver is an external subscription, not derivable state.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // Bias the band toward the top of the viewport, so a heading counts as
      // "current" while its content is being read, not only as it scrolls past.
      // Only the top 20% of the viewport counts as "current". A taller band
      // makes several headings qualify at once and the marker jitters.
      { rootMargin: "0% 0% -80% 0%", threshold: 0 },
    )

    for (const entry of entries) {
      const element = document.getElementById(entry.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  return (
    <aside
      className="sticky top-[104px] flex h-[calc(100vh-104px)] flex-col overflow-y-auto pe-4 pt-12 pb-2"
      style={{
        // Fades the list where it meets the viewport edges so entries don't
        // appear guillotined mid-scroll. The top fade only engages once there
        // is something scrolled past to hide.
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, #000 16px, #000 calc(100% - 16px), transparent)",
        maskImage:
          "linear-gradient(to bottom, transparent, #000 16px, #000 calc(100% - 16px), transparent)",
      }}
    >
      {/* Their heading pairs the label with a list glyph rather than standing
          alone, which is what keeps the rail from reading as stray links. */}
      <h3 className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted">
        <svg
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M15 18H3" />
          <path d="M17 6H3" />
          <path d="M21 12H3" />
        </svg>
        On this page
      </h3>
      {/* Their rail draws a border-s line that is deliberately transparent, and
          states position with a 1px bar that slides between entries instead.
          The bar is the only visible rail element. */}
      <ul className="relative flex flex-col border-s border-transparent py-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              data-active={entry.id === activeId || undefined}
              onClick={(event) => {
                // Preserve the hash route: these are in-page anchors, and
                // letting the browser rewrite the hash would navigate away.
                event.preventDefault()
                document
                  .getElementById(entry.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
                setActiveId(entry.id)
              }}
              className={cn(
                // Active is the *foreground*, not the accent — their
                // --color-fd-primary resolves to #090909 / #fcfcfc. The accent
                // never appears in this rail.
                "relative flex scroll-m-4 items-center py-1.5 text-[13px] wrap-anywhere transition-colors first:pt-0 last:pb-0",
                entry.depth === 2 ? "ps-6" : "ps-3",
                entry.id === activeId
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {/* The indicator is a 1px bar on the rail, not a dot beside the
                  label. Sliding it is what makes scrolling read as movement. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 -start-px w-px bg-foreground transition-opacity",
                  entry.id === activeId ? "opacity-100" : "opacity-0",
                )}
              />
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
