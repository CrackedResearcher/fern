import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config"
import { z } from "zod"

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    /**
     * `links` drives the resource chip row under a page description — their
     * Figma / Storybook / Source row. Theirs extracts it from the raw MDX with
     * a regex; declaring it in the frontmatter schema instead means a typo is a
     * build error rather than a silently missing row.
     */
    schema: frontmatterSchema.extend({
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
          }),
        )
        .optional(),
    }),
  },
})

export default defineConfig({
  mdxOptions: {
    /**
     * The same Shiki themes their docs site ships — the figure carries
     * `--shiki-light:#24292e; --shiki-dark:#e1e4e8`, which is github-light /
     * github-dark. Picking a different pair is the fastest way to make code
     * that is otherwise pixel-identical read as a different site.
     */
    rehypeCodeOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },
})
