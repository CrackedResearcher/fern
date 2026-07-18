import { docs } from "@/.source/server"
import { loader } from "fumadocs-core/source"
import { createElement } from "react"
import { BookIcon, ComponentsIcon } from "@/components/tab-icons"

const ICONS = { Book: BookIcon, Components: ComponentsIcon } as const

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  /**
   * Turns `"icon": "Book"` in a meta.json into an element.
   *
   * Without this resolver Fumadocs silently drops the field — the tab renders
   * its title with no icon and nothing warns you. Rendering it then needed a
   * second fix in the layout, which only ever emitted `{title}`; see the
   * MODIFIED note in layouts/notebook/client.tsx.
   */
  icon(icon) {
    if (!icon) return
    const Glyph = ICONS[icon as keyof typeof ICONS]
    if (!Glyph) return
    return createElement(Glyph)
  },
})
