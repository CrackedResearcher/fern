import { useEffect, useState, useSyncExternalStore } from "react"
import { BlockPage, tocFor } from "./components/BlockPage"
import { CommandPalette } from "./components/CommandPalette"
import { Header, type ThemeMode } from "./components/Header"
import { MobileNav, Sidebar } from "./components/Sidebar"
import { TableOfContents } from "./components/TableOfContents"
import { useRoute } from "./lib/router"
import { REGISTRY } from "./registry"

const THEME_KEY = "fern-theme"
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
  const route = useRoute()

  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  )
  const dark = theme === "system" ? systemDark : theme === "dark"

  const block = REGISTRY.find((entry) => entry.slug === route) ?? REGISTRY[0]!

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

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
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-bg text-fg">
        <Header
          theme={theme}
          onSetTheme={setTheme}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNav={() => setNavOpen(true)}
          stars={stars}
        />

        <div className="mx-auto flex max-w-[1440px]">
          <Sidebar slug={block.slug} />
          <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12">
            <BlockPage block={block} dark={dark} />
          </main>
          <TableOfContents entries={tocFor(block)} />
        </div>

        <MobileNav
          slug={block.slug}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  )
}
