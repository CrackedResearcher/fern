import { readFile } from "node:fs/promises"
import path from "node:path"
import { codeToHtml } from "shiki"

/**
 * Highlighted source for a file, on demand.
 *
 * The alternative is inlining every file into the page, which put the color
 * picker page at 161KB gzipped — most of it collapsed source a reader never
 * opens — and repeatedly exhausted the dev server's heap re-highlighting it on
 * each edit. Fetching on expand keeps the page light and lets a component show
 * every file it actually needs.
 */
export async function GET(request: Request) {
  const file = new URL(request.url).searchParams.get("file")
  // Anchored to the repo and refusing traversal: this reads from disk on a
  // caller-supplied path, so the resolved target has to stay inside it.
  if (!file || file.includes("..") || path.isAbsolute(file)) {
    return new Response("Bad request", { status: 400 })
  }

  const root = path.join(process.cwd(), "..", "..")
  const target = path.resolve(root, file)
  if (!target.startsWith(root + path.sep)) {
    return new Response("Bad request", { status: 400 })
  }

  let code: string
  try {
    code = await readFile(target, "utf8")
  } catch {
    return new Response("Not found", { status: 404 })
  }

  // Shiki's own string output, rather than rendering React nodes to markup —
  // a route handler importing react-dom/server is both slower and something
  // Next refuses outright.
  const html = await codeToHtml(code, {
    lang: target.endsWith(".ts") ? "typescript" : "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })

  return Response.json({ html, lines: code.split("\n").length })
}
