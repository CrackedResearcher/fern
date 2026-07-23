/**
 * The model record, its price formatting, and the catalogue-relative metrics
 * behind the meters. No React, so a server component — or a pricing page, or a
 * test — can import this without pulling the picker in. That is why it is its
 * own entry in `tsup.config.ts` and in `exports`.
 */

export interface ModelPrice {
  amount: number
  /**
   * Written before the figure — "$4/1M". With one, the unit noun is dropped
   * everywhere: "$4" says what "4 dollars" says in a third of the width.
   */
  symbol?: string
  /**
   * Singular. Pluralised naively with an "s" at 2 or more, which is correct
   * for "credit", "token" and "request" — pass an already-plural noun if your
   * unit is irregular.
   */
  unit?: string
  /**
   * The denominator, written short: "sec", "image", "1M tokens". It lands in a
   * badge beside the model name, so "generation" pushes the name out of a
   * narrow trigger where "image" does not.
   */
  per?: string
  /**
   * Renders "from N", for a figure that is a floor rather than the price.
   * Presenting a floor as exact is something a user discovers on their invoice.
   */
  from?: boolean
}

export interface Model {
  /** Stable id. This is what `onChange` reports and `value` matches against. */
  id: string
  /** What the user reads. */
  name: string
  /** Shown under the name and searchable — "Anthropic", "Google". */
  provider?: string
  /**
   * Provider mark. Optional by design: a model without one falls back to its
   * initial on the same tile, never to another provider's icon.
   */
  logo?: string
  /**
   * The tile behind the mark — any CSS background, gradients included. For a
   * monochrome mark that would otherwise be invisible on one theme: pair it
   * with a white version of the logo.
   */
  logoBackground?: string
  /** One or two lines. The reason someone would pick this model. */
  description?: string
  strengths?: string[]
  limitations?: string[]
  /** Capabilities. Searchable, and the source of the filter chips. */
  tags?: string[]
  /** A short status word beside the name: "New", "Beta", "Preview". */
  badge?: string
  price?: ModelPrice
  /**
   * Any scale you like — 1-5, tokens/sec, a percentage. Meters normalise
   * against the rest of the catalogue, so only the ordering matters.
   */
  speed?: number
  quality?: number
  /** Section heading. Groups appear in the order they first occur. */
  group?: string
  /**
   * Unavailable on this plan or for this input. The row stays visible and the
   * cursor still lands on it — a model you cannot see is a model you cannot
   * upgrade for — but it cannot be selected.
   */
  disabled?: boolean
  /** Why it is unavailable. A locked row with no reason is a dead end. */
  disabledReason?: string
}

/**
 * "from 4 credits/sec", "2 credits/image", "6 credits".
 *
 * One format for the badge and the details card both, so the number a user
 * compares in the list is the same number they read after opening it.
 */
export function formatPrice(price: ModelPrice | undefined): string | null {
  if (!price || !Number.isFinite(price.amount)) return null
  const prefix = price.from ? "from " : ""
  const per = price.per ? `/${price.per}` : ""
  if (price.symbol) return `${prefix}${price.symbol}${price.amount}${per}`
  const unit = price.unit ?? "credit"
  const noun = price.amount === 1 ? unit : `${unit}s`
  return `${prefix}${price.amount} ${noun}${per}`
}

/**
 * The row form, without the unit noun — the noun is identical on every line and
 * costs more width than the model names have. The card spells it out in full.
 */
export function compactPrice(price: ModelPrice | undefined): string | null {
  if (!price || !Number.isFinite(price.amount)) return null
  const per = price.per ? `/${price.per}` : ""
  return `${price.from ? "~" : ""}${price.symbol ?? ""}${price.amount}${per}`
}

export interface Meters {
  /** 0-1, or null when the catalogue gives nothing to compare against. */
  speed: number | null
  quality: number | null
  /** Already inverted: a full bar is cheap, because full always reads as good. */
  cost: number | null
}

const normalise = (value: number, values: number[]): number | null => {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  // Every model scoring the same says nothing, and a row of full bars reads as
  // a claim rather than the absence of one.
  if (max === min) return null
  return (value - min) / (max - min)
}

/**
 * A `model -> meters` lookup for one catalogue.
 *
 * Relative, not absolute: "fast" has no meaning without a population, and a
 * fixed 1-5 tier invites a vendor to mark everything a 4.
 *
 * Cost is normalised only within models sharing a price denominator —
 * per-second and per-image are different quantities, and ranking them against
 * each other tells a user nothing they can act on.
 */
export function meterScale(models: Model[]): (model: Model) => Meters {
  const speeds = models.map((m) => m.speed).filter((v): v is number => v != null)
  const qualities = models
    .map((m) => m.quality)
    .filter((v): v is number => v != null)

  const byUnit = new Map<string, number[]>()
  for (const model of models) {
    if (model.price == null) continue
    const key = `${model.price.unit ?? "credit"}/${model.price.per ?? ""}`
    if (!byUnit.has(key)) byUnit.set(key, [])
    byUnit.get(key)!.push(model.price.amount)
  }

  return (model) => {
    let cost: number | null = null
    if (model.price) {
      const key = `${model.price.unit ?? "credit"}/${model.price.per ?? ""}`
      const peers = byUnit.get(key) ?? []
      const ratio = normalise(model.price.amount, peers)
      cost = ratio == null ? null : 1 - ratio
    }
    return {
      speed: model.speed == null ? null : normalise(model.speed, speeds),
      quality: model.quality == null ? null : normalise(model.quality, qualities),
      cost,
    }
  }
}
