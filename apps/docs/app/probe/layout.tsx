import { notFound } from "next/navigation"
import type { ReactNode } from "react"

/**
 * Probes are measuring harnesses, not docs, and they are noisy — a page of
 * computed-style diffs reads as a broken site to anyone who lands on it.
 *
 * Gated here rather than per page so a probe added later is covered without
 * anyone remembering to. `NODE_ENV` is "development" under `bun run dev` and
 * "production" for any build, which is exactly the split wanted: probes are a
 * thing you run against the dev server while changing a component.
 */
export default function ProbeLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound()
  return <>{children}</>
}
