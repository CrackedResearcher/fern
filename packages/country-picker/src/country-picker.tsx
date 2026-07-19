"use client"

/**
 * The picker's UI. Matching is in `./search`, data in `./countries`, glyphs in
 * `./icons`, leaves in `./parts`, open/close in `./use-open-state`.
 */

import * as React from "react"
import { createPortal } from "react-dom"
import { COUNTRIES, type Country } from "./countries"
import { rank } from "./search"
import { handleKeys } from "./keyboard"
import {
  EASE_OUT,
  ENTER_MS,
  EXIT_MS,
  useOpenState,
  useScrollEdges,
} from "./use-open-state"
import { useAnchoredPosition } from "./use-anchored-position"
import { ChevronIcon, CloseIcon, SearchIcon } from "./icons"
import {
  DialBadge,
  EmptyState,
  Flag,
  LetterHeader,
  Row,
  ScrollFade,
  SearchField,
  Trigger,
} from "./parts"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

export interface CountryPickerProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "onSelect"> {
  /** Controlled selection, as an ISO 3166-1 alpha-2 code. */
  value?: string
  /** Initial selection when uncontrolled. */
  defaultValue?: string
  /** Fires with the code and the full country record. */
  onChange?: (code: string, country: Country) => void
  /** Replace the country list — for a subset, or a different locale's names. */
  countries?: Country[]
  /**
   * Codes pinned above the list. For phone inputs, where a handful of countries
   * cover most traffic and alphabetical order buries them.
   */
  priority?: string[]
  /** Show the dial code on each row and allow searching by it. */
  showDialCode?: boolean
  /** Show flags. Off gives a plain text list, and skips 195 image requests. */
  showFlags?: boolean
  /** Resolves a flag URL from a lowercase country code. */
  flagSrc?: (code: string) => string
  /** Text shown on the trigger with nothing selected. */
  placeholder?: string
  /** Placeholder inside the search field. */
  searchPlaceholder?: string
  disabled?: boolean
  /** Accessible name for the trigger. */
  label?: string
  /** Let the user clear the selection once one is made. */
  clearable?: boolean
  /** Illustration for the empty state. Defaults to an inline globe. */
  emptyIcon?: React.ReactNode
}

/**
 * A CDN by default, so `bun add` works with no setup — images that 404 until
 * you copy an asset directory is broken out of the box. The same files ship in
 * the package; copy them into your public dir and override `flagSrc` to
 * self-host.
 */
const DEFAULT_FLAG_SRC = (code: string) =>
  `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@gh-pages/flags/${code.toLowerCase()}.svg`

export const CountryPicker = React.forwardRef<
  HTMLDivElement,
  CountryPickerProps
