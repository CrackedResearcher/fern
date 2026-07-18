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
packages/color-picker   @fern-ui/color-picker — the published block
apps/docs               Next.js 16 + Fumadocs documentation site and playground
MIGRATION_PROMPT.md     completed brief for adopting @heroui/styles — historical
packages/color-picker/REDESIGN.md   agreed spec for the next picker pass
```

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
`scale(0)`.

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
