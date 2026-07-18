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
      <div className="mx-auto flex h-13 max-w-[1400px] md:h-14 items-center gap-3 px-4 sm:px-6">
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
        <button
          type="button"
          onClick={onOpenSearch}
          className="search-field__group mx-auto hidden w-full max-w-md cursor-pointer md:inline-flex"
        >
          <span className="search-field__search-icon">
            <SearchIcon />
          </span>
          <span className="search-field__input text-left text-field-placeholder">
            Search documentation…
          </span>
          <kbd className="kbd mr-2 h-5 px-1.5 font-mono text-[10px]">⌘K</kbd>
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
              choice, and a binary switch silently discards it. Structured as
              their tab list so the selected segment gets the same lifted
              `--segment` chip their segmented controls use. */}
          <div
            role="group"
            aria-label="Theme"
            className="tabs__list-container hidden sm:block"
          >
            <div className="tabs__list" data-orientation="horizontal">
              {THEMES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSetTheme(id)}
                  aria-label={label}
                  aria-pressed={theme === id}
                  data-selected={theme === id || undefined}
                  className="tabs__tab size-7 !w-7 !px-0"
                >
                  {/* The selected chip is a sibling behind the label rather
                      than a background on it, matching how their indicator
                      sits at z-index -1 under the tab. */}
                  {theme === id && <span className="tabs__indicator" />}
                  <Icon size={14} />
                </button>
              ))}
            </div>
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

      {/* Row two: section tabs. Their secondary tab variant — a flat row with
          an accent underline indicator — rather than the pill variant. */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <nav
          className="tabs tabs--secondary"
          data-orientation="horizontal"
          aria-label="Documentation sections"
        >
          <div className="tabs__list-container">
            <div className="tabs__list" data-orientation="horizontal">
              {TABS.map(({ id, label, Icon }) => {
                const active = activeTab === id
                return (
                  <a
                    key={id}
                    href={href(id === "components" ? REGISTRY[0]!.slug : id)}
                    aria-current={active ? "page" : undefined}
                    data-selected={active || undefined}
                    className="tabs__tab h-10 w-auto gap-2 px-3"
                  >
                    {active && <span className="tabs__indicator" />}
                    <Icon size={15} />
                    {label}
                  </a>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
