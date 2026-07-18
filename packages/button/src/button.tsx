"use client"

/**
 * A button matched to the HeroUI v3 `.button` spec, without the dependency.
 *
 * HeroUI's own Button is a thin wrapper over `react-aria-components`, and its
 * stylesheet keys every state off *both* a `data-*` attribute and the native
 * pseudo-class (`.button:hover, .button[data-hovered=true]`). That second half
 * is what makes this possible: the pseudo-classes alone reproduce the visual
 * contract, so the whole react-aria tree can go.
 *
 * What is lost with it is react-aria's press abstraction — unified pointer,
 * touch and keyboard handling, and the context that lets a Popover or Dropdown
 * adopt a button as its trigger. This is a button, not a trigger primitive.
 */

import * as React from "react"
import { mergeClasses } from "./merge-classes"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "outline"
  | "danger"
  | "danger-soft"

export type ButtonSize = "sm" | "md" | "lg"

/**
 * The four properties every variant drives, mirroring HeroUI's own structure.
 * Keeping the indirection means a variant is four values rather than four
 * class strings, and hover/pressed stay in one place.
 */
type ButtonVars = React.CSSProperties &
  Record<"--btn-bg" | "--btn-bg-hover" | "--btn-bg-pressed" | "--btn-fg", string>

/**
 * Literal fallbacks are the light-theme defaults converted from HeroUI's oklch
 * source, so the button renders correctly with no theme loaded at all.
 * `--accent` is oklch(62.04% .195 253.83) → #0485f7, and so on.
 */
const VARIANTS: Record<ButtonVariant, ButtonVars> = {
  primary: {
    "--btn-bg": "var(--accent, #0485f7)",
    "--btn-bg-hover": "var(--accent-hover, #0479dd)",
    "--btn-bg-pressed": "var(--accent-hover, #0479dd)",
    "--btn-fg": "var(--accent-foreground, #ffffff)",
  },
  secondary: {
    "--btn-bg": "var(--default, #ebebec)",
    "--btn-bg-hover": "var(--default-hover, #e2e2e4)",
    "--btn-bg-pressed": "var(--default-hover, #e2e2e4)",
    "--btn-fg": "var(--accent-soft-foreground, #0b6bc4)",
  },
  // Deliberately inherits `--btn-fg`. HeroUI's tertiary sets no foreground, so
  // it takes the surrounding text colour — that is what makes it the neutral
  // choice inside a toolbar.
  tertiary: {
    "--btn-bg": "var(--default, #ebebec)",
    "--btn-bg-hover": "var(--default-hover, #e2e2e4)",
    "--btn-bg-pressed": "var(--default-hover, #e2e2e4)",
    "--btn-fg": "currentColor",
  },
  ghost: {
    "--btn-bg": "transparent",
    "--btn-bg-hover": "var(--default, #ebebec)",
    "--btn-bg-pressed": "var(--default, #ebebec)",
    "--btn-fg": "var(--default-foreground, #18181b)",
  },
  outline: {
    "--btn-bg": "transparent",
    // 60% rather than the flat `--default` the other variants use: an outlined
    // button already reads as a surface, so a full-strength hover fill makes it
    // jump forward more than the others do.
    "--btn-bg-hover": "color-mix(in srgb, var(--default, #ebebec) 60%, transparent)",
    "--btn-bg-pressed": "var(--default, #ebebec)",
    "--btn-fg": "var(--default-foreground, #18181b)",
  },
  danger: {
    "--btn-bg": "var(--danger, #ff383c)",
    "--btn-bg-hover": "var(--danger-hover, #f22e33)",
    "--btn-bg-pressed": "var(--danger-hover, #f22e33)",
    "--btn-fg": "var(--danger-foreground, #ffffff)",
  },
  "danger-soft": {
    "--btn-bg": "color-mix(in oklab, var(--danger, #ff383c) 15%, transparent)",
    "--btn-bg-hover": "color-mix(in oklab, var(--danger, #ff383c) 20%, transparent)",
    "--btn-bg-pressed": "color-mix(in oklab, var(--danger, #ff383c) 20%, transparent)",
    "--btn-fg": "var(--danger-soft-foreground, #cc2427)",
  },
}

