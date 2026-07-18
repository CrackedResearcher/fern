"use client"

/** The picker's presentational pieces. Kept out of the shell so the component
 *  file reads as composition rather than as a wall of markup. */

import * as React from "react"
import { cn } from "./utils"
import { EASE_OUT, RECESSED, RAISED, THUMB_RADIUS, type ChannelSpec } from "./constants"
import { DURATION, EASING } from "./motion"
import type { useTrackDrag } from "./hooks"

interface LabelledSliderProps {
  drag: ReturnType<typeof useTrackDrag>
  onKeyDown: (event: React.KeyboardEvent) => void
  disabled: boolean
  label: string
  readout: string
  valueNow: number
  valueMax: number
  valueText: string
  background: string
  overlay?: string
  /** Value as 0-1. The thumb's own radius is inset from each end. */
  fraction: number
  thumb: { background: string }
  reducedMotion: boolean
}

/**
 * A labelled slider: name on the left, live value on the right, track below.
 *
 * The readout matters more than it looks. Without it the only way to know the
 * hue is to read it back out of the hex field, which is a translation task;
 * showing the number turns the slider into something you can aim with.
 */
export function LabelledSlider({
  drag,
  onKeyDown,
  disabled,
  label,
  readout,
  valueNow,
  valueMax,
  valueText,
  background,
  overlay,
  fraction,
  thumb,
  reducedMotion,
}: LabelledSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[12px] text-[var(--muted,#71717a)]">
          {label}
        </span>
        {/* Tabular figures so the readout doesn't jitter while dragging. */}
        <span className="font-mono text-[12px] tabular-nums text-[var(--muted,#71717a)]">
          {readout}
        </span>
      </div>

      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={valueMax}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        aria-orientation="horizontal"
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyDown}
        {...drag.handlers}
        className={cn(
          // 20px visible track inside a 32px hit area — the bar stays slim
          // while the pointer target clears a comfortable touch size.
          "relative flex h-8 touch-none items-center rounded-xl",
          !disabled && "cursor-pointer",
          "outline-hidden focus-visible:ring-[3px] focus-visible:ring-[var(--focus,#0485f7)]/50",
        )}
      >
        <div
          ref={drag.trackRef}
          className="relative h-5 w-full rounded-full"
          style={{ background, boxShadow: RECESSED }}
        >
          {overlay && (
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: overlay, boxShadow: RECESSED }}
            />
          )}
          {/* A circle larger than its rail, so it reads as sitting on top of
              the track rather than embedded in it. */}
          <Thumb
            width={20}
            height={20}
            dragging={drag.dragging}
            reducedMotion={reducedMotion}
            style={{
              // Travels between the two insets rather than 0-100%, so at either
              // end the thumb sits flush inside the rail instead of half over
              // it. `useTrackDrag` is given the same inset, so the thumb stays
              // under the cursor.
              left: `calc(${fraction} * (100% - ${THUMB_RADIUS * 2}px) + ${THUMB_RADIUS}px)`,
              top: "50%",
              background: thumb.background,
              boxShadow: RAISED,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * One editable channel: the letter sits on the tray, the number sits in a
 * raised chip. Keeping the letter outside the chip is what lets four fields fit
 * across 232px — inside, each chip would need its own left padding for a label
 * that is one character wide.
 *
 * `role="spinbutton"` rather than a bare text input: it is what carries the
 * range to a screen reader, and it is the role that makes arrow keys expected
 * rather than surprising.
 */
export function ChannelField({
  spec,
  draft,
  disabled,
  focusRing,
  onDraft,
  onPreview,
  onCommit,
  onStep,
  onCancel,
}: {
  spec: ChannelSpec
  draft: string | null
  disabled: boolean
  focusRing: string
  onDraft: (text: string) => void
  onPreview: (text: string) => void
  onCommit: (text: string) => void
  onStep: (delta: number) => void
  onCancel: () => void
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-0.5">
      <span
        aria-hidden
        className="shrink-0 pl-0.5 text-[11px] text-[var(--muted,#71717a)]"
      >
        {spec.short}
      </span>
      <input
        role="spinbutton"
        // Named in channel units — "Red, 77", never "77 percent". A screen
        // reader user editing four fields needs to know which one they are in.
        aria-label={spec.name}
        aria-valuenow={spec.value}
        aria-valuemin={spec.min}
        aria-valuemax={spec.max}
        aria-valuetext={`${spec.name}, ${spec.value}`}
        inputMode="numeric"
        value={draft ?? String(spec.value)}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        // Capped at the width of the channel's own maximum, so 255 fits and
        // 2555 cannot be typed in the first place. Filtering to digits here
        // rather than validating later means the field never holds text the
        // channel could not accept.
        maxLength={String(spec.max).length}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/[^0-9]/g, "")
            .slice(0, String(spec.max).length)
          onDraft(digits)
          onPreview(digits)
        }}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={(event) => onCommit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            onCommit(event.currentTarget.value)
            return
          }
          if (event.key === "Escape") {
            onCancel()
            return
          }
          // Shift multiplies by 10, matching the sliders and native ranges.
          const step = event.shiftKey ? 10 : 1
          if (event.key === "ArrowUp") {
            event.preventDefault()
            onStep(step)
          } else if (event.key === "ArrowDown") {
            event.preventDefault()
            onStep(-step)
          }
        }}
        className={cn(
          "h-9 w-full min-w-0 rounded-lg bg-[var(--surface,#ffffff)] px-1 text-center",
          "text-[12px] tabular-nums",
          "text-[var(--foreground,#18181b)] outline-hidden",
          focusRing,
        )}
      />
    </div>
  )
}

