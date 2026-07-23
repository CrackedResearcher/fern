"use client"

import * as React from "react"
import { EmptyMark } from "./icons"

const FG = "var(--fern-foreground, #18181b)"
const MUTED = "var(--fern-muted, #71717a)"

/**
 * Names what would match, rather than stopping at "no results". The suggestions
 * are real facets from the catalogue, so they are guaranteed to return
 * something — a dead end offering a second dead end is worse than the first.
 */
export function EmptyState({
  query,
  facets,
  onReset,
}: {
  query: string
  facets: string[]
  onReset: () => void
}) {
  return (
    <div
      data-slot="empty"
      role="status"
      className="flex flex-col items-center gap-1 px-6 py-8 text-center"
    >
      <span aria-hidden className="mb-2">
        <EmptyMark />
      </span>
      <p className="text-[14px] font-medium" style={{ color: FG }}>
        {query.trim()
          ? `No models match “${query.trim()}”`
          : "No models match these filters"}
      </p>
      <p className="text-[13px]" style={{ color: MUTED }}>
        {facets.length ? (
          <>
            Try a provider, or a capability like{" "}
            {facets.slice(0, 2).map((tag, index) => (
              <React.Fragment key={tag}>
                {index > 0 && " or "}
                <b>{tag}</b>
              </React.Fragment>
            ))}
            .
          </>
        ) : (
          "Try a model name, or the provider that makes it."
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        className={[
          "mt-3 cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium",
          "bg-[var(--fern-default,#ebebec)] transition-[background-color,scale] duration-150",
          "hover:bg-[var(--fern-default-hover,#e0e0e2)] active:scale-[0.97]",
        ].join(" ")}
        style={{
          color: FG,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        Start over
      </button>
    </div>
  )
}
