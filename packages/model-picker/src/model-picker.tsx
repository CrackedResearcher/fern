"use client"

/**
 * The picker's shell. Matching is in `./search`, faceting in `./filters`, the
 * record and its metrics in `./model`, the visible list in `./use-model-list`,
 * geometry in `./use-panel-geometry`, glyphs in `./icons`, leaves in `./parts`
 * and `./empty`, trigger and chrome in `./chrome`, the detail pane in
 * `./details`.
 */

import * as React from "react"
import { createPortal } from "react-dom"
import type { Model } from "./model"
import { handleKeys } from "./keyboard"
import { useOpenState, useScrollEdges } from "./use-open-state"
import { useAnchoredPosition } from "./use-anchored-position"
import { usePanelGeometry } from "./use-panel-geometry"
import { useModelList } from "./use-model-list"
import { Logo, Row, ScrollFade, SectionHeader } from "./parts"
import { EmptyState } from "./empty"
import { FacetChips, SearchField, Trigger, type TriggerVariant } from "./chrome"
import { DETAIL_WIDTH, DetailsCard } from "./details"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

const HAIRLINE =
  "color-mix(in oklab, var(--fern-foreground, #18181b) 9%, transparent)"

export interface ModelPickerProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "onSelect"> {
  /** The catalogue. Order is preserved — put the model you want chosen first. */
  models: Model[]
  /** Controlled selection, as a model id. */
  value?: string
  /** Initial selection when uncontrolled. */
  defaultValue?: string
  /** Fires with the id and the full model record. */
  onChange?: (id: string, model: Model) => void
  onOpenChange?: (open: boolean) => void
  /**
   * Ids pinned into a leading section, most recent first. Persisting them is
   * the host's decision, not the component's — a block that writes to
   * localStorage on its own is a surprise in someone else's app.
   */
  recent?: string[]
  recentLabel?: string
  /** Compact trigger for a config row, or the standalone control. */
  variant?: TriggerVariant
  /** Text shown on the trigger with nothing selected. */
  placeholder?: string
  searchPlaceholder?: string
  /** Defaults on once the catalogue is long enough to need it. */
  searchable?: boolean
  /** Capability chips derived from tags. Defaults on when there are tags. */
  filterable?: boolean
  /**
   * A second pane with the active model's description, meters and tradeoffs.
   *
   * Off by default: the list alone answers the question most of the time. Where
   * it is on it is open from the moment the panel is — no hover, no reveal
   * delay — and folds into the rows when the viewport cannot hold both.
   */
  showDetails?: boolean
  showLogos?: boolean
  /**
   * Price beside each name, and on the trigger. Off by default: a column of
   * prices reframes the list as a menu, which is a stronger claim than a
   * component should make on its own.
   */
  showPrice?: boolean
  disabled?: boolean
  /** Accessible name for the trigger and the panel. */
  label?: string
}

