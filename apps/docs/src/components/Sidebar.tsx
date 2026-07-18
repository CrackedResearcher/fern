import { cn, EASE } from "../lib/cn"
import { href } from "../lib/router"
import { CATEGORIES, REGISTRY } from "../registry"
import { CloseIcon } from "./icons"

function NavList({ slug, onNavigate }: { slug: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-7">
      {CATEGORIES.map((category) => (
        <div key={category} className="flex flex-col gap-1">
          <h2 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            {category}
          </h2>
          {REGISTRY.filter((block) => block.category === category).map((block) => {
            const active = block.slug === slug
            const planned = block.status === "planned"
            return (
              // A dot marker plus colour and weight, rather than a filled pill.
              // At sidebar density a solid background on every active row makes
              // the rail feel heavier than the content it indexes.
              <a
                key={block.slug}
                href={planned ? undefined : href(block.slug)}
                onClick={planned ? undefined : onNavigate}
                aria-current={active ? "page" : undefined}
                aria-disabled={planned || undefined}
                data-active={active || undefined}
                className={cn(
                  // Active is an accent *tint*, not a raised white pill. Their
                  // rail states the current page with bg-accent/10 and accent
                  // text; a lifted surface chip reads heavier than the content
                  // it indexes and made the rail compete with the page.
                  "relative flex flex-row items-center justify-between gap-2 rounded-lg p-2 text-sm text-start",
                  "transition-colors hover:transition-none",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  planned && "cursor-not-allowed opacity-45",
                  active
                    ? "bg-accent/10 font-medium text-accent"
                    : !planned && "text-muted hover:bg-default/50 hover:text-foreground/80",
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <span>{block.name}</span>
                {planned && (
                  <span className="chip chip--default chip--primary h-5 rounded-full px-1.5 text-[10px] text-muted/90">
                    Soon
                  </span>
                )}
              </a>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ slug }: { slug: string }) {
  return (
    <aside className="sticky top-[104px] h-[calc(100vh-104px)] overflow-y-auto ps-4 pe-4 pt-6">
      <NavList slug={slug} />
    </aside>
  )
}

/** Mobile drawer. Slides rather than fades so the direction implies dismissal. */
export function MobileNav({
  slug,
  open,
  onClose,
}: {
  slug: string
  open: boolean
  onClose: () => void
}) {
  return (
    <div
      className={cn("fixed inset-0 z-40 lg:hidden", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionTimingFunction: EASE }}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-72 overflow-y-auto bg-background px-4 py-5",
          "border-r border-separator transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-xl text-foreground-muted hover:bg-default"
          >
            <CloseIcon />
          </button>
        </div>
        <NavList slug={slug} onNavigate={onClose} />
      </div>
    </div>
  )
}
