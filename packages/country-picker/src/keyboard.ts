import type * as React from "react"

export interface KeyContext {
  open: boolean
  disabled: boolean
  count: number
  setOpen: (open: boolean) => void
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  select: () => void
  close: () => void
}

/** Arrows move one, Page keys ten, Home and End jump. Enter selects, Escape
 *  closes, Tab closes and moves on. */
export function handleKeys(
  event: React.KeyboardEvent,
  { open, disabled, count, setOpen, setActiveIndex, select, close }: KeyContext,
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
      case "Escape":
        event.preventDefault()
        close()
        break
      case "Tab":
        close()
        break
    }
}
