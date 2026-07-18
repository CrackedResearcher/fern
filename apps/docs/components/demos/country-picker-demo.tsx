"use client"

import { useState } from "react"
import { CountryPicker } from "@fern-ui/country-picker"

/** The docs app self-hosts the flags it already ships in public/. */
const flagSrc = (code: string) => `/flags/${code.toLowerCase()}.svg`

export function CountryPickerDemo() {
  const [country, setCountry] = useState("IN")
  return <CountryPicker value={country} onChange={setCountry} flagSrc={flagSrc} />
}

/** Common markets pinned above the alphabetical list. */
export function CountryPickerPriority() {
  const [country, setCountry] = useState("")
  return (
    <CountryPicker
      value={country}
      onChange={setCountry}
      flagSrc={flagSrc}
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
      showDialCode={false}
    />
  )
}
