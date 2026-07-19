# fern docs

The documentation site — live at https://fernui.vercel.app — and the test harness. There is deliberately no separate
demo app — blocks get exercised and documented in the same place, so a block
that looks wrong here is wrong.

Next.js 16 + Fumadocs, Tailwind v4, Shiki for highlighting.

```bash
bun run dev          # localhost:5200
bun run build
bun run typecheck
```

Packages alias to their source, so changes to `packages/*` hot-reload without a
build step.

## Layout

```
app/                  routes and global.css
app/probe/            measuring harnesses, not docs pages
content/docs/         MDX, one file per block
components/mdx.tsx    what MDX can reach without an import
components/demos/     live examples registered in mdx.tsx
components/fumadocs/  ported layout — see Attribution
```

Adding a block page means an `.mdx` under `content/docs/components/`, a demo in
`components/demos/`, one entry in `components/mdx.tsx`, and one line in
`content/docs/components/meta.json`. That's what keeps adding the next block
cheap.

## Screenshots

The site reads `?theme=light|dark` from the URL so headless screenshots can
capture either. Check both — dark-mode bugs like invisible checkerboards and
panels that collapse into the page don't show up in light.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=8000 --screenshot=/tmp/shot.png \
  --window-size=1400,1100 \
  "http://localhost:5200/docs/components/color-picker?theme=dark"
```

Wait for the dev server to go idle first. Turbopack serves the page before the
stylesheet finishes rebuilding — if the "Compiling…" badge is in the shot, the
shot is void.

## Probes

`app/probe/` holds measuring harnesses. They render two components side by side,
walk the whole `getComputedStyle` on each pair, and render the differences into
the page so a headless screenshot captures them.

Compare *every* property. `app/probe/button` found six real gaps — `position`,
`user-select`, `touch-action`, `white-space`, icon-only padding, the outline
border — that a hand-picked list of the twelve obvious properties reported as a
clean pass.

## Traps

**Tailwind v4 doesn't scan sibling workspace packages.** Classes used in
`packages/*` are dropped unless declared in `app/global.css`:

```css
@source "../../../packages/color-picker/src";
```

This fails silently — the page renders with no styles and no error.

**`@theme inline` doesn't emit runtime CSS variables.** It inlines values at
build time, so `var(--color-surface)` in plain CSS resolves to nothing.
Reference the authored variable instead.

**Tailwind v4 under Next needs `@tailwindcss/postcss`.** Without
`postcss.config.mjs` the stylesheet passes through untransformed and the page
renders with no styles at all. Same silent failure as above.

**`tw-animate-css` can't be resolved by Turbopack.** It publishes only a `style`
export condition. It also can't be dropped — the theme's component layer
`@apply`s its utilities. `next.config.mjs` aliases the bare specifier to the
located file.

**Static properties don't survive the RSC boundary.** `Foo.Bar = Bar` on a
client component is undefined by the time a server component resolves it, so
`<Foo.Bar>` in MDX throws. Export slots as separate components.

## Deployment

`vercel.json` at the repo root configures this app. It is the only deployable
thing in the repo — the packages go to npm.

The build command builds the packages before the site, and that order is
load-bearing:

```
bun run --filter '@fern-ui/*' build && bun run --filter docs build
```

`dist/` is gitignored, so a fresh clone has none. Only `@fern-ui/color-picker`
is aliased to source (`tsconfig` paths + `transpilePackages`); the other three
resolve through their `package.json` to `dist/index.js`. Building the site
alone fails with `module-not-found` on all three — it passes locally only
because a previous build left `dist/` behind.

## Attribution

This app's theme foundation — colour, elevation, radius, spacing, and the
component style layer — comes from
[`@heroui/styles`](https://github.com/heroui-inc/heroui/tree/v3/packages/styles),
consumed as a pinned npm dependency rather than copied in.

`components/fumadocs/` is HeroUI's fork of Fumadocs' Notebook layout, ported
under Apache-2.0. It is someone else's code: every file carries an attribution
header, and [`NOTICE`](../../NOTICE) records the modifications. Keep the headers.

The published blocks under `packages/` depend on none of this. They read CSS
custom properties with literal fallbacks, so consumers never download the theme.
