"use client"

import * as React from "react"
import {
  clamp,
  formatColor,
  luminance,
  parseHex,
  rgbToHsv,
  toColor,
  type Color,
  type ColorFormat,
  type HSV,
} from "./color"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

/** Alpha checkerboard, inlined so the component ships without an asset. */
const CHECKERBOARD =
  "repeating-conic-gradient(rgba(0,0,0,0.13) 0% 25%, transparent 0% 50%) 50% / 8px 8px"

const HUE_GRADIENT =
  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"

const EASE = "cubic-bezier(0.2, 0, 0, 1)"

/**
 * Depth comes from one consistent rule: tracks and wells are *recessed* with an
 * inset shadow, thumbs and the card are *raised* with a cast shadow plus a
 * highlight along their top edge. Reversing that on any one element is what
 * makes a 3D UI read as flat or muddled.
 */
const RECESSED =
  "inset 0 1px 2px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.09)"
const RAISED =
  "0 0 0 2.5px #fff, 0 1px 3px rgba(0,0,0,0.32), 0 3px 8px -2px rgba(0,0,0,0.28)"

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

export interface ColorPickerProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "onChange" | "defaultValue" | "color"
  > {
  /** Controlled value. Accepts `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa`. */
  value?: string
  /** Initial value when uncontrolled. Defaults to `#3b82f6`. */
  defaultValue?: string
  /**
   * Fires on every change, including each frame of a drag. The second argument
   * carries every representation so you never have to convert by hand.
   */
  onChange?: (value: string, color: Color) => void
  /**
   * Fires once when an interaction settles — pointer release, key press, or a
   * committed text entry. Use this for network writes and undo history.
   */
  onChangeComplete?: (value: string, color: Color) => void
  /** Output format for the string passed to callbacks. Defaults to `"hex"`. */
  format?: ColorFormat
  /** Show the opacity slider and include alpha in the output. */
  alpha?: boolean
  /** Preset colors rendered as a row of swatches. */
  swatches?: string[]
  /** Offer the native screen eyedropper where the browser supports it. */
  eyedropper?: boolean
  /** Show a copy-to-clipboard button beside the value. */
  copyable?: boolean
  /** Block all interaction and dim the control. */
  disabled?: boolean
  /** Accessible name for the whole picker. Defaults to `"Color picker"`. */
  label?: string
}

interface State {
  hsv: HSV
  alpha: number
}

/* -------------------------------------------------------------------------- */
/*                                   Hooks                                    */
/* -------------------------------------------------------------------------- */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

/** Honours the OS "reduce motion" setting. Returns false during SSR. */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

/**
 * Pointer-capture drag. `trackRef` marks the element whose geometry defines
 * 0-1, while the handlers can be attached to a larger padded parent — that
 * split is what lets a 10px-tall slider carry a 44px touch target.
 */
function useTrackDrag(
  onPosition: (x: number, y: number) => void,
  onEnd: () => void,
  disabled: boolean,
) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const emit = (event: React.PointerEvent) => {
    const element = trackRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    onPosition(
      rect.width ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0,
      rect.height ? clamp((event.clientY - rect.top) / rect.height, 0, 1) : 0,
    )
  }

  return {
    trackRef,
    dragging,
    handlers: disabled
      ? {}
      : {
          onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return
            event.preventDefault() // suppress text selection mid-drag
            event.currentTarget.setPointerCapture(event.pointerId)
            setDragging(true)
            emit(event)
          },
          onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
            if (dragging) emit(event)
          },
          onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragging) return
            event.currentTarget.releasePointerCapture(event.pointerId)
            setDragging(false)
            onEnd()
          },
        },
  }
}

/* -------------------------------------------------------------------------- */
/*                                   State                                    */
/* -------------------------------------------------------------------------- */

