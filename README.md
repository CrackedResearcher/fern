<div align="center">
  <img src=".github/assets/banner.png" alt="fern" width="100%" />

  <h3>React UI blocks that get the small things right.</h3>
  <p>Thoughtfully designed, zero-dependency, copy-paste friendly.</p>

  <a href="#license">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-7ac555?style=flat-square&labelColor=1c1c1c" />
  </a>
  <a href="https://react.dev">
    <img alt="React 18 or 19" src="https://img.shields.io/badge/react-18%20%7C%2019-7ac555?style=flat-square&labelColor=1c1c1c" />
  </a>
  <img alt="Zero runtime dependencies" src="https://img.shields.io/badge/runtime%20deps-0-7ac555?style=flat-square&labelColor=1c1c1c" />
  <a href="https://github.com/CrackedResearcher/fern/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/CrackedResearcher/fern?style=flat-square&labelColor=1c1c1c&color=7ac555" />
  </a>

  <!--
    Uncomment on first publish. Until a package exists on the registry these
    render as a grey "invalid" and a red "package not found", which reads as a
    broken project rather than an unpublished one.

    <a href="https://www.npmjs.com/package/@fern-ui/color-picker">
      <img alt="npm version" src="https://img.shields.io/npm/v/@fern-ui/color-picker?style=flat-square&labelColor=1c1c1c&color=7ac555" />
    </a>
    <a href="https://www.npmjs.com/package/@fern-ui/color-picker">
      <img alt="npm downloads" src="https://img.shields.io/npm/dm/@fern-ui/color-picker?style=flat-square&labelColor=1c1c1c&color=7ac555" />
    </a>
    <a href="https://bundlephobia.com/package/@fern-ui/color-picker">
      <img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/@fern-ui/color-picker?style=flat-square&labelColor=1c1c1c&color=7ac555" />
    </a>
  -->
</div>

<br />

Most component libraries compete on colour. Colour is a solved problem — fern
borrows its theme foundation and spends its effort on the interaction details
that libraries usually get wrong. The colour picker keeps hue and saturation at
the black and grey extremes of the field, where most pickers snap the hue slider
back to red. That's the kind of thing this is for.

## Blocks

| Package | Description |
| --- | --- |
| [`@fern-ui/button`](packages/button) | Seven variants, three sizes, with the press scale tuned per size. |
| [`@fern-ui/code-block`](packages/code-block) | Code viewer with a filename bar, copy, and collapse for long files. |
| [`@fern-ui/color-picker`](packages/color-picker) | HEX/RGBA/HSL, editable channels, alpha, and eyedropper. |
| [`@fern-ui/country-picker`](packages/country-picker) | Searchable select — matches name, code, dial code, and aliases. |

> [!NOTE]
> Nothing is published to npm yet. Until it is, copy a block out of
> `packages/` — that path is supported first-class, not a fallback.

## Getting started

```bash
bun install
bun run dev          # docs and playground at localhost:5200
```

The docs site is also the test harness, so every block is exercised and
documented in the same place. See [`apps/docs`](apps/docs) for how it's built.

## Why

- **Zero runtime dependencies beyond React.** Colour maths, drag handling and
  keyboard behaviour are written, not installed.
- **Themes without importing a theme.** Blocks read CSS custom properties with
  literal fallbacks — `var(--surface, #ffffff)`.
- **Accessibility isn't a later pass.** Roles, labels, live regions that
  announce settled values only, and `prefers-reduced-motion` throughout.

## License

MIT. See [`NOTICE`](NOTICE) for third-party attribution.
