"use client"

import { Button } from "@heroui/react"
import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Live demo with its source fused to the bottom edge, as one box.
 *
 * Their `.component-preview-container`: the preview pane is closed on three
 * sides with a top radius, and the code section below supplies the bottom edge.
 * The preview deliberately omits its own bottom border — drawing both would put
 * a 2px seam through the middle of the box.
 *
 * Used as two slots so a fenced code block can live inside it in MDX:
 *
 *   <Preview>
 *     <PreviewDemo><ColorPickerDemo /></PreviewDemo>
 *     <PreviewCode>
 *     ```tsx
 *     …
 *     ```
 *     </PreviewCode>
 *   </Preview>
 *
 * The slots are separate exports rather than `Preview.Demo` / `Preview.Code`.
 * Preview is a client component, and static properties hung off one do not
 * survive the RSC boundary — by the time MDX resolves the dotted name on the
 * server it is undefined, and the page 500s with "Expected component
 * `Preview.Code` to be defined".
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
}: {
  children: ReactNode
  standalone?: boolean
  label?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  /**
   * Whether the snippet is actually taller than the clamp.
   *
   * A genuine outside-React measurement, not derived state — the height depends
   * on font loading and container width, neither of which React knows about, so
   * it has to be observed rather than computed. Without this the button
   * rendered on every block, including five-line ones where expanding and
   * collapsing look identical and the control is pure noise.
   */
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
      className={
        standalone
          ? "code-section relative my-4 overflow-hidden rounded-xl border border-separator bg-transparent"
          : "code-section relative rounded-b-xl border border-separator bg-transparent"
      }
    >
      {label && (
        <div className="flex items-center justify-between border-b border-separator bg-surface-secondary px-4 py-2">
          <span className="font-mono text-xs text-foreground">{label}</span>
        </div>
      )}
      <div
        ref={contentRef}
        className={
          clamped
            ? // Opaque for the first 20%, then fading out, so the cut reads as
              // "there is more" rather than as a crop.
              "docs-code-block-wrapper relative max-h-[150px] overflow-hidden [mask-image:linear-gradient(#000_0%_20%,transparent_100%)]"
            : standalone
              // A whole source file expands to tens of thousands of pixels,
              // which loses the page. Scroll it inside the block instead.
              ? "docs-code-block-wrapper relative max-h-[70vh] overflow-auto"
              : "docs-code-block-wrapper relative"
        }
      >
        {children}
      </div>
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
