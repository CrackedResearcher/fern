import { useEffect, useState } from "react"
import { cn, EASE } from "../lib/cn"
import { highlight, type CodeLang } from "../lib/highlight"
import { CheckIcon, CopyIcon } from "./icons"

export function CodeBlock({
  code,
  lang = "tsx",
  dark,
  className,
}: {
  code: string
  lang?: CodeLang
  dark: boolean
  className?: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Highlighting is async (the grammar and wasm load on demand), so this is a
  // genuine external synchronisation rather than derivable state. The plain
  // code renders first and is replaced once the highlighter resolves.
  useEffect(() => {
    let active = true
    highlight(code, lang, dark).then((result) => {
      if (active) setHtml(result)
    })
    return () => {
      active = false
    }
  }, [code, lang, dark])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }

  return (
    <div className={cn("group relative", className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          "absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg",
          "bg-surface-1/80 text-fg-muted backdrop-blur",
          "opacity-0 transition-[opacity,background-color,scale] duration-150",
          "group-hover:opacity-100 focus-visible:opacity-100 active:scale-[0.97]",
          "hover:text-fg",
          "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>

      {/* Wide code scrolls inside its own container so the page never does. */}
      {html ? (
        <div
          className="fern-code overflow-x-auto rounded-xl border border-divider text-[13px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-xl border border-divider bg-surface-2 p-4 text-[13px] leading-relaxed">
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}
