import { readFile } from "node:fs/promises"
import path from "node:path"
import { highlight } from "fumadocs-core/highlight"
import { PreviewCode } from "@/components/preview"

/**
 * A package source file, rendered in the same code viewer the examples use —
 * clamped with the fade, expanded by the same button, copied by the same
 * control. A second collapse pattern on one page reads as two conventions.
 */
export async function ComponentSource({
  pkg,
  file,
  path: repoPath,
}: {
  pkg?: string
  file?: string
  /** Repo-relative path, for components that are not published packages. */
  path?: string
}) {
  const root = path.join(process.cwd(), "..", "..")
  const source = repoPath
    ? path.join(root, repoPath)
    : path.join(root, "packages", pkg!, "src", file!)
  const name = repoPath ? path.basename(repoPath) : file!

  let code: string
  try {
    code = await readFile(source, "utf8")
  } catch {
    return null
  }

  // defaultColor:false emits both themes as CSS variables instead of baking
  // one into an inline style, which no stylesheet can then override.
  const lang = name.endsWith(".ts") ? "typescript" : "tsx"

  const rendered = await highlight(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })

  return (
    <PreviewCode standalone label={name} lang={lang}>
      {rendered}
    </PreviewCode>
  )
}
