import { DocsLayout } from "fumadocs-ui/layouts/notebook"
import type { ReactNode } from "react"
import { source } from "@/lib/source"
import { FernMark } from "@/components/fern-mark"

/**
 * The Notebook layout with `tabMode: "navbar"` — the same combination
 * heroui.com runs, confirmed by the `id="nd-notebook-layout"` element and the
 * two-row `#nd-subnav` header in their served HTML.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      tabMode="navbar"
      // 1552px is their resolved --fd-layout-width (97rem). The 1400px value
      // exists in their CSS as an unused class; taking it would narrow every
      // rail by ~150px.
      containerProps={{
        className: "[--fd-layout-width:1552px]",
      }}
      nav={{
        title: (
          <span className="inline-flex items-center gap-2 font-semibold">
            <FernMark />
            fern
          </span>
        ),
      }}
      links={[
        {
          text: "GitHub",
          url: "https://github.com/CrackedResearcher/fern",
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  )
}
