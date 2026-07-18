import type { ReactNode } from "react"

/**
 * Live preview frame.
 *
 * Structure and metrics are their `.component-preview-container`: a 350px-min
 * pane closed on three sides with a top radius, sitting directly on top of the
 * code block so the two read as one box. The border deliberately omits the
 * bottom edge — the code section beneath supplies it, and doubling them would
 * draw a 2px seam through the middle.
 */
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="component-preview-container group relative my-4 w-full">
      <div className="preview not-prose relative flex min-h-[350px] w-full items-center justify-center overflow-hidden rounded-t-xl border-t border-r border-l border-separator p-4 sm:p-10">
        {children}
      </div>
    </div>
  )
}
