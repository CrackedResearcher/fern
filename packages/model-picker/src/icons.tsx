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
      className="shrink-0 text-[var(--fern-muted,#71717a)] transition-transform duration-150"
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size} strokeWidth={2.5}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function CloseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size} strokeWidth={2.5}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/** Locked rows. A shackle that reads at 12px — closed, not ajar. */
export function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size} strokeWidth={2}>
      <rect x="4" y="10.5" width="16" height="10.5" rx="3" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

/** Strengths. */
export function PlusIcon({ size = 13 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/** Limitations. Deliberately a minus rather than a warning triangle — a
 *  tradeoff is not an alert, and the triangle made every model look broken. */
export function MinusIcon({ size = 13 }: { size?: number }) {
  return (
    <svg {...iconProps} width={size} height={size} strokeWidth={2.5}>
      <path d="M5 12h14" />
    </svg>
  )
}

/**
 * Empty-state mark: two tilted cards behind a chip.
 *
 * Drawn rather than shipped as an image — the packages ship no assets, and a
 * raster mark cannot follow the theme. Colours are tints of the foreground so
 * they move the right way on both: darker on light, lighter on dark.
 */
export function EmptyMark() {
  const CARD = 100
  const scale = 0.6
  const tint = (percent: number) =>
    `color-mix(in oklab, var(--fern-foreground, #18181b) ${percent}%, var(--fern-surface, #ffffff))`

  return (
    <div
      aria-hidden
      style={{ position: "relative", width: 132 * scale, height: 126 * scale }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: 132,
          height: 126,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: CARD,
            height: CARD,
            borderRadius: 22,
            transformOrigin: "top left",
            rotate: "5deg",
            translate: "30.472px 0.472px",
            background: tint(4),
          }}
        />
        <div
          style={{
            position: "absolute",
            width: CARD,
            height: CARD,
            borderRadius: 22,
            transformOrigin: "top left",
            rotate: "352deg",
            translate: "0 13.917px",
            background: tint(8),
            boxShadow: "0 1px 4px rgb(0 0 0 / 0.08)",
          }}
        />
        <svg
          viewBox="0 0 24 24"
          width="62"
          height="62"
          fill="none"
          stroke="color-mix(in oklab, var(--fern-foreground, #18181b) 22%, transparent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", left: 25, top: 25 }}
        >
          <rect x="7" y="7" width="10" height="10" rx="2.5" />
          <path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
        </svg>
      </div>
    </div>
  )
}
