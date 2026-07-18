import { readFile } from "node:fs/promises"
import path from "node:path"
import { highlight } from "fumadocs-core/highlight"
import { PreviewCode } from "@/components/preview"
import { CodeActions } from "@/components/code-actions"

/**
 * A package source file, rendered in the same code viewer the examples use —
 * clamped with the fade, expanded by the same button, copied by the same
 * control. A second collapse pattern on one page reads as two conventions.
 */
export async function ComponentSource({
  pkg,
  file,
}: {
  pkg: string
  file: string
}) {
  const source = path.join(process.cwd(), "..", "..", "packages", pkg, "src", file)

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

  return (
    <PreviewCode standalone label={file}>
      <figure className="relative m-0">
        <CodeActions className="absolute top-2 right-2 z-10" />
        {rendered}
      </figure>
    </PreviewCode>
  )
}
