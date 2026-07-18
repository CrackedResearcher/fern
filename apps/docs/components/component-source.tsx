"use client"

import { useEffect, useRef, useState } from "react"
import { PreviewCode } from "@/components/preview"

/**
 * A source file, fetched and highlighted on first expand.
 *
 * Inlining every file put the color picker page at 161KB gzipped, nearly all of
 * it collapsed source a reader never opens, and exhausted the dev server's heap
 * re-highlighting it on each edit. The blocks are closed by default, so loading
 * on open costs nothing a reader sees — and it lets a component list every file
 * it needs rather than a subset that would leave the copy-paste broken.
 */
export function ComponentSource({
  pkg,
  file,
  path,
}: {
  pkg?: string
  file?: string
  /** Repo-relative path, for components that are not published packages. */
  path?: string
}) {
  const target = path ?? `packages/${pkg}/src/${file}`
  const name = target.split("/").pop() ?? target
  const lang = name.endsWith(".ts") ? "typescript" : "tsx"

  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load once the block is opened, not on mount — that is the whole point.
  useEffect(() => {
    const section = ref.current?.closest(".code-section")
    if (!section) return
    let done = false
    const load = () => {
      if (done) return
      done = true
      fetch(`/api/source?file=${encodeURIComponent(target)}`)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((data) => setHtml(data.html))
        .catch(() => setFailed(true))
    }
    const button = [...section.querySelectorAll("button")].find((element) =>
      /Expand/.test(element.textContent ?? ""),
    )
    // No Expand button means the block is short enough to render whole, so
    // there is nothing to defer.
    if (!button) load()
    else button.addEventListener("click", load, { once: true })
    return () => button?.removeEventListener("click", load)
  }, [target])

  return (
    <PreviewCode standalone label={name} lang={lang}>
      <div ref={ref} className="docs-code-block-wrapper">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="shiki shiki-themes m-0 px-4 py-4 text-[13px] text-muted">
            <code>{failed ? `Could not load ${name}` : `Loading ${name}…`}</code>
          </pre>
        )}
      </div>
    </PreviewCode>
  )
}
