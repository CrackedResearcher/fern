/** Inline SVGs — the package ships no icon dependency. */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

export function SearchIcon() {
  return (
    <svg {...iconProps} width={15} height={15}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      {...iconProps}
      width={14}
      height={14}
      strokeWidth={2.5}
      className="shrink-0 text-[var(--muted,#71717a)] transition-transform duration-150"
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path d="m6 9 6 6 6-6" />
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

export function CloseIcon() {
  return (
    <svg {...iconProps} width={12} height={12} strokeWidth={2.5}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/**
 * Empty-state mark: two stacked tiles with a globe knocked out of a disc.
 *
 * Drawn rather than shipped as an image. A greyscale PNG cannot follow the
 * theme — it needs an opacity hack to stop glaring on dark — whereas
 * currentColor at layered opacities reads on any surface, and the package
 * keeps its no-asset promise.
 *
 * The globe is stroked in `--surface` rather than filled, so it reads as cut
 * out of the disc and picks up whatever the panel behind it is.
 */
export function GlobeIcon() {
  return (
    <svg viewBox="0 0 96 96" width={84} height={84} fill="none" aria-hidden>
      {/* The back tile only peeks — enough to read as two cards, not enough to
          compete. It is also fainter, so the front one holds the focus. */}
      <rect
        x="26"
        y="21"
        width="52"
        height="52"
        rx="16"
        transform="rotate(6 52 47)"
        fill="currentColor"
        opacity="0.10"
      />
      <rect
        x="16"
        y="26"
        width="56"
        height="56"
        rx="17"
        fill="currentColor"
        opacity="0.15"
      />
      <circle cx="44" cy="54" r="18" fill="currentColor" opacity="0.28" />
      <g
        stroke="var(--surface, #ffffff)"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <circle cx="44" cy="54" r="11.5" />
        <path d="M32.5 54h23" />
        <ellipse cx="44" cy="54" rx="5.2" ry="11.5" />
      </g>
    </svg>
  )
}

