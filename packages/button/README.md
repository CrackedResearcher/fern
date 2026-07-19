# @fern-ui/button

A button for React, matched to the HeroUI v3 spec without the dependency. No
runtime dependencies beyond React itself.

```bash
bun add @fern-ui/button
```

## Usage

```tsx
import { Button } from "@fern-ui/button"

<Button variant="primary">Save</Button>
<Button variant="outline" size="lg">Cancel</Button>
<Button isIconOnly aria-label="New project"><PlusIcon /></Button>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "ghost" \| "outline" \| "danger" \| "danger-soft"` | `"primary"` | Colour treatment. `tertiary` inherits the surrounding text colour. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height and type scale. Each steps down at the `md` breakpoint. |
| `isIconOnly` | `boolean` | `false` | Square, sized to the height, inline padding removed. Needs an `aria-label`. |
| `fullWidth` | `boolean` | `false` | Fill the inline size of the parent. |
| `isDisabled` | `boolean` | — | Alias for `disabled`, so a HeroUI call site swaps over unchanged. |
| `onPress` | `MouseEventHandler` | — | Alias for `onClick`. Both fire if both are given. |

Any other prop on a native `button` passes through. `type` defaults to
`"button"` rather than `"submit"`, so a button inside a form does not submit it
by accident.

`className` is merged last-wins against the variant classes rather than
appended, so an override actually wins instead of racing in the stylesheet.

## Sizes

Heights step down at the `md` breakpoint — 36/40/44px below it, 32/36/40px
above — which is HeroUI's own behaviour.

That makes `sm` a 36px target, falling to 32px on desktop, under the 40px
minimum every other fern block clears. The tradeoff is deliberate: this block
exists to be indistinguishable from HeroUI's, and a taller `sm` would put every
adopted call site visibly out of step with the page around it. Use `md` or `lg`
for anything a finger has to hit.

The press scale is per size — `0.98`, `0.97`, `0.96`. A fixed ratio makes a
small button look like it barely moves and a large one look like it collapses.

## Icons

Any `svg` child is sized and aligned automatically — 20px, dropping to 16px at
`md`. It also carries a small negative inline margin, because a glyph rarely
fills its own box and the optical gap otherwise reads wider than the set one.

## Theming

Every colour is a CSS custom property with a literal fallback, so the button
renders correctly against no theme at all:

```css
:root {
  --accent: #0485f7;
  --accent-hover: #0479dd;
  --accent-foreground: #ffffff;
  --default: #ebebec;
  --default-hover: #e2e2e4;
  --default-foreground: #18181b;
  --danger: #ff383c;
  --border: #dedee0;
  --focus: #0485f7;
  --radius: 0.5rem;
}
```

The fallbacks are HeroUI's light-theme values converted out of oklch, so an
unthemed button is their default rather than a guess.

`--radius` is multiplied by three, so the button stays proportional to your
other surfaces without needing its own token. `--disabled-opacity` drives the
disabled state.

## Accessibility

The focus ring is separated from the button by a band of the page background,
so it stays legible on a filled variant where a flush ring would read as part
of the fill.

Only `transform`, `background-color` and `box-shadow` transition —
`transition: all` would also ease the focus ring, which has to appear the
instant focus lands. `prefers-reduced-motion` removes the press scale and the
colour transitions.

## What this is not

HeroUI's Button wraps `react-aria-components`, which is also what lets a
Popover or Dropdown adopt it as a trigger. That does not carry over. This is a
button, not a trigger primitive.

## License

MIT
