# fern

React UI blocks. Thoughtfully designed, low-dependency, copy-paste friendly.

## What this project is

A component library where the differentiation is **behaviour and usability**,
not colour. Colour systems are a solved problem — the theme foundation is
borrowed. What is not solved, and what fern exists to do well, is the hundred
small interaction details that most component libraries get wrong.

Concretely, the colour picker preserves hue and saturation at the black and
grey extremes of the field (most pickers snap the hue slider back to red),
protects a drag against a second finger hijacking it, separates per-frame
`onChange` from settle-only `onChangeComplete`, announces only settled values
to screen readers, and flips its thumb ring by the luminance underneath so it
never disappears. That is the product.

If a change makes a block prettier but not better to use, it is not the
priority. If it makes a block more usable, it is.

## Layout

```
packages/button         @fern-ui/button — seven variants, three sizes
packages/code-block     @fern-ui/code-block — filename bar, copy, collapse
packages/color-picker   @fern-ui/color-picker — the published block
packages/country-picker @fern-ui/country-picker — searchable country select
apps/docs               Next.js 16 + Fumadocs documentation site and playground
apps/docs/app/probe     measuring harnesses, not docs pages — see below
MIGRATION_PROMPT.md     completed brief for adopting @heroui/styles — historical
packages/color-picker/REDESIGN.md   agreed spec for the next picker pass
```

Next up is `@fern-ui/cmdk`, a command menu. It is a good fit — a command menu
is almost entirely behaviour, and the ranked matcher, portal positioning,
keyboard model and long-list handling already exist in the country picker. The
thing to settle before starting is what it beats `cmdk` on, because "beautiful
and performant" does not: that library is both. The honest angles are zero
runtime dependencies (it pulls Radix), a real copy-paste path, and the
interaction details. If performance is the claim it needs a number —
`content-visibility` is proven here at 198 rows, not at 10,000.

The docs site is also the test harness. There is deliberately no separate demo
app — components get exercised and documented in the same place.

## Commands

```bash
bun install
bun run dev          # docs at localhost:5200
bun run typecheck    # all workspaces
bun run build        # tsup build of every package
```

Per workspace: `cd packages/color-picker && bunx tsc --noEmit`

## Hard rules

**Published packages have zero runtime dependencies beyond React.** Colour
maths, drag handling, keyboard behaviour, and clipboard logic are written, not
installed. Docs-app dependencies (Shiki, the theme package) are unconstrained —
consumers never download them. Check `packages/*/package.json` before adding
anything.

**Every block ships two ways, and the file layout serves both.** `bun add
@fern-ui/<block>` and copy-paste are equal paths, so:

- **No file exceeds 400 lines.** Past that it stops being readable, and a
  reviewer stops reading it.
- **The UI layer stays in one file.** Behaviour, data, glyphs and presentational
  leaves split into their own — `search.ts`, `countries.ts`, `icons.tsx`,
  `parts.tsx`. Each is copy-paste friendly on its own.
- **Anything a consumer can import separately is its own entry** in
  `tsup.config.ts` and in `exports`, so importing the data never drags React
  into their graph.
- Static assets a block needs (flags, for instance) live in `apps/docs/public`
  and are resolved through a prop with a sensible default, never bundled.

**Blocks read CSS custom properties with literal fallbacks**, never import a
theme:

```tsx
background: "var(--surface, #ffffff)"
```

They theme automatically where variables exist and still render correctly
where they do not.

**Third-party token names appear in exactly one mapping file.** Components use
fern's semantic names (`bg-surface`, `text-accent`). A foundation rename or
swap must be a one-file change.

**Accessibility is not optional and not a later pass.** Every control carries a
role, a label, and a human-readable `aria-valuetext`. Interactive targets clear
40px. `prefers-reduced-motion` is respected. Live regions announce settled
values only — narrating every drag frame floods a screen reader.

The one accepted exception is `@fern-ui/button`, whose `sm` size is 36px and
drops to 32px above the `md` breakpoint. That is HeroUI's own sizing, and the
block exists to be pixel-identical to it — a taller `sm` would make every
adopted call site visibly disagree with the surrounding page. Do not "fix" it
to 40px; the tradeoff was made deliberately and measured.

## Verification

**Typechecking is not evidence the UI works.** A pass early in this project
shipped a version where Tailwind silently dropped every class on the component
and typecheck still returned 0. Only inline gradients rendered.

For any visual change, screenshot and actually look:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=8000 --screenshot=/tmp/shot.png \
  --window-size=1400,1100 \
  "http://localhost:5200/docs/components/color-picker?theme=dark"
