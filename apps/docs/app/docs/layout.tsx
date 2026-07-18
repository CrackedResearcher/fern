import { DocsLayout } from "@/components/fumadocs/layouts/notebook"
import type { ReactNode } from "react"
import { source } from "@/lib/source"
import { FernMark } from "@/components/fern-mark"
import { HeaderActions } from "@/components/header-actions"

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
      // Their resolved layout variables. --fd-layout-width is 97rem/1552px —
      // the 1400px value exists in their CSS as an unused class. The rails are
      // 268px each; leaving them at the Fumadocs default made fern's sidebar
      // ~100px wider than theirs, which is the difference you notice first.
      containerProps={{
        className:
          "[--fd-layout-width:1552px] md:layout:[--fd-sidebar-width:268px] xl:layout:[--fd-toc-width:268px]",
      }}
      // `secondary: true` is what routes an item into #nd-nav-actions, the
      // right-hand cluster where theirs sits. nav.children renders beside the
      // logo instead, inside the sidebar column. githubUrl is deliberately not
      // set — HeaderActions already renders the GitHub button, and both would
      // put two of them in the bar.
      links={[
        {
          type: "custom",
          secondary: true,
          children: <HeaderActions />,
        },
      ]}
      themeSwitch={{ mode: "light-dark-system" }}
      nav={{
        title: (
          <span className="inline-flex items-center gap-2 font-semibold">
            <FernMark />
            fern
          </span>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
