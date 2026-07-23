"use client"

/** The column that grows out of the panel's edge. Driven by the cursor, so it
 *  is reachable with the keyboard — a hover-only submenu is not. */

import * as React from "react"
import { formatPrice, type Meters, type Model } from "./model"
import { LockIcon } from "./icons"

const FG = "var(--fern-foreground, #18181b)"
const MUTED = "var(--fern-muted, #71717a)"
const ACCENT = "var(--fern-focus, #0485f7)"

export const DETAIL_WIDTH = 296
/** A model with nine listed strengths has, in practice, none. The catalogue's
 *  own order decides which three matter. */
const MAX_BULLETS = 3
const SEGMENTS = 5

/**
 * Segments rather than a continuous bar: a bar at the bottom of the range reads
 * as a half-loaded progress bar, where segments still say "one out of five".
 *
 * Never transitioned — an eased fill is still growing toward the previous model
 * while the cursor is two rows on.
 */
function Meter({ label, value }: { label: string; value: number }) {
  const filled = Math.max(1, Math.round(value * SEGMENTS))
  return (
    <div className="flex items-center gap-2">
      <span className="w-[46px] shrink-0 text-[11px]" style={{ color: MUTED }}>
        {label}
      </span>
      <span className="flex flex-1 gap-[3px]">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className="h-[3px] flex-1 rounded-full"
            style={{
              background:
                i < filled
                  ? ACCENT
                  : `color-mix(in oklab, ${FG} 10%, transparent)`,
            }}
          />
        ))}
      </span>
    </div>
  )
}

function Bullets({ items, sign }: { items: string[]; sign: "+" | "–" }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item} className="flex gap-1.5 text-[12px] leading-[1.5]">
          <span
            aria-hidden
            className="shrink-0 tabular-nums"
            style={{
              color:
                sign === "+"
                  ? ACCENT
                  : `color-mix(in oklab, ${FG} 35%, transparent)`,
            }}
          >
            {sign}
          </span>
          <span style={{ color: MUTED }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-medium tracking-[0.07em] uppercase"
      style={{ color: `color-mix(in oklab, ${FG} 40%, transparent)` }}
    >
      {children}
    </p>
  )
}

export function DetailsCard({
  model,
  meters,
  /** How many models the meters are relative to. */
  population,
  logo,
}: {
  model: Model
  meters: Meters
  population: number
  logo: React.ReactNode
}) {
  const price = formatPrice(model.price)
  const hasMeters =
    meters.speed != null || meters.quality != null || meters.cost != null

  return (
    // Hidden from assistive tech: all of it is already announced through the
    // active row's label and description, and exposing it as well reads the
    // name twice on every arrow press. Spacing is looser than the list, which
    // is scanned rather than read.
    <div aria-hidden className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-3">
        {logo}
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="truncate text-[15px] font-semibold" style={{ color: FG }}>
            {model.name}
          </p>
          {model.provider && (
            <p className="truncate text-[12px]" style={{ color: MUTED }}>
              {model.provider}
            </p>
          )}
        </div>
        {/* In the header, not a footer — as a footer it sits below the fold on
            any model with three strengths. */}
        {price && (
          <span
            className="shrink-0 self-start text-[12px] tabular-nums"
            style={{ color: MUTED }}
          >
            {price}
          </span>
        )}
      </div>

      {model.disabled && (
        <p
          className="flex gap-1.5 rounded-lg px-2.5 py-2 text-[12px] leading-[1.45]"
          style={{
            color: FG,
            background: `color-mix(in oklab, ${FG} 6%, transparent)`,
          }}
        >
          <span className="mt-[3px] shrink-0" style={{ color: MUTED }}>
            <LockIcon size={11} />
          </span>
          {model.disabledReason ?? "Not available on your current plan."}
        </p>
      )}

      {model.description && (
        <p className="text-[13px] leading-[1.6]" style={{ color: MUTED }}>
          {model.description}
        </p>
      )}

      {hasMeters && (
        <div className="flex flex-col gap-2.5">
          {meters.quality != null && <Meter label="Quality" value={meters.quality} />}
          {meters.speed != null && <Meter label="Speed" value={meters.speed} />}
          {meters.cost != null && <Meter label="Value" value={meters.cost} />}
          {/* Said out loud: a filled scale with no stated population reads as
              an absolute score. */}
          <p className="text-[11px]" style={{ color: MUTED }}>
            Relative to the {population} models here
          </p>
        </div>
      )}

      {!!model.strengths?.length && (
        <div className="flex flex-col gap-2">
          <Label>Strengths</Label>
          <Bullets items={model.strengths.slice(0, MAX_BULLETS)} sign="+" />
        </div>
      )}

      {!!model.limitations?.length && (
        <div className="flex flex-col gap-2">
          <Label>Tradeoffs</Label>
          <Bullets items={model.limitations.slice(0, MAX_BULLETS)} sign="–" />
        </div>
      )}

    </div>
  )
}
