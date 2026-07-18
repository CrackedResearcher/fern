/**
 * Color math. No dependencies.
 *
 * Ranges: h 0-360, s/v/a 0-1, r/g/b 0-255.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let rgb: [number, number, number]
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / d + 2)
    else h = 60 * ((rn - gn) / d + 4)
  }
  if (h < 0) h += 360

  return { h, s: max === 0 ? 0 : d / max, v: max }
}

const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")

export function rgbToHex({ r, g, b }: RGB, a = 1): string {
  const base = `#${hex2(r)}${hex2(g)}${hex2(b)}`
  return a >= 1 ? base : `${base}${hex2(a * 255)}`
}

/**
 * Parses #rgb, #rgba, #rrggbb, and #rrggbbaa. Returns null when unparseable,
 * which lets the hex input keep invalid text on screen while the user types
 * instead of destroying it mid-keystroke.
 */
export function parseHex(input: string): { rgb: RGB; a: number } | null {
  const hex = input.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null

  let full: string
  if (hex.length === 3 || hex.length === 4) {
    full = hex
      .split("")
      .map((c) => c + c)
      .join("")
  } else if (hex.length === 6 || hex.length === 8) {
    full = hex
  } else {
    return null
  }

  const int = parseInt(full.slice(0, 6), 16)
  return {
    rgb: { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 },
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  }
}

export interface HSL {
  h: number
  s: number
  l: number
}

export function hsvToHsl({ h, s, v }: HSV): HSL {
  const l = v * (1 - s / 2)
  const denom = Math.min(l, 1 - l)
  return { h, s: denom === 0 ? 0 : (v - l) / denom, l }
}

/**
 * Inverse of `hsvToHsl`. Needed because the HSL channel fields are authored in
 * HSL but the picker's state is HSV — without this, typing into the S or L
 * field would have no way back into the model the field and sliders read from.
 */
export function hslToHsv({ h, s, l }: HSL): HSV {
  const v = l + s * Math.min(l, 1 - l)
  return { h, s: v === 0 ? 0 : 2 * (1 - l / v), v }
}

export type ColorFormat = "hex" | "rgb" | "hsl"

/** The full colour, in every representation, handed to change callbacks. */
export interface Color {
  hex: string
  rgb: RGB
  hsl: HSL
  hsv: HSV
  alpha: number
}

const round = (n: number, places = 0) => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

/** Serialises to CSS. Alpha is omitted entirely when fully opaque. */
export function formatColor(color: Color, format: ColorFormat): string {
  const { rgb, hsl, alpha } = color
  const a = round(alpha, 2)

  if (format === "rgb") {
    return a >= 1
      ? `rgb(${rgb.r} ${rgb.g} ${rgb.b})`
      : `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${a})`
  }
  if (format === "hsl") {
    const h = round(hsl.h)
    const s = round(hsl.s * 100)
    const l = round(hsl.l * 100)
    return a >= 1 ? `hsl(${h} ${s}% ${l}%)` : `hsl(${h} ${s}% ${l}% / ${a})`
  }
  return color.hex
}

/** Builds the full colour record from the picker's internal HSV + alpha. */
export function toColor(hsv: HSV, alpha: number, withAlpha: boolean): Color {
  const rgb = hsvToRgb(hsv)
  return {
    hex: rgbToHex(rgb, withAlpha ? alpha : 1),
    rgb,
    hsl: hsvToHsl(hsv),
    hsv,
    alpha: withAlpha ? alpha : 1,
  }
}

/** Relative luminance per WCAG 2.1, used to pick a legible thumb ring. */
export function luminance({ r, g, b }: RGB): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
