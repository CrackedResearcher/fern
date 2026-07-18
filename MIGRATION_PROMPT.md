# Task: adopt `@heroui/styles` as fern's theme foundation

## Context

`fern` is a React UI block library at `~/Desktop/build/fern`. Bun workspaces:

```
packages/color-picker   → @fern-ui/color-picker, the published block
apps/docs               → Vite + React + Tailwind v4 documentation site
```

Both are currently themed by a hand-ported token layer at
`apps/docs/src/theme.css`, which was reverse-engineered from HeroUI v3 source.
It approximates their system and drifts from it in ways that are tedious to
chase one screenshot at a time.

**Goal:** stop porting and start consuming. `@heroui/styles@3.2.2` is published
on npm under Apache-2.0. Install it, make it the single source of colour,
radius, shadow, and spacing truth, and delete our approximation.

The division of labour after this change:

- **Their foundation** — colour, elevation, radius, spacing, theme presets.
  Guaranteed to match because it is literally their code, not our copy of it.
- **Our components** — thoroughly designed behaviour, accessibility, and
  interaction. This is where fern differentiates. Do not touch it.

## Hard constraints

1. **`packages/color-picker` must keep zero runtime dependencies beyond React.**
   It is a copy-paste-friendly published package. It must NOT import
   `@heroui/styles`. Instead it should read CSS custom properties with literal
   fallbacks, so it themes automatically when the variables exist and still
   looks correct when they do not:

   ```tsx
   background: "var(--surface, #ffffff)"
   color: "var(--foreground, #11181c)"
   ```

   `@heroui/styles` may be a **devDependency of `apps/docs` only.**

2. **Do not change component logic, props, accessibility, or interaction.**
   Specifically preserve, and verify still working:
   - hue and saturation preserved at the black/grey extremes of the field
   - multi-touch protection (a drag owns one pointer id)
   - `onChange` on every frame vs `onChangeComplete` once on settle
   - arrow-key stepping (1%, 10% with Shift, Home/End)
   - the polite live region announcing only settled values
   - `prefers-reduced-motion` handling
   - the luminance-flipping thumb ring

3. **Insulate against their naming with an indirection layer.** This is the
   most important structural requirement, and skipping it is what would
   actually create lock-in.

   Their variable names must appear in **exactly one file**. Everywhere else
   uses fern's own semantic names:

   ```css
   /* the only place a heroui-owned name is written */
   @theme inline {
     --color-surface: var(--their-surface-var);
     --color-accent:  var(--their-accent-var);
   }
   ```

   Components then use `bg-surface` and `text-accent`, never
   `var(--their-surface-var)` directly. If they rename variables in a major
   version, or fern later drops the dependency, that is a one-file change
   instead of a codebase-wide sweep.

   Pin the exact version — `"@heroui/styles": "3.2.2"` with no caret. v3 is
   moving fast and a minor bump could rename tokens.

   Overriding remains available at any time: their styles sit in `@layer`, and
   unlayered CSS beats layered CSS regardless of specificity, so any fern
   declaration outside a layer wins automatically. Verify this actually holds
   by overriding one variable and confirming it takes effect.

4. **Attribution.** Apache-2.0 requires retaining the licence and NOTICE.
   Add a `NOTICE` file at the repo root crediting HeroUI, and a line in
   `README.md` stating that theme tokens come from `@heroui/styles`
   (Apache-2.0). Do not copy their source files into the repo — depend on the
   package.

## Steps

1. `bun add -d @heroui/styles --cwd apps/docs`

2. Inspect what the package actually ships before wiring it:
   ```
   ls node_modules/@heroui/styles
   cat node_modules/@heroui/styles/package.json   # check "exports"
   ```
   Find the CSS entry point and the file defining the theme variables. Read the
   variable names it defines — do not assume they match ours.

3. In `apps/docs/src/index.css`, import their stylesheet and delete our
   `@import "./theme.css"`. Then delete `apps/docs/src/theme.css` entirely.
   Keep the Tailwind `@theme inline` block that maps variables to utility
   names, but repoint every entry at their variable names.

4. Reconcile naming. Our current utilities are `bg-background`,
   `text-foreground`, `text-muted`, `bg-surface`, `bg-default`,
   `bg-default-hover`, `border-separator`, `text-accent`, `ring-focus`,
   `rounded-field`. Map each to their equivalent. Where they have no
   equivalent, keep ours and leave a comment saying so. Where a name collides
   with different meaning, rename ours — theirs wins.

5. Verify their dark theme activates the way ours did. We toggle a `.dark`
   class on a wrapper div; they may key off `.dark`, `[data-theme="dark"]`, or
   both. Adjust `apps/docs/src/App.tsx` to whatever they expect.

6. Rebuild the theme-preset picker (`apps/docs/src/components/ThemePicker.tsx`)
   on top of their preset mechanism if they ship one. If they do not, keep ours
   but have each preset override only their accent variable.

7. Update `packages/color-picker/src/color-picker.tsx` to read CSS variables
   with fallbacks per constraint 1. It currently hardcodes `#ebebec`,
   `#0485f7`, and several `rgb(0 0 0 / …)` shadows.

## Verification — do not skip, and do not report success without doing this

Typechecking is not evidence the UI is correct. A previous pass shipped a
version where Tailwind silently dropped every class and typecheck still passed.

```bash
cd ~/Desktop/build/fern
bun install
(cd packages/color-picker && bunx tsc --noEmit)
(cd apps/docs && bunx tsc --noEmit)
(cd apps/docs && bunx vite --port 5200 &)
```

Then screenshot both themes with headless Chrome and **actually look at them**:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=8000 --screenshot=/tmp/light.png \
  --window-size=1400,1100 "http://localhost:5200/?theme=light#/color-picker"
```

Repeat with `?theme=dark`. Confirm in the images:

- the page background is a light grey and cards are white — not white on white
- code blocks are a clearly distinct panel from the page in **both** themes
- the picker's swatches, sliders, and value field are all legible
- switching theme presets retints the whole page, not only the accent
- text contrast is comfortable in dark mode, not muddy

Also click the copy button several times rapidly and confirm the icon does not
flicker between states.

## Definition of done

- `apps/docs/src/theme.css` is deleted and nothing references it
- `@heroui/styles` is a devDependency of `apps/docs` only, never of
  `packages/color-picker`
- `packages/color-picker/package.json` still lists React as its sole peer
  dependency and no runtime dependencies
- both packages typecheck
- screenshots of both themes have been captured and visually inspected
- `NOTICE` exists and `README.md` credits the source
- every behaviour in constraint 2 still works

Commit in small, scoped commits as you go rather than one large commit at the
end. If something in their package does not fit our structure, say so
explicitly in your report rather than silently working around it.
