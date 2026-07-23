"use client"

/** The closed control, and the panel's search and filter chrome. */

import * as React from "react"
import type { Model } from "./model"
import { Logo, RowPrice } from "./parts"
import { ChevronIcon, CloseIcon, SearchIcon } from "./icons"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

const SURFACE = "var(--fern-surface, #ffffff)"
const FG = "var(--fern-foreground, #18181b)"
const MUTED = "var(--fern-muted, #71717a)"

export type TriggerVariant = "default" | "pill"

/**
 * The trigger. `pill` is the compact form for a config row, `default` is
 * standalone.
 *
 * Neither opens on hover: that fires on every pass of the cursor across a dense
 * row and means nothing at all on touch. The pill stays 40px — the floor for an
 * interactive target does not move because a control got smaller.
 */
export const Trigger = React.forwardRef<
  HTMLButtonElement,
  {
    id: string
    popoverId: string
    open: boolean
    label: string
    variant: TriggerVariant
    selected?: Model
    placeholder: string
    showLogos: boolean
    showPrice: boolean
    disabled: boolean
    focusRing: string
    onToggle: () => void
  }
>(function Trigger(
  {
    id,
    popoverId,
    open,
    label,
    variant,
    selected,
    placeholder,
    showLogos,
    showPrice,
    disabled,
    focusRing,
    onToggle,
  },
  ref,
) {
  const pill = variant === "pill"

  return (
    <button
      ref={ref}
      type="button"
      id={id}
      data-slot="trigger"
      data-variant={variant}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? popoverId : undefined}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 bg-[var(--fern-default,#ebebec)]",
        "transition-[background-color,scale] duration-150",
        pill
          ? "h-10 max-w-[240px] rounded-full pr-2.5 pl-2 text-[13px]"
          : "h-11 w-full rounded-xl px-3 text-[13.5px]",
        !disabled && "cursor-pointer hover:bg-[var(--fern-default-hover,#e0e0e2)]",
        !disabled && "active:scale-[0.97]",
        disabled && "cursor-not-allowed opacity-50",
        focusRing,
      )}
      style={{ color: FG }}
    >
      {selected ? (
        <>
          {showLogos && <Logo model={selected} size={pill ? 20 : 22} eager />}
          {/* Long names truncate rather than pushing the control wider — in a
              config row that shifts everything beside it. */}
          <span className="min-w-0 flex-1 truncate text-left">{selected.name}</span>
          {!pill && showPrice && <RowPrice model={selected} />}
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate text-left" style={{ color: MUTED }}>
          {placeholder}
        </span>
      )}
      <ChevronIcon open={open} />
    </button>
  )
})

/** The search field, with its icon overlaid rather than in a wrapper box.
 *  Markup and metrics are the country picker's, unchanged. */
export const SearchField = React.forwardRef<
  HTMLInputElement,
  {
    listId: string
    activeId?: string
    placeholder: string
    value: string
    onChange: (value: string) => void
    onClear: () => void
    focusRing: string
  }
>(function SearchField(
  { listId, activeId, placeholder, value, onChange, onClear, focusRing },
  ref,
) {
  return (
    <div className="relative flex items-center px-1 pt-1 pb-2">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3.5 text-[var(--fern-muted,#71717a)]"
      >
        <SearchIcon />
      </span>
      <input
        ref={ref}
        data-slot="search"
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-xl bg-[var(--fern-default,#ebebec)] pr-9 pl-9",
          "text-[15px] text-[var(--fern-foreground,#18181b)] outline-hidden",
          "placeholder:text-[var(--fern-muted,#71717a)]",
          focusRing,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className={cn(
            "absolute right-3.5 grid size-5 cursor-pointer place-items-center rounded-full",
            "text-[var(--fern-muted,#71717a)] transition-colors duration-150",
            "hover:bg-[var(--fern-default-hover,#e0e0e2)] hover:text-[var(--fern-foreground,#18181b)]",
          )}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
})

/**
 * Capability chips, on one line that scrolls. Wrapping them stacked seven into
 * a block taller than three model rows — chrome outweighing what it filters.
 * The edge fades so a sliced chip reads as more to come, not as a clipping bug.
 */
export function FacetChips({
  facets,
  active,
  live,
  onToggle,
}: {
  facets: string[]
  active: string[]
  live: Set<string>
  onToggle: (tag: string) => void
}) {
  if (!facets.length) return null
  return (
    <div className="relative">
      <div
        data-slot="facets"
        role="group"
        aria-label="Filter by capability"
        className="flex gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {facets.map((tag) => {
          const on = active.includes(tag)
          const dead = !live.has(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              disabled={dead}
              onClick={() => onToggle(tag)}
              className={cn(
                // Squared off: full-radius capsules under a squared field read
                // as a different control set.
                "shrink-0 rounded-lg px-2.5 py-1 text-[12px] leading-[1.35] whitespace-nowrap",
                "duration-150",
                // Filled, never stroked: a 1px ring on a 24px chip is a hard
                // edge at the smallest size in the panel, and a row of them
                // reads as a grid of boxes rather than one control.
                on
                  ? "bg-[color-mix(in_oklab,var(--fern-focus,#0485f7)_13%,transparent)] text-[var(--fern-focus,#0485f7)]"
                  : "bg-[color-mix(in_oklab,var(--fern-foreground,#18181b)_5%,transparent)] hover:bg-[color-mix(in_oklab,var(--fern-foreground,#18181b)_9%,transparent)]",
                // 0.97, matching every other fern block. One control pressing
                // deeper than the rest makes a set feel assembled from parts.
                !dead && "active:scale-[0.97] transition-[background-color,color,opacity,scale]",
                // Kept in place rather than removed: a chip row that reflows as
                // you click through it puts the next chip under a moving target.
                dead ? "cursor-not-allowed opacity-35" : "cursor-pointer",
              )}
              style={on ? undefined : { color: MUTED }}
            >
              {tag}
            </button>
          )
        })}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 pb-2"
        style={{ background: `linear-gradient(to left, ${SURFACE}, transparent)` }}
      />
    </div>
  )
}
