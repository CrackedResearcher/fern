import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { cache } from "react"
import { source } from "@/lib/source"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/components/fumadocs/layouts/notebook/page"
import { notFound } from "next/navigation"
import { getMDXComponents } from "@/components/mdx"
import { CopyMarkdown, ResourceLinks } from "@/components/page-actions"

/**
 * Page structure mirrors their docs app's own `page.tsx` (heroui v3,
 * apps/docs/src/app/[lang]/docs/[[...slug]]/page.tsx):
 *
 *   <section className="flex flex-col gap-2">
 *     <div className="flex flex-wrap items-center justify-between gap-2">
 *       <DocsTitle/> … <ViewOptions/>
 *     </div>
 *     <DocsDescription className="text-md mt-2 mb-4"/>
 *     <ComponentLinks/>
 *   </section>
 *   <DocsBody className="prose-sm"/>
 *
 * The title row is a *justify-between* flex, which is what puts the copy
 * control opposite the heading rather than under it. Getting that wrapper
 * wrong is why fern's pages read as bare next to theirs even once the shell
 * matched.
 */
/** Raw MDX for the copy button, read the same way their docs app reads it. */
const getRawMDX = cache(async (pagePath: string): Promise<string> => {
  try {
    return await readFile(join(process.cwd(), "content/docs", pagePath), "utf-8")
  } catch {
    return ""
  }
})

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const links = page.data.links ?? []
  const raw = await getRawMDX(page.path)

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DocsTitle className="flex items-center gap-2">
            {page.data.title}
          </DocsTitle>
          {page.data.toc.length > 0 && (
            <div className="flex items-center gap-2">
              <CopyMarkdown markdown={raw} />
            </div>
          )}
        </div>
        <DocsDescription className="text-md mt-2 mb-4">
          {page.data.description}
        </DocsDescription>
        <ResourceLinks links={links} />
      </section>

      <DocsBody className="prose-sm">
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
