"use client"

import * as React from "react"
import {
  clamp,
  formatColor,
  luminance,
  parseHex,
  rgbToHsv,
  hsvToRgb,
  toColor,
  type Color,
  type ColorFormat,
  type HSV,
} from "./color"
import { DURATION, EASING } from "./motion"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

/**
 * Alpha checkerboard, inlined so the component ships without an asset.
 *
 * Mid-grey rather than black: a black-on-transparent checker is invisible
 * against a dark card, which is exactly where the opacity track needs to read.
 * A neutral grey holds contrast on both light and dark surfaces.
 */
const CHECKERBOARD =
  "repeating-conic-gradient(rgba(140,140,140,0.55) 0% 25%, rgba(255,255,255,0.9) 0% 50%) 50% / 9px 9px"

/**
 * Hue ramp drawn at the *current* saturation and brightness rather than at
 * full chroma. A permanently vivid rainbow lies about the outcome: at 20%
 * saturation, dragging it produces muted colours, and the control should
 * preview that rather than promise neon.
 */
function hueGradient(s: number, v: number) {
  const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => {
    const { r, g, b } = hsvToRgb({ h: h % 360, s, v })
    return `rgb(${r} ${g} ${b}) ${Math.round((h / 360) * 100)}%`
  })
  return `linear-gradient(to right, ${stops.join(", ")})`
}

// ease-in is never used here — starting slow reads as lag at exactly the
// moment the user is watching hardest.
const EASE_OUT = EASING.out

/**
 * Depth comes from one consistent rule: tracks and wells are *recessed* with an
 * inset shadow, thumbs and the card are *raised* with a cast shadow plus a
 * highlight along the top edge. Reversing that on any single element is what
 * makes a dimensional UI read as muddled.
 */
const RECESSED =
  "inset 0 1px 2px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.09)"
/**
 * The white ring alone vanishes against a white card, leaving the thumb looking
 * like a floating dot. The hairline outside it re-establishes the edge on light
 * surfaces without darkening the thumb on dark ones.
 */
const RAISED =
  "0 0 0 3px #fff, 0 0 0 4px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.3), 0 3px 8px -2px rgba(0,0,0,0.22)"

/** Palette read off the Figma kit's ColorSwatchPicker, in its order. */
const DEFAULT_SWATCHES = [
  "#f43f5e",
  "#d946ef",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
  "#f97316",
]

const FORMAT_CYCLE: ColorFormat[] = ["hex", "rgb", "hsl"]

/** Presets shown per page before the pager kicks in. */
const SWATCHES_PER_PAGE = 10

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
  /**
   * Starting output format. The user can cycle this at runtime with the format
   * button unless `formatToggle` is false; changing it affects both the
   * displayed text and the string passed to callbacks.
   */
  format?: ColorFormat
  /** Let the user cycle hex → rgb → hsl by pressing the format label. */
  formatToggle?: boolean
  /** Show the opacity slider and include alpha in the output. */
  alpha?: boolean
  /**
   * Preset colors. Pass `false` to hide the row, or an array to replace the
   * default palette.
   */
  swatches?: string[] | false
  /** Offer the native screen eyedropper where the browser supports it. */
  eyedropper?: boolean
  /** Show the copy-to-clipboard button. */
  copyable?: boolean
  /** Show a randomise button that jumps to an arbitrary colour. */
  shuffle?: boolean
  /**
   * Show the starting color beside the current one. Pressing it reverts —
   * picking is comparative, so the value you began with should stay reachable.
   */
  comparison?: boolean
  /** Block all interaction and dim the control. */
  disabled?: boolean
  /**
   * Layout. Mirrors the `_ColorPickerSelect` variants in the HeroUI Figma kit.
   *
   * - `default`  — presets above the field, controls below.
   * - `swatches` — presets move beneath the controls, so the field leads.
   *
   * `fields` and `sliders` from the kit are not implemented yet: both need a
   * colour-model select and per-channel inputs that do not exist here.
   */
  variant?: "default" | "swatches"
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
 * 0-1, while the handlers attach to a larger padded parent — that split is what
 * lets a 10px-tall slider carry a 40px touch target.
 */
