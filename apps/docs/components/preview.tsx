"use client"

import { Button } from "@heroui/react"
import { useState, type ReactNode } from "react"

/**
 * Live preview plus its source, as one box.
 *
 * Structure and metrics come from their `.component-preview-container`: a
 * 350px-min pane closed on three sides with a top radius, sitting directly on
 * a code section that supplies the bottom edge. The preview's border
 * deliberately omits its bottom — doubling the two would draw a 2px seam
 * through the middle of the box.
 *
 * The code starts collapsed to 150px under a fade mask, which is what stops a
 * long example from burying the next heading.
 */
export function Preview({
  children,
  code,
}: {
  children: ReactNode
  code?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="component-preview-container group relative my-4 w-full">
      <div className="preview not-prose relative flex min-h-[350px] w-full items-center justify-center overflow-hidden rounded-t-xl border-t border-r border-l border-separator p-4 sm:p-10">
        {children}
      </div>

      {code && (
        <div className="code-section relative rounded-b-xl border border-separator bg-transparent">
          <div
            className={
              expanded
                ? "relative"
                : // mask-to-bottom: opaque for the first 20%, fading out — so
                  // the cut reads as "there is more" rather than as a crop.
                  "relative max-h-[150px] overflow-hidden [mask-image:linear-gradient(#000_0%_20%,transparent_100%)]"
            }
          >
            {code}
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
      )}
    </div>
  )
}
