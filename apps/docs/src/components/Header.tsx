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

const iconButton = cn(
  "grid size-9 place-items-center rounded-xl text-foreground-muted",
  "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
  "hover:bg-default hover:text-foreground",
  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
)

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
        <span className="hidden shrink-0 rounded-full bg-default px-2 py-0.5 font-mono text-[11px] text-foreground-muted sm:block">
          0.1.0
        </span>

        {/* A button rather than a real input: it opens a palette, and a text
            field that refuses typing is a worse lie than a button. */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            "mx-auto hidden h-9 w-full max-w-md items-center gap-2.5 rounded-xl px-3 md:flex",
            "border border-separator bg-background-secondary text-[13px] text-foreground-muted",
            "transition-colors duration-150 hover:bg-default",
            "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
          )}
          style={{ transitionTimingFunction: EASE }}
        >
          <SearchIcon />
          <span>Search documentation…</span>
          <kbd className="ml-auto rounded-md bg-default-hover px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
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
              choice, and a binary switch silently discards it. */}
          <div className="hidden items-center gap-0.5 rounded-full border border-separator p-0.5 sm:flex">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSetTheme(id)}
                aria-label={label}
                aria-pressed={theme === id}
                className={cn(
                  "grid size-7 place-items-center rounded-full transition-colors duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  theme === id
                    ? "bg-default text-foreground"
                    : "text-foreground-muted hover:text-foreground",
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          <a
            href="https://github.com/CrackedResearcher/fern"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border border-separator px-3",
              "text-[13px] text-foreground-muted transition-colors duration-150",
              "hover:bg-default hover:text-foreground",
              "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <GitHubIcon />
            {stars && <span className="hidden tabular-nums sm:inline">{stars}</span>}
          </a>
        </div>
      </div>

      {/* Row two: section tabs */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <nav className="flex h-10 items-end gap-1 overflow-x-auto md:gap-3">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <a
                key={id}
                href={href(id === "components" ? REGISTRY[0]!.slug : id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-1 pb-2 pt-1.5 text-[13.5px]",
                  "transition-colors duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                  active
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-foreground-muted hover:text-foreground",
                )}
                style={{ transitionTimingFunction: EASE }}
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
