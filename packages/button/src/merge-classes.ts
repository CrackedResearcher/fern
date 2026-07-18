/**
 * A last-wins class merge, scoped to the utility families this button sets.
 *
 * Tailwind gives every utility the same specificity, so a consumer's
 * `h-[34px]` does not reliably beat the button's own `h-10` — whichever sits
 * later in the generated stylesheet wins, which is not something the caller
 * can see or control. `tailwind-merge` exists to solve this, but pulling it in
 * would cost the package its zero-dependency guarantee for one behaviour.
 *
 * So this drops a base class when the caller supplies one from the same
 * family. It is deliberately not a general Tailwind merger: it only knows the
 * families the button actually emits. Anything outside that list is left
 * alone, which is the safe direction to be wrong in — an unrecognised class
 * is simply appended, exactly as it would be today.
 */

/**
 * Families are matched on the prefix *before* the value. Order matters: the
 * first match wins, so longer prefixes are listed ahead of the shorter ones
 * they would otherwise be swallowed by (`px-` before `p-`).
 */
const FAMILIES = [
  "rounded-",
  "px-",
  "py-",
  "p-",
  "gap-",
  "size-",
  "h-",
  "w-",
  "bg-",
  "text-",
  "font-",
  "border-",
  "border",
  "shadow-",
  "opacity-",
]

/** Strips a responsive/state prefix so `md:h-9` is compared as `h-9`. */
function familyOf(token: string): string | null {
  const bare = token.slice(token.lastIndexOf(":") + 1)
  const variant = token.slice(0, token.lastIndexOf(":") + 1)
  const family = FAMILIES.find((prefix) => bare.startsWith(prefix))
  // The variant is part of the identity: `md:h-9` and `h-10` do not conflict,
  // they apply at different widths, so overriding one must not drop the other.
  return family ? variant + family : null
}

export function mergeClasses(
  base: string,
  ...overrides: (string | false | null | undefined)[]
): string {
  const extra = overrides.filter(Boolean).join(" ").split(/\s+/).filter(Boolean)
  if (extra.length === 0) return base

  const overridden = new Set<string>()
  for (const token of extra) {
    const family = familyOf(token)
    if (family) overridden.add(family)
  }

  const kept = base
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      const family = familyOf(token)
      return family === null || !overridden.has(family)
    })

  return [...kept, ...extra].join(" ")
}
