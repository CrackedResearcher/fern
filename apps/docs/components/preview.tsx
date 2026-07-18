"use client"

import { Button } from "@heroui/react"
import { useState, type ReactNode } from "react"

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

export function PreviewCode({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="code-section relative rounded-b-xl border border-separator bg-transparent">
      <div
        className={
          expanded
            ? "docs-code-block-wrapper relative"
            : // Opaque for the first 20%, then fading out, so the cut reads as
              // "there is more" rather than as a crop.
              "docs-code-block-wrapper relative max-h-[150px] overflow-hidden [mask-image:linear-gradient(#000_0%_20%,transparent_100%)]"
        }
      >
        {children}
      </div>
      <Button
        size="sm"
        variant="tertiary"
        className="absolute right-1/2 bottom-2 translate-x-1/2 bg-surface text-xs shadow-sm shadow-black/5"
        onPress={() => setExpanded((value) => !value)}
      >
        {expanded ? "Collapse code" : "Expand code"}
      </Button>
    </div>
  )
}
