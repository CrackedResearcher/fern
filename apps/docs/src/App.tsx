import { useEffect, useState } from "react"
import { BlockPage, tocFor } from "./components/BlockPage"
import { CommandPalette } from "./components/CommandPalette"
import { Header } from "./components/Header"
import { MobileNav, Sidebar } from "./components/Sidebar"
import { TableOfContents } from "./components/TableOfContents"
import { useRoute } from "./lib/router"
import { REGISTRY } from "./registry"

const THEME_KEY = "fern-theme"

function initialTheme() {
  const fromUrl = new URLSearchParams(window.location.search).get("theme")
  if (fromUrl === "dark") return true
  if (fromUrl === "light") return false
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored) return stored === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function App() {
  const [dark, setDark] = useState(initialTheme)
  const [searchOpen, setSearchOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const route = useRoute()

  const block = REGISTRY.find((entry) => entry.slug === route) ?? REGISTRY[0]!

  // Writing to localStorage and binding a global hotkey are both genuine
  // outside-React effects.
  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark])

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

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-bg text-fg">
        <Header
          dark={dark}
          onToggleTheme={() => setDark((value) => !value)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNav={() => setNavOpen(true)}
        />

        <div className="mx-auto flex max-w-[1440px]">
          <Sidebar slug={block.slug} />
          <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-14">
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
