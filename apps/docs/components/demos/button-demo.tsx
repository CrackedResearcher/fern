"use client"

import { useState } from "react"
import { Button } from "@fern-ui/button"

/**
 * Demos wrap in a centred flex row rather than a grid: the variants differ in
 * label width, and a grid would pad them to a common column and hide that.
 */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {children}
    </div>
  )
}

export function ButtonDemo() {
  return (
    <Row>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="danger-soft">Danger soft</Button>
    </Row>
  )
}

/** Sizes sit on one baseline so the height steps are the only difference. */
export function ButtonSizes() {
  return (
    <Row>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Row>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
    </svg>
  )
}

export function ButtonIcons() {
  return (
    <Row>
      <Button>
        <PlusIcon />
        New project
      </Button>
      <Button variant="outline">
        Delete
        <TrashIcon />
      </Button>
      {/* Icon-only still needs a name — nothing else in the button says what it does. */}
      <Button isIconOnly aria-label="New project">
        <PlusIcon />
      </Button>
      <Button isIconOnly variant="danger-soft" aria-label="Delete project">
        <TrashIcon />
      </Button>
    </Row>
  )
}

export function ButtonDisabled() {
  return (
    <Row>
      <Button isDisabled>Primary</Button>
      <Button variant="secondary" isDisabled>
        Secondary
      </Button>
      <Button variant="outline" isDisabled>
        Outline
      </Button>
      <Button variant="danger" isDisabled>
        Danger
      </Button>
    </Row>
  )
}

/**
 * Full width inside a fixed column, because the prop does nothing without a
 * constrained parent and a demo that fills the whole preview would not show it.
 */
export function ButtonFullWidth() {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      <Button fullWidth>Continue</Button>
      <Button fullWidth variant="ghost">
        Cancel
      </Button>
    </div>
  )
}

/** Counts up, so the press is visibly doing something beyond the scale. */
export function ButtonPress() {
  const [count, setCount] = useState(0)
  return (
    <Row>
      <Button onPress={() => setCount((n) => n + 1)}>Pressed {count}×</Button>
      <Button variant="secondary" onClick={() => setCount(0)}>
        Reset
      </Button>
    </Row>
  )
}
