"use client"

/**
 * The complete color picker, in one file — this package is meant to be copied
 * as well as installed. Only `./color` stays separate: it is a published entry
 * point and is usable without React.
 */

import * as React from "react"
import {
  clamp,
  formatColor,
  hslToHsv,
  hsvToRgb,
  luminance,
  parseColor,
  rgbToHex,
  rgbToHsv,
  toColor,
  type Color,
  type ColorFormat,
  type HSV,
  type RGB,
} from "./color"


const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

/* -------------------------------------------------------------------------- */
/*                                  Motion                                  */
/* -------------------------------------------------------------------------- */

/** Motion tokens. Plain cubic-beziers, so springy motion costs nothing. */

const EASING = {
  /**
   * Strong ease-out. Moves immediately, which is what makes a control feel
   * like it heard you. Default for anything entering or responding to input.
   */
  out: "cubic-bezier(0.23, 1, 0.32, 1)",

  /** Natural acceleration and deceleration, for things moving on screen. */
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",

  /**
   * A spring without a physics engine. The y-values exceed 1, so the curve
   * overshoots its target and settles back — the same overshoot a real spring
   * produces. Use for tactile feedback like a thumb grabbing under the cursor.
   */
  spring: "cubic-bezier(0.155, 1.105, 0.295, 1.12)",

  /** Same idea, gentler overshoot. For larger or heavier elements. */
  softSpring: "cubic-bezier(0.16, 1.11, 0.3, 1.02)",

  /**
   * A slightly slower, more elegant general-purpose curve. Reaches for a
   * softer landing than `out` — good for colour and background changes where
   * urgency would feel twitchy.
   */
  soft: "cubic-bezier(0.36, 0.66, 0.4, 1)",
} as const

/** Milliseconds. Exits are faster than enters; nothing exceeds 300ms. */
const DURATION = {
  /** Press feedback. Must be near-instant to register as a response. */
  press: 120,
  /** Something appearing or growing. */
  enter: 200,
  /** Something leaving. Half the enter, by design. */
  exit: 100,
  /** Larger surfaces that would feel abrupt at enter speed. */
  slow: 300,
} as const

/* -------------------------------------------------------------------------- */
/*                                Constants                                 */
/* -------------------------------------------------------------------------- */

/** Presentation constants shared by the picker shell and its parts. */


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
 * Full chroma always — it is a selector, not a preview. Drawn at the current
 * saturation and brightness it goes solid black at v=0, where you can no longer
 * tell two hues apart.
 */
