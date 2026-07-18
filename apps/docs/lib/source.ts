import { docs } from "@/.source/server"
import { loader } from "fumadocs-core/source"
import { Book, Cubes3, Rocket } from "@gravity-ui/icons"
import { createElement } from "react"

const ICONS = { Book, Cubes3, Rocket } as const

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  /**
   * Turns `"icon": "Book"` in a meta.json into an element.
   *
   * Without this resolver Fumadocs silently drops the field — the tab renders
   * its title with no icon and nothing warns you. That is why fern's nav tabs
   * were text-only next to theirs: the icon names were set all along, but
   * nothing was resolving them.
   *
   * Same icon set their docs use (@gravity-ui/icons), sized to the 1em their
   * tab markup expects.
   */
  icon(icon) {
    if (!icon) return
    const Glyph = ICONS[icon as keyof typeof ICONS]
    if (!Glyph) return
    return createElement(Glyph, { width: "1em", height: "1em" })
  },
})