function useTrackDrag(
  onPosition: (x: number, y: number) => void,
  onEnd: () => void,
  disabled: boolean,
) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const pointerId = React.useRef<number | null>(null)
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
            // Multi-touch protection: once a drag owns a pointer, ignore every
            // other one. Without this, a second finger teleports the thumb.
            if (pointerId.current !== null) return
            event.preventDefault() // suppress text selection mid-drag
            event.currentTarget.setPointerCapture(event.pointerId)
            pointerId.current = event.pointerId
            setDragging(true)
            emit(event)
          },
          onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            emit(event)
          },
          onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            event.currentTarget.releasePointerCapture(event.pointerId)
            pointerId.current = null
            setDragging(false)
            onEnd()
          },
          onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerId.current !== event.pointerId) return
            pointerId.current = null
            setDragging(false)
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
      format: initialFormat = "hex",
      formatToggle = true,
      // Defaults ship the complete picker. Good defaults matter more than
      // options — most people never customise, so the box should be full.
      alpha: alphaProp,
      swatches = DEFAULT_SWATCHES,
      variant = "default",
      eyedropper = true,
      copyable = true,
      shuffle = true,
      comparison = true,
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
    const [format, setFormat] = React.useState(initialFormat)
    const [draft, setDraft] = React.useState<string | null>(null)
    const [alphaDraft, setAlphaDraft] = React.useState<string | null>(null)
    const [announcement, setAnnouncement] = React.useState("")
    const [copied, setCopied] = React.useState(false)
    const [swatchPage, setSwatchPage] = React.useState(0)
    const reducedMotion = usePrefersReducedMotion()
    const inputId = React.useId()

    // The colour the picker opened with, kept for the comparison well.
    const [initial] = React.useState(value ?? defaultValue)

    // Sync a controlled value without an effect: compare against the last prop
    // we reconciled and adjust during render. React reruns this pass before
    // committing, so nothing extra is painted.
    const [lastValue, setLastValue] = React.useState(value)
    if (value !== undefined && value !== lastValue) {
      setLastValue(value)
      setState((previous) => stateFromString(value, previous.hsv))
    }

    /**
     * Composition follows the variant, and an explicit prop always wins.
     *
     * The kit's `swatches` layout is a *reduced* one — field, hue, presets, and
     * nothing else. It is not the default layout with the presets moved, which
     * is what an earlier pass shipped.
     *
     * Dropping the readout is a real accessibility question, not just a visual
     * one: without it there is no on-screen text for the current value. The
     * sliders keep their labels and aria-valuetext and the polite live region
     * still announces settled values, so the value stays reachable to a screen
     * reader — but a sighted user loses it, which is why `default` keeps the
     * field and this variant is opt-in.
     */
    const alpha = alphaProp ?? variant === "default"
    const showValueField = variant === "default"

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

    /** Accepts "40", "40%", or " 40 " — anything a person would actually type. */
    const commitAlphaDraft = (text: string) => {
      setAlphaDraft(null)
      const parsed = Number.parseFloat(text.replace("%", "").trim())
      if (Number.isNaN(parsed)) return
      commit({ ...state, alpha: clamp(parsed / 100, 0, 1) }, true)
    }

    const cycleFormat = () => {
      const next =
        FORMAT_CYCLE[(FORMAT_CYCLE.indexOf(format) + 1) % FORMAT_CYCLE.length]!
      setFormat(next)
      setAnnouncement(formatColor(color, next))
    }

    /**
     * Read after hydration, not during render.
     *
     * `typeof window !== "undefined"` evaluates false on the server and true on
     * the client, so the server omitted the eyedropper button and the client
     * rendered it — a hydration mismatch that React resolves by throwing away
     * and re-rendering the whole subtree. The server snapshot is pinned to
     * false so both passes agree, and the button appears on the commit after.
     *
     * The subscribe callback is a no-op because the capability cannot change
     * for the lifetime of the document.
     */
    const supportsEyedropper = React.useSyncExternalStore(
      () => () => {},
      () => "EyeDropper" in window,
      () => false,
    )

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
      "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus,#0485f7)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface,#ffffff)]"

    const swatchList = swatches === false ? [] : swatches
    // Presets page rather than wrap. A wrapping grid changes the card's height
    // as the palette grows; a pager keeps the layout fixed at any length.
    const maxSwatchPage = Math.max(
      0,
      Math.ceil(swatchList.length / SWATCHES_PER_PAGE) - 1,
    )
    const visibleSwatches = swatchList.slice(
      swatchPage * SWATCHES_PER_PAGE,
      swatchPage * SWATCHES_PER_PAGE + SWATCHES_PER_PAGE,
    )

    const randomize = () => {
      // Random hue, but saturation and value kept in a usable band — fully
      // random HSV mostly returns muddy near-black and washed-out pastels.
      commit(
        {
          hsv: {
            h: Math.floor(Math.random() * 360),
            s: 0.55 + Math.random() * 0.4,
            v: 0.6 + Math.random() * 0.35,
          },
          alpha: state.alpha,
        },
        true,
      )
    }

    const swatchRow = (

        <div className="flex items-center gap-3 px-2">
          <PagerButton
            direction="previous"
            disabled={disabled || swatchPage === 0}
            onClick={() => setSwatchPage((page) => Math.max(0, page - 1))}
          />
          <div className="flex flex-1 items-center justify-between">
            {visibleSwatches.map((swatch) => {
              const selected = swatch.toLowerCase() === color.hex.toLowerCase()
              return (
                <button
                  key={swatch}
                  type="button"
                  aria-label={swatch}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() =>
                    commit(stateFromString(swatch, state.hsv), true)
                  }
                  className={cn(
                    "size-4 shrink-0 rounded-full",
                    "transition-[scale] duration-150 hover:scale-115 active:scale-[0.97]",
                    focusRing,
                  )}
                  style={{
                    backgroundColor: swatch,
                    transitionTimingFunction: EASE_OUT,
                    // outline + offset leaves a gap showing the card itself,
                    // so the ring reads on light and dark without a theme flag.
                    outline: selected ? `2px solid ${swatch}` : undefined,
                    outlineOffset: selected ? 2 : undefined,
                    boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
                  }}
                />
              )
            })}
          </div>
          <PagerButton
            direction="next"
            disabled={disabled || swatchPage >= maxSwatchPage}
            onClick={() =>
              setSwatchPage((page) => Math.min(maxSwatchPage, page + 1))
            }
          />
        </div>
    )

    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-label={label}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "flex w-60 select-none flex-col gap-2 pt-4 pr-2 pb-3 pl-2 antialiased",
          "rounded-[20px] bg-[var(--surface,#ffffff)]",
          disabled && "pointer-events-none opacity-50 saturate-50",
          className,
        )}
        style={{
          // Three layers, and the middle one carries a *negative* y offset — a
          // faint upward bloom that keeps the top edge from looking pasted onto
          // the page. Without it the card reads as sitting in a hole.
          //
          // The literal is the light-theme value. Where a host defines
          // --overlay-shadow the card picks up that host's elevation, including
          // its dark-theme treatment, which is why there is no dark: variant
          // here any more — one variable covers both.
          boxShadow:
            "var(--overlay-shadow, 0 14px 28px 0 rgb(0 0 0 / 0.08), 0 -6px 12px 0 rgb(0 0 0 / 0.03), 0 2px 8px 0 rgb(0 0 0 / 0.06), 0 0 0 1px rgb(0 0 0 / 0.04))",
          // Mobile Safari paints a grey box over anything tappable otherwise.
          WebkitTapHighlightColor: "transparent",
        }}
        {...props}
      >
        {/* ------------------------------ Swatches ------------------------------ */}
        {/* Placement is the whole difference between the two variants. Default
            puts presets above the field — they are where you *start*, and
            putting them after the fine controls implies they are an
            afterthought. The `swatches` variant inverts that, leading with the
            field and closing on the palette. */}
        {swatchList.length > 0 && variant === "default" && swatchRow}

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
            "relative aspect-square w-full touch-none rounded-2xl",
            !disabled && "cursor-crosshair",
            "outline-hidden focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--focus,#0485f7)]/70",
          )}
          style={{
            backgroundColor: `hsl(${state.hsv.h} 100% 50%)`,
            // The dot pattern sits above the two gradients and below the thumb.
            // It is not decoration: over a smooth 2D ramp there is nothing for
            // the eye to register movement against, and the dots give the drag
            // a fixed grid to read position from.
            backgroundImage:
              "radial-gradient(circle, rgb(255 255 255 / 0.2) 1px, transparent 1px), linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
            backgroundSize: "8px 8px, auto, auto",
            boxShadow: "inset 0 0 1px 0 rgb(0 0 0 / 0.3)",
          }}
        >
          <Thumb
            width={16}
            height={16}
            dragging={field.dragging}
            reducedMotion={reducedMotion}
            style={{
              left: `${state.hsv.s * 100}%`,
              top: `${(1 - state.hsv.v) * 100}%`,
              background: solid,
              boxShadow: `0 0 0 3px ${fieldThumbRing}, 0 1px 4px rgb(0 0 0 / 0.4)`,
            }}
          />
        </div>

        {/* ------------------------------ Controls ------------------------------ */}
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <LabelledSlider
                drag={hue}
                onKeyDown={handleHueKeys}
                disabled={disabled}
                label="Hue"
                readout={`${Math.round(state.hsv.h)}°`}
                valueNow={Math.round(state.hsv.h)}
                valueMax={360}
                valueText={`${Math.round(state.hsv.h)} degrees`}
                background={hueGradient(state.hsv.s, state.hsv.v)}
                thumb={{
                  left: `${(state.hsv.h / 360) * 100}%`,
                  background: `hsl(${state.hsv.h} 100% 50%)`,
                }}
                reducedMotion={reducedMotion}
              />

              {alpha && (
                <LabelledSlider
                  drag={opacity}
                  onKeyDown={handleOpacityKeys}
                  disabled={disabled}
                  label="Opacity"
                  readout={`${Math.round(state.alpha * 100)}%`}
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

            <div className="flex shrink-0 items-center gap-2">
              {eyedropper && supportsEyedropper && (
                <SquareButton
                  onClick={pickFromScreen}
                  disabled={disabled}
                  label="Pick a color from the screen"
                  focusRing={focusRing}
                >
                  <EyedropperIcon />
                </SquareButton>
              )}
              {shuffle && (
                <SquareButton
                  onClick={randomize}
                  disabled={disabled}
                  label="Random color"
                  focusRing={focusRing}
                >
                  <ShuffleIcon />
                </SquareButton>
              )}
            </div>
          </div>

          {swatchList.length > 0 && variant === "swatches" && swatchRow}

          {/* ----------------------------- Value field ---------------------------- */}
          {showValueField && (
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              Color value
            </label>
            <div className="flex h-9 min-w-0 flex-1 items-center rounded-xl bg-[var(--default,#ebebec)]">
              <button
                type="button"
                onClick={cycleFormat}
                disabled={disabled || !formatToggle}
                aria-label={`Color format: ${format}. Press to change.`}
                className={cn(
                  "flex h-full shrink-0 items-center gap-1 rounded-l-xl pr-1.5 pl-3",
                  "text-[10px] font-semibold tracking-wide uppercase",
                  "text-[var(--muted,#71717a)]",
                  formatToggle &&
                    "transition-colors duration-150 hover:text-[var(--foreground,#18181b)]",
                  focusRing,
                )}
                style={{ transitionTimingFunction: EASE_OUT }}
              >
                {format}
                {formatToggle && <ChevronIcon />}
              </button>

              <span
                aria-hidden
                className="h-4 w-px shrink-0 bg-[var(--separator,rgb(0_0_0/0.1))]"
              />

              {/* Current colour, inline with its own value — the swatch and the
                  text it describes should not be in different places. */}
              <span
                aria-hidden
                className="ml-2.5 size-4 shrink-0 rounded-full"
                style={{
                  background: CHECKERBOARD,
                  boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.15)",
                }}
              >
                <span
                  className="block size-full rounded-full"
                  style={{ backgroundColor: output }}
                />
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
                  "h-full w-full min-w-0 bg-transparent px-2",
                  "font-mono text-[13px] tracking-tight tabular-nums lowercase",
                  "text-[var(--foreground,#18181b)] outline-hidden",
                )}
              />

              {copyable && (
                <IconButton
                  onClick={copy}
                  disabled={disabled}
                  label={copied ? "Copied" : "Copy color value"}
                  focusRing={focusRing}
                >
                  {/* Both icons stay mounted and cross-fade. Toggling
                      visibility would pop; blur bridges the two states so the
                      eye reads one object changing rather than two swapping. */}
                  <IconSwap showSecond={copied} reducedMotion={reducedMotion}>
                    <CopyIcon />
                    <CheckIcon />
                  </IconSwap>
                </IconButton>
              )}
            </div>

            {comparison && initial.toLowerCase() !== color.hex.toLowerCase() && (
              <button
                type="button"
                onClick={() => commit(stateFromString(initial, state.hsv), true)}
                disabled={disabled}
                aria-label={`Revert to ${initial}`}
                title={`Revert to ${initial}`}
                className={cn(
                  "size-9 shrink-0 rounded-xl",
                  "transition-[scale] duration-150 active:scale-[0.97]",
                  focusRing,
                )}
                style={{
                  backgroundColor: initial,
                  transitionTimingFunction: EASE_OUT,
                  boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
                }}
              />
            )}
          </div>
          )}
        </div>

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

