import { useState, type ReactNode } from "react"
import { cn, EASE } from "../lib/cn"
import { MoonIcon, SunIcon } from "./icons"

const VIEWPORTS = {
  mobile: 360,
  tablet: 640,
  desktop: null,
} as const

type Viewport = keyof typeof VIEWPORTS

const segment = cn(
  "rounded-lg px-2.5 py-1 text-[12px] transition-colors duration-150",
  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
)

/**
 * Live preview surface with its own controls.
 *
 * The theme toggle here is scoped to the preview rather than the page: the
 * point is to check a component in both themes without losing your place in
 * the docs, so flipping the whole site would defeat it.
 */
export function Preview({
  children,
  pageDark,
}: {
  children: ReactNode
  pageDark: boolean
}) {
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [override, setOverride] = useState<boolean | null>(null)
  const dark = override ?? pageDark
  const width = VIEWPORTS[viewport]

  return (
    <div className="overflow-hidden rounded-2xl border border-divider">
      <div className="flex items-center justify-between gap-2 border-b border-divider bg-surface-2/40 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOverride(!dark)}
          aria-label={dark ? "Preview in light theme" : "Preview in dark theme"}
          className={cn(
            "grid size-8 place-items-center rounded-lg text-fg-muted",
            "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
            "hover:bg-surface-2 hover:text-fg",
            "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
          )}
          style={{ transitionTimingFunction: EASE }}
        >
          {dark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>

        <div className="flex items-center gap-0.5 rounded-xl bg-surface-2/60 p-0.5">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewport(key)}
              aria-pressed={viewport === key}
              className={cn(
                segment,
                viewport === key
                  ? "bg-bg font-medium text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              {key[0]!.toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* The dotted ground keeps translucent colours readable — a flat surface
          makes a 40%-opacity swatch ambiguous. */}
      <div
        className={cn(dark ? "dark" : "", "transition-colors duration-200")}
        style={{ transitionTimingFunction: EASE }}
      >
        <div
          className="grid min-h-[440px] place-items-center bg-bg p-8"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 0.5px, transparent 0.5px)",
            backgroundSize: "16px 16px",
            color: "rgba(128,128,128,0.22)",
          }}
        >
          <div
            className="mx-auto w-full transition-[max-width] duration-300"
            style={{
              maxWidth: width ? `${width}px` : "100%",
              transitionTimingFunction: EASE,
            }}
          >
            <div className="flex justify-center">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
