"use client"

import * as React from "react"
import {
  clamp,
  formatColor,
  hslToHsv,
  luminance,
  parseHex,
  rgbToHsv,
  hsvToRgb,
  toColor,
  type Color,
  type ColorFormat,
  type HSV,
  type RGB,
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
 * Hue ramp at full chroma, always — it is a *selector*, not a preview.
 *
 * An earlier pass drew it at the current saturation and brightness, reasoning
 * that a vivid rainbow over-promises the outcome. It does, but the cost is far
 * worse than the benefit: at brightness 0 every stop evaluates to rgb(0,0,0)
 * and the rail becomes a solid black bar you cannot pick a hue from. That is
 * precisely where this picker makes a point of *preserving* hue, so the one
 * place the behaviour matters most is the place the control stopped showing it.
 *
 * A hue rail's job is to let you find a hue. Anything that makes two hues
 * indistinguishable has broken it, however honest the preview.
 */
const HUE_GRADIENT = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
  .map((h) => {
    const { r, g, b } = hsvToRgb({ h: h % 360, s: 1, v: 1 })
    return `rgb(${r} ${g} ${b}) ${Math.round((h / 360) * 100)}%`
  })
  .join(", ")})`

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

/**
 * The colour models offered by the select. `rgb` is labelled RGBA because the
 * row it produces includes an alpha field — naming it RGB would promise three
 * fields and deliver four.
 */
const MODELS: { value: ColorFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGBA" },
  { value: "hsl", label: "HSL" },
]

/**
 * One editable channel. `min`/`max` are real bounds, not display hints: input
 * outside them reverts rather than clamping, so a typo reads as "nothing
 * happened" instead of silently becoming a different colour.
 */
interface ChannelSpec {
  key: string
  short: string
  name: string
  value: number
  min: number
  max: number
}

/**
 * Re-derives HSV from RGB while carrying hue and saturation through the points
 * where they are mathematically undefined — grey has no hue, black has neither.
 *
 * The same rule `stateFromString` applies to dragging, applied to typing. Enter
 * `0 0 0` in the RGB fields without it and the hue slider snaps back to red,
 * which is the exact bug this picker exists to not have.
 */
function hsvFromRgbPreserving(rgb: RGB, previous: HSV): HSV {
  const next = rgbToHsv(rgb)
  return {
    h: next.s === 0 || next.v === 0 ? previous.h : next.h,
    s: next.v === 0 ? previous.s : next.s,
    v: next.v,
  }
}


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
  /** Offer the native screen eyedropper where the browser supports it. */
  eyedropper?: boolean
  /** Show the copy-to-clipboard button. */
  copyable?: boolean
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
      variant = "default",
      eyedropper = true,
      copyable = true,
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
    // One draft at a time: only the focused field can be mid-edit, and keying
    // it means switching fields cannot leave a stale value behind in another.
    const [channelDraft, setChannelDraft] = React.useState<{
      key: string
      text: string
    } | null>(null)
    const [announcement, setAnnouncement] = React.useState("")
    const [copied, setCopied] = React.useState(false)

    const reducedMotion = usePrefersReducedMotion()
    const inputId = React.useId()
    // The select reshapes the row beneath it, so it needs to point at it.
    const channelGroupId = React.useId()

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

    /**
     * The channels the current model exposes. Switching model reshapes this row
     * and never touches the colour — the value is held in HSV, and every model
     * is a view onto it.
     */
    const channels: ChannelSpec[] =
      format === "rgb"
        ? [
            { key: "r", short: "R", name: "Red", value: color.rgb.r, min: 0, max: 255 },
            { key: "g", short: "G", name: "Green", value: color.rgb.g, min: 0, max: 255 },
            { key: "b", short: "B", name: "Blue", value: color.rgb.b, min: 0, max: 255 },
            ...(alpha
              ? [
                  {
                    key: "a",
                    short: "A",
                    name: "Alpha",
                    value: Math.round(state.alpha * 100),
                    min: 0,
                    max: 100,
                  },
                ]
              : []),
          ]
        : format === "hsl"
          ? [
              { key: "h", short: "H", name: "Hue", value: Math.round(color.hsl.h), min: 0, max: 360 },
              { key: "s", short: "S", name: "Saturation", value: Math.round(color.hsl.s * 100), min: 0, max: 100 },
              { key: "l", short: "L", name: "Lightness", value: Math.round(color.hsl.l * 100), min: 0, max: 100 },
            ]
          : []

    /**
     * Accepts "77", "77%", "77°", or " 77 " — anything a person would type.
     *
     * Out-of-range reverts rather than clamping. Clamping turns a fat-fingered
     * `2555` into 255 and looks like it worked; reverting shows the entry was
     * rejected, which is the honest outcome for a typo.
     */
    const commitChannel = (spec: ChannelSpec, text: string) => {
      setChannelDraft(null)
      const parsed = Number.parseFloat(
        text.replace("%", "").replace("°", "").trim(),
      )
      if (Number.isNaN(parsed) || parsed < spec.min || parsed > spec.max) return

      if (spec.key === "a") {
        commit({ ...state, alpha: parsed / 100 }, true)
        return
      }
      if (format === "rgb") {
        const rgb = { ...color.rgb, [spec.key]: Math.round(parsed) }
        commit({ ...state, hsv: hsvFromRgbPreserving(rgb, state.hsv) }, true)
        return
      }
      const hsl = {
        ...color.hsl,
        [spec.key]: spec.key === "h" ? parsed : parsed / 100,
      }
      // Hue is carried from state rather than round-tripped: at s=0 or l=0/1 the
      // HSL hue is undefined, and reading it back would discard the live one.
      commit(
        { ...state, hsv: { ...hslToHsv(hsl), h: spec.key === "h" ? parsed : state.hsv.h } },
        true,
      )
    }

    const changeModel = (next: ColorFormat) => {
      setFormat(next)
      setChannelDraft(null)
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

    return (
      <div
        ref={forwardedRef}
        role="group"
        aria-label={label}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          // 264px, not the kit's 240px. Once the eyedropper shares the readout row
          // there is not enough width left for a full 8-digit value, and the
          // readout is the one part that must never truncate — a picker that
          // cannot show you what you picked has failed at its only job.
          "flex w-66 select-none flex-col gap-2 pt-4 pr-2 pb-3 pl-2 antialiased",
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
            // Wider than tall, and capped. A square field on a 264px card is ~248px
            // of height before the sliders even start, which makes the popover
            // tall enough to clip against a viewport edge or push its own
            // trigger off screen. 4:3 keeps both axes comfortably draggable
            // while taking ~60px off the total.
            "relative aspect-[4/3] max-h-[200px] w-full touch-none rounded-2xl",
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
                background={HUE_GRADIENT}
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

          </div>

          {/* --------------------------- Model + actions -------------------------- */}
          {showValueField && (
          <div className="flex items-center gap-2">
            {/* A native select, deliberately. A custom listbox is several
                hundred lines of focus management and typeahead to arrive back
                where the platform already is — and it would be the only part of
                this package that needed a portal. */}
            <div className="relative flex h-10 min-w-0 flex-1 items-center rounded-2xl bg-[var(--default,#ebebec)]">
              <select
                value={format}
                disabled={disabled || !formatToggle}
                aria-label="Color model"
                aria-controls={channelGroupId}
                onChange={(event) =>
                  changeModel(event.target.value as ColorFormat)
                }
                className={cn(
                  "h-full w-full appearance-none rounded-2xl bg-transparent pr-9 pl-3.5",
                  "text-[13px] font-medium text-[var(--foreground,#18181b)] outline-hidden",
                  !disabled && formatToggle && "cursor-pointer",
                  focusRing,
                )}
              >
                {MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 flex text-[var(--muted,#71717a)]"
              >
                <ChevronIcon />
              </span>
            </div>

            {eyedropper && supportsEyedropper && (
              <RoundButton
                onClick={pickFromScreen}
                disabled={disabled}
                label="Pick a color from the screen"
                focusRing={focusRing}
              >
                <EyedropperIcon />
              </RoundButton>
            )}

          </div>
          )}

          {/* ----------------------------- Channel row ---------------------------- */}
          {showValueField && (
          <div className="flex items-center gap-2">
          <div
            id={channelGroupId}
            role="group"
            aria-label="Color channels"
            className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-2xl bg-[var(--default,#ebebec)] p-1.5"
          >
            {format === "hex" ? (
              <>
                <label htmlFor={inputId} className="sr-only">
                  Hex color value
                </label>
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
                    "h-full w-full min-w-0 rounded-xl bg-[var(--surface,#ffffff)] px-3",
                    "font-mono text-[13px] tracking-tight tabular-nums lowercase",
                    "text-[var(--foreground,#18181b)] outline-hidden",
                    focusRing,
                  )}
                />
              </>
            ) : (
              channels.map((spec) => (
                <ChannelField
                  key={spec.key}
                  spec={spec}
                  draft={
                    channelDraft?.key === spec.key ? channelDraft.text : null
                  }
                  disabled={disabled}
                  focusRing={focusRing}
                  onDraft={(text) => setChannelDraft({ key: spec.key, text })}
                  onCommit={(text) => commitChannel(spec, text)}
                  onStep={(delta) =>
                    commitChannel(
                      spec,
                      String(clamp(spec.value + delta, spec.min, spec.max)),
                    )
                  }
                  onCancel={() => setChannelDraft(null)}
                />
              ))
            )}
          </div>

            {/* Copy sits after the row it copies, so what lands on the
                clipboard is what the row displays — `#747839` in HEX,
                `rgb(116 120 57)` in RGBA. A copy button that always emits hex
                regardless of the selected model is a trap. */}
            {copyable && (
              <RoundButton
                onClick={copy}
                disabled={disabled}
                label={copied ? "Copied" : `Copy ${output}`}
                focusRing={focusRing}
              >
                {/* Both icons stay mounted and cross-fade. Toggling visibility
                    would pop; blur bridges the two states so the eye reads one
                    object changing rather than two swapping. */}
                <IconSwap showSecond={copied} reducedMotion={reducedMotion}>
                  <CopyIcon />
                  <CheckIcon />
                </IconSwap>
              </RoundButton>
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
function ChannelField({
  spec,
  draft,
  disabled,
  focusRing,
  onDraft,
  onCommit,
  onStep,
  onCancel,
}: {
  spec: ChannelSpec
  draft: string | null
  disabled: boolean
  focusRing: string
  onDraft: (text: string) => void
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
        onChange={(event) => onDraft(event.target.value)}
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
          "h-8 w-full min-w-0 rounded-[10px] bg-[var(--surface,#ffffff)] px-1 text-center",
          "text-[12px] tabular-nums",
          "text-[var(--foreground,#18181b)] outline-hidden",
          focusRing,
        )}
      />
    </div>
  )
}

/** 40×40 circular action button. Clears the WCAG 2.5.5 target minimum. */
function RoundButton({
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


function ChevronIcon() {
  return (
    <svg {...iconProps} width={11} height={11} strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
