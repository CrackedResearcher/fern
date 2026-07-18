import { useEffect, useState, useSyncExternalStore } from "react"
import { BlockPage, tocFor } from "./components/BlockPage"
import { CommandPalette } from "./components/CommandPalette"
import { Header, type ThemeMode } from "./components/Header"
import { type Preset } from "./components/ThemePicker"
import { MobileNav, Sidebar } from "./components/Sidebar"
import { TableOfContents } from "./components/TableOfContents"
import { useRoute } from "./lib/router"
import { REGISTRY } from "./registry"

const THEME_KEY = "fern-theme"
const PRESET_KEY = "fern-preset"
const VIBRANT_KEY = "fern-vibrant"
const DARK_QUERY = "(prefers-color-scheme: dark)"

function subscribeToSystemTheme(callback: () => void) {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

function initialTheme(): ThemeMode {
  const fromUrl = new URLSearchParams(window.location.search).get("theme")
  if (fromUrl === "dark" || fromUrl === "light") return fromUrl
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === "dark" || stored === "light" || stored === "system") return stored
  return "system"
}

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme)
  const [searchOpen, setSearchOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [stars, setStars] = useState<string | null>(null)
  const [preset, setPreset] = useState<Preset>(
    () => (window.localStorage.getItem(PRESET_KEY) as Preset | null) ?? "default",
  )
  const [vibrant, setVibrant] = useState(
    () => window.localStorage.getItem(VIBRANT_KEY) === "true",
  )
  const route = useRoute()

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
  const dark = theme === "system" ? systemDark : theme === "dark"

  // A route that isn't a block is a real page, not a fallback. Silently
  // showing REGISTRY[0] made the tab bar lie about where you were.
  // The empty route is the landing page and lands on the first block; any
  // other unknown route renders a real page instead.
  const block =
    REGISTRY.find((entry) => entry.slug === route) ??
    (route === "" ? REGISTRY[0] : undefined)
  const isBlockRoute = Boolean(block)

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(PRESET_KEY, preset)
    window.localStorage.setItem(VIBRANT_KEY, String(vibrant))
  }, [preset, vibrant])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Scroll to top on route change — otherwise a short page inherits the
  // previous page's scroll position and opens halfway down.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  // Star count is decoration; if the request fails the pill just renders
  // without a number rather than showing a zero that looks like a real value.
  useEffect(() => {
    let active = true
    fetch("https://api.github.com/repos/CrackedResearcher/fern")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (!active || !data?.stargazers_count) return
        const count = data.stargazers_count
        setStars(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div
      className={dark ? "dark" : ""}
      data-preset={preset === "default" ? undefined : preset}
      data-vibrant={vibrant || undefined}
    >
      <div className="min-h-screen bg-background text-foreground">
        <Header
          theme={theme}
          onSetTheme={setTheme}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNav={() => setNavOpen(true)}
          stars={stars}
          preset={preset}
          onSetPreset={setPreset}
          vibrant={vibrant}
          onSetVibrant={setVibrant}
        />

        {/* 12-column grid rather than fixed widths: the content column then
            scales with the viewport instead of the rails eating into it, and
            the TOC only claims space once there is room for it (xl). */}
        <div className="mx-auto grid max-w-[1440px] grid-cols-12 px-6">
          <div className="hidden lg:col-span-2 lg:block">
            <Sidebar slug={block?.slug ?? ""} />
          </div>
          <main className="col-span-12 min-w-0 py-10 lg:col-span-10 lg:px-12 xl:col-span-8">
            {block ? (
              <BlockPage block={block} dark={dark} />
            ) : (
              <StubPage route={route} />
            )}
          </main>
          <div className="hidden xl:col-span-2 xl:block">
            {isBlockRoute && block && (
              <TableOfContents entries={tocFor(block)} />
            )}
          </div>
        </div>

        <MobileNav
          slug={block?.slug ?? ""}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  )
}

const STUBS: Record<string, { title: string; body: string }> = {
  "getting-started": {
    title: "Getting Started",
    body: "Installation and setup guides land here. Until then, each block page carries its own install command and usage example.",
  },
  changelog: {
    title: "Changelog",
    body: "Release notes land here once the first version is published to npm.",
  },
}

/** Real page for a route that exists in the nav but has no content yet.
 *  Better than silently rendering the first block, which made the tab bar
 *  claim you were somewhere you weren't. */
function StubPage({ route }: { route: string }) {
  const stub = STUBS[route]
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-balance">
        {stub?.title ?? "Not found"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-foreground-muted">
        {stub?.body ?? "That page does not exist."}
      </p>
    </article>
  )
}
