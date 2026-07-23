import type * as React from "react"

export interface KeyContext {
  open: boolean
  disabled: boolean
  count: number
  /** Empty query, used to decide whether Backspace belongs to the text. */
  queryEmpty: boolean
  setOpen: (open: boolean) => void
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  select: () => void
  /** Removes the last active facet chip. */
  popFacet: () => void
  close: () => void
}

/**
 * Arrows move one, Page keys ten, Home and End jump. Enter selects, Escape
 * closes, Tab closes and moves on.
 *
 * Backspace on an empty query removes the last facet chip, as every token input
 * does. Guarded on the query being empty — deleting a filter mid-word is a
 * worse failure than not offering the shortcut.
 */
export function handleKeys(
  event: React.KeyboardEvent,
  {
    open,
    disabled,
    count,
    queryEmpty,
    setOpen,
    setActiveIndex,
    select,
    popFacet,
    close,
  }: KeyContext,
) {
  if (disabled) return

  if (!open) {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
    }
    return
  }

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, count - 1))
      break
    case "ArrowUp":
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      break
    case "Home":
      event.preventDefault()
      setActiveIndex(0)
      break
    case "End":
      event.preventDefault()
      setActiveIndex(count - 1)
      break
    case "PageDown":
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 10, count - 1))
      break
    case "PageUp":
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 10, 0))
      break
    case "Enter":
      event.preventDefault()
      select()
      break
    case "Backspace":
      if (queryEmpty) popFacet()
      break
    case "Escape":
      event.preventDefault()
      close()
      break
    case "Tab":
      close()
      break
  }
}
