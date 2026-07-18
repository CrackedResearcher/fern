# Color picker — definitive design

Agreed spec for the next pass. Supersedes the `variant` prop and the HeroUI
Figma variants, both of which were exploratory.

## Composition

```
┌──────────────────────────────────────┐  264px, r20, overlay shadow
│ ┌──────────────────────────────────┐ │
│ │  saturation / brightness         │ │  4:3, max-h 200px, r16
│ │                            ◉     │ │  thumb: fill + 3px white ring
│ └──────────────────────────────────┘ │
│  Hue                          217°   │  12px/400 muted, tabular-nums
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  20px, fully round
│  Opacity                      100%   │
│  ▨▨━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  checkerboard under
│                                      │
│  ┌────────────┐    ⬤     ┌────┐     │  model select | preview | eyedropper
│  │  RGBA   ⌄  │          │ ⌗  │     │
│  └────────────┘                      │
│                                      │
│  ┌──────────────────────────┐  ┌──┐ │  editable fields | copy
│  │ R 77  G 77  B 77  A 77   │  │⧉ │ │
│  └──────────────────────────┘  └──┘ │
└──────────────────────────────────────┘
```

## Decisions

**No presets row.** Removed entirely, not hidden behind a prop. Presets are a
shortcut, not a required part, and the row cost vertical space in a popover
that was already too tall.

**The model select drives the last row.** One control, two shapes:

| Mode   | Last row                                    |
| ------ | ------------------------------------------- |
| `HEX`  | one editable field — `#747839`               |
| `RGBA` | four editable fields — `R G B A`             |
| `HSL`  | three editable fields — `H S L`              |

Hex stays a mode rather than being dropped, because hex is what people paste
and copy. Switching mode reformats in place; it never loses the colour.

**Every field is editable, and commits on blur or Enter.** Not on every
keystroke — typing `7` in a channel should not drive the colour to 7 and then
to 77. Invalid input reverts on blur rather than clamping silently, so a typo
is visible instead of becoming a different colour.

**Copy sits after the editable row**, so it copies what the row displays in
the current mode — `#747839` in hex, `rgba(116, 120, 57, 1)` in RGBA. A copy
button that always emits hex regardless of the selected mode is a trap.

**Eyedropper sits with the preview**, not beside a slider. It sets the value,
so it belongs with the value. Parking it next to Opacity also made that track
shorter than Hue, leaving two sibling sliders visibly unequal.

## Behaviour that must survive the rewrite

Non-negotiable — this is the product, and none of it is visible in a mockup:

- Hue and saturation preserved at the black/grey extremes of the field.
- One drag owns one pointer id; a second finger cannot hijack it.
- `onChange` every frame, `onChangeComplete` once on settle.
- Arrow keys step 1%, Shift 10%, Home/End jump — on the field *and* every
  slider. The field is a primary control and must be keyboard-operable.
- Polite live region announces settled values only.
- `prefers-reduced-motion` removes the thumb scale and icon transitions.
- Thumb ring flips on the luminance beneath it.
- Interactive targets clear 40px.

### New a11y surface this design adds

Each channel input needs its own accessible name and value in **channel
units** — "Red, 77", not "77 percent". Four inputs is four times the surface,
and it is the part most likely to be skipped:

- `aria-label` per field naming the channel.
- `inputMode="numeric"` so touch keyboards are right.
- Range announced via `aria-valuemin` / `max` where the field is a spinner,
  or plain validation messaging where it is free text.
- The mode select must announce what it changes — it reshapes the row beneath
  it, so it needs `aria-controls` pointing at that group.

## Suggested order

Each step is shippable on its own:

1. Model select + editable field row (HEX first, then RGBA/HSL) — the
   structural change; replaces the current single input.
2. Move copy after the field row and make it mode-aware.
3. Preview circle + eyedropper row.
4. Delete the preset row, the `variant` prop and their docs.
5. Re-verify every behaviour above, per channel. Do not skip.

## Constraints

Unchanged and load-bearing:

- Zero runtime dependencies beyond React. No `@heroui/*` in this package.
- CSS custom properties with literal fallbacks — `var(--surface, #ffffff)`.
- Docs site is the test harness; exercise each mode there.