/** 40×40 circular action button. Clears the WCAG 2.5.5 target minimum. */
export function RoundButton({
  onClick,
  disabled,
  label,
  focusRing,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  focusRing: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        "bg-[var(--default,#ebebec)] text-[var(--muted,#52525b)]",
        "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
        "hover:bg-[var(--default-hover,#e0e0e2)] hover:text-[var(--foreground,#18181b)]",
        focusRing,
      )}
      style={{ transitionTimingFunction: EASE_OUT }}
    >
      {children}
    </button>
  )
}



export function Thumb({
  style,
  dragging,
  width,
  height,
  reducedMotion,
}: {
  style: React.CSSProperties
  dragging: boolean
  width: number
  height: number
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        ...style,
        width,
        height,
        // Position is deliberately never transitioned. Easing it leaves the
        // thumb trailing the cursor and the whole control reads as laggy.
        // Shrinks under the pointer rather than growing. Pressing a physical
        // control moves it away from you, so scaling down is what reads as
        // "held"; scaling up reads as a hover affordance instead.
        transform: `translate(-50%, -50%) scale(${dragging && !reducedMotion ? 0.92 : 1})`,
        transitionProperty: reducedMotion ? "none" : "transform",
        transitionDuration: `${DURATION.press}ms`,
        transitionTimingFunction: EASING.out,
      }}
    />
  )
}

/** Cross-fades two icons in place. Never scales from 0 — nothing in the real
 *  world appears out of nothing, and a blur bridges the overlap. */
export function IconSwap({
  showSecond,
  reducedMotion,
  children,
}: {
  showSecond: boolean
  reducedMotion: boolean
  children: [React.ReactNode, React.ReactNode]
}) {
  const [first, second] = children
  const base = "absolute inset-0 grid place-items-center"
  // Asymmetric by design: the arriving icon takes the enter duration, the
  // leaving one exits in half that. A slow exit reads as reluctance.
  const timing = (entering: boolean) =>
    reducedMotion
      ? {
          transitionProperty: "opacity",
          transitionDuration: `${DURATION.exit}ms`,
        }
      : {
          transitionProperty: "opacity, transform, filter",
          transitionDuration: `${entering ? DURATION.enter : DURATION.exit}ms`,
          transitionTimingFunction: EASING.out,
        }

  return (
    <span className="relative grid size-4 place-items-center">
      <span
        className={base}
        style={{
          ...timing(!showSecond),
          opacity: showSecond ? 0 : 1,
          transform: reducedMotion
            ? undefined
            : `scale(${showSecond ? 0.6 : 1})`,
          filter: reducedMotion ? undefined : `blur(${showSecond ? 4 : 0}px)`,
        }}
      >
        {first}
      </span>
      <span
        className={base}
        style={{
          ...timing(showSecond),
          opacity: showSecond ? 1 : 0,
          transform: reducedMotion
            ? undefined
            : `scale(${showSecond ? 1 : 0.6})`,
          filter: reducedMotion ? undefined : `blur(${showSecond ? 0 : 4}px)`,
        }}
      >
        {second}
      </span>
    </span>
  )
}
