import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { Preview } from "@/components/preview"
import { ColorPickerDemo } from "@/components/demos/color-picker-demo"

/**
 * Components reachable from MDX without an import in every file. Demos are
 * registered here so a block page stays prose plus a one-line tag, which is
 * what keeps adding the next block cheap.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Preview,
    ColorPickerDemo,
    ...components,
  }
}
