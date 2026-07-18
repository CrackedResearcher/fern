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
 * Empty-state mark: two tilted cards with a globe.
 *
 * Geometry from the Paper export, with its literal whites swapped for tokens —
 * a white card on a white panel is invisible, so the front card takes the
 * panel's own surface and is defined by its shadow, which reads on either
 * theme. The globe is a tint of the foreground rather than a fixed grey.
 */
export function GlobeIcon() {
  const CARD = 100
  const scale = 0.66

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: 132 * scale,
        height: 126 * scale,
      }}
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
            left: 0,
            top: 0,
            width: CARD,
            height: CARD,
            borderRadius: 22,
            transformOrigin: "top left",
            rotate: "5deg",
            translate: "30.472px 0.472px",
            // The back card recedes; the front leads. A foreground tint moves
            // the right way on both themes — darker on light, lighter on dark
            // — where a literal white vanished into the panel on light and
            // glared on dark.
            background:
              "color-mix(in oklab, var(--foreground, #18181b) 4%, var(--surface, #ffffff))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CARD,
            height: CARD,
            borderRadius: 22,
            transformOrigin: "top left",
            rotate: "352deg",
            translate: "0 13.917px",
            background:
              "color-mix(in oklab, var(--foreground, #18181b) 8%, var(--surface, #ffffff))",
            boxShadow: "0 1px 4px rgb(0 0 0 / 0.08)",
          }}
        />
        <svg
          viewBox="0 0 70.02 70.02"
          width="70"
          height="70"
          style={{ position: "absolute", left: 21.472, top: 21.472 }}
        >
          <path
            fillRule="nonzero"
            fill="color-mix(in oklab, var(--foreground, #18181b) 20%, transparent)"
            d="M70.014 35.007C70.014 41.932 67.962 48.699 64.115 54.457 60.269 60.213 54.801 64.7 48.404 67.35 42.008 69.999 34.968 70.693 28.178 69.342 21.387 67.991 15.15 64.657 10.253 59.762 5.357 54.866 2.023 48.627 0.672 41.837-0.678 35.046 0.015 28.008 2.665 21.61 5.314 15.214 9.801 9.747 15.559 5.9 21.315 2.054 28.084 0 35.007 0 44.291 0 53.196 3.689 59.761 10.253 66.327 16.818 70.014 25.723 70.014 35.007ZM57.018 35.034C57.018 30.681 55.728 26.424 53.308 22.805 50.89 19.185 47.452 16.364 43.431 14.698 39.408 13.033 34.984 12.596 30.713 13.446 26.443 14.295 22.522 16.392 19.443 19.469 16.365 22.548 14.269 26.47 13.419 30.739 12.57 35.009 13.006 39.435 14.672 43.457 16.338 47.479 19.159 50.917 22.778 53.335 26.399 55.754 30.655 57.044 35.007 57.044 37.898 57.044 40.761 56.475 43.431 55.369 46.101 54.263 48.528 52.642 50.571 50.598 52.615 48.554 54.237 46.128 55.342 43.457 56.45 40.787 57.018 37.924 57.018 35.034ZM24.711 33.283C24.711 33.283 16.58 33.283 16.58 33.283 16.899 29.958 18.11 26.779 20.086 24.085 22.06 21.39 24.728 19.279 27.804 17.977 28.097 17.853 28.388 17.738 28.68 17.63 26.108 22.45 24.746 27.821 24.711 33.283ZM24.711 36.784C24.747 42.246 26.111 47.619 28.684 52.437 28.386 52.329 28.094 52.214 27.804 52.092 24.725 50.792 22.055 48.683 20.078 45.988 18.102 43.292 16.893 40.112 16.58 36.784 16.58 36.784 24.711 36.784 24.711 36.784ZM28.212 33.283C28.289 31.223 28.528 29.172 28.925 27.149 29.323 25.013 29.976 22.935 30.872 20.956 32.137 18.265 33.76 16.523 35.007 16.523 36.254 16.523 37.878 18.265 39.142 20.956 40.039 22.935 40.691 25.013 41.09 27.149 41.487 29.172 41.725 31.223 41.803 33.283 41.803 33.283 28.212 33.283 28.212 33.283ZM41.803 36.784C41.725 38.844 41.487 40.895 41.09 42.92 40.691 45.054 40.037 47.132 39.142 49.111 37.878 51.806 36.254 53.544 35.007 53.544 33.76 53.544 32.137 51.806 30.872 49.111 29.977 47.132 29.323 45.054 28.925 42.92 28.528 40.896 28.289 38.844 28.212 36.784 28.212 36.784 41.803 36.784 41.803 36.784ZM48.095 21.945C51.145 24.984 53.034 28.996 53.434 33.283 53.434 33.283 45.304 33.283 45.304 33.283 45.268 27.821 43.905 22.449 41.33 17.63 41.628 17.738 41.922 17.855 42.21 17.981 44.411 18.908 46.41 20.255 48.095 21.945ZM45.304 36.784C45.304 36.784 53.434 36.784 53.434 36.784 53.116 40.109 51.905 43.288 49.928 45.982 47.954 48.677 45.286 50.788 42.21 52.092 41.919 52.216 41.627 52.333 41.334 52.441 43.909 47.621 45.271 42.248 45.304 36.784Z"
          />
        </svg>
      </div>
    </div>
  )
}


