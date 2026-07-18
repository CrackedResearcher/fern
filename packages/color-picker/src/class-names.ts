/**
 * Class-name joining. Deliberately not named `utils`.
 *
 * A module called "utils" is where unrelated helpers accumulate, because
 * nothing has to justify its name to live there. This one is named for the
 * single thing it does, so anything that is not about composing class names
 * has an obvious reason not to be added to it.
 *
 * Shared rather than inlined because both `color-picker.tsx` and `parts.tsx`
 * need it, and two copies of the same three lines is how they drift.
 */
export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")