function stateFromString(input: string, previous?: HSV): State {
  const parsed = parseHex(input)
  if (!parsed) return { hsv: previous ?? { h: 0, s: 0, v: 0 }, alpha: 1 }

  const hsv = rgbToHsv(parsed.rgb)
  // Hue is undefined for greys and saturation is undefined for black. Carrying
  // the previous values forward stops the hue slider snapping back to red when
  // a drag reaches the black or white edge of the field.
  return {
    hsv: {
      h: hsv.s === 0 || hsv.v === 0 ? (previous?.h ?? hsv.h) : hsv.h,
      s: hsv.v === 0 ? (previous?.s ?? hsv.s) : hsv.s,
      v: hsv.v,
    },
    alpha: parsed.a,
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(
    {
      value,
      defaultValue = "#3b82f6",
      onChange,
      onChangeComplete,
      format = "hex",
      alpha = false,
      swatches,
      eyedropper = false,
      copyable = false,
      disabled = false,
      label = "Color picker",
      className,
      ...props
    },
    forwardedRef,
  ) {
    const [state, setState] = React.useState<State>(() =>
      stateFromString(value ?? defaultValue),
    )
    const [draft, setDraft] = React.useState<string | null>(null)
    const [announcement, setAnnouncement] = React.useState("")
    const [copied, setCopied] = React.useState(false)
    const reducedMotion = usePrefersReducedMotion()
    const inputId = React.useId()

    // Sync a controlled value without an effect: compare against the last prop
    // we reconciled and adjust during render. React reruns this pass before
    // committing, so nothing extra is painted.
    const [lastValue, setLastValue] = React.useState(value)
    if (value !== undefined && value !== lastValue) {
      setLastValue(value)
      setState((previous) => stateFromString(value, previous.hsv))
    }

    const color = toColor(state.hsv, state.alpha, alpha)
    const output = formatColor(color, format)
    const solid = formatColor({ ...color, alpha: 1 }, "hex")

    const commit = (next: State, settled = false) => {
      setState(next)
      const nextColor = toColor(next.hsv, next.alpha, alpha)
      const nextOutput = formatColor(nextColor, format)
      onChange?.(nextOutput, nextColor)
      if (settled) {
        onChangeComplete?.(nextOutput, nextColor)
        // Only announce settled values — narrating every drag frame would
        // flood a screen reader with hundreds of updates.
        setAnnouncement(nextOutput)
      }
    }

    // Ending a drag must not re-run `commit` — the value is already current, and
    // doing so would fire a redundant onChange with identical data.
    const settle = () => {
      onChangeComplete?.(output, color)
      setAnnouncement(output)
    }

    const field = useTrackDrag(
      (x, y) => commit({ ...state, hsv: { ...state.hsv, s: x, v: 1 - y } }),
      settle,
      disabled,
    )
    const hue = useTrackDrag(
      (x) => commit({ ...state, hsv: { ...state.hsv, h: x * 360 } }),
      settle,
      disabled,
    )
    const opacity = useTrackDrag(
      (x) => commit({ ...state, alpha: x }),
      settle,
      disabled,
    )

    /* --------------------------------- Keys -------------------------------- */

    // Arrows nudge 1%, shift 10% — the ratio native range inputs use, so it
    // matches existing muscle memory.
    const handleFieldKeys = (event: React.KeyboardEvent) => {
      if (disabled) return
      const step = event.shiftKey ? 0.1 : 0.01
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      }
      const delta = deltas[event.key]
      if (!delta) return
      event.preventDefault()
      commit(
        {
          ...state,
          hsv: {
            ...state.hsv,
            s: clamp(state.hsv.s + delta[0], 0, 1),
            v: clamp(state.hsv.v + delta[1], 0, 1),
          },
        },
        true,
      )
    }

    const handleHueKeys = (event: React.KeyboardEvent) => {
      if (disabled) return
      const step = event.shiftKey ? 10 : 1
      let next: number | null = null
      if (event.key === "ArrowLeft" || event.key === "ArrowDown")
        next = state.hsv.h - step
      else if (event.key === "ArrowRight" || event.key === "ArrowUp")
        next = state.hsv.h + step
      else if (event.key === "Home") next = 0
      else if (event.key === "End") next = 359
      if (next === null) return
      event.preventDefault()
      commit({ ...state, hsv: { ...state.hsv, h: (next + 360) % 360 } }, true)
    }

    const handleOpacityKeys = (event: React.KeyboardEvent) => {
      if (disabled) return
      const step = event.shiftKey ? 0.1 : 0.01
      let next: number | null = null
      if (event.key === "ArrowLeft" || event.key === "ArrowDown")
        next = state.alpha - step
      else if (event.key === "ArrowRight" || event.key === "ArrowUp")
        next = state.alpha + step
      else if (event.key === "Home") next = 0
      else if (event.key === "End") next = 1
      if (next === null) return
      event.preventDefault()
      commit({ ...state, alpha: clamp(next, 0, 1) }, true)
    }

    /* ------------------------------- Actions ------------------------------- */

    const commitDraft = (text: string) => {
      setDraft(null)
      if (parseHex(text)) commit(stateFromString(text, state.hsv), true)
    }

    const supportsEyedropper =
      typeof window !== "undefined" && "EyeDropper" in window

    const pickFromScreen = async () => {
      try {
        const EyeDropperCtor = (
          window as unknown as {
            EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> }
          }
        ).EyeDropper
        const result = await new EyeDropperCtor().open()
        commit(stateFromString(result.sRGBHex, state.hsv), true)
      } catch {
        // Dismissing the eyedropper rejects; that is a cancel, not an error.
      }
    }

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(output)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      } catch {
        // Clipboard can be blocked by permissions; failing silently is fine.
      }
    }

    // A white ring disappears on pale colors and a dark ring disappears on deep
    // ones, so the field thumb's border tracks the luminance beneath it.
    const fieldThumbRing =
      luminance(color.rgb) > 0.55 ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.98)"

    const focusRing =
      "outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"

    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-label={label}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "w-[280px] select-none p-3 antialiased",
          // Concentric radii: 28px outer = 16px inner + 12px padding.
          "rounded-[28px] bg-white dark:bg-neutral-900",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_-6px_rgba(0,0,0,0.1),0_28px_56px_-16px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(0,0,0,0.05)]",
          "dark:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5),0_28px_56px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(255,255,255,0.08)]",
          disabled && "pointer-events-none opacity-55 saturate-50",
          className,
        )}
        {...props}
      >
        {/* ----------------------- Saturation / brightness ---------------------- */}
        <div
          ref={field.trackRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(state.hsv.v * 100)}
          aria-valuetext={`Saturation ${Math.round(state.hsv.s * 100)} percent, brightness ${Math.round(state.hsv.v * 100)} percent`}
          aria-disabled={disabled || undefined}
          onKeyDown={handleFieldKeys}
          {...field.handlers}
          className={cn(
            "relative aspect-[5/4] w-full touch-none rounded-2xl",
            !disabled && "cursor-crosshair",
            "outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-blue-500/70",
          )}
          style={{
            backgroundColor: `hsl(${state.hsv.h} 100% 50%)`,
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          <Thumb
            size={18}
            dragging={field.dragging}
            reducedMotion={reducedMotion}
            style={{
              left: `${state.hsv.s * 100}%`,
              top: `${(1 - state.hsv.v) * 100}%`,
              background: solid,
              boxShadow: `0 0 0 3px ${fieldThumbRing}, 0 2px 6px rgba(0,0,0,0.4)`,
            }}
          />
        </div>

        {/* ------------------------------ Controls ------------------------------ */}
        <div className="mt-3 flex items-center gap-3">
          {/* Current color well — recessed to sit opposite the raised thumbs. */}
          <div
            aria-hidden
            className="size-11 shrink-0 rounded-full"
            style={{ background: CHECKERBOARD, boxShadow: RECESSED }}
          >
            <div
              className="size-full rounded-full transition-colors duration-150"
              style={{
                backgroundColor: output,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                transitionTimingFunction: EASE,
              }}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <SliderTrack
              drag={hue}
              onKeyDown={handleHueKeys}
              disabled={disabled}
              ariaLabel="Hue"
              valueNow={Math.round(state.hsv.h)}
              valueMax={360}
              valueText={`${Math.round(state.hsv.h)} degrees`}
              background={HUE_GRADIENT}
              thumb={{
                left: `${(state.hsv.h / 360) * 100}%`,
                background: `hsl(${state.hsv.h} 100% 50%)`,
              }}
              reducedMotion={reducedMotion}
            />

            {alpha && (
              <SliderTrack
                drag={opacity}
                onKeyDown={handleOpacityKeys}
                disabled={disabled}
                ariaLabel="Opacity"
                valueNow={Math.round(state.alpha * 100)}
                valueMax={100}
                valueText={`${Math.round(state.alpha * 100)} percent`}
                background={CHECKERBOARD}
                overlay={`linear-gradient(to right, transparent, ${solid})`}
                thumb={{ left: `${state.alpha * 100}%`, background: solid }}
                reducedMotion={reducedMotion}
              />
            )}
          </div>
        </div>

        {/* ------------------------------ Value row ----------------------------- */}
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Color value
          </label>
          <div
            className="flex h-11 min-w-0 flex-1 items-center rounded-2xl bg-neutral-100 pl-3 pr-1 dark:bg-neutral-800/80"
            style={{ boxShadow: RECESSED }}
          >
            <span className="mr-2 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {format}
            </span>
            <input
              id={inputId}
              value={draft ?? output}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={(event) => commitDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitDraft(event.currentTarget.value)
                }
                if (event.key === "Escape") setDraft(null)
              }}
              className={cn(
                "h-full w-full min-w-0 bg-transparent",
                "font-mono text-[13px] lowercase tabular-nums tracking-tight",
                "text-neutral-900 outline-none dark:text-neutral-100",
              )}
            />
            {copyable && (
              <IconButton
                onClick={copy}
                disabled={disabled}
                label={copied ? "Copied" : "Copy color value"}
                focusRing={focusRing}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            )}
          </div>

          {eyedropper && supportsEyedropper && (
            <button
              type="button"
              onClick={pickFromScreen}
              disabled={disabled}
              aria-label="Pick a color from the screen"
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl",
                "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)]",
                "dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]",
                "transition-[scale,background-color] duration-150 active:scale-[0.96]",
                "hover:bg-neutral-50 dark:hover:bg-neutral-700",
                focusRing,
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              <EyedropperIcon />
            </button>
          )}
        </div>

        {/* ------------------------------ Swatches ------------------------------ */}
        {swatches && swatches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/[0.07] pt-3 dark:border-white/[0.08]">
            {swatches.map((swatch) => {
              const selected = swatch.toLowerCase() === color.hex.toLowerCase()
              return (
                <button
                  key={swatch}
                  type="button"
                  aria-label={swatch}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => commit(stateFromString(swatch, state.hsv), true)}
                  className={cn(
                    "size-6 rounded-full",
                    "transition-[scale] duration-150 hover:scale-110 active:scale-[0.96]",
                    focusRing,
                  )}
                  style={{
                    backgroundColor: swatch,
                    transitionTimingFunction: EASE,
                    boxShadow: selected
                      ? `0 0 0 2px #fff, 0 0 0 4px ${swatch}, 0 1px 3px rgba(0,0,0,0.3)`
                      : "inset 0 0 0 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.15)",
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Settled values only — narrating every drag frame would flood a reader. */}
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
    )
  },
)

/* -------------------------------------------------------------------------- */
/*                                   Parts                                    */
/* -------------------------------------------------------------------------- */

interface SliderTrackProps {
  drag: ReturnType<typeof useTrackDrag>
  onKeyDown: (event: React.KeyboardEvent) => void
  disabled: boolean
  ariaLabel: string
  valueNow: number
  valueMax: number
  valueText: string
  background: string
  overlay?: string
  thumb: { left: string; background: string }
  reducedMotion: boolean
}

/**
 * A 10px-tall track inside a 40px-tall hit area. The visible bar stays slim
 * while the pointer target clears the WCAG 2.5.5 minimum on touch.
 */
function SliderTrack({
  drag,
  onKeyDown,
  disabled,
  ariaLabel,
  valueNow,
  valueMax,
  valueText,
  background,
  overlay,
  thumb,
  reducedMotion,
}: SliderTrackProps) {
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={valueMax}
      aria-valuenow={valueNow}
      aria-valuetext={valueText}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      {...drag.handlers}
      className={cn(
        "relative flex h-10 items-center rounded-xl touch-none",
        !disabled && "cursor-pointer",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-blue-500/50",
      )}
    >
      <div
        ref={drag.trackRef}
        className="relative h-2.5 w-full rounded-full"
        style={{ background, boxShadow: RECESSED }}
      >
        {overlay && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: overlay, boxShadow: RECESSED }}
          />
        )}
        <Thumb
          size={16}
          dragging={drag.dragging}
          reducedMotion={reducedMotion}
          style={{
            left: thumb.left,
            top: "50%",
            background: thumb.background,
            boxShadow: RAISED,
          }}
        />
      </div>
    </div>
  )
}

function Thumb({
  style,
  dragging,
  size,
  reducedMotion,
}: {
  style: React.CSSProperties
  dragging: boolean
  size: number
  reducedMotion: boolean
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        ...style,
        width: size,
        height: size,
        // Position is deliberately never transitioned. Easing it leaves the
        // thumb trailing the cursor and the whole control reads as laggy.
        transform: `translate(-50%, -50%) scale(${dragging && !reducedMotion ? 1.18 : 1})`,
        transitionProperty: reducedMotion ? "none" : "transform",
        transitionDuration: "150ms",
        transitionTimingFunction: EASE,
      }}
    />
  )
}

function IconButton({
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
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl",
        "text-neutral-500 dark:text-neutral-400",
        "transition-[scale,background-color,color] duration-150 active:scale-[0.96]",
        "hover:bg-black/5 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-neutral-100",
        focusRing,
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  )
}

const iconProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

function EyedropperIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
