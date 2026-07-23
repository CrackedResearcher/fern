# @fern-ui/model-picker

A model picker for React — search, capability filters, and a details card that
follows the keyboard. No runtime dependencies beyond React itself.

```bash
bun add @fern-ui/model-picker
```

Import the stylesheet once, anywhere in your app:

```tsx
import "@fern-ui/model-picker/styles.css"
```

The component is built from Tailwind utilities. Without the stylesheet the
markup is correct and nothing is styled — it fails quietly rather than loudly,
so it is worth checking first if a block looks wrong.

Skip it only if you are copy-pasting the source into a Tailwind project of your
own, where your build generates the utilities already.

## Usage

The catalogue is yours — there is no bundled model list, because a model list
goes stale in weeks and yours is the only one that is true.

```tsx
import { ModelPicker, type Model } from "@fern-ui/model-picker"

const MODELS: Model[] = [
  {
    id: "opus-4-8",
    name: "Opus 4.8",
    provider: "Anthropic",
    description: "The strongest model here for long multi-step work.",
    tags: ["vision", "reasoning", "200K context"],
    strengths: ["Holds long context without drifting", "Careful with tools"],
    limitations: ["Slower than the smaller models"],
    price: { amount: 15, unit: "credit", per: "1M tokens" },
    speed: 2,
    quality: 5,
  },
  // …
]

function Example() {
  const [model, setModel] = useState("opus-4-8")
  return <ModelPicker models={MODELS} value={model} onChange={setModel} />
}
```

Uncontrolled works too — omit `value` and pass `defaultValue`.

## What it does that a dropdown does not

**The details card is driven by the cursor, not by hover.** Arrow through the
list and the card keeps up, so everything it says — what a model is good at,
what it costs, why it is locked — is reachable without a mouse. It picks the
side with room, and folds into the rows when there is no room either side.

**The meters are relative to your catalogue.** `speed` and `quality` take any
scale you like and are normalised across the models you actually offer, because
"fast" has no meaning without a population. Cost is normalised only within the
models sharing a price denominator — credits-per-second and credits-per-image
are different quantities, and ranking one against the other tells a user
nothing they can act on.

**Locked models stay visible.** A model gated behind a plan keeps its row and
its details, cannot be selected, and says why. A model nobody can see is a
model nobody can upgrade for.

**Filters come from your tags.** The chips are derived, not configured, so they
cannot drift out of step with the catalogue. Chips that would empty the list
are disabled in place rather than removed — a chip row that reflows as you
click through it puts the next chip under a moving target.

**Order is preserved.** The list is never sorted alphabetically; a curated
catalogue puts the model you want chosen first, and sorting throws that away.

## Keyboard

Arrows move, Home and End jump to the ends, PageUp and PageDown move by ten.
Enter selects, Escape closes, Tab closes and moves on. Backspace on an empty
query removes the last filter chip. The trigger opens on Enter, Space or
ArrowDown.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `models` | `Model[]` | — | The catalogue. Order is preserved. |
| `value` | `string` | — | Controlled selection, as a model id. |
| `defaultValue` | `string` | — | Initial selection when uncontrolled. |
| `onChange` | `(id, model) => void` | — | Fires with the id and the full record. |
| `onOpenChange` | `(open) => void` | — | Fires as the panel opens and closes. |
| `recent` | `string[]` | — | Ids pinned into a leading section, most recent first. |
| `recentLabel` | `string` | `"Recent"` | Heading for that section. |
| `variant` | `"default" \| "pill"` | `"default"` | Compact trigger for a config row. |
| `searchable` | `boolean` | over 7 models | Show the search field. |
| `filterable` | `boolean` | 2+ tags | Show the capability chips. |
| `showDetails` | `boolean` | `true` | The card beside the list. |
| `showLogos` | `boolean` | `true` | Provider marks, with a drawn monogram fallback. |
| `showPrice` | `boolean` | `true` | Price badges on rows and the trigger. |
| `placeholder` | `string` | `"Select a model"` | Trigger text with nothing selected. |
| `searchPlaceholder` | `string` | `"Search models"` | Placeholder inside the search field. |
| `disabled` | `boolean` | `false` | Block interaction and dim the control. |
| `label` | `string` | `"Model"` | Accessible name for the trigger and panel. |

## The `Model` record

```ts
interface Model {
  id: string
  name: string
  provider?: string
  logo?: string
  description?: string
  strengths?: string[]
  limitations?: string[]
  tags?: string[]          // searchable, and the source of the filter chips
  badge?: string           // "New", "Beta"
  price?: { amount: number; unit?: string; per?: string; from?: boolean }
  speed?: number           // any scale — normalised across the catalogue
  quality?: number
  group?: string           // section heading
  disabled?: boolean
  disabledReason?: string  // a locked row with no reason is a dead end
}
```

`price.from` renders "from N". Use it when the number is a floor rather than
the price — presenting a floor as an exact figure is something a user only
discovers on their invoice.

Types, `formatPrice` and `meterScale` are importable without React:

```ts
import { formatPrice, type Model } from "@fern-ui/model-picker/model"
```

## Theming

Every colour reads a `--fern-` custom property with a literal fallback, so the
block themes automatically where those variables exist and still renders
correctly where they do not.

`--fern-surface`, `--fern-foreground`, `--fern-muted`, `--fern-default`,
`--fern-default-hover`, `--fern-focus`, `--fern-overlay-shadow`.

## Licence

MIT