export const ModelPicker = React.forwardRef<HTMLDivElement, ModelPickerProps>(
  function ModelPicker(
    {
      models,
      value,
      defaultValue,
      onChange,
      onOpenChange,
      recent,
      recentLabel = "Recent",
      variant = "default",
      placeholder = "Select a model",
      searchPlaceholder = "Search models",
      searchable,
      filterable,
      showDetails = false,
      showLogos = true,
      showPrice = false,
      disabled = false,
      label = "Model",
      className,
      ...props
    },
    forwardedRef,
  ) {
    const [open, setOpen] = React.useState(false)
    const { rendered, shown, reducedMotion, panelRef: attachPanel } =
      useOpenState(open)
    const [query, setQuery] = React.useState("")
    const [activeFacets, setActiveFacets] = React.useState<string[]>([])
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [internal, setInternal] = React.useState(defaultValue)

    const selectedId = value ?? internal
    const listId = React.useId()
    const triggerId = React.useId()
    const popoverId = React.useId()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)
    const panelRef = React.useRef<HTMLDivElement>(null)

    const position = useAnchoredPosition(triggerRef, rendered, 420)
    const geometry = usePanelGeometry(
      position,
      DETAIL_WIDTH,
      showDetails,
      shown,
      reducedMotion,
    )
    const { edges, measure: measureEdges } = useScrollEdges(listRef, rendered && !!geometry)

    const selected = models.find((m) => m.id === selectedId)
    const { items, facets, live, meters } = useModelList(
      models,
      query,
      activeFacets,
      recent,
      recentLabel,
    )

    const showSearch = searchable ?? models.length > 7
    const showFacets = (filterable ?? facets.length >= 2) && facets.length > 0

    // Reset the cursor when the result set changes, or it can point past the end.
    const [lastKey, setLastKey] = React.useState("")
    const resultKey = `${query}|${activeFacets.join(",")}`
    if (resultKey !== lastKey) {
      setLastKey(resultKey)
      setActiveIndex(0)
    }

    const activeModel = items[activeIndex]?.model

    /**
     * One element per section, each carrying its own heading.
     *
     * `index` stays flat across sections — it is the keyboard cursor's position
     * in `items` and must not restart per group.
     */
    const groups = React.useMemo(() => {
      const out: { heading?: string; rows: { model: Model; index: number }[] }[] =
        []
      items.forEach((item, index) => {
        if (item.heading || out.length === 0) {
          out.push({ heading: item.heading, rows: [] })
        }
        out[out.length - 1]!.rows.push({ model: item.model, index })
      })
      return out
    }, [items])
    // The pane holds its width even with nothing to show. Letting the panel
    // narrow on an empty search and widen again on the next keystroke makes the
    // whole object twitch under a cursor that has not moved.
    const withDetail = !!geometry?.withDetail

    const commit = (model: Model) => {
      // Locked rows keep the cursor so the pane can explain them, but a click
      // must not quietly do nothing that looks like a selection.
      if (model.disabled) return
      if (value === undefined) setInternal(model.id)
      onChange?.(model.id, model)
      setOpen(false)
      onOpenChange?.(false)
      setQuery("")
    }

    const setOpenState = (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    }

    const close = () => {
      setOpenState(false)
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Focus on open, and start the cursor on the current selection rather than
    // row 0 — opening a list scrolled away from what is chosen makes someone
    // hunt for the thing they already picked.
    React.useEffect(() => {
      if (!open) return
      if (showSearch) inputRef.current?.focus()
      else listRef.current?.focus()
      const index = items.findIndex((item) => item.model.id === selectedId)
      setActiveIndex(index > -1 ? index : 0)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Keep the active row in view. `block: "nearest"` so it scrolls the minimum
    // rather than yanking the row to the centre on every arrow press.
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
        count: items.length,
        queryEmpty: query === "",
        setOpen: setOpenState,
        setActiveIndex,
        select: () => {
          const model = items[activeIndex]?.model
          if (model) commit(model)
        },
        popFacet: () => setActiveFacets((f) => f.slice(0, -1)),
        close,
      })

    const focusRing =
      "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--fern-focus,#0485f7)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fern-surface,#ffffff)]"

    // With no room for the second pane the descriptions fold into the rows —
    // narrower, but nothing is hidden behind the thing that explains it.
    const inlineDetails = showDetails && !!geometry && !geometry.withDetail

    return (
      <div
        ref={(node) => {
          rootRef.current = node
          if (typeof forwardedRef === "function") forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        data-slot="model-picker"
        className={cn(
          "relative",
          variant === "pill" ? "inline-flex" : "w-80",
          className,
        )}
        onKeyDown={onKeyDown}
        {...props}
      >
        <Trigger
          ref={triggerRef}
          id={triggerId}
          popoverId={popoverId}
          open={open}
          label={label}
          variant={variant}
          selected={selected}
          placeholder={placeholder}
          showLogos={showLogos}
          showPrice={showPrice}
          disabled={disabled}
          focusRing={focusRing}
          onToggle={() => setOpenState(!open)}
        />

        {rendered &&
          position &&
          geometry &&
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
              // One surface split by a hairline, not two slabs with a gutter:
              // a gutter has no radius for the panes to be concentric with.
              className="fixed z-50 flex overflow-hidden rounded-2xl bg-[var(--fern-surface,#ffffff)] p-1"
              style={{
                ...geometry.vertical,
                left: geometry.left,
                width: geometry.width,
                // Scales from the trigger it belongs to, not its own centre.
                transformOrigin:
                  position.placement === "bottom" ? "top center" : "bottom center",
                ...geometry.surface,
              }}
            >
              <div
                className="flex min-w-0 flex-col"
                style={{ width: geometry.listWidth }}
              >
                
                {showSearch && (
                  <div className="shrink-0">
                    <SearchField
                      ref={inputRef}
                      listId={listId}
                      activeId={
                        activeModel ? `${listId}-${activeModel.id}` : undefined
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
                  </div>
                )}

                
                {showFacets && (
                  <div className="shrink-0">
                    <FacetChips
                      facets={facets}
                      active={activeFacets}
                      live={live}
                      onToggle={(tag) =>
                        setActiveFacets((f) =>
                          f.includes(tag)
                            ? f.filter((t) => t !== tag)
                            : [...f, tag],
                        )
                      }
                    />
                  </div>
                )}

                {/* min-h-0 is what makes the list the part that scrolls. */}
                <div className="relative min-h-0 flex-1">
                  {edges.top && <ScrollFade side="top" />}
                  <div
                    ref={listRef}
                    id={listId}
                    data-slot="list"
                    role="listbox"
                    aria-label={label}
                    tabIndex={showSearch ? -1 : 0}
                    aria-activedescendant={
                      !showSearch && activeModel
                        ? `${listId}-${activeModel.id}`
                        : undefined
                    }
                    onScroll={measureEdges}
                    className={cn(
                      "h-full overflow-y-auto overscroll-contain outline-none",
                      "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    )}
                  >
                    {items.length === 0 ? (
                      <EmptyState
                        query={query}
                        facets={facets}
                        onReset={() => {
                          setQuery("")
                          setActiveFacets([])
                          inputRef.current?.focus()
                        }}
                      />
                    ) : (
                      groups.map((group, groupIndex) => (
                        <div
                          key={group.heading ?? `group-${groupIndex}`}
                          data-slot="section-group"
                        >
                          {group.heading && (
                            <SectionHeader label={group.heading} />
                          )}
                          {group.rows.map(({ model, index }) => (
                            <Row
                              key={model.id}
                              model={model}
                              index={index}
                              id={`${listId}-${model.id}`}
                              query={query}
                              active={index === activeIndex}
                              selected={model.id === selectedId}
                              showLogo={showLogos}
                              showPrice={showPrice}
                              inlineDetails={!!inlineDetails}
                              onSelect={commit}
                              onHover={setActiveIndex}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                  {edges.bottom && <ScrollFade side="bottom" />}
                </div>
              </div>

              {withDetail && (
                <div
                  data-slot="details"
                  className={cn(
                    "min-h-0 shrink-0 overflow-y-auto",
                    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                  style={{
                    width: DETAIL_WIDTH,
                    borderLeft: `1px solid ${HAIRLINE}`,
                  }}
                >
                  {activeModel && (
                    <DetailsCard
                      model={activeModel}
                      meters={meters(activeModel)}
                      population={models.length}
                      logo={<Logo model={activeModel} size={30} eager />}
                    />
                  )}
                </div>
              )}
            </div>,
            document.body,
          )}
      </div>
    )
  },
)
