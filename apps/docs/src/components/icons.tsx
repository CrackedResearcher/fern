const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

export function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function MenuIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function MonitorIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  )
}

export function BookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

export function BlocksIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect width="7" height="7" x="3" y="3" rx="1.5" />
      <rect width="7" height="7" x="14" y="3" rx="1.5" />
      <rect width="7" height="7" x="3" y="14" rx="1.5" />
      <rect width="7" height="7" x="14" y="14" rx="1.5" />
    </svg>
  )
}

export function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
    </svg>
  )
}

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10Z" />
    </svg>
  )
}

export function FernMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21V8m0 0c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Zm0 5c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Zm0 4c0-3-2-5-5-5 0 3 2 5 5 5Zm0-1c0-3 2-5 5-5 0 3-2 5-5 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
