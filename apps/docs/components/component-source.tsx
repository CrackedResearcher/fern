import { readFile } from "node:fs/promises"
import path from "node:path"
import { highlight } from "fumadocs-core/highlight"
import { CodeActions } from "@/components/code-actions"

/**
 * Renders a package source file for copy-paste, collapsed.
 *
 * A native <details> rather than a client toggle: the block is closed on load,
 * costs no JavaScript, and is keyboard-operable and findable by browser search
 * without any work.
 */
export async function ComponentSource({
  pkg,
  file,
}: {
  pkg: string
  file: string
}) {
  const source = path.join(
    process.cwd(),
    "..",
    "..",
    "packages",
    pkg,
    "src",
    file,
  )

  let code: string
  try {
    code = await readFile(source, "utf8")
  } catch {
    return null
  }

  const rendered = await highlight(code, {
    lang: file.endsWith(".ts") ? "typescript" : "tsx",
    themes: { light: "github-light", dark: "github-dark" },
  })

  const lines = code.split("\n").length

  return (
    <details className="not-prose group my-4 overflow-hidden rounded-xl border border-separator">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-surface-secondary px-4 py-3 text-sm">
        <span className="font-mono text-foreground">{file}</span>
        <span className="flex items-center gap-3 text-muted">
          <span className="text-xs tabular-nums">{lines} lines</span>
          <span className="text-xs group-open:hidden">Show</span>
          <span className="hidden text-xs group-open:inline">Hide</span>
        </span>
      </summary>
      <figure className="docs-code-block-wrapper relative m-0 max-h-[60vh] overflow-auto border-t border-separator">
        <CodeActions className="sticky top-2 z-10 float-right mr-2" />
        {rendered}
      </figure>
    </details>
  )
}
