"use client"

/** The picker's presentational leaves, kept out of the shell so the component
 *  file reads as composition. */

import * as React from "react"
import type { Country } from "./countries"
import {
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  GlobeIcon,
  SearchIcon,
} from "./icons"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

const SURFACE = "var(--fern-surface, #ffffff)"

/**
 * Fade at a scroll boundary, so rows dissolve into the edge instead of being
 * sliced by it. Anywhere content scrolls under something — a sticky header, the
 * end of a panel — the hard cut reads as a rendering fault.
 */
export function ScrollFade({ side }: { side: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      data-slot="scroll-fade"
      className={cn(
        // inset-x-0: the panel's own padding already insets this wrapper, so
        // a second inset left the row edges poking out past the fade.
        "pointer-events-none absolute inset-x-0 z-20 h-6",
        // The panel is r16 with 4px of padding, so its inner corner is r12.
        // Square corners here overhang that curve and sit on the border.
        side === "top" ? "top-0 rounded-t-xl" : "bottom-0 rounded-b-xl",
      )}
      style={{
        background: `linear-gradient(to ${side === "top" ? "bottom" : "top"}, ${SURFACE}, transparent)`,
      }}
    />
  )
}

const ROW_SKIP: React.CSSProperties = {
  contentVisibility: "auto",
  containIntrinsicSize: "auto 40px",
}

export function Row({
  country,
  index,
  id,
  active,
  selected,
  showDialCode,
  showFlags,
  flagSrc,
  onSelect,
  onHover,
}: {
  country: Country
  index: number
  id: string
  active: boolean
  selected: boolean
  showDialCode: boolean
  showFlags: boolean
  flagSrc: (code: string) => string
  onSelect: (country: Country) => void
  onHover: (index: number) => void
}) {
  return (
    <div
      id={id}
      data-slot="option"
      data-index={index}
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(country)}
      onPointerMove={() => onHover(index)}
      style={ROW_SKIP}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2",
        // Two distinct states, as on the trigger: the keyboard/pointer cursor
        // is a neutral wash, the current selection is tinted with the accent so
        // you can tell "where I am" from "what I chose" at a glance.
        active && !selected && "bg-[var(--fern-default,#ebebec)]",
        selected &&
          "bg-[color-mix(in_oklab,var(--fern-focus,#0485f7)_12%,transparent)]",
        selected && active &&
          "bg-[color-mix(in_oklab,var(--fern-focus,#0485f7)_20%,transparent)]",
      )}
    >
      {showFlags && <Flag country={country} flagSrc={flagSrc} />}
      <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--fern-foreground,#18181b)]">
        {country.name}
      </span>
      {showDialCode && <DialBadge dial={country.dial} />}
      {selected && (
        <span className="shrink-0 text-[var(--fern-focus,#0485f7)]">
          <CheckIcon />
        </span>
      )}
    </div>
  )
}

/**
 * Rows lazy-load, so only the flags scrolled to are fetched — 195 eager
 * requests on open is the difference between instant and visibly stalling.
 *
 * The trigger passes `eager`, because it is one always-visible image and
 * Chrome holds lazy images until the document finishes loading; on a page that
 * never quite settles, a lazy trigger flag simply never appears.
 *
 * The ring is an inset shadow rather than a border so it does not affect
 * layout.
 */
export function Flag({
  country,
  flagSrc,
  eager = false,
}: {
  country: Country
  flagSrc: (code: string) => string
  eager?: boolean
}) {
  return (
    <img
      src={flagSrc(country.code)}
      alt=""
      width={22}
      height={22}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden"
      }}
      data-slot="flag"
      className="size-[22px] shrink-0 rounded-full object-cover"
      style={{ boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.1)" }}
    />
  )
}

/**
 * Tabular figures so the badges line up down the column.
 *
 * The fill is a tint of the foreground rather than `--fern-default`, which is also
 * the hovered-row background — a badge painted in it disappears on exactly the
 * row you are pointing at. A tint reads on any surface and stays quiet enough
 * not to compete with the country name.
 */
export function DialBadge({ dial }: { dial: string }) {
  return (
    <span
      data-slot="dial"
      className="shrink-0 rounded px-1 py-px font-mono text-[11px] leading-[1.45] tabular-nums"
      style={{
        backgroundColor:
          "color-mix(in oklab, var(--fern-foreground, #18181b) 7%, transparent)",
        color: "var(--fern-muted, #71717a)",
      }}
    >
      {dial}
    </span>
  )
}

