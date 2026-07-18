import {
  createHighlighterCore,
  type HighlighterCore,
} from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"

/**
 * Shiki, loaded with only the grammars and themes this site uses.
 *
 * The full Shiki bundle carries every language and theme it supports, which is
 * megabytes. Importing the core plus three grammars keeps it to a fraction of
 * that, and the whole thing is lazy — nothing loads until a code block renders.
 */

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [
      import("shiki/themes/github-light-default.mjs"),
      import("shiki/themes/github-dark-default.mjs"),
    ],
    langs: [
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/json.mjs"),
    ],
    engine: createOnigurumaEngine(import("shiki/wasm")),
  })
  return highlighterPromise
}

export type CodeLang = "tsx" | "bash" | "json"

export async function highlight(
  code: string,
  lang: CodeLang,
  dark: boolean,
): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, {
    lang,
    theme: dark ? "github-dark-default" : "github-light-default",
  })
}
