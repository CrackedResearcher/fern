import { useEffect, useState } from "react"
import { cn, EASE } from "../lib/cn"
import { highlight, type CodeLang } from "../lib/highlight"
import { useCopy } from "../lib/useCopy"
import { CheckIcon, CopyIcon } from "./icons"

/**
 * Cross-fades the copy and check icons in place.
 *
 * Both stay mounted and swap opacity and scale. Toggling which one renders
 * would pop, and popping is what makes a confirmation feel unreliable — the
 * affordance has to read as one object changing state, not two swapping.
 */
function CopyGlyph({ copied }: { copied: boolean }) {
  const shared =
    "absolute inset-0 grid place-items-center transition-[opacity,scale] duration-150"
  return (
    <span className="relative grid size-3.5 place-items-center">
      <span
        className={cn(shared, copied ? "scale-50 opacity-0" : "scale-100 opacity-100")}
        style={{ transitionTimingFunction: EASE }}
      >
        <CopyIcon />
      </span>
      <span
        className={cn(shared, copied ? "scale-100 opacity-100" : "scale-50 opacity-0")}
        style={{ transitionTimingFunction: EASE }}
      >
        <CheckIcon />
      </span>
    </span>
  )
}

export function CodeBlock({
  code,
  lang = "tsx",
  dark,
  className,
  /** True when the block sits directly beneath a preview and shares its frame. */
  attached = false,
}: {
  code: string
  lang?: CodeLang
  dark: boolean
  className?: string
  attached?: boolean
}) {
  const [html, setHtml] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  // Highlighting is async — the grammar and wasm load on demand — so this is a
  // real external synchronisation. Plain code renders first and is replaced
  // once the highlighter resolves.
  useEffect(() => {
    let active = true
    highlight(code, lang, dark).then((result) => {
      if (active) setHtml(result)
    })
    return () => {
      active = false
    }
  }, [code, lang, dark])

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        // The frame belongs to the section, not the code. Standalone blocks
        // are borderless; only a block joined to a preview carries the edge
        // that closes that shared box.
        attached
          ? "rounded-b-xl border-r border-b border-l border-separator"
          : "rounded-xl",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => copy(code)}
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          "absolute top-3 right-2 z-10 grid size-8 place-items-center rounded-lg",
          "text-muted backdrop-blur-lg transition-colors duration-150",
          "hover:text-foreground",
          "outline-hidden focus-visible:ring-2 focus-visible:ring-focus/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <CopyGlyph copied={copied} />
      </button>

      {/* Wide code scrolls inside its own container so the page never does. */}
      {html ? (
        <div
          className="fern-code overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="fern-code-fallback overflow-x-auto p-4">
          <code className="font-mono text-[13px] leading-relaxed">{code}</code>
        </pre>
      )}
    </div>
  )
}
