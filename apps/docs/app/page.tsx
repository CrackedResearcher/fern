import { redirect } from "next/navigation"

/**
 * Root lands on a real page, not on /docs.
 *
 * Once content is organised into root folders — which is what generates the
 * navbar tab row — /docs itself has no page behind it, so redirecting there
 * 404s at the site's front door. next.config.mjs covers /docs and the
 * pre-folder URLs.
 */
export default function Home() {
  redirect("/docs/getting-started")
}
