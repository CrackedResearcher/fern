import type { Country } from "./countries"

/**
 * Folds diacritics and case so "cote" matches "Côte d'Ivoire". Normalising at
 * search time rather than storing a second copy of every name.
 */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()

/** Digits only, so "+44", "44" and "(44)" all match the same dial code. */
const digits = (value: string) => value.replace(/\D/g, "")

/**
 * Scores a country against a query. Higher is better; 0 means no match.
 *
 * Ranked rather than filtered so an exact code match ("in") outranks the
 * countries that merely contain those letters, which is otherwise the fastest
 * way to make a search box feel wrong.
 */
export function score(country: Country, query: string): number {
  const q = fold(query)
  if (!q) return 1

  const name = fold(country.name)
  const code = country.code.toLowerCase()

  if (code === q) return 100
  if (name === q) return 95
  // An exact alias outranks a name prefix, or "uk" surfaces Ukraine above the
  // United Kingdom — the prefix is accidental, the alias is what was meant.
  if (country.alias?.some((a) => fold(a) === q)) return 92
  if (name.startsWith(q)) return 80
  if (country.alias?.some((a) => fold(a).startsWith(q))) return 60

  // Dial codes are matched on digits, so "+3" and "3" behave the same. Only
  // when the query looks numeric, or "1" would rank every country containing
  // the letter it is not.
  const d = digits(query)
  if (d && /^\+?\d/.test(query.trim())) {
    const cd = digits(country.dial)
    if (cd === d) return 90
    if (cd.startsWith(d)) return 70
  }

  if (name.includes(q)) return 40
  if (country.alias?.some((a) => fold(a).includes(q))) return 30
  return 0
}


/**
 * The visible list: pinned codes first when idle, best-scoring first when
 * searching. Ties break alphabetically so equal matches keep the order the eye
 * is already scanning in.
 */
export function rank(
  sorted: Country[],
  query: string,
  priority: string[] | undefined,
  byCode: Map<string, Country>,
): Country[] {
  if (!query.trim()) {
    if (!priority?.length) return sorted
    const pinned = priority
      .map((code) => byCode.get(code))
      .filter(Boolean) as Country[]
    return [...pinned, ...sorted.filter((c) => !priority.includes(c.code))]
  }
  return sorted
    .map((country) => ({ country, s: score(country, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.country.name.localeCompare(b.country.name))
    .map((r) => r.country)
}