const HUE_GRADIENT = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
  .map((h) => {
    const { r, g, b } = hsvToRgb({ h: h % 360, s: 1, v: 1 })
    return `rgb(${r} ${g} ${b}) ${Math.round((h / 360) * 100)}%`
  })
  .join(", ")})`

/** Half the slider thumb's width. Insets both its travel and the drag maths. */
const THUMB_RADIUS = 10

/** Half the field thumb's width. Insets its travel on both axes. */
const FIELD_THUMB_RADIUS = 8

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

/* -------------------------------------------------------------------------- */
/*                                  Hooks                                   */
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
  /**
   * Inset of the usable range at each end, in px — the thumb's radius. A thumb
   * centred on its value hangs half off the rail at 0% and 100%. Applied to the
   * pointer maths too, so the thumb stays under the cursor.
   */
  inset = 0,
  /** Vertical equivalent, for the 2D field. Sliders leave it at 0. */
  insetY = 0,
) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const pointerId = React.useRef<number | null>(null)
  const [dragging, setDragging] = React.useState(false)

  const emit = (event: React.PointerEvent) => {
    const element = trackRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const usableX = rect.width - inset * 2
    const usableY = rect.height - insetY * 2
    onPosition(
      usableX > 0 ? clamp((event.clientX - rect.left - inset) / usableX, 0, 1) : 0,
      usableY > 0 ? clamp((event.clientY - rect.top - insetY) / usableY, 0, 1) : 0,
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

/**
 * Carries hue and saturation through the points where they are undefined —
 * grey has no hue, black has neither. Without it, typing `0 0 0` into the RGB
 * fields snaps the hue slider back to red.
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
  /**
   * Show the name and live readout above each slider.
   *
   * On by default: in HEX and RGBA the readout is the only place the hue
   * appears at all, and a number you can aim at is what separates a slider you
   * can use deliberately from one you can only nudge. Turn it off for a
   * compact picker where the two bars are self-evident.
   */
  sliderLabels?: boolean
  /** Offer the native screen eyedropper where the browser supports it. */
  eyedropper?: boolean
  /** Show the copy-to-clipboard button. */
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

/*                                   State                                    */
/* -------------------------------------------------------------------------- */

function stateFromString(
  input: string,
  previous?: HSV,
  previousAlpha = 1,
): State {
  const parsed = parseColor(input)
  // Unparseable input must not invent a colour. Carrying the previous alpha
  // through matters as much as the previous hue: resetting it to 1 turned any
  // string the parser did not understand into a silent "opacity back to 100%".
  if (!parsed) return { hsv: previous ?? { h: 0, s: 0, v: 0 }, alpha: previousAlpha }

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
      sliderLabels = true,
      eyedropper = true,
      copyable = true,
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

    const copyTimer = React.useRef<number | undefined>(undefined)
    // Genuine outside-React cleanup, not derived state — the timer has to be
    // cancelled if the picker unmounts mid-confirmation.
    React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])

    const reducedMotion = usePrefersReducedMotion()
    const inputId = React.useId()
    // The select reshapes the row beneath it, so it needs to point at it.
    const channelGroupId = React.useId()

    // Sync a controlled value without an effect: compare against the last prop
    // we reconciled and adjust during render. React reruns this pass before
    // committing, so nothing extra is painted.
    const [lastValue, setLastValue] = React.useState(value)
    if (value !== undefined && value !== lastValue) {
      setLastValue(value)
      setState((previous) =>
        stateFromString(value, previous.hsv, previous.alpha),
      )
    }

    const alpha = alphaProp ?? true

    const color = toColor(state.hsv, state.alpha, alpha)
    const output = formatColor(color, format)
    // Built from the channels, not by spreading { alpha: 1 } over the record —
    // formatColor's hex branch returns the precomputed color.hex and never
    // reads that field, so the override silently kept the alpha.
    const solid = rgbToHex(color.rgb, 1)

    // Previews the alpha it sets. Solid reads fully opaque at 15%; alpha alone
    // vanishes at 0%, hence the checkerboard behind it.
    const translucentThumb = `linear-gradient(0deg, ${rgbToHex(color.rgb, state.alpha)}, ${rgbToHex(color.rgb, state.alpha)}), ${CHECKERBOARD}`

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
      FIELD_THUMB_RADIUS,
      FIELD_THUMB_RADIUS,
    )
    const hue = useTrackDrag(
      (x) => commit({ ...state, hsv: { ...state.hsv, h: x * 360 } }),
      settle,
      disabled,
      FIELD_THUMB_RADIUS,
  THUMB_RADIUS,
    )
    const opacity = useTrackDrag(
      (x) => commit({ ...state, alpha: x }),
      settle,
      disabled,
      FIELD_THUMB_RADIUS,
  THUMB_RADIUS,
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

    // Accepts anything the parser understands, not just hex — pasting
    // `rgb(116 120 57)` into the hex field is a thing people do, and rejecting
    // a colour the component can read is a worse answer than converting it.
    // Unparseable text reverts on blur rather than clamping to something near.
    const commitDraft = (text: string) => {
      setDraft(null)
      if (parseColor(text))
        commit(stateFromString(text, state.hsv, state.alpha), true)
    }

    /**
     * Previews once the digits form a complete colour — 3, 4, 6 or 8 of them.
     * Length is what makes live safe here: an incomplete hex simply does not
     * parse. Non-hex paste is left for blur rather than stripped to digits.
     */
    const setHexDraft = (text: string) => {
      if (/^[a-z]/i.test(text.trim())) {
        setDraft(text)
        return
      }
      const digits = text.replace(/[^0-9a-fA-F]/g, "").slice(0, 8)
      setDraft(`#${digits}`)
      if ([3, 4, 6, 8].includes(digits.length))
        commit(stateFromString(`#${digits}`, state.hsv, state.alpha), false)
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

    /** Writes one channel into the colour. `settled` gates onChangeComplete. */
    const applyChannel = (
      spec: ChannelSpec,
      parsed: number,
      settled: boolean,
    ) => {
      if (spec.key === "a") {
        commit({ ...state, alpha: parsed / 100 }, settled)
        return
      }
      if (format === "rgb") {
        const rgb = { ...color.rgb, [spec.key]: Math.round(parsed) }
        commit({ ...state, hsv: hsvFromRgbPreserving(rgb, state.hsv) }, settled)
        return
      }
      const hsl = {
        ...color.hsl,
        [spec.key]: spec.key === "h" ? parsed : parsed / 100,
      }
      // Hue is carried from state rather than round-tripped: at s=0 or l=0/1 the
      // HSL hue is undefined, and reading it back would discard the live one.
      commit(
        {
          ...state,
          hsv: {
            ...hslToHsv(hsl),
            h: spec.key === "h" ? parsed : state.hsv.h,
          },
        },
        settled,
      )
    }

    // Only from a complete in-range value. The field is filtered to digits and
    // capped at its own maximum, so typing 7 toward 77 cannot drive the colour
    // to 7 first. Out of range previews nothing and waits for blur.
    const previewChannel = (spec: ChannelSpec, text: string) => {
      if (text === "") return
      const parsed = Number(text)
      if (Number.isNaN(parsed) || parsed < spec.min || parsed > spec.max) return
      applyChannel(spec, parsed, false)
    }

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
      applyChannel(spec, parsed, true)
    }

    const changeModel = (next: ColorFormat) => {
      setFormat(next)
      setChannelDraft(null)
      setAnnouncement(formatColor(color, next))
    }

    // Server snapshot pinned to false so both passes agree — reading `window`
    // during render is a hydration mismatch that throws away the subtree.
    // Subscribe is a no-op: the capability cannot change.
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
        // Hold the handle so rapid presses reset one timer rather than stacking
        // several — otherwise the icon flickers as each stale timeout fires.
        window.clearTimeout(copyTimer.current)
        copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
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

    /**
     * Declared once and rendered from one of two places depending on the model,
     * so the two sites cannot drift. Whichever row it lands in, it copies the
     * value the channel row is displaying — `#747839` in HEX,
     * `rgb(116 120 57)` in RGBA. A copy button that always emits hex regardless
     * of the selected model is a trap.
     */
    const copyButton = (
      <RoundButton
        onClick={copy}
        disabled={disabled}
        label={copied ? "Copied" : `Copy ${output}`}
        focusRing={focusRing}
      >
        {/* Both icons stay mounted and cross-fade. Toggling visibility would
            pop; blur bridges the two states so the eye reads one object
            changing rather than two swapping. */}
        <IconSwap showSecond={copied} reducedMotion={reducedMotion}>
          <CopyIcon />
          <CheckIcon />
        </IconSwap>
      </RoundButton>
    )

    return (
      <div
        ref={forwardedRef}
        data-slot="color-picker"
        role="group"
        aria-label={label}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          // 320px. The channel row is what sets this now: four RGBA fields plus
          // their letters have to hold a three-digit value each without the
          // number crowding its own box, and 264px left them at ~43px. A picker
          // that cannot show you what you picked has failed at its only job.
          // r24 to match HeroUI's .popover, which resolves to
          // min(32px, --radius-3xl) = 24px. Measured against the live
          // stylesheet, not inferred — the picker is a popover surface and
          // should not be the one overlay on the page with its own corner.
          //
          // Padding is uniform, and that is load-bearing rather than tidy.
          // Concentric nesting is outer = inner + padding, so r24 with an 8px
          // inset wants its children at r16 — but the inset has to be the
          // *same* on every edge for one radius to satisfy it. At 16px top and
          // 8px sides the top corners wanted one value and the sides another,
          // and the field's curve visibly fought the card's.
          "flex w-80 select-none flex-col gap-4 p-2 antialiased",
          "rounded-3xl bg-[var(--surface,#ffffff)]",
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
          data-slot="field"
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
            // Wider than tall. A square field is ~304px of height before the
            // sliders even start, which makes the popover tall enough to clip
            // against a viewport edge or push its own trigger off screen. 4:3
            // keeps both axes comfortably draggable while taking ~76px off.
            //
            // The cap is a backstop for hosts that widen the card past 320px,
            // not part of the normal path — at 320 the field is 228px and 4:3
            // holds. Set it below that and the ratio silently stops applying,
            // which is what a 200px cap was quietly doing here.
            //
            // r16 = card r24 - 8px padding. A nested surface reads as
            // concentric only when it steps down by the gap between them.
            // See RADIUS in tokens.ts.
            "relative aspect-[4/3] max-h-[240px] w-full touch-none rounded-2xl",
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
              // Same containment rule as the sliders: travel between the
              // insets, not 0-100%, so the thumb stays inside the field. At
              // s=0 v=0 it was centred on the corner and cleared the card.
              left: `calc(${state.hsv.s} * (100% - ${FIELD_THUMB_RADIUS * 2}px) + ${FIELD_THUMB_RADIUS}px)`,
              top: `calc(${1 - state.hsv.v} * (100% - ${FIELD_THUMB_RADIUS * 2}px) + ${FIELD_THUMB_RADIUS}px)`,
              background: solid,
              boxShadow: `0 0 0 3px ${fieldThumbRing}, 0 1px 4px rgb(0 0 0 / 0.4)`,
            }}
          />
        </div>

        {/* ------------------------------ Controls ------------------------------ */}
        {/* One spacing scale, three steps: 16px between sections, 12px
            between the two sliders, 6px from a label to the track it names.
            A single gap everywhere reads as one undifferentiated stack — the
            model select and the channel row are separate ideas and were
            sitting as close together as a label sits to its own slider. */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            {/* gap-1.5 + the hit area's 10px of invisible padding = the same 16px
                that separates every other section. -mb-2.5 cancels the
                trailing padding so the model row below sits 16px away too,
                rather than 26px. */}
            <div className="-mb-2.5 flex min-w-0 flex-1 flex-col gap-1.5">
              <LabelledSlider
                drag={hue}
                onKeyDown={handleHueKeys}
                disabled={disabled}
                label="Hue"
                showLabel={sliderLabels}
                readout={`${Math.round(state.hsv.h)}°`}
                valueNow={Math.round(state.hsv.h)}
                valueMax={360}
                valueText={`${Math.round(state.hsv.h)} degrees`}
                background={HUE_GRADIENT}
                fraction={state.hsv.h / 360}
                thumb={{ background: `hsl(${state.hsv.h} 100% 50%)` }}
                reducedMotion={reducedMotion}
              />

              {alpha && (
                <LabelledSlider
                  drag={opacity}
                  onKeyDown={handleOpacityKeys}
                  disabled={disabled}
                  label="Opacity"
                  showLabel={sliderLabels}
                  readout={`${Math.round(state.alpha * 100)}%`}
                  valueNow={Math.round(state.alpha * 100)}
                  valueMax={100}
                  valueText={`${Math.round(state.alpha * 100)} percent`}
                  background={CHECKERBOARD}
                  overlay={`linear-gradient(to right, transparent, ${solid})`}
                  fraction={state.alpha}
                  thumb={{ background: translucentThumb }}
                  reducedMotion={reducedMotion}
                />
              )}
            </div>

          </div>

          {/* --------------------------- Model + actions -------------------------- */}
          {(
          <div className="flex items-center gap-2">
            {/* A native select, deliberately. A custom listbox is several
                hundred lines of focus management and typeahead to arrive back
                where the platform already is — and it would be the only part of
                this package that needed a portal. */}
            <div className="relative flex h-10 min-w-0 flex-1 items-center rounded-2xl bg-[var(--default,#ebebec)]">
              <select
                data-slot="model-select"
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

            {/* The current colour, at the same 40px as the buttons either side
                so the row reads as one rank of circles. Checkerboard beneath,
                because a semi-transparent colour over the card would just look
                like a lighter colour — the transparency has to be visible or
                the preview is lying about the value. */}
            <div
              data-slot="preview"
              aria-hidden
              className="relative size-10 shrink-0 rounded-full"
              style={{ background: CHECKERBOARD }}
            >
              <div
                className="size-full rounded-full"
                style={{ backgroundColor: output }}
              />
              {/*
               * One hairline, on its own layer above both fills.
               *
               * It was on the checkerboard *and* on the colour disc, which are
               * coincident circles — two 1px rings antialiasing against the
               * same edge is what made the rim look brittle on dark colours.
               *
               * Black over a light colour, white over a dark one, rather than
               * one tinted neutral for both: a near-black hairline on a dark
               * swatch picks up the fill beneath it and reads as grime on the
               * edge instead of as a defined edge.
               */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `inset 0 0 0 1px ${
                    luminance(color.rgb) > 0.5
                      ? "rgb(0 0 0 / 0.12)"
                      : "rgb(255 255 255 / 0.16)"
                  }`,
                }}
              />
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

            {/* Copy rides with whichever row has the room. HEX is one field
                with space to spare, so it sits there, next to the value it
                copies. RGBA is four fields across 232px and every pixel the
                button takes comes straight out of them — "255" stops fitting
                long before the row looks full. */}
            {copyable && format !== "hex" && copyButton}
          </div>
          )}

          {/* ----------------------------- Channel row ---------------------------- */}
          {(
          <div className="flex items-center gap-2">
          <div
            data-slot="channels"
            id={channelGroupId}
            role="group"
            aria-label="Color channels"
            className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[var(--default,#ebebec)] px-2 py-1"
          >
            {format === "hex" ? (
              <>
                <label htmlFor={inputId} className="sr-only">
                  Hex color value
                </label>
                <input
                  data-slot="hex-input"
                  id={inputId}
                  value={draft ?? output}
                  disabled={disabled}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  // 9 = "#" + 8 digits, the longest form (#rrggbbaa). Without a
                  // cap the field accepted unbounded text that could never
                  // parse.
                  maxLength={9}
                  onChange={(event) => setHexDraft(event.target.value)}
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
                  onPreview={(text) => previewChannel(spec, text)}
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

            {copyable && format === "hex" && copyButton}
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
/*                                  Parts                                   */
/* -------------------------------------------------------------------------- */

/** The picker's presentational pieces. Kept out of the shell so the component
 *  file reads as composition rather than as a wall of markup. */


interface LabelledSliderProps {
  drag: ReturnType<typeof useTrackDrag>
  onKeyDown: (event: React.KeyboardEvent) => void
  disabled: boolean
  label: string
  readout: string
  /** Render the name/readout row. The slider keeps its aria-label either way. */
  showLabel: boolean
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
function LabelledSlider({
  drag,
  onKeyDown,
  disabled,
  label,
  readout,
  showLabel,
  valueNow,
  valueMax,
  valueText,
  background,
  overlay,
  fraction,
  thumb,
  reducedMotion,
}: LabelledSliderProps) {
  // No gap on the column, deliberately. The hit area is 40px around a 20px
  // rail, so it already carries 10px of invisible padding above the track —
  // a flex gap on top of that stacked to a 16px visual gap, exactly the space
  // that separates one *section* from the next. A label has to sit closer to
  // the thing it names than sections sit to each other, or the grouping reads
  // backwards.
  return (
    <div className="flex flex-col">
      {showLabel && (
        // Pulls the label into the hit area's 10px of internal padding rather
        // than adding to it. A plain gap could only ever make this bigger —
        // 10px was already the floor with no gap at all — and the negative
        // margin is on the label rather than on the track so the 16px between
        // sections is untouched. leading-none stops the 12px text carrying
        // another ~3px of leading below its glyphs, which is why this reads
        // tighter than the number alone suggests.
        <div className="-mb-0.5 flex items-center justify-between px-0.5 leading-none">
          <span className="text-[12px] text-[var(--muted,#71717a)]">
            {label}
          </span>
          {/* Tabular figures so the readout doesn't jitter while dragging. */}
          <span className="font-mono text-[12px] tabular-nums text-[var(--muted,#71717a)]">
            {readout}
          </span>
        </div>
      )}

      <div
        data-slot="slider"
        data-channel={label.toLowerCase()}
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
          // 20px visible track inside a 40px hit area — the bar stays slim
          // while the target clears the WCAG 2.5.5 minimum. The two are
          // separate elements precisely so the hit area can exceed the paint:
          // `trackRef` marks the 20px rail that defines 0-1, the handlers sit
          // on this padded parent.
          "relative flex h-10 touch-none items-center rounded-2xl",
          !disabled && "cursor-pointer",
          "outline-hidden focus-visible:ring-[3px] focus-visible:ring-[var(--focus,#0485f7)]/50",
        )}
      >
        <div
          data-slot="track"
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
 * The letter sits on the tray, not in the chip — inside, each chip would need
 * its own padding for a one-character label and four would not fit.
 * `spinbutton` carries the range to a screen reader and makes arrows expected.
 */
function ChannelField({
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
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <span
        aria-hidden
        className="shrink-0 text-[11px] text-[var(--muted,#71717a)]"
      >
        {spec.short}
      </span>
      <input
        data-slot="channel-input"
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
          "h-10 w-full min-w-0 rounded-xl bg-[var(--surface,#ffffff)] px-1 text-center",
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
      data-slot="action"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full",
        // #71717a, matching every other --muted fallback in this file. It read
        // #52525b, so a themed page rendered the icons and the slider labels
        // the same colour while an unthemed one rendered the icons darker —
        // one token resolving to two literals means the fallback does not
        // preserve the relationship the theme describes.
        "bg-[var(--default,#ebebec)] text-[var(--muted,#71717a)]",
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
      data-slot="thumb"
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

/* -------------------------------------------------------------------------- */
/*                                  Icons                                   */
/* -------------------------------------------------------------------------- */

/** Icons, inlined as paths — the package ships no icon dependency. */

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

/**
 * Filled pen, to match the copy glyph beside it — the stroked Lucide
 * eyedropper next to a filled copy mark read as two different icon sets.
 *
 * `fill` is currentColor, not the #B5B5B5 the export carried: the button owns
 * the colour so the icon can follow the theme and the hover state. A literal
 * grey here would sit unchanged on a dark card and ignore hover entirely.
 */
function EyedropperIcon() {
  return (
    <svg
      viewBox="9.002 16.003 20.004 20.004"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden
    >
      <path d="M28.126 16.883C26.953 15.71 25.075 15.71 23.902 16.883 23.902 16.883 21.79 18.995 21.79 18.995 21.79 18.995 20.969 18.174 20.969 18.174 20.5 17.704 19.795 17.704 19.327 18.174 19.327 18.174 18.388 18.995 18.388 18.995 17.918 19.464 17.918 20.168 18.388 20.638 18.388 20.638 24.254 26.504 24.254 26.504 24.723 26.973 25.427 26.973 25.896 26.504 25.896 26.504 26.717 25.683 26.717 25.683 27.187 25.213 27.187 24.509 26.717 24.04 26.717 24.04 26.014 23.219 26.014 23.219 26.014 23.219 28.126 21.106 28.126 21.106 29.298 19.934 29.298 18.056 28.126 16.883ZM12.404 28.381C9.823 30.962 11.348 32.135 9.002 35.185 9.002 35.185 9.823 36.007 9.823 36.007 12.874 33.66 14.047 35.185 16.628 32.604 16.628 32.604 22.611 26.621 22.611 26.621 22.611 26.621 18.388 22.397 18.388 22.397 18.388 22.397 12.404 28.381 12.404 28.381Z" />
    </svg>
  )
}

// The docs code blocks' copy glyph, duplicated as a path rather than imported
// — that button is built on HeroUI's, and this package takes no dependencies.
function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width={15} height={15} fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} width={15} height={15} strokeWidth={2.5}>
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