```

The docs site reads `?theme=light|dark` from the URL specifically so headless
screenshots can capture either. **Check both themes** — dark-mode bugs
(invisible checkerboards, panels that collapse into the page) do not show up in
light.

**When a block has to match something, diff the rendered DOM, not the classes.**
HeroUI overrides its own utilities with unlayered rules, so a class list is not
evidence of anything. `apps/docs/app/probe/button` is the pattern: render both
components side by side, walk the whole `getComputedStyle` on each pair, and
render the differences into the page so a headless screenshot captures them.
Compare *every* property — a hand-picked list only finds the differences you
already suspected. That harness found six real gaps (`position`, `user-select`,
`touch-action`, `white-space`, icon-only padding, the outline border) that a
list of the twelve obvious properties reported as a clean pass.

**Wait for the dev server to go idle before believing a screenshot.** Turbopack
serves the page before the stylesheet finishes rebuilding, so a probe run with
the "Compiling…" badge still up measures a half-applied stylesheet. One such run
reported the button as matching on every property that later turned out to be
wrong. If the badge is in the shot, the shot is void.

## Conventions

**Commits are small and scoped.** One logical change per commit, pushed as you
go. Not one large commit at the end.

**Comments explain the non-obvious *why*, never the what.** A comment earns its
place by recording a decision, a constraint, or a trap — something a reader
would otherwise have to rediscover:

```tsx
// Position is deliberately never transitioned. Easing it leaves the thumb
// trailing the cursor and the whole control reads as laggy.
```

Do not narrate code that speaks for itself.

**No `useEffect` for derived state.** Adjust state during render for
controlled-value sync. Reserve effects for genuine outside-React
synchronisation: subscriptions, timers, `matchMedia`, `IntersectionObserver`.

**Motion:** strong custom ease-out, never `ease-in` (it reads as lag at exactly
the moment the user is watching). Press feedback at `scale(0.97)`, ~150ms.
Exits are faster than enters. Never `transition: all`. Never animate from
`scale(0)` — start at `0.96`-`0.97` with opacity.

Panels animate from the trigger, not their own centre: set `transform-origin`
to the edge they open from. An exit needs the element kept mounted while it
plays, and the enter needs a committed start style — do that from a ref
callback with a forced reflow, not `requestAnimationFrame`, which can be
cancelled by an effect re-run and leave the panel stuck invisible.

**Anything that scrolls fades at its boundaries.** A row sliced by a sticky
header or by the end of a panel reads as a rendering fault. Fade to the
surface colour underneath, and only on the edge that has content beyond it —
a fade with nothing to scroll to is a wash over the first row, not a hint. A
gradient overlay, not `mask-image`: a mask fades the element's own background
too, so the surface thins out and lets what is behind it through.

**A cursor and a selection are different states.** Where a list has both, the
keyboard/pointer cursor is a neutral wash and the current selection is tinted
— otherwise "where I am" and "what I chose" are indistinguishable. Open a list
with the cursor on the selection, scrolled to it.

**Nested surfaces are concentric:** inner radius = outer radius − the gap
between them, and the gap has to be equal on every edge for one radius to
satisfy it. Asymmetric padding is why a corner reads wrong. Remember the
border: a 12px child inside a 12px parent with a 1px border leaves a 1px flat
spot; let `overflow-hidden` clip it instead of hardcoding the inner value.

**Popovers are portalled.** An absolutely-positioned panel is clipped by any
ancestor with `overflow: hidden` — a card, a preview box, a modal — and no
z-index fixes it, because clipping happens before stacking. Position against
the trigger in viewport coordinates, observe the trigger for resize, and flip
when the space below cannot hold the panel.

**Empty states say what to try next.** "No results" alone is a dead end; name
the things that would match. The illustration is drawn, not shipped as an
image — a raster asset cannot follow the theme and the packages ship no
assets — and it stays quiet enough not to compete with the message.

## Traps that have already cost time

**Tailwind v4 does not scan sibling workspace packages.** Classes used in
`packages/*` are dropped from the docs build unless declared:

```css
@source "../../../packages/color-picker/src";
```

This fails *silently* — the page renders with no styles and no error.

**`@theme inline` does not emit runtime CSS variables.** It inlines values at
build time. `var(--color-surface)` written in plain CSS resolves to nothing.
Reference the authored variable (`var(--surface)`) instead.

**bun hardlinks binaries out of its global cache**, and on macOS that
invalidates their code signature — Gatekeeper SIGKILLs esbuild and vite dies
with `The service was stopped: write EPIPE`. `bunfig.toml` sets
`backend = "copyfile"` to prevent it. If the dev server dies this way after a
`bun add`, that file is the fix; do not re-run `bun install --force` and call
it solved, because the next install re-breaks it.

**Tailwind v4 under Next needs `@tailwindcss/postcss`.** Without
`postcss.config.mjs` the stylesheet is passed through untransformed — `@import`
and `@theme` survive into the output, no utilities are generated, and the page
renders with *no styles at all*. No error, no warning. Same class of silent
failure as the `@source` trap above.

**`tw-animate-css` cannot be resolved by Turbopack.** It publishes only a
`style` export condition and blocks deep paths. It also cannot be dropped —
`@heroui/styles`' component layer `@apply`s its utilities, which is a build
error, not a missing animation. `next.config.mjs` locates the file and aliases
the bare specifier to it.

**Static properties do not survive the RSC boundary.** `Foo.Bar = Bar` on a
client component is undefined by the time a server component resolves it, so
`<Foo.Bar>` in MDX throws at render. Export the slots as separate components.

**Type that reads bolder than it should is usually rendering, not CSS.**
`:root` carries `-webkit-font-smoothing: antialiased`, `font-synthesis: none`
and `text-rendering: optimizeLegibility`. Dropping `font-synthesis` in
particular makes the browser fake missing weights by smearing glyphs — heavier
and blurrier at an identical `font-weight`. Check these before hunting for a
class difference.

**The docs shell is ported code, not ours.** `apps/docs/components/fumadocs/`
is HeroUI's fork of Fumadocs' Notebook layout, ported under Apache-2.0. Every
file carries an attribution header and `NOTICE` records the modifications.
Changes there are edits to someone else's code — keep the headers.

**Translucent surfaces collapse on dark backgrounds.** `rgba(40,40,40,0.4)`
over a near-black page lands within a couple of percent of the page. Use solid
surface steps in dark, not translucency.

**Clipboard confirmations need their timer cleared.** Calling `setTimeout`
without holding the handle means rapid clicks stack timers and the icon
flickers. See `apps/docs/components/code-actions.tsx` and
`apps/docs/components/page-actions.tsx`.

## Publishing

Nothing is published yet. The npm org is `fern-ui`; packages are
`@fern-ui/<block>` with `publishConfig.access: "public"` already set. First
publish needs `npm login` from the maintainer, then `bun run build` before
`npm publish` — `files: ["dist"]` means publishing without building ships an
empty package.