/**
 * Starting colour on the left, current on the right. Choosing a colour is a
 * comparative act — you judge against where you began — so the original stays
 * visible and pressing it reverts.
 */
function ComparisonWell({
  current,
  initial,
  changed,
  disabled,
  onRevert,
  focusRing,
}: {
  current: string
  initial: string
  changed: boolean
  disabled: boolean
  onRevert: () => void
  focusRing: string
}) {
  // Until the colour actually differs, a split well is two identical halves
  // with a meaningless seam down the middle. Show one solid chip instead and
  // only divide it once there is something to compare against.
  if (!changed) {
    return (
      <div
        aria-hidden
        className="size-9 shrink-0 rounded-full"
        style={{ background: CHECKERBOARD, boxShadow: RECESSED }}
      >
        <div
          className="size-full rounded-full"
          style={{ backgroundColor: current }}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-9 shrink-0 overflow-hidden rounded-full"
      style={{ background: CHECKERBOARD, boxShadow: RECESSED }}
    >
      <button
        type="button"
        onClick={onRevert}
        disabled={disabled}
        aria-label={`Revert to ${initial}`}
        title={`Revert to ${initial}`}
        className={cn("h-full w-9 cursor-pointer", focusRing)}
        style={{ backgroundColor: initial }}
      />
      <div
        aria-hidden
        className="h-full w-9"
        style={{ backgroundColor: current }}
      />
    </div>
  )
}

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
  thumb: { left: string; background: string }
  reducedMotion: boolean
}