/**
 * Heights shrink at `md`, which is HeroUI's own behaviour — 40/36/44 below the
 * breakpoint, 36/32/40 above it. Tailwind v4 resolves `h-10` to
 * `calc(var(--spacing) * 10)`, the same expression HeroUI compiles to, so a
 * consumer who retunes `--spacing` keeps both in step.
 *
 * The press scale is per size on purpose: a fixed ratio makes a small button
 * look like it barely moves and a large one look like it collapses.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm md:h-8 active:scale-[0.98]",
  md: "h-10 px-4 text-sm md:h-9 active:scale-[0.97]",
  lg: "h-11 px-4 text-base md:h-10 active:scale-[0.96]",
}

/** The one variant that is not purely a colour swap. */
const VARIANT_CLASS: Partial<Record<ButtonVariant, string>> = {
  outline: "border border-[var(--border,#dedee0)]",
}

/** Icon-only trades the inline padding for a fixed width, one step per size. */
const ICON_ONLY: Record<ButtonSize, string> = {
  sm: "w-9 px-0 md:w-8",
  md: "w-10 px-0 md:w-9",
  lg: "w-11 px-0 md:w-10",
}

const ICON =
  "[&_svg:not([data-slot=spinner]_svg)]:pointer-events-none " +
  "[&_svg:not([data-slot=spinner]_svg)]:shrink-0 " +
  "[&_svg:not([data-slot=spinner]_svg)]:self-center " +
  // The negative inline margin claws back part of the gap: an icon's glyph
  // rarely fills its own box, so the optical gap reads wider than the set one.
  "[&_svg:not([data-slot=spinner]_svg)]:-mx-0.5 " +
  "[&_svg:not([data-slot=spinner]_svg)]:size-5 " +
  "md:[&_svg:not([data-slot=spinner]_svg)]:size-4"

const BASE =
  "relative isolate inline-flex w-fit items-center justify-center gap-2 " +
  "rounded-[calc(var(--radius,0.5rem)*3)] " +
  "font-medium whitespace-nowrap select-none " +
  // Opts out of the ~300ms delay a browser holds a tap for in case it becomes
  // a double-tap zoom. Without it every press on touch feels a beat late.
  "touch-manipulation " +
  "cursor-[var(--cursor-interactive,pointer)] " +
  // `[color:…]` rather than `text-[…]`: `text-` is the font-size family as far
  // as the merge is concerned, and a size override must not strip the colour.
  "bg-[var(--btn-bg)] [color:var(--btn-fg)] " +
  "hover:bg-[var(--btn-bg-hover)] active:bg-[var(--btn-bg-pressed)] " +
  "outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[var(--focus,#0485f7)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background,#ffffff)] " +
  "disabled:pointer-events-none disabled:opacity-[var(--disabled-opacity,0.5)] " +
  "disabled:cursor-[var(--cursor-disabled,not-allowed)] " +
  // Only the three properties that actually change. `transition: all` would
  // also ease the ring, which should appear instantly on focus.
  "transition-[transform,background-color,box-shadow] " +
  "motion-reduce:transition-none motion-reduce:active:scale-100"

export interface ButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "color"> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Square, sized to the height, with the inline padding removed. */
  isIconOnly?: boolean
  fullWidth?: boolean
  /** Alias for `disabled`, so a HeroUI call site swaps over unchanged. */
  isDisabled?: boolean
  /** Alias for `onClick`, likewise. Both fire if both are given. */
  onPress?: React.MouseEventHandler<HTMLButtonElement>
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isIconOnly = false,
      fullWidth = false,
      isDisabled,
      disabled,
      onPress,
      onClick,
      className,
      style,
      type = "button",
      ...rest
    },
    ref,
  ) {
    // Applied in stages rather than concatenated. Emitting both `px-4` and
    // `px-0` and hoping the right one wins is what produced icon-only buttons
    // with the text variant's padding — Tailwind gives them equal specificity,
    // so the stylesheet's own ordering decided it, not this file.
    let classes = mergeClasses(BASE + " " + ICON, SIZES[size])
    classes = mergeClasses(classes, VARIANT_CLASS[variant])
    if (isIconOnly) classes = mergeClasses(classes, ICON_ONLY[size])
    if (fullWidth) classes = mergeClasses(classes, "w-full")

    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        data-slot="button"
        disabled={isDisabled ?? disabled}
        className={mergeClasses(classes, className)}
        style={{
          ...VARIANTS[variant],
          // The compositor hint pairs with `will-change`: without it the first
          // press repaints on the main thread and the scale visibly hitches.
          transform: "translateZ(0)",
          willChange: "transform",
          transitionDuration: "250ms, 100ms, 100ms",
          transitionTimingFunction: "ease, cubic-bezier(0, 0, 0.2, 1), cubic-bezier(0, 0, 0.2, 1)",
          ...style,
        }}
        onClick={(event) => {
          onClick?.(event)
          onPress?.(event)
        }}
      />
    )
  },
)
