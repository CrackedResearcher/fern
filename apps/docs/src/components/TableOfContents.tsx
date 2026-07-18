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
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    )

    for (const entry of entries) {
      const element = document.getElementById(entry.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-10 pr-6 xl:block">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        On this page
      </h2>
      <ul className="flex flex-col gap-0.5 border-l border-divider">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
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
                "-ml-px block border-l py-1.5 text-[13px] transition-colors duration-150",
                entry.depth === 2 ? "pl-6" : "pl-4",
                entry.id === activeId
                  ? "border-fg font-medium text-fg"
                  : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
