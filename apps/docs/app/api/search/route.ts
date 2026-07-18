import { source } from "@/lib/source"
import { createFromSource } from "fumadocs-core/search/server"

/**
 * Search index.
 *
 * Fumadocs' search dialog queries this route. Without it the dialog opens,
 * accepts typing and can never return anything — which reads as "the search is
 * just an empty box" rather than as a missing endpoint, because nothing errors.
 */
export const { GET } = createFromSource(source)