export function EmptyState({
  query,
  icon,
  onClear,
}: {
  query: string
  icon?: React.ReactNode
  onClear: () => void
}) {
  return (
    <div
      data-slot="empty"
      role="status"
      className="flex flex-col items-center gap-1 px-6 py-10 text-center"
    >
      <span aria-hidden className="mb-2 text-[var(--fern-muted,#71717a)]">
        {icon ?? <GlobeIcon />}
      </span>
      <p className="text-[14px] font-medium text-[var(--fern-foreground,#18181b)]">
        No countries match “{query.trim()}”
      </p>
      <p className="text-[13px] text-[var(--fern-muted,#71717a)]">
        Try a country name, a two-letter code like <b>JP</b>, or a dial code
        like <b>+81</b>.
      </p>
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "mt-3 rounded-full px-3.5 py-1.5 text-[13px] font-medium",
          "bg-[var(--fern-default,#ebebec)] text-[var(--fern-foreground,#18181b)]",
          "transition-[background-color,scale] duration-150 active:scale-[0.97]",
          "hover:bg-[var(--fern-default-hover,#e0e0e2)]",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        Clear search
      </button>
    </div>
  )
}


/** The closed control. Split out so the shell file stays under 400 lines. */
export const Trigger = React.forwardRef<
  HTMLButtonElement,
  {
    id: string
    popoverId: string
    open: boolean
    label: string
    selected?: Country
    placeholder: string
    showDialCode: boolean
    showFlags: boolean
    flagSrc: (code: string) => string
    disabled: boolean
    clearable: boolean
    focusRing: string
    onToggle: () => void
    onClear: () => void
  }
>(function Trigger(
  {
    id,
    popoverId,
    open,
    label,
    selected,
    placeholder,
    showDialCode,
    showFlags,
    flagSrc,
    disabled,
    clearable,
    focusRing,
    onToggle,
    onClear,
  },
  ref,
) {
  return (
        <button
          ref={ref}
          type="button"
          id={id}
          data-slot="trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-label={label}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-xl px-3",
            "bg-[var(--fern-default,#ebebec)] text-[15px] text-[var(--fern-foreground,#18181b)]",
            "transition-[background-color,scale] duration-150",
            !disabled && "cursor-pointer hover:bg-[var(--fern-default-hover,#e0e0e2)]",
            !disabled && "active:scale-[0.97]",
            disabled && "cursor-not-allowed opacity-50",
            focusRing,
          )}
        >
          {selected ? (
            <>
              {showFlags && <Flag country={selected} flagSrc={flagSrc} eager />}
              <span className="min-w-0 flex-1 truncate text-left">
                {selected.name}
              </span>
              {showDialCode && <DialBadge dial={selected.dial} />}
            </>
          ) : (
            <span className="flex-1 text-left text-[var(--fern-muted,#71717a)]">
              {placeholder}
            </span>
          )}

          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(event) => {
                event.stopPropagation()
                onClear()
              }}
              className="grid size-5 shrink-0 place-items-center rounded-full text-[var(--fern-muted,#71717a)] hover:bg-[var(--fern-surface,#fff)]/60 hover:text-[var(--fern-foreground,#18181b)]"
            >
              <CloseIcon />
            </span>
          )}
          <ChevronIcon open={open} />
        </button>
  )
})


/** The search field, with its icon overlaid rather than in a wrapper box. */
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
            "absolute right-3.5 grid size-5 place-items-center rounded-full",
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
 * Sticky section letter. Its background fades out over the last 40% so a row
 * scrolling underneath dissolves rather than being cut in half by the edge.
 */
export function LetterHeader({ letter }: { letter: string }) {
  return (
    <div
      aria-hidden
      data-slot="letter"
      className="sticky top-0 z-10 -mb-2 px-3 pt-2 pb-5 text-[11px] font-medium tracking-wide text-[var(--fern-muted,#71717a)]"
      style={{
        // A long tail, not a hard edge. Too short and the row underneath reads
        // as stuck to the letter rather than passing behind it.
        background: `linear-gradient(to bottom, ${SURFACE} 0%, ${SURFACE} 45%, transparent 100%)`,
      }}
    >
      {letter}
    </div>
  )
}
