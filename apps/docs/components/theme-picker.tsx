"use client"

import { Button, Popover, Separator, Switch } from "@heroui/react"
import { useEffect, useState } from "react"

export type Preset =
  | "default"
  | "sky"
  | "lavender"
  | "mint"
  | "rose"
  | "amber"
  | "slate"

/** Swatch colours mirror the accent each preset sets in global.css. */
const PRESETS: { id: Preset; label: string; swatch: string }[] = [
  { id: "default", label: "Default", swatch: "oklch(0.6204 0.195 253.83)" },
  { id: "sky", label: "Sky", swatch: "oklch(0.72 0.132 220.5)" },
  { id: "lavender", label: "Lavender", swatch: "oklch(0.665 0.185 301.2)" },
  { id: "mint", label: "Mint", swatch: "oklch(0.755 0.132 165.4)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.63 0.219 15.8)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.755 0.158 62.5)" },
  { id: "slate", label: "Slate", swatch: "oklch(0.44 0.021 285.9)" },
]

const PRESET_KEY = "fern-preset"
const VIBRANT_KEY = "fern-vibrant"

const PaletteIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden className="size-3.5 text-foreground">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M11.773 7.412c-.064.064-.27.249-1.017-.027-.75-.277-1.706-.928-2.695-1.918-.99-.99-1.64-1.945-1.918-2.695-.276-.747-.091-.953-.027-1.017s.27-.249 1.017.027q.14.052.29.121c.7.324 1.54.93 2.405 1.797.99.99 1.641 1.945 1.918 2.695.276.747.091.953.027 1.017M7 6.528c.85.85 1.738 1.535 2.581 1.972H1.694v-.027a1.3 1.3 0 0 1 .1-.507l2.802-4.33.172-.26C5.16 4.383 5.956 5.485 7 6.529m3.89-3.889c2.147 2.148 3.24 4.537 1.944 5.834a13 13 0 0 1-2.127 1.719L6.352 13.01s-1.945 1.296-4.537-1.296C-.778 9.12.518 7.176.518 7.176l2.818-4.355A13 13 0 0 1 5.056.694C6.351-.602 8.74.491 10.888 2.64M12.748 15c.966 0 1.75-.765 1.75-1.71 0-1.234-1.17-2.76-1.512-3.178a.3.3 0 0 0-.237-.111.31.31 0 0 0-.24.112c-.34.422-1.511 1.96-1.511 3.178 0 .944.784 1.71 1.75 1.71"
      clipRule="evenodd"
    />
  </svg>
)

/**
 * Theme preset picker.
 *
 * Structure mirrors theirs: a 4-column grid of round swatches with labels, a
 * separator, then a "Vibrant palette" row with a switch. Built from HeroUI's
 * Popover/Button/Switch/Separator rather than hand-rolled equivalents, so the
 * trigger height, popover elevation and switch geometry come from the same
 * implementation their header uses.
 *
 * Presets are applied to <html>, which is where next-themes also writes, so a
 * preset and the light/dark class compose instead of fighting.
 */
export function ThemePicker() {
  const [preset, setPreset] = useState<Preset>("default")
  const [vibrant, setVibrant] = useState(false)

  // Read the stored choice after mount. Reading during render would disagree
  // with the server pass and throw away the tree on hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem(PRESET_KEY) as Preset | null
    if (stored) setPreset(stored)
    setVibrant(window.localStorage.getItem(VIBRANT_KEY) === "true")
  }, [])

  // Writing to <html> is genuine outside-React synchronisation, not derived
  // state — the CSS variables live on the document, not in the component tree.
  useEffect(() => {
    const root = document.documentElement
    if (preset === "default") root.removeAttribute("data-preset")
    else root.setAttribute("data-preset", preset)
    root.toggleAttribute("data-vibrant", vibrant)
    window.localStorage.setItem(PRESET_KEY, preset)
    window.localStorage.setItem(VIBRANT_KEY, String(vibrant))
  }, [preset, vibrant])

  const active = PRESETS.find((entry) => entry.id === preset) ?? PRESETS[0]!

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          size="sm"
          variant="tertiary"
          className="text-xs text-muted"
          aria-label="Design theme"
        >
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full"
            style={{
              background: active.swatch,
              boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.15)",
            }}
          />
          <span className="hidden sm:inline">{active.label}</span>
        </Button>
      </Popover.Trigger>

      <Popover.Content className="w-[292px]">
        <Popover.Dialog className="flex flex-col gap-3 p-1" aria-label="Design theme">
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((entry) => {
              const selected = entry.id === preset
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setPreset(entry.id)}
                  aria-pressed={selected}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 outline-hidden transition-colors hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus/60"
                >
                  <span
                    aria-hidden
                    className="size-9 rounded-full"
                    style={{
                      background: entry.swatch,
                      outline: selected ? "2px solid var(--accent)" : undefined,
                      outlineOffset: 2,
                      boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
                    }}
                  />
                  <span className="text-[11px] text-muted">{entry.label}</span>
                </button>
              )
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3 px-1.5 pb-1">
            <span className="flex flex-col">
              <span className="text-sm font-medium">Vibrant palette</span>
              <span className="text-xs text-muted">
                More saturated, less contrast
              </span>
            </span>
            <Switch
              isSelected={vibrant}
              onChange={setVibrant}
              aria-label="Vibrant palette"
            />
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