/**
 * A labelled slider: name on the left, live value on the right, track below.
 *
 * The readout matters more than it looks. Without it the only way to know the
 * hue is to read it back out of the hex field, which is a translation task;
 * showing the number turns the slider into something you can aim with.
 */
function LabelledSlider({
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
  thumb,
  reducedMotion,
}: LabelledSliderProps) {
  return (
    <div className="flex flex-col gap-1">
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
              left: thumb.left,
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

/** 32×32 action button sitting beside the sliders. */
function SquareButton({
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
        "grid size-8 shrink-0 place-items-center rounded-2xl",
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

/** Chevron pager for the preset row. Hidden from readers — the swatches
 *  themselves are the content, and the arrows only reposition them. */
function PagerButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} presets`}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full",
        "text-[var(--muted,#a1a1aa)]",
        "transition-[color,opacity] duration-150",
        "hover:text-[var(--foreground,#18181b)] disabled:opacity-30",
        "outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--focus,#0485f7)]/50",
      )}
      style={{ transitionTimingFunction: EASE_OUT }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={{
          transform: direction === "next" ? "rotate(180deg)" : undefined,
        }}
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  )
}

function Thumb({
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
function IconSwap({
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
        "text-[var(--muted,#71717a)]",
        "transition-[scale,background-color,color] duration-150 active:scale-[0.97]",
        "hover:bg-[var(--default,#ebebec)] hover:text-[var(--foreground,#18181b)]",
        focusRing,
      )}
      style={{ transitionTimingFunction: EASE_OUT }}
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
    <svg {...iconProps} width={14} height={14}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg {...iconProps} width={15} height={15}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg {...iconProps} width={11} height={11} strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
