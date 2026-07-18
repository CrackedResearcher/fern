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
      // No collapse control. Theirs has none in the header — the toggle was
      // rendering at the far right where their language icon sits.
      sidebar={{ collapsible: false }}
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
        /* "top" is not cosmetic: it centres the search, keeps the logo on
           desktop, and widens the trigger (index.tsx:353-410). "auto" gives a
           narrow left-aligned search and no logo. */
        mode: "top",
        // Their version sits beside the logo, not in the right-hand cluster —
        // `<div class="flex items-center gap-4">logo v3.2.2 ⌄</div>`.
        title: (
          <span className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2.5 font-semibold">
              <FernMark />
              fern
            </span>
            {/* Their version trigger: muted, xs→sm, with a chevron, and
                hidden below lg. */}
            <span className="mt-1 hidden items-center gap-1.5 py-1 text-left text-xs font-medium text-muted transition-opacity hover:opacity-80 lg:flex sm:text-sm">
              v0.1.0
              <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </span>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
