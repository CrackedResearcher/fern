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
