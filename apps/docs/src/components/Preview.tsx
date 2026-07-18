import { useState, type ReactNode } from "react"
import { cn, EASE } from "../lib/cn"
import { MoonIcon, SunIcon } from "./icons"

const VIEWPORTS = {
  mobile: 360,
  tablet: 640,
  desktop: null,
} as const

type Viewport = keyof typeof VIEWPORTS

/** Their tab class carries size, radius, colour and focus; only the type
 *  scale is narrowed for this denser control. */
const segment = "tabs__tab w-auto px-2.5 text-[12px]"

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
    <div className="component-preview relative my-4 w-full">
      <div className="flex items-center justify-between gap-2 rounded-t-xl border-t border-r border-l border-separator px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOverride(!dark)}
          aria-label={dark ? "Preview in light theme" : "Preview in dark theme"}
          className="button button--ghost button--icon-only button--sm text-muted"
        >
          {dark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>

        {/* Their segmented control: a pill tray with the selected segment
            lifted on --segment, rather than a shadow-sm approximation. */}
        <div role="group" aria-label="Viewport" className="tabs__list-container">
          <div className="tabs__list" data-orientation="horizontal">
            {(Object.keys(VIEWPORTS) as Viewport[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                aria-pressed={viewport === key}
                data-selected={viewport === key || undefined}
                className={segment}
              >
                {viewport === key && <span className="tabs__indicator" />}
                {key[0]!.toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The dotted ground keeps translucent colours readable — a flat surface
          makes a 40%-opacity swatch ambiguous. */}
      <div
        className={cn(dark ? "dark" : "", "transition-colors duration-200")}
        style={{ transitionTimingFunction: EASE }}
      >
        {/* Transparent, not patterned. A dotted ground competes with whatever
            is being previewed; the page's own background is the honest
            backdrop for judging a component. */}
        <div className="grid min-h-[350px] place-items-center border-r border-l border-separator p-4 sm:p-10">
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
