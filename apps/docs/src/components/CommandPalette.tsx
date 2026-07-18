import { useEffect, useMemo, useState } from "react"
import { cn, EASE } from "../lib/cn"
import { navigate } from "../lib/router"
import { REGISTRY } from "../registry"
import { SearchIcon } from "./icons"

interface Result {
  slug: string
  name: string
  category: string
  description: string
  planned: boolean
}

/**
 * Local search. With a registry this size, filtering an array beats shipping a
 * search index — Algolia earns its place at hundreds of pages, not ten.
 */
function search(query: string): Result[] {
  const all = REGISTRY.map((block) => ({
    slug: block.slug,
    name: block.name,
    category: block.category,
    description: block.description,
    planned: block.status === "planned",
  }))
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return all
  return all.filter((entry) =>
    `${entry.name} ${entry.category} ${entry.description}`
      .toLowerCase()
      .includes(trimmed),
  )
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const results = useMemo(() => search(query), [query])

  // Reset on close rather than on open, so the closing animation doesn't show
  // the list rebuilding mid-fade.
  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setQuery("")
        setCursor(0)
      }, 200)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  const choose = (result: Result) => {
    if (result.planned) return
    navigate(result.slug)
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setCursor((value) => Math.min(value + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setCursor((value) => Math.max(value - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const result = results[cursor]
      if (result) choose(result)
    } else if (event.key === "Escape") {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]",
        !open && "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionTimingFunction: EASE }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl border border-separator bg-background shadow-2xl",
          "transition-[opacity,transform] duration-200",
          // Never from scale(0) — nothing in the real world appears from
          // nothing, and a near-scale entrance reads as arriving, not popping.
          open ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="flex items-center gap-3 border-b border-separator px-4">
          <span className="text-foreground-muted">
            <SearchIcon size={16} />
          </span>
          <input
            autoFocus={open}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setCursor(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search blocks…"
            aria-label="Search blocks"
            className="h-12 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-foreground-muted"
          />
          <kbd className="rounded-md bg-default px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
            esc
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-foreground-muted">
              No blocks match “{query}”.
            </li>
          )}
          {results.map((result, index) => (
            <li key={result.slug}>
              <button
                type="button"
                disabled={result.planned}
                onMouseEnter={() => setCursor(index)}
                onClick={() => choose(result)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left",
                  "transition-colors duration-100",
                  result.planned && "cursor-not-allowed opacity-45",
                  index === cursor && !result.planned && "bg-default",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-foreground">
                    {result.name}
                  </span>
                  <span className="block truncate text-[12px] text-foreground-muted">
                    {result.description}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-default px-1.5 py-0.5 text-[10px] text-foreground-muted">
                  {result.planned ? "Soon" : result.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
