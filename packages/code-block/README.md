# @fern-ui/code-block

A code viewer for React — filename bar, copy button, and collapse for long
files. No runtime dependencies beyond React itself.

It does not highlight. Pass it already-highlighted markup, or plain text.
Bundling a highlighter would cost more than the component.

```bash
bun add @fern-ui/code-block
```

## Usage

```tsx
import { CodeBlock } from "@fern-ui/code-block"

<CodeBlock label="button.tsx">
  <pre>{source}</pre>
</CodeBlock>
```

With a highlighter — Shiki here, but anything that returns markup works:

```tsx
const html = await codeToHtml(source, { lang: "tsx", theme: "github-dark" })

<CodeBlock label="button.tsx">
  <div dangerouslySetInnerHTML={{ __html: html }} />
</CodeBlock>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The code. Highlighted markup, or plain text. |
| `label` | `string` | — | Filename for the bar. Falls back to `lang`. |
| `lang` | `string` | — | Language shown when there is no filename. Uppercased, so it never reads like a filename. |
| `standalone` | `boolean` | `false` | Round all four corners. Leave off when the block is fused to something above it. |
| `lineNumbers` | `boolean` | `false` | Show the line-number gutter. |
| `copyable` | `boolean` | — | Show the copy button in the bar. |
| `className` | `string` | — | Lands on the root element. |

Omit both `label` and `lang` and the bar does not render at all.

## Collapse

Blocks taller than 150px collapse behind an **Expand code** button. Shorter ones
render whole, with no button — a control that does nothing is worse than no
control.

The collapsed edge fades to the surface colour underneath rather than using
`mask-image`: a mask fades the element's own background too, so the surface
thins out and lets whatever is behind it through.

## Copy

The confirmation holds its timer handle and clears it on the next click.
Without that, rapid clicks stack timers and the icon flickers between states.

Copy uses `navigator.clipboard`, which browsers block outside a secure origin
and can gate behind permissions. A failure is swallowed rather than surfaced —
the icon simply does not change.

## Theming

Reads CSS custom properties with literal fallbacks, so it renders correctly
against no theme and picks one up where it exists:

```css
:root {
  --surface: #ffffff;
  --surface-secondary: #f4f4f5;
  --background: #060607;
  --separator: rgb(0 0 0 / 0.1);
  --foreground: #18181b;
  --muted: #71717a;
  --default: #ebebec;
  --focus: #0485f7;
}
```

## License

MIT
