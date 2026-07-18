"use client"

/**
 * Not a docs page — a measuring harness, kept out of `content/` so it never
 * appears in the sidebar.
 *
 * It renders HeroUI's Button and fern's side by side for every variant, size
 * and icon-only combination, then diffs `getComputedStyle` between the pair.
 * Diffing the rendered DOM rather than the class lists is the point: HeroUI
 * overrides its own utilities with unlayered rules, so the classes lie.
 */

import { Button as Hero } from "@heroui/react"
import { Button as Fern } from "@fern-ui/button"
import { useEffect, useRef, useState } from "react"

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
  "outline",
  "danger",
  "danger-soft",
] as const

const SIZES = ["sm", "md", "lg"] as const

/**
 * Every computed property is compared, not a chosen list — a fixed list only
 * finds the differences you already suspected. These few are excluded because
 * they differ by design: fern drives its variants through its own custom
 * properties and writes the transition longhand rather than HeroUI's shorthand.
 */
const IGNORE = /^(transition|animation|will-change|--|webkit|transform$)/

interface Row {
  label: string
  prop: string
  hero: string
  fern: string
}

export default function ButtonProbe() {
  const root = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    // Two frames: one for React's commit, one for the stylesheet to have been
    // applied to it. Measuring in the first leaves every value at its initial.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const found: Row[] = []
        root.current?.querySelectorAll<HTMLElement>("[data-pair]").forEach((pair) => {
          const hero = pair.querySelector<HTMLElement>("[data-side=hero] button")
          const fern = pair.querySelector<HTMLElement>("[data-side=fern] button")
          if (!hero || !fern) return
          const a = getComputedStyle(hero)
          const b = getComputedStyle(fern)
          for (let i = 0; i < a.length; i++) {
            const prop = a.item(i)
            if (!prop || IGNORE.test(prop)) continue
            const av = a.getPropertyValue(prop)
            const bv = b.getPropertyValue(prop)
            if (av !== bv) {
              found.push({
                label: pair.dataset.pair ?? "",
                prop,
                hero: av,
                fern: bv,
              })
            }
          }
        })
        setRows(found)
      }),
    )
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div ref={root} className="p-8 font-mono text-xs">
      <div
        data-probe-summary
        className="mb-6 rounded-lg border border-separator p-4 text-sm"
      >
        {rows === null
          ? "measuring…"
          : rows.length === 0
            ? `PASS — ${VARIANTS.length * SIZES.length * 2} pairs, 0 computed-style differences`
            : `FAIL — ${rows.length} differences`}
      </div>

      {rows && rows.length > 0 && (
        <table className="mb-8 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-separator">
              <th className="py-1 pr-4">pair</th>
              <th className="py-1 pr-4">property</th>
              <th className="py-1 pr-4">heroui</th>
              <th className="py-1">fern</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-separator/50">
                <td className="py-1 pr-4">{row.label}</td>
                <td className="py-1 pr-4">{row.prop}</td>
                <td className="py-1 pr-4 text-danger">{row.hero}</td>
                <td className="py-1">{row.fern}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex flex-col gap-3">
        {VARIANTS.map((variant) =>
          SIZES.map((size) =>
            [false, true].map((iconOnly) => {
              const label = `${variant}/${size}${iconOnly ? "/icon" : ""}`
              return (
                <div
                  key={label}
                  data-pair={label}
                  className="flex items-center gap-4"
                >
                  <span className="w-40 shrink-0 text-muted">{label}</span>
                  <span data-side="hero">
                    <Hero variant={variant} size={size} isIconOnly={iconOnly}>
                      {iconOnly ? <Glyph /> : "Button"}
                    </Hero>
                  </span>
                  <span data-side="fern">
                    <Fern variant={variant} size={size} isIconOnly={iconOnly}>
                      {iconOnly ? <Glyph /> : "Button"}
                    </Fern>
                  </span>
                </div>
              )
            }),
          ),
        )}
      </div>
    </div>
  )
}

const Glyph = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <circle cx="8" cy="8" r="6" />
  </svg>
)
