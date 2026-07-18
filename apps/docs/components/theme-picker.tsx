"use client"

import { Button, Popover } from "@heroui/react"
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

/**
 * A 4-column grid of swatches, on HeroUI's Popover so the trigger and elevation
 * match their header. Presets apply to <html>, where next-themes also writes,
 * so a preset and the light/dark class compose instead of fighting.
 */
export function ThemePicker() {
  const [preset, setPreset] = useState<Preset>("default")

  // Read the stored choice after mount. Reading during render would disagree
  // with the server pass and throw away the tree on hydration.
  useEffect(() => {
    const stored = window.localStorage.getItem(PRESET_KEY) as Preset | null
    if (stored) setPreset(stored)
  }, [])

  // Writing to <html> is genuine outside-React synchronisation, not derived
  // state — the CSS variables live on the document, not in the component tree.
  useEffect(() => {
    const root = document.documentElement
    if (preset === "default") root.removeAttribute("data-preset")
    else root.setAttribute("data-preset", preset)
    window.localStorage.setItem(PRESET_KEY, preset)
  }, [preset])

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

      {/* 256px, sized to the content: four 54px columns, the widest label
          plus a little air. */}
      <Popover.Content className="w-64">
        <Popover.Dialog className="p-2" aria-label="Design theme">
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {PRESETS.map((entry) => {
              const selected = entry.id === preset
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setPreset(entry.id)}
                  aria-pressed={selected}
                  className="flex flex-col items-center gap-2 rounded-xl p-1 outline-hidden transition-colors hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus/60"
                >
                  {/* Their swatches read as spheres, not flat discs — a light
                      source top-left and a darker base. A flat fill is the
                      giveaway that the row was rebuilt rather than matched. */}
                  <span
                    aria-hidden
                    className="size-9 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${entry.swatch} 72%, white) 0%, ${entry.swatch} 52%, color-mix(in oklab, ${entry.swatch} 82%, black) 100%)`,
                      outline: selected ? "2px solid var(--accent)" : undefined,
                      outlineOffset: 3,
                      boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08)",
                    }}
                  />
                  <span className="text-[11px] leading-none text-foreground">
                    {entry.label}
                  </span>
                </button>
              )
            })}
          </div>

        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
