import type { Model } from "./model"

/**
 * Derived from the catalogue, not configured — a separate `filters` prop goes
 * stale the moment a model gains a tag, and fails invisibly.
 *
 * Ordered by how many models carry each tag: a facet matching one model is a
 * search, not a filter.
 */
export function facets(models: Model[]): string[] {
  const counts = new Map<string, number>()
  const firstSeen = new Map<string, number>()
  for (const [index, model] of models.entries()) {
    for (const tag of model.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
      if (!firstSeen.has(tag)) firstSeen.set(tag, index)
    }
  }
  return [...counts.keys()].sort(
    (a, b) =>
      counts.get(b)! - counts.get(a)! || firstSeen.get(a)! - firstSeen.get(b)!,
  )
}

/**
 * Facets narrow, they do not widen. Picking "vision" then "fast" is someone
 * building up a requirement; answering with a longer list than they started
 * from reads as the control ignoring them.
 */
export function applyFacets(models: Model[], active: string[]): Model[] {
  if (!active.length) return models
  return models.filter((model) =>
    active.every((tag) => model.tags?.includes(tag)),
  )
}

/**
 * Which facets still return something. Dead ones are disabled rather than
 * hidden — a chip row that reflows as you click through it puts the next chip
 * under a moving target.
 */
export function liveFacets(
  models: Model[],
  active: string[],
  all: string[],
): Set<string> {
  const live = new Set<string>()
  for (const tag of all) {
    if (active.includes(tag)) {
      live.add(tag)
      continue
    }
    if (applyFacets(models, [...active, tag]).length) live.add(tag)
  }
  return live
}
