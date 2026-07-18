"use client"

/**
 * A code viewer: filename bar, copy button, and a collapse for long files.
 *
 * Highlighting is deliberately not in here. Whatever you already use — Shiki,
 * Prism, a server-rendered string — goes in as `children`, which is what keeps
 * this dependency-free. The block owns the chrome and the behaviour.
 */

import * as React from "react"
import { CheckIcon, CopyIcon } from "./icons"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

/** Height the code is clamped to before it is worth offering to expand. */
const COLLAPSED_MAX = 150

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"

export interface CodeBlockProps {
  children: React.ReactNode
  /** Filename for the bar. Falls back to `lang` when not given, uppercased. */
  label?: string
  lang?: string
  /** Round all four corners. Off when the block is fused to something above. */
  standalone?: boolean
  /** Show the line-number gutter. Off by default — numbers are noise unless
   *  you are pointing at a specific line. */
  lineNumbers?: boolean
  /** Show the copy button in the bar. */
  copyable?: boolean
  className?: string
}

export function CodeBlock({
  children,
  label,
  lang,
  standalone = false,
  lineNumbers = false,
  copyable = true,
  className,
}: CodeBlockProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [overflows, setOverflows] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Measured, not derived: the height depends on font loading and container
  // width. Without it the Expand button rendered on every block, including
  // five-line ones where expanding changes nothing.
  React.useEffect(() => {
    const element = contentRef.current
    if (!element) return
    // A few px of tolerance: content landing within a rounding error of the
    // clamp would otherwise flip the button on and off as the layout settles.
    const measure = () => setOverflows(element.scrollHeight > COLLAPSED_MAX + 8)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const clamped = overflows && !expanded
  const bar = label ?? lang
  const surface =
    "bg-[var(--surface,#ffffff)] dark:bg-[var(--background,#060607)]"

  return (
    <div
      data-slot="code-block"
      data-has-bar={bar ? "" : undefined}
      className={cn(
        "code-section relative",
        standalone
          ? cn(
              "my-4 rounded-xl border border-[var(--separator,rgb(0_0_0/0.1))] bg-[var(--surface-secondary,#f4f4f5)]",
              // The bar fills the top when there is one; without it the
              // surface needs its own inset there or it sits flush to the edge.
              bar ? "px-1 pb-1" : "p-1",
            )
          : "rounded-b-xl border border-[var(--separator,rgb(0_0_0/0.1))] bg-transparent",
        className,
      )}
    >
      {bar && (
        <div
          data-slot="bar"
          className="flex items-center justify-between gap-3 bg-[var(--surface-secondary,#f4f4f5)] py-1 pr-1 pl-4"
        >
          <span className="font-mono text-xs text-[var(--foreground,#18181b)]">
            {label ?? lang?.toUpperCase()}
          </span>
          {copyable && <CopyButton targetRef={contentRef} />}
        </div>
      )}

      <div
        ref={contentRef}
        data-slot="content"
        data-line-numbers={lineNumbers || undefined}
        className={cn(
          "relative",
          clamped && "max-h-[150px] overflow-hidden",
          // A whole source file expands to tens of thousands of pixels, which
          // loses the page. Scroll it inside the block instead.
          !clamped && standalone && "max-h-[70vh] overflow-auto",
          standalone && cn("rounded-lg", surface),
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {children}
      </div>

      {/* A gradient over the content rather than a mask on it. mask-image fades
          the element's background too, so the surface thins out and lets what
          is behind it through. */}
      {clamped && (
        <div
          aria-hidden
          data-slot="fade"
          className={cn(
            "pointer-events-none absolute inset-x-1 bottom-1 h-24 rounded-b-lg",
            "bg-gradient-to-b from-transparent to-[var(--surface,#ffffff)]",
            "dark:to-[var(--background,#060607)]",
          )}
        />
      )}

      {overflows && (
        <button
          type="button"
          data-slot="toggle"
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            // 36px tall, 12px inline, r24 — HeroUI's .button--sm at
            // calc(--radius * 3), which is what this replaced. A plain button
            // keeps the package dependency-free, but it has to land on the
            // same metrics or the block stops matching the rest of the system.
            "absolute right-1/2 bottom-2 h-9 translate-x-1/2 rounded-3xl px-3",
            "bg-[var(--surface,#ffffff)] text-xs text-[var(--foreground,#18181b)]",
            "shadow-sm shadow-black/5",
            "transition-[background-color,scale] duration-150 active:scale-[0.97]",
            "hover:bg-[var(--default,#ebebec)]",
            "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus,#0485f7)]/50",
          )}
          style={{ transitionTimingFunction: EASE_OUT }}
        >
          {expanded ? "Collapse code" : "Expand code"}
        </button>
      )}
    </div>
  )
}

/**
 * Copies the block's text. Reads it off the rendered content rather than
 * taking it as a prop — the caller passes highlighted nodes, and the text a
 * reader is looking at is the text they mean to copy.
 */
function CopyButton({
  targetRef,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    const code = targetRef.current?.textContent
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      // Hold the handle so rapid presses reset one timer rather than stacking
      // several — otherwise the icon flickers as each stale timeout fires.
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }

  return (
    <button
      type="button"
      data-slot="copy"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className={cn(
        // Matches the toggle: 36px, same radius family.
        "grid size-9 shrink-0 place-items-center rounded-3xl",
        "text-[var(--muted,#71717a)]",
        "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
        "hover:bg-[var(--default,#ebebec)] hover:text-[var(--foreground,#18181b)]",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus,#0485f7)]/50",
      )}
      style={{ transitionTimingFunction: EASE_OUT }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}
