"use client"

/**
 * Not a docs page — a viewing harness, kept out of `content/` so it never
 * appears in the sidebar.
 *
 * The interesting states of this block are all *open* states: the panel, the
 * details card beside it, the meters, a locked row. A headless screenshot
 * cannot click, so the trigger is clicked programmatically once the page has
 * settled, and `?state=` picks which arrangement to capture.
 *
 *   /probe/model-picker?theme=dark
 *   /probe/model-picker?theme=light&state=filtered
 *   /probe/model-picker?state=locked
 *   /probe/model-picker?state=scrolled&y=34
 */

import { useEffect, useRef } from "react"
import { ModelPicker } from "@fern-ui/model-picker"
import {
  ModelPickerDemo,
  ModelPickerMinimal,
  ModelPickerPill,
} from "@/components/demos/model-picker-demo"

/**
 * Real key events, not React state — the point of the harness is to exercise
 * the same path a user takes, including the focus and scroll behaviour that a
 * prop-driven "open" would skip entirely.
 */
function press(target: Element, key: string) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  )
}

export default function ModelPickerProbe() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get("state")
    const host = hostRef.current
    if (!host) return

    const trigger = host.querySelector<HTMLButtonElement>('[data-slot="trigger"]')
    trigger?.click()

    // One frame is not enough: the panel positions from a measurement taken
    // after it mounts, and the details card only appears once that resolves.
    const timer = window.setTimeout(() => {
      const list = document.querySelector('[data-slot="list"]')
      const input = document.querySelector<HTMLInputElement>('[data-slot="search"]')
      const keyTarget = input ?? list
      if (!keyTarget) return

      // `scrolled` parks the list mid-scroll, which is where the section
      // headings and the scroll fades have to be checked. `?y=` picks the
      // offset. It sets scrollTop on a later tick and skips the arrow presses
      // below, because the cursor's own scrollIntoView runs after them and
      // snapped the list straight back — a scroll test that silently measured
      // nothing.
      if (state === "scrolled") {
        window.setTimeout(() => {
          const l = document.querySelector('[data-slot="list"]')
          const y = new URLSearchParams(window.location.search).get("y")
          if (l) l.scrollTop = Number(y ?? 70)
        }, 200)
        return
      }

      if (state === "locked") {
        // The locked row sits last in the catalogue.
        press(keyTarget, "End")
        press(keyTarget, "ArrowUp")
      } else if (state === "filtered") {
        const chips = document.querySelectorAll<HTMLButtonElement>(
          '[data-slot="facets"] button',
        )
        chips[0]?.click()
      } else {
        press(keyTarget, "ArrowDown")
        press(keyTarget, "ArrowDown")
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-[var(--fern-background,#fff)] p-10">
      <div className="flex flex-col gap-10">
        <section>
          <p className="mb-3 text-xs text-[var(--fern-muted,#71717a)]">
            open
          </p>
          <div ref={hostRef}>
            <ModelPickerDemo />
          </div>
        </section>

        {/* Closed states, so one shot shows both triggers against the panel. */}
        <section className="mt-[420px] flex items-center gap-6">
          <p className="text-xs text-[var(--fern-muted,#71717a)]">closed</p>
          <ModelPickerPill />
          <ModelPickerMinimal />
          <ModelPicker
            models={[{ id: "a", name: "Claude Opus 4.8", provider: "Anthropic" }]}
            defaultValue="a"
            disabled
          />
        </section>
      </div>
    </main>
  )
}
