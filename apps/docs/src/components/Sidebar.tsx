import { cn, EASE } from "../lib/cn"
import { href } from "../lib/router"
import { CATEGORIES, REGISTRY } from "../registry"
import { CloseIcon } from "./icons"

function NavList({ slug, onNavigate }: { slug: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-7">
      {CATEGORIES.map((category) => (
        <div key={category} className="flex flex-col gap-1">
          <h2 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            {category}
          </h2>
          {REGISTRY.filter((block) => block.category === category).map((block) => {
            const active = block.slug === slug
            const planned = block.status === "planned"
            return (
              <a
                key={block.slug}
                href={planned ? undefined : href(block.slug)}
                onClick={planned ? undefined : onNavigate}
                aria-current={active ? "page" : undefined}
                aria-disabled={planned || undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px]",
                  "transition-colors duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  planned && "cursor-not-allowed opacity-45",
                  active
                    ? "bg-surface-2 font-medium text-fg"
                    : !planned && "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                {block.name}
                {planned && (
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
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
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-divider px-4 py-8 md:block">
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
      className={cn("fixed inset-0 z-40 md:hidden", !open && "pointer-events-none")}
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
          "absolute inset-y-0 left-0 w-72 overflow-y-auto bg-bg px-4 py-5",
          "border-r border-divider transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-xl text-fg-muted hover:bg-surface-2"
          >
            <CloseIcon />
          </button>
        </div>
        <NavList slug={slug} onNavigate={onClose} />
      </div>
    </div>
  )
}
