import type { Model } from "./model"

const fold = (value: string) => value.toLowerCase().trim()

/**
 * Scores a model against a query. Higher is better; 0 means no match.
 *
 * Ranked rather than filtered, so typing a provider gathers its models at the
 * top instead of leaving them wherever the catalogue happened to put them.
 */
export function score(model: Model, query: string): number {
  const q = fold(query)
  if (!q) return 1

  const name = fold(model.name)
  const id = fold(model.id)
  const provider = model.provider ? fold(model.provider) : ""

  if (id === q || name === q) return 100
  if (name.startsWith(q)) return 85
  // A provider match outranks a mid-name one: "google" should gather Google's
  // models above a model that merely mentions it in a tag.
  if (provider === q) return 80
  if (provider.startsWith(q)) return 70
  if (model.tags?.some((tag) => fold(tag) === q)) return 65
  if (name.includes(q)) return 50
  if (provider.includes(q)) return 40
  if (model.tags?.some((tag) => fold(tag).includes(q))) return 30
  if (id.includes(q)) return 20
  return 0
}

/**
 * The visible list.
 *
 * With no query the catalogue's own order is preserved exactly. Unlike a
 * country list, a model list is curated — the first entry is usually the one
 * you want chosen, and alphabetising throws that away. Ties while searching
 * break on the same original order, for the same reason.
 */
export function rank(models: Model[], query: string): Model[] {
  if (!query.trim()) return models
  return models
    .map((model, index) => ({ model, index, s: score(model, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map((r) => r.model)
}

/**
 * Where a query lands in a string, so the row can bold it.
 *
 * Only the first occurrence, and only a contiguous run: highlighting every
 * scattered letter of a fuzzy match turns the name into confetti and is harder
 * to read than no highlight at all.
 */
export function matchRange(text: string, query: string): [number, number] | null {
  const q = fold(query)
  if (!q) return null
  const start = fold(text).indexOf(q)
  return start === -1 ? null : [start, start + q.length]
}

export interface ListItem {
  model: Model
  /** Section heading to render above this row, if it opens one. */
  heading?: string
}

/**
 * Rows in section order, each section's heading attached to its first row.
 *
 * `recent` is pinned into its own leading section: in a catalogue big enough to
 * need search, re-finding the two models someone alternates between is the most
 * repeated action this component has.
 */
export function sections(
  models: Model[],
  recent: string[] | undefined,
  recentLabel: string,
): ListItem[] {
  const pinned: Model[] = []
  if (recent?.length) {
    const byId = new Map(models.map((m) => [m.id, m] as const))
    for (const id of recent) {
      const model = byId.get(id)
      // Skipped rather than stubbed: a recents list outlives the catalogue it
      // was recorded against.
      if (model) pinned.push(model)
    }
  }

  const pinnedIds = new Set(pinned.map((m) => m.id))
  const rest = models.filter((m) => !pinnedIds.has(m.id))
  const grouped = rest.some((m) => m.group)

  const out: ListItem[] = pinned.map((model, index) => ({
    model,
    heading: index === 0 ? recentLabel : undefined,
  }))

  if (!grouped) {
    // A single unnamed section still needs its heading when recents sit above
    // it, or the rest of the catalogue reads as more recents.
    for (const [index, model] of rest.entries()) {
      out.push({ model, heading: index === 0 && pinned.length ? "All models" : undefined })
    }
    return out
  }

  const order: string[] = []
  const buckets = new Map<string, Model[]>()
  for (const model of rest) {
    const key = model.group ?? "Other"
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(model)
  }
  for (const key of order) {
    for (const [index, model] of buckets.get(key)!.entries()) {
      out.push({ model, heading: index === 0 ? key : undefined })
    }
  }
  return out
}
