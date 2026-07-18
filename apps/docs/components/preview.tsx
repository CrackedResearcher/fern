"use client"

import { Button } from "@heroui/react"
import { CodeActions } from "@/components/code-actions"
import { cn } from "@/components/cn"
import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Live demo with its source fused to the bottom edge, as one box. The demo
 * omits its bottom border because the code section supplies it — drawing both
 * puts a 2px seam through the middle.
 *
 * Separate exports rather than `Preview.Demo`: static properties on a client
 * component do not survive the RSC boundary, and MDX resolves the dotted name
 * on the server, where it is undefined.
 */
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="component-preview-container group relative my-4 w-full">
      {children}
    </div>
  )
}

export function PreviewDemo({ children }: { children: ReactNode }) {
  return (
    <div className="preview not-prose relative flex min-h-[350px] w-full items-center justify-center overflow-hidden rounded-t-xl border-t border-r border-l border-separator p-4 sm:p-10">
      {children}
    </div>
  )
}

/** Height the code is clamped to before it is worth offering to expand. */
const COLLAPSED_MAX = 150

export function PreviewCode({
  children,
  /** Standalone blocks round all four corners; fused ones only the bottom. */
  standalone = false,
  label,
  lang,
  lineNumbers = false,
}: {
  children: ReactNode
  standalone?: boolean
  /** Filename for the bar. Falls back to `lang` when not given. */
  label?: string
  lang?: string
  lineNumbers?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Measured, not derived: the height depends on font loading and container
  // width. Without it the Expand button rendered on every block, including
  // five-line ones where expanding changes nothing.
  useEffect(() => {
    const element = contentRef.current
    if (!element) return
    // A few px of tolerance: content that lands within a rounding error of the
    // clamp would otherwise flip the button on and off as the layout settles.
    const measure = () =>
      setOverflows(element.scrollHeight > COLLAPSED_MAX + 8)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const clamped = overflows && !expanded

  return (
    <div
      data-has-bar={(label ?? lang) ? "" : undefined}
      className={
        standalone
          ? cn(
              "code-section relative my-4 rounded-xl border border-separator bg-surface-secondary",
              // The bar fills the top when there is one; without it the surface
              // needs its own inset there or it sits flush to the edge.
              (label ?? lang) ? "px-1 pb-1" : "p-1",
            )
          : "code-section relative rounded-b-xl border border-separator bg-transparent"
      }
    >
      {(label ?? lang) && (
        <div className="flex items-center justify-between gap-3 bg-surface-secondary py-1 pr-1 pl-4">
          <span className="font-mono text-xs text-foreground">
            {label ?? lang?.toUpperCase()}
          </span>
          <CodeActions />
        </div>
      )}
      <div
        ref={contentRef}
        data-line-numbers={lineNumbers || undefined}
        className={
          clamped
            ? cn(
                "docs-code-block-wrapper relative max-h-[150px] overflow-hidden",
                standalone && "rounded-lg bg-surface dark:bg-background",
              )
            : standalone
              // A whole source file expands to tens of thousands of pixels,
              // which loses the page. Scroll it inside the block instead.
              ? "docs-code-block-wrapper relative max-h-[70vh] overflow-auto rounded-lg bg-surface dark:bg-background"
              : "docs-code-block-wrapper relative"
        }
      >
        {children}
      </div>
      {/* A gradient over the content rather than a mask on it. mask-image fades
          the element's background too, so the surface thinned out and let the
          shell grey through exactly where the fade was strongest. */}
      {clamped && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-1 bottom-1 h-24 rounded-b-lg",
            "bg-gradient-to-b from-transparent to-surface dark:to-background",
          )}
        />
      )}
      {overflows && (
        <Button
          size="sm"
          variant="tertiary"
          className="absolute right-1/2 bottom-2 translate-x-1/2 bg-surface text-xs shadow-sm shadow-black/5"
          onPress={() => setExpanded((value) => !value)}
        >
          {expanded ? "Collapse code" : "Expand code"}
        </Button>
      )}
    </div>
  )
}
