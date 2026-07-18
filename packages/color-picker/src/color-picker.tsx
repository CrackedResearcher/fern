"use client"

import * as React from "react"
import {
  clamp,
  formatColor,
  hslToHsv,
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
import {
  CHECKERBOARD,
  EASE_OUT,
  HUE_GRADIENT,
  MODELS,
  FIELD_THUMB_RADIUS,
  THUMB_RADIUS,
  type ChannelSpec,
} from "./constants"
import { usePrefersReducedMotion, useTrackDrag } from "./hooks"
import { ChannelField, IconSwap, LabelledSlider, RoundButton, Thumb } from "./parts"
import { CheckIcon, ChevronIcon, CopyIcon, EyedropperIcon } from "./icons"
import { cn } from "./utils"

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
    /**
     * The colour at full opacity, built from the channels rather than by
     * overriding `alpha` on the record.
     *
     * `formatColor(..., "hex")` returns the precomputed `color.hex`, which
     * already has alpha baked into it, so spreading `{ alpha: 1 }` over the
     * record changed a field the hex branch never reads. The result was that
     * `solid` carried the alpha it was meant to strip: at 0% opacity the
     * opacity thumb faded out completely and the track's end stop went
     * transparent, so the slider stopped showing which colour it was fading
     * towards at exactly the end where you need to see it.
     */
    const solid = rgbToHex(color.rgb, 1)

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
     * Filters to hex as it is typed, and previews as soon as the digits form a
     * complete colour — 3, 4, 6 or 8 of them.
     *
     * Length is what makes this safe to do live where a channel field is not.
     * `#ab` is not a colour at any length, so it previews nothing; `#abc` is
     * unambiguously one. There is no equivalent of the `7`-then-`77` problem
     * because an incomplete hex string simply does not parse.
     *
     * Anything pasted that is not hex (an `rgb(...)` string) is left alone for
     * blur to handle, rather than being stripped down to its digits.
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

    /**
     * Live preview while typing, but only from a *complete* in-range value.
     *
     * REDESIGN.md argued against per-keystroke commits on the grounds that
     * typing `7` toward `77` drives the colour to 7 first. That risk is real
     * but it is a property of partial input, not of live updating: the field is
     * filtered to digits and capped at the width of its own maximum, so the
     * only values reaching here are ones the channel can actually hold. An
     * empty or out-of-range field previews nothing and waits for blur.
     */
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
            <div className="flex min-w-0 flex-1 flex-col gap-3">
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
                  thumb={{ background: solid }}
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
            id={channelGroupId}
            role="group"
            aria-label="Color channels"
            className="flex h-12 min-w-0 flex-1 items-center gap-1 rounded-2xl bg-[var(--default,#ebebec)] p-1"
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
