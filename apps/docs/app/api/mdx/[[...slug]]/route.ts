import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { source } from "@/lib/source"

/**
 * Serves a page's raw MDX as plain text, for the "View as Markdown" action and
 * for anything pointing an assistant at a page.
 *
 * Their site serves this at `<page-url>.mdx`. Next cannot route a dotted
 * suffix alongside the page itself, so fern uses a sibling path instead — the
 * content is the same, only the URL shape differs.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) return new Response("Not found", { status: 404 })

  try {
    const raw = await readFile(
      join(process.cwd(), "content/docs", page.path),
      "utf-8",
    )
    return new Response(raw, {
      headers: { "content-type": "text/markdown; charset=utf-8" },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
