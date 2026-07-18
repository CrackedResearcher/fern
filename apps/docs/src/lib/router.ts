import { useSyncExternalStore } from "react"

/**
 * Hash routing in ~30 lines. A docs site with a handful of static routes does
 * not need a router library — and hash routes deploy to any static host
 * without server rewrite rules.
 */

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

function currentPath() {
  return window.location.hash.replace(/^#\/?/, "") || ""
}

export function useRoute() {
  return useSyncExternalStore(subscribe, currentPath, () => "")
}

export function navigate(path: string) {
  window.location.hash = `/${path}`
}

/** Anchors need a real href for middle-click and "open in new tab" to work. */
export function href(path: string) {
  return `#/${path}`
}
