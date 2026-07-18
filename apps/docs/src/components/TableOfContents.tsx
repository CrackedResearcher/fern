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
      className="sticky top-[104px] h-[calc(100vh-104px)] w-[240px] overflow-y-auto pt-6 pr-4 pl-4"
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
      <p className="mb-3 text-[14px] text-muted">On this page</p>
      <ul className="flex flex-col gap-2">
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
                "relative flex items-center py-1.5 text-[13px] transition-colors duration-150",
                entry.depth === 2 ? "ps-6" : "ps-3",
                entry.id === activeId ? "text-foreground" : "text-foreground-muted hover:text-foreground",
              )}
            >
              {/* Marker fades in rather than appearing, so scrolling between
                  entries reads as a move instead of a flicker. */}
              <span
                aria-hidden
                className={cn(
                  "absolute -ml-3 size-1 rounded-full bg-foreground-muted transition-opacity duration-150",
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
