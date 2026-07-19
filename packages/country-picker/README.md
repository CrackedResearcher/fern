# @fern-ui/country-picker

A searchable country select for React — flags, dial codes, and keyboard
filtering. No runtime dependencies beyond React itself.

```bash
bun add @fern-ui/country-picker
```

## Usage

```tsx
import { CountryPicker } from "@fern-ui/country-picker"

function Example() {
  const [country, setCountry] = useState("IN")
  return <CountryPicker value={country} onChange={setCountry} />
}
```

Uncontrolled works too — omit `value` and pass `defaultValue`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Controlled selection, as an ISO 3166-1 alpha-2 code. |
| `defaultValue` | `string` | — | Initial selection when uncontrolled. |
| `onChange` | `(code, country) => void` | — | Fires with the code and the full country record. |
| `countries` | `Country[]` | 195 countries | Replace the list — for a subset, or another locale's names. |
| `priority` | `string[]` | — | Codes pinned above the alphabetical list. |
| `showDialCode` | `boolean` | `true` | Show the dial code and allow searching by it. |
| `showFlags` | `boolean` | `true` | Off gives a plain text list, and skips 195 image requests. |
| `flagSrc` | `(code) => string` | `/flags/{code}.svg` | Resolves a flag URL from a lowercase country code. |
| `placeholder` | `string` | `"Select a country"` | Trigger text with nothing selected. |
| `searchPlaceholder` | `string` | `"Search countries"` | Placeholder inside the search field. |
| `clearable` | `boolean` | `true` | Let the user clear the selection once one is made. |
| `emptyIcon` | `ReactNode` | inline globe | Illustration for the empty state. |
| `disabled` | `boolean` | `false` | Block interaction and dim the control. |
| `label` | `string` | `"Country"` | Accessible name for the trigger. |

Any other prop lands on the root element.

## Search

Matches four things at once — country name, two-letter code, dial code, and
common aliases — so `UK`, `GB`, `+44` and `britain` all find the United
Kingdom. Diacritics fold, so `cote` finds Côte d'Ivoire.

Turning `showDialCode` off also removes dial codes from the search index, so a
query of `44` matches nothing rather than surprising you with the UK.

## Flags

Flags are not bundled. `flagSrc` resolves a URL from the country code and
defaults to `/flags/{code}.svg`, so you either host them yourself:

```tsx
<CountryPicker flagSrc={(code) => `https://cdn.example.com/${code}.svg`} />
```

or copy a flag set into your own `public/`. Shipping 195 images inside a
package nobody asked for is not a tradeoff worth making.

## The country data

Exported from its own entry point, so importing the list never pulls the React
component into your bundle:

```ts
import { COUNTRIES, type Country } from "@fern-ui/country-picker/countries"
```

## Keyboard

Arrows move, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends,
<kbd>PageUp</kbd>/<kbd>PageDown</kbd> move by ten. <kbd>Enter</kbd> selects,
<kbd>Escape</kbd> closes, <kbd>Tab</kbd> closes and moves on. The trigger opens
on <kbd>Enter</kbd>, <kbd>Space</kbd> or <kbd>ArrowDown</kbd>.

The list opens with the cursor on the current selection, scrolled to it.

## Notes

The panel is portalled. An absolutely-positioned panel is clipped by any
ancestor with `overflow: hidden` — a card, a modal — and no z-index fixes that,
because clipping happens before stacking. It positions against the trigger in
viewport coordinates and flips when the space below cannot hold it.

A cursor and a selection are different states: the keyboard cursor is a neutral
wash, the current selection is tinted. Otherwise "where I am" and "what I
chose" are indistinguishable.

## License

MIT
