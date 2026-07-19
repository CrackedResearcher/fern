# fern

React UI blocks that get the small things right. Thoughtfully designed, zero runtime dependencies, copy-paste friendly. **Yours to edit.**

![fern](.github/assets/banner.png)

[![License](https://img.shields.io/badge/license-MIT-7ac555?style=flat-square&labelColor=1c1c1c)](#license)
[![React](https://img.shields.io/badge/react-18%20%7C%2019-7ac555?style=flat-square&labelColor=1c1c1c)](https://react.dev)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-7ac555?style=flat-square&labelColor=1c1c1c)](#)
[![Stars](https://img.shields.io/github/stars/CrackedResearcher/fern?style=flat-square&labelColor=1c1c1c&color=7ac555)](https://github.com/CrackedResearcher/fern/stargazers)

<!--
  Uncomment on first publish. Until a package exists on the registry these
  render as a grey "invalid" and a red "package not found", which reads as a
  broken project rather than an unpublished one.

  [![npm](https://img.shields.io/npm/v/@fern-ui/color-picker?style=flat-square&labelColor=1c1c1c&color=7ac555)](https://www.npmjs.com/package/@fern-ui/color-picker)
  [![downloads](https://img.shields.io/npm/dm/@fern-ui/color-picker?style=flat-square&labelColor=1c1c1c&color=7ac555)](https://www.npmjs.com/package/@fern-ui/color-picker)
-->

## Blocks

| Package | Description |
| --- | --- |
| [`@fern-ui/button`](packages/button) | Seven variants, three sizes, with the press scale tuned per size. |
| [`@fern-ui/code-block`](packages/code-block) | Code viewer with a filename bar, copy, and collapse for long files. |
| [`@fern-ui/color-picker`](packages/color-picker) | HEX/RGBA/HSL, editable channels, alpha, and eyedropper. |
| [`@fern-ui/country-picker`](packages/country-picker) | Searchable select — matches name, code, dial code, and aliases. |

Not on npm yet. Until then, copy a block out of `packages/` — that path is supported first-class, not a fallback.

## Documentation

```bash
bun install
bun run dev
```

The docs site and playground run at localhost:5200. See [`apps/docs`](apps/docs).

## License

MIT. See [`NOTICE`](NOTICE) for third-party attribution.
