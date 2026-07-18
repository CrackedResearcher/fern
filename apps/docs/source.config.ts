import { defineConfig, defineDocs } from "fumadocs-mdx/config"

export const docs = defineDocs({
  dir: "content/docs",
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