>(function CountryPicker(
  {
    value,
    defaultValue,
    onChange,
    countries = COUNTRIES,
    priority,
    showDialCode = true,
    showFlags = true,
    flagSrc = DEFAULT_FLAG_SRC,
    placeholder = "Select a country",
    searchPlaceholder = "Search countries",
    disabled = false,
    label = "Country",
    clearable = true,
    emptyIcon,
    className,
    ...props
  },
  forwardedRef,
) {
  const [open, setOpen] = React.useState(false)
  const { rendered, shown, reducedMotion, panelRef: attachPanel } =
    useOpenState(open)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [internal, setInternal] = React.useState(defaultValue)

  const selectedCode = value ?? internal
  const listId = React.useId()
  const triggerId = React.useId()
  const popoverId = React.useId()

  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  const position = useAnchoredPosition(triggerRef, rendered, 380)
  const { edges, measure: measureEdges } = useScrollEdges(listRef)

  const byCode = React.useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries) map.set(country.code, country)
    return map
  }, [countries])

  const selected = selectedCode ? byCode.get(selectedCode) : undefined

  // Sorted once per list, filtered per keystroke.
  const sorted = React.useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries],
  )

  const results = React.useMemo(
    () => rank(sorted, query, priority, byCode),
    [sorted, query, priority, byCode],
  )

  // Reset the cursor when the result set changes, or it can point past the end.
  const [lastQuery, setLastQuery] = React.useState(query)
  if (query !== lastQuery) {
    setLastQuery(query)
    setActiveIndex(0)
  }

  const commit = (country: Country) => {
    if (value === undefined) setInternal(country.code)
    onChange?.(country.code, country)
    setOpen(false)
    setQuery("")
  }

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  // Close on an outside pointer. The panel is portalled, so it is not inside
  // rootRef and has to be checked separately.
  React.useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      close()
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  // Focus the search field on open, and start the cursor on the current
  // selection rather than row 0.
  React.useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const index = results.findIndex((c) => c.code === selectedCode)
    setActiveIndex(index > -1 ? index : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // position.maxHeight is a dep because the list has no bound until the anchor
  // resolves; measuring before that, the bottom fade never appears.
  React.useEffect(() => {
    if (rendered) measureEdges()
  }, [rendered, results.length, position?.maxHeight, measureEdges])

  // Keep the active row in view. `block: "nearest"` so it scrolls the minimum
  // rather than yanking the row to the centre on every arrow press.
  // position.maxHeight is a dep for the same reason as the fades: until the
  // anchor resolves the list has no bound, so "nearest" is already satisfied
  // and the selected row never gets scrolled to.
  React.useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open, position?.maxHeight])

  const onKeyDown = (event: React.KeyboardEvent) =>
    handleKeys(event, {
      open,
      disabled,
      count: results.length,
      setOpen,
      setActiveIndex,
      select: () => {
        const country = results[activeIndex]
        if (country) commit(country)
      },
      close,
    })

  const focusRing =
    "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--fern-focus,#0485f7)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fern-surface,#ffffff)]"

  // Section letters are computed once per result set rather than per row, so a
  // row only has to compare against the letter before it.
  const showLetters = !query.trim() && !priority?.length

  return (
    <div
      ref={(node) => {
        rootRef.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      data-slot="country-picker"
      className={cn("relative w-72", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      <Trigger
        ref={triggerRef}
        id={triggerId}
        popoverId={popoverId}
        open={open}
        label={label}
        selected={selected}
        placeholder={placeholder}
        showDialCode={showDialCode}
        showFlags={showFlags}
        flagSrc={flagSrc}
        disabled={disabled}
        clearable={clearable}
        focusRing={focusRing}
        onToggle={() => setOpen((o) => !o)}
        onClear={() => {
          if (value === undefined) setInternal(undefined)
          onChange?.("", undefined as unknown as Country)
        }}
      />

      {rendered &&
        position &&
        createPortal(
        <div
          ref={(node) => {
            panelRef.current = node
            attachPanel(node)
          }}
          id={popoverId}
          data-slot="popover"
          data-placement={position.placement}
          role="dialog"
          aria-label={label}
          className="fixed z-50 overflow-hidden rounded-2xl bg-[var(--fern-surface,#ffffff)] p-1"
          style={{
            top: position.placement === "bottom" ? position.top : undefined,
            bottom:
              position.placement === "top"
                ? window.innerHeight - position.top
                : undefined,
            left: position.left,
            width: position.width,
            boxShadow:
              "var(--fern-overlay-shadow, 0 14px 28px 0 rgb(0 0 0 / 0.08), 0 2px 8px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.06))",
            // Scales from the trigger it belongs to, not from its own centre.
            transformOrigin:
              position.placement === "bottom" ? "top center" : "bottom center",
            opacity: shown ? 1 : 0,
            // Never from scale(0) — nothing in the real world appears out of
            // nothing. 0.96 with a 4px rise reads as the panel arriving.
            transform: reducedMotion
              ? undefined
              : shown
                ? "scale(1) translateY(0)"
                : `scale(0.97) translateY(${position.placement === "bottom" ? -6 : 6}px)`,
            transitionProperty: reducedMotion ? "opacity" : "opacity, transform",
            transitionDuration: `${shown ? ENTER_MS : EXIT_MS}ms`,
            transitionTimingFunction: EASE_OUT,
          }}
        >
          <SearchField
            ref={inputRef}
            listId={listId}
            activeId={
              results[activeIndex]
                ? `${listId}-${results[activeIndex].code}`
                : undefined
            }
            placeholder={searchPlaceholder}
            value={query}
            onChange={setQuery}
            onClear={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            focusRing={focusRing}
          />

          <div className="relative">
            {!showLetters && edges.top && <ScrollFade side="top" />}
          <div
            ref={listRef}
            id={listId}
            data-slot="list"
            role="listbox"
            aria-label={label}
            onScroll={measureEdges}
            // No cap with no results: there is nothing to scroll, and the cap
            // clipped the empty state's illustration instead.
            style={{
              maxHeight: results.length ? position.maxHeight - 64 : undefined,
            }}
            className={cn(
              "overflow-y-auto overscroll-contain",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {results.length === 0 ? (
              <EmptyState
                query={query}
                icon={emptyIcon}
                onClear={() => setQuery("")}
              />
            ) : (
              results.map((country, index) => {
                const letter = country.name[0]?.toUpperCase()
                const newLetter =
                  showLetters &&
                  letter !== results[index - 1]?.name[0]?.toUpperCase()
                return (
                  <React.Fragment key={country.code}>
                    {newLetter && letter && <LetterHeader letter={letter} />}
                    <Row
                      country={country}
                      index={index}
                      id={`${listId}-${country.code}`}
                      active={index === activeIndex}
                      selected={country.code === selectedCode}
                      showDialCode={showDialCode}
                      showFlags={showFlags}
                      flagSrc={flagSrc}
                      onSelect={commit}
                      onHover={setActiveIndex}
                    />
                  </React.Fragment>
                )
              })
            )}
          </div>
            {edges.bottom && <ScrollFade side="bottom" />}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
})

/**
 * `content-visibility` lets the browser skip layout and paint for rows outside
 * the scrollport, which is what keeps 195 rows cheap without a virtualiser and
 * its scroll-restoration problems. `contain-intrinsic-size` supplies the height
 * it would have had, so the scrollbar does not jump as rows render.
 */
