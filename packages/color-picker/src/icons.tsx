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
export function EyedropperIcon() {
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

/**
 * The same copy glyph the docs' code blocks use — two overlapping rounded
 * squares, filled — so a reader sees one copy affordance on the page rather
 * than two marks that nearly match.
 *
 * Duplicated as a path rather than imported: the docs button is built on
 * HeroUI's `<Button>`, and this package takes no runtime dependency beyond
 * React. A shared 16×16 path costs nothing and is the part that actually
 * carries the resemblance.
 */
export function CopyIcon() {
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

export function CheckIcon() {
  return (
    <svg {...iconProps} width={15} height={15} strokeWidth={2.5}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}


export function ChevronIcon() {
  return (
    <svg {...iconProps} width={11} height={11} strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
