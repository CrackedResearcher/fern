# @fern-ui/country-picker

A searchable country select for React — flags, dial codes, and keyboard
filtering. No runtime dependencies beyond React itself.

```bash
bun add @fern-ui/country-picker
```

Import the stylesheet once, anywhere in your app:

```tsx
import "@fern-ui/country-picker/styles.css"
```

The component is built from Tailwind utilities. Without the stylesheet the
markup is correct and nothing is styled — it fails quietly rather than loudly,
so it is worth checking first if a block looks wrong.

Skip it only if you are copy-pasting the source into a Tailwind project of your
own, where your build generates the utilities already.

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
| `flagSrc` | `(code) => string` | jsDelivr CDN | Resolves a flag URL from a lowercase country code. |
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

By default flags load from a CDN, so `bun add` works with no setup — a picker
whose images 404 until you copy an asset directory is broken out of the box.

The same 200 SVGs ship inside the package. To self-host, copy them into your
public directory and point `flagSrc` at it:

```bash
cp -r node_modules/@fern-ui/country-picker/flags public/flags
```

```tsx
<CountryPicker flagSrc={(code) => `/flags/${code}.svg`} />
```

Each is a 512×512 circle-cropped SVG averaging 0.6KB, loaded lazily — only the
rows you scroll to are fetched.

`showFlags={false}` skips them entirely, and with them 200 image requests.

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
