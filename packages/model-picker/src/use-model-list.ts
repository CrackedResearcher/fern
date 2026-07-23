"use client"

import * as React from "react"
import { meterScale, type Meters, type Model } from "./model"
import { rank, sections, type ListItem } from "./search"
import { applyFacets, facets as deriveFacets, liveFacets } from "./filters"

export interface ModelList {
  items: ListItem[]
  facets: string[]
  live: Set<string>
  meters: (model: Model) => Meters
}

/**
 * The list the panel renders: faceted, ranked, sectioned, and the facet state
 * that goes with it.
 *
 * Kept out of the component so the "which models appear, in what order" rule
 * is one testable pure pipeline rather than four memos interleaved with
 * refs and portals.
 */
export function useModelList(
  models: Model[],
  query: string,
  activeFacets: string[],
  recent: string[] | undefined,
  recentLabel: string,
): ModelList {
  const facets = React.useMemo(() => deriveFacets(models), [models])

  const live = React.useMemo(
    () => liveFacets(models, activeFacets, facets),
    [models, activeFacets, facets],
  )

  /**
   * Meters scale against the whole catalogue, not the filtered view. Filtering
   * to the three fastest models and then showing them as slow, medium and fast
   * would rescale the bars under the user without anything having changed
   * about the models themselves.
   */
  const meters = React.useMemo(() => meterScale(models), [models])

  const items = React.useMemo(() => {
    const narrowed = applyFacets(models, activeFacets)
    const ranked = rank(narrowed, query)
    // Recents are a shortcut through the idle list. Once someone is searching
    // or filtering they have said what they want, and pinning the same rows
    // twice makes a short result set look longer than it is.
    const idle = !query.trim() && !activeFacets.length
    return sections(ranked, idle ? recent : undefined, recentLabel)
  }, [models, activeFacets, query, recent, recentLabel])

  return { items, facets, live, meters }
}
