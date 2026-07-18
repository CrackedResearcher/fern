import { useEffect, useRef, useState } from "react"
import { cn, EASE } from "../lib/cn"

export type Preset =
  | "default"
  | "sky"
  | "lavender"
  | "mint"
  | "rose"
  | "amber"
  | "slate"

/** Swatch colours mirror the accent each preset sets in theme.css. */
export const PRESETS: { id: Preset; label: string; swatch: string }[] = [
  { id: "default", label: "Default", swatch: "oklch(0.6204 0.195 253.83)" },
  { id: "sky", label: "Sky", swatch: "oklch(0.72 0.132 220.5)" },
  { id: "lavender", label: "Lavender", swatch: "oklch(0.665 0.185 301.2)" },
  { id: "mint", label: "Mint", swatch: "oklch(0.755 0.132 165.4)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.63 0.219 15.8)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.755 0.158 62.5)" },
  { id: "slate", label: "Slate", swatch: "oklch(0.44 0.021 285.9)" },
]

export function ThemePicker({
  preset,
  onSetPreset,
  vibrant,
  onSetVibrant,
}: {
  preset: Preset
  onSetPreset: (preset: Preset) => void
  vibrant: boolean
  onSetVibrant: (vibrant: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const active = PRESETS.find((entry) => entry.id === preset) ?? PRESETS[0]!

  // Dismiss on outside click and Escape. Both are genuine document-level
  // subscriptions, not state we could derive.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-2 rounded-full border border-separator px-3",
          "text-[13px] text-foreground transition-colors duration-150",
          "hover:bg-surface-hover",
          "outline-hidden focus-visible:ring-2 focus-visible:ring-focus/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <span
          aria-hidden
          className="size-4 rounded-full"
          style={{
            background: active.swatch,
            boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.15)",
          }}
        />
        <span className="hidden sm:inline">{active.label}</span>
      </button>

      <div
        role="dialog"
        aria-label="Theme presets"
        className={cn(
          "absolute right-0 top-11 z-50 w-64 rounded-2xl border border-separator bg-overlay p-3",
          "transition-[opacity,transform] duration-200",
          // Scales from the trigger's corner rather than its centre, so the
          // panel reads as unfolding out of the button that opened it.
          "origin-top-right",
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
        style={{
          boxShadow: "var(--overlay-shadow)",
          transitionTimingFunction: EASE,
        }}
      >
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((entry) => {
            const selected = entry.id === preset
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSetPreset(entry.id)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-1.5",
                  "transition-colors duration-150 hover:bg-surface-hover",
                  "outline-hidden focus-visible:ring-2 focus-visible:ring-focus/60",
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <span
                  aria-hidden
                  className="size-8 rounded-full transition-transform duration-150"
                  style={{
                    background: entry.swatch,
                    outline: selected ? "2px solid var(--accent)" : undefined,
                    outlineOffset: 2,
                    boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
                  }}
                />
                <span className="text-[10px] text-muted">{entry.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-separator pt-3">
          <span className="flex flex-col">
            <span className="text-[12px] font-medium">Vibrant</span>
            <span className="text-[10px] text-muted">
              More saturated, less contrast
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={vibrant}
            aria-label="Vibrant palette"
            onClick={() => onSetVibrant(!vibrant)}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
              vibrant ? "bg-accent" : "bg-default",
              "outline-hidden focus-visible:ring-2 focus-visible:ring-focus/60",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <span
              aria-hidden
              className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[left] duration-200"
              style={{
                left: vibrant ? "1.125rem" : "0.125rem",
                transitionTimingFunction: EASE,
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
