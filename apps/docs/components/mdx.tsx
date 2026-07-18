import defaultMdxComponents from "fumadocs-ui/mdx"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import type { MDXComponents } from "mdx/types"
import type { ComponentProps } from "react"
import { Preview, PreviewCode, PreviewDemo } from "@/components/preview"
import { CodeActions } from "@/components/code-actions"
import { PropsTable } from "@/components/props-table"
import { ComponentSource } from "@/components/component-source"
import { InstallTabs } from "@/components/install-tabs"
import {
  CountryPickerDemo,
  CountryPickerPlain,
  CountryPickerPriority,
} from "@/components/demos/country-picker-demo"
import {
  ColorPickerCommit,
  ColorPickerDemo,
  ColorPickerMinimal,
  ColorPickerModel,
} from "@/components/demos/color-picker-demo"

/**
 * Components reachable from MDX without an import in every file. Demos are
 * registered here so a block page stays prose plus a one-line tag, which is
 * what keeps adding the next block cheap.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    /**
     * Fumadocs' own copy button is swapped out through the Actions slot so the
     * block carries HeroUI's copy glyph on a HeroUI button, matching theirs.
     * `allowCopy` is off because CodeActions supplies its own.
     */
    pre: ({ ref: _ref, ...props }: ComponentProps<"pre">) => (
      <CodeBlock {...props} allowCopy={false} Actions={CodeActions}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    Preview,
    PreviewDemo,
    PreviewCode,
    PropsTable,
    ComponentSource,
    InstallTabs,
    ColorPickerDemo,
    ColorPickerModel,
    ColorPickerCommit,
    ColorPickerMinimal,
    CountryPickerDemo,
    CountryPickerPriority,
    CountryPickerPlain,
    ...components,
  }
}
