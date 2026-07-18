import { cn, EASE } from "../lib/cn"
import { href } from "../lib/router"
import {
  FernMark,
  GitHubIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "./icons"

const iconButton = cn(
  "grid size-9 place-items-center rounded-xl text-fg-muted",
  "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
  "hover:bg-surface-2 hover:text-fg",
  "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
)

export function Header({
  dark,
  onToggleTheme,
  onOpenSearch,
  onOpenNav,
}: {
  dark: boolean
  onToggleTheme: () => void
  onOpenSearch: () => void
  onOpenNav: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className={cn(iconButton, "md:hidden")}
          style={{ transitionTimingFunction: EASE }}
        >
          <MenuIcon />
        </button>

        <a href={href("")} className="flex items-center gap-2">
          <FernMark />
          <span className="text-[15px] font-semibold tracking-tight">fern</span>
        </a>
        <span className="hidden rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-fg-muted sm:block">
          0.1.0
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {/* A fake input rather than a real one: it opens a palette, and a
              text field that refuses typing is a worse lie than a button. */}
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(
              "flex h-9 items-center gap-2 rounded-xl border border-divider px-3",
              "text-[13px] text-fg-muted",
              "transition-colors duration-150 hover:bg-surface-2",
              "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-2 hidden rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            className={iconButton}
            style={{ transitionTimingFunction: EASE }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          <a
            href="https://github.com/CrackedResearcher/fern"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className={iconButton}
            style={{ transitionTimingFunction: EASE }}
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </header>
  )
}
