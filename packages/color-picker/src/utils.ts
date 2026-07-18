/** Joins class names, dropping anything falsy. */
export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")
