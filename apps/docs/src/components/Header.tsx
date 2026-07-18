import { cn, EASE } from "../lib/cn"
import { href, useRoute } from "../lib/router"
import { REGISTRY } from "../registry"
import {
  BookIcon,
  BlocksIcon,
  FernMark,
  GitHubIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SparkIcon,
  SunIcon,
} from "./icons"
import { ThemePicker, type Preset } from "./ThemePicker"

export type ThemeMode = "light" | "dark" | "system"

const TABS = [
  { id: "getting-started", label: "Getting Started", Icon: BookIcon },
  { id: "components", label: "Components", Icon: BlocksIcon },
  { id: "changelog", label: "Changelog", Icon: SparkIcon },
]

const THEMES: { id: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { id: "light", label: "Light theme", Icon: SunIcon },
  { id: "dark", label: "Dark theme", Icon: MoonIcon },
  { id: "system", label: "System theme", Icon: MonitorIcon },
]

/**
 * Their button classes, not a hand-rolled equivalent. `.button` already
 * carries the press scale, the hover timing, the focus ring, the reduced-motion
 * opt-out and the tap-highlight suppression — restating any of that here is how
 * the two drift apart. The modifiers are exactly the ones their own docs site
 * uses for header controls.
 */
const iconButton = "button button--ghost button--icon-only button--sm text-muted"

export function Header({
  theme,
  onSetTheme,
  onOpenSearch,
  onOpenNav,
  stars,
  preset,
  onSetPreset,
  vibrant,
  onSetVibrant,
}: {
  theme: ThemeMode
  onSetTheme: (mode: ThemeMode) => void
  onOpenSearch: () => void
  onOpenNav: () => void
  stars: string | null
  preset: Preset
  onSetPreset: (preset: Preset) => void
  vibrant: boolean
  onSetVibrant: (vibrant: boolean) => void
}) {
  const route = useRoute()
  // Every block route lives under the Components tab, so it stays lit while
  // reading any block page rather than only on the tab's own landing route.
  const activeTab = REGISTRY.some((block) => block.slug === route)
    ? "components"
    : route || "components"

  return (
    // Opaque, not translucent. A blurred bar over scrolling content is a
    // nice trick that costs a compositing layer and smears the type behind
    // it; a solid bar with a hairline reads cleaner at this density.
    <header className="sticky top-0 z-30 bg-background after:absolute after:bottom-[-1px] after:left-1/2 after:h-px after:w-screen after:-translate-x-1/2 after:bg-separator after:content-['']">
      {/* Row one: identity, search, actions */}
      <div className="mx-auto flex h-13 max-w-[1552px] items-center gap-3 px-4 md:h-14 md:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className={cn(iconButton, "lg:hidden")}
          style={{ transitionTimingFunction: EASE }}
        >
          <MenuIcon />
        </button>

        <a href={href("")} className="flex shrink-0 items-center gap-2">
          <FernMark />
          <span className="text-[15px] font-semibold tracking-tight">fern</span>
        </a>
        <span className="chip chip--default chip--primary hidden h-5 shrink-0 rounded-full px-1.5 font-mono text-[10px] text-muted/90 sm:inline-flex">
          0.1.0
        </span>

        {/* A button rather than a real input: it opens a palette, and a text
            field that refuses typing is a worse lie than a button. It still
            borrows the search field's shell so it is indistinguishable from
            the real control it stands in for. */}
        {/* Their trigger: field-background, field-shadow, 12px radius, *no*
            border, capped at 300px then 400px, and the label is the single
            word "Search" with ⌘ and K as two separate keycaps pushed right.
            fern had a full-width bordered bar reading "Search documentation…",
            which is a visibly different control. */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            "my-auto hidden w-full max-w-[300px] items-center gap-2 rounded-field p-1.5 ps-2.5 text-sm md:inline-flex md:max-w-[400px] lg:me-12",
            "bg-field text-field-placeholder shadow-field",
            "transition-colors duration-150 hover:bg-field-hover",
            "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
          )}
          style={{ transitionTimingFunction: EASE }}
        >
          <SearchIcon />
          <span>Search</span>
          <span className="ms-auto inline-flex gap-0.5">
            <kbd className="kbd h-5 px-1.5 text-[10px]">⌘</kbd>
            <kbd className="kbd h-5 px-1.5 text-[10px]">K</kbd>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className={cn(iconButton, "md:hidden")}
            style={{ transitionTimingFunction: EASE }}
          >
            <SearchIcon size={16} />
          </button>

          <ThemePicker
            preset={preset}
            onSetPreset={onSetPreset}
            vibrant={vibrant}
            onSetVibrant={onSetVibrant}
          />

          {/* Three-way rather than a toggle: "follow the OS" is a distinct
              choice, and a binary switch silently discards it. Their control is
              a bordered pill holding three 26px round buttons — not a segmented
              tab tray, which is what fern had it as. */}
          <div
            role="group"
            aria-label="Theme"
            className="hidden items-center rounded-full border p-1 sm:inline-flex"
          >
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSetTheme(id)}
                aria-label={label}
                aria-pressed={theme === id}
                className={cn(
                  "grid size-6.5 place-items-center rounded-full p-1.5 transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  theme === id
                    ? "bg-default text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <a
            href="https://github.com/CrackedResearcher/fern"
            target="_blank"
            rel="noreferrer"
            className="button button--outline button--sm gap-2 text-muted"
          >
            <GitHubIcon />
            {stars && <span className="hidden tabular-nums sm:inline">{stars}</span>}
          </a>
        </div>
      </div>

      {/* Row two: section tabs. A plain 2px accent underline on the link
          itself — not the tabs component. Their markup uses border-b-2 with a
          sliding-free indicator, and an `#nd-subnav` rule repoints the border
          colour at --accent. */}
      <div className="mx-auto max-w-[1552px] px-4 md:px-6">
        <nav
          className="flex h-10 flex-row items-end gap-1 overflow-x-auto md:gap-3"
          aria-label="Documentation sections"
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <a
                key={id}
                href={href(id === "components" ? REGISTRY[0]!.slug : id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium text-nowrap",
                  "transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                <Icon size={15} />
                {label}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
