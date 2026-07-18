export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

/** Strong ease-out — moves immediately, so the UI reads as responsive. */
export const EASE = "cubic-bezier(0.23, 1, 0.32, 1)"
