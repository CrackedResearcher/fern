"use client"

import type { ReactNode } from "react"
import { CodeBlock } from "@fern-ui/code-block"

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

/**
 * Thin wrapper over the published block, so the docs site and the package
 * cannot drift — what a reader sees here is what they install.
 */
export function PreviewCode({
  children,
  standalone = false,
  label,
  lang,
  lineNumbers = false,
}: {
  children: ReactNode
  standalone?: boolean
  label?: string
  lang?: string
  lineNumbers?: boolean
}) {
  return (
    <CodeBlock
      standalone={standalone}
      label={label}
      lang={lang}
      lineNumbers={lineNumbers}
      // A fenced block brings its own copy button from the MDX pre override,
      // so the block's would be a second one on the same code.
      copyable={Boolean(label ?? lang)}
      className="docs-code-block-wrapper"
    >
      {children}
    </CodeBlock>
  )
}
