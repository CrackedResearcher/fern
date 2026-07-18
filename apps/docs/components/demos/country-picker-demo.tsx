"use client"

import { useState } from "react"
import { CountryPicker } from "@fern-ui/country-picker"

/** The docs app self-hosts the flags it already ships in public/. */
const flagSrc = (code: string) => `/flags/${code.toLowerCase()}.svg`

/**
 * Greyscale, so one file works on both themes — `dark:invert` would flip it to
 * near-white and blow out against a dark panel, where the point is to sit
 * quietly behind the message.
 */
const emptyIcon = (
  <img
    src="/empty-search-country.png"
    alt=""
    width={56}
    height={48}
    className="opacity-90 dark:opacity-40"
  />
)

export function CountryPickerDemo() {
  const [country, setCountry] = useState("US")
  return <CountryPicker
      value={country}
      onChange={setCountry}
      flagSrc={flagSrc}
      emptyIcon={emptyIcon}
    />
}

/** Common markets pinned above the alphabetical list. */
export function CountryPickerPriority() {
  const [country, setCountry] = useState("")
  return (
    <CountryPicker
      value={country}
      onChange={setCountry}
      flagSrc={flagSrc}
      emptyIcon={emptyIcon}
      priority={["US", "GB", "IN", "DE", "JP"]}
      placeholder="Where are you based?"
    />
  )
}

/** Names only — no dial codes, and no searching by them. */
export function CountryPickerPlain() {
  const [country, setCountry] = useState("BR")
  return (
    <CountryPicker
      value={country}
      onChange={setCountry}
      flagSrc={flagSrc}
      emptyIcon={emptyIcon}
      showDialCode={false}
    />
  )
}
