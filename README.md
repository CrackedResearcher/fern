# fern

Thoughtfully designed React UI blocks. Low-dependency, copy-paste, yours to edit.

## Blocks

| Package | Description |
| --- | --- |
| [`@fern-ui/color-picker`](packages/color-picker) | Accessible color picker with alpha, swatches, and eyedropper. |

## Principles

**Low dependency.** Blocks depend on React and nothing else at runtime. Color
math, drag handling, and keyboard behaviour are written rather than installed.

**Tree-shakeable.** Every package is `sideEffects: false` with granular entry
points, so importing a utility never drags a component into your bundle.

**Accessible by default.** Full keyboard support, correct ARIA, 44px hit areas,
live-region announcements, and `prefers-reduced-motion` support — not as an
afterthought toggle.

**Yours to edit.** Blocks are meant to be copied into your codebase and changed.
The npm package is a convenience, not a lock-in.

## Development

```bash
bun install
bun run dev        # docs at localhost:5200
bun run typecheck
bun run build
```

The docs app aliases packages to their source, so changes hot-reload without a
build step.

## Layout

```
packages/          one folder per block
apps/docs          docs site and live playground
```

## Theme foundation

The documentation site's colour, elevation, radius, spacing, and component
styles come from [`@heroui/styles`](https://github.com/heroui-inc/heroui/tree/v3/packages/styles)
by HeroUI, consumed as a pinned npm dependency rather than copied in. See
[`NOTICE`](NOTICE) for attribution and a note on the package's conflicting
licence metadata.

The published blocks under `packages/` do **not** depend on it. They read CSS
custom properties with literal fallbacks, so they pick up a host's theme where
one exists and render correctly where it does not.

## License

MIT
