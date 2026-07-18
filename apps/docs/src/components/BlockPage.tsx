import { useState } from "react"
import { cn, EASE } from "../lib/cn"
import { href } from "../lib/router"
import { REGISTRY, type BlockDoc } from "../registry"
import { CodeBlock } from "./CodeBlock"
import { Preview } from "./Preview"
import { PropsTable } from "./PropsTable"
import type { TocEntry } from "./TableOfContents"
import { CheckIcon, CopyIcon } from "./icons"

export function tocFor(block: BlockDoc): TocEntry[] {
  const entries: TocEntry[] = []
  if (block.install) entries.push({ id: "installation", label: "Installation", depth: 1 })
  if (block.demos?.length) entries.push({ id: "usage", label: "Usage", depth: 1 })
  if (block.anatomy) entries.push({ id: "anatomy", label: "Anatomy", depth: 1 })
  if (block.accessibility?.length)
    entries.push({ id: "accessibility", label: "Accessibility", depth: 1 })
  if (block.props?.length)
    entries.push({ id: "api-reference", label: "API reference", depth: 1 })
  return entries
}

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="group scroll-mt-20 text-[20px] font-semibold tracking-[-0.01em]"
    >
      <a href={`#${id}`} className="no-underline">
        {children}
        <span className="ml-2 text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  )
}

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-separator bg-default py-1 pl-4 pr-1">
      <code className="flex-1 font-mono text-[13px] text-foreground">{command}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg text-foreground-muted",
          "transition-[background-color,color,scale] duration-150 active:scale-[0.97]",
          "hover:bg-default-hover hover:text-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  )
}

export function BlockPage({ block, dark }: { block: BlockDoc; dark: boolean }) {
  const [demoIndex, setDemoIndex] = useState(0)
  const demo = block.demos?.[demoIndex]

  const readable = REGISTRY.filter((entry) => entry.status === "ready")
  const position = readable.findIndex((entry) => entry.slug === block.slug)
  const previous = position > 0 ? readable[position - 1] : undefined
  const next = position >= 0 ? readable[position + 1] : undefined

  return (
    <article className="max-w-[900px] pb-20">
      <p className="mb-2 text-[13px] font-medium text-foreground-muted">{block.category}</p>
      <h1 className="text-[28px] font-semibold text-balance">
        {block.name}
      </h1>
      <p className="mt-2 mb-4 text-[18px] leading-relaxed text-pretty text-muted">
        {block.description}
      </p>

      {block.status === "planned" && (
        <div className="mt-10 rounded-2xl border border-dashed border-separator p-10 text-center text-[14px] text-foreground-muted">
          Not built yet.
        </div>
      )}

      {block.install && (
        <section className="mt-12">
          <Heading id="installation">Installation</Heading>
          <div className="mt-4">
            <CopyableCommand command={block.install} />
          </div>
        </section>
      )}

      {block.demos && demo && (
        <section className="mt-12">
          <Heading id="usage">Usage</Heading>

          {/* Tabs only earn their space when there is more than one demo. */}
          {block.demos.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {block.demos.map((entry, index) => (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => setDemoIndex(index)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-150",
                    "outline-none focus-visible:ring-2 focus-visible:ring-focus/60",
                    index === demoIndex
                      ? "bg-foreground font-medium text-background"
                      : "text-foreground-muted hover:bg-default",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Preview pageDark={dark}>{demo.render()}</Preview>
          </div>

          <CodeBlock code={demo.code} dark={dark} className="mt-3" />
        </section>
      )}

      {block.anatomy && (
        <section className="mt-12">
          <Heading id="anatomy">Anatomy</Heading>
          <p className="mt-3 text-[14px] leading-relaxed text-pretty text-foreground-muted">
            {block.anatomy.description}
          </p>
          <CodeBlock code={block.anatomy.code} dark={dark} className="mt-4" />
        </section>
      )}

      {block.accessibility && block.accessibility.length > 0 && (
        <section className="mt-12">
          <Heading id="accessibility">Accessibility</Heading>
          <ul className="mt-4 flex flex-col gap-2.5">
            {block.accessibility.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-[14px] leading-relaxed text-pretty text-foreground-muted"
              >
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-foreground-muted" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {block.props && (
        <section className="mt-12">
          <Heading id="api-reference">API reference</Heading>
          <PropsTable props={block.props} />
        </section>
      )}

      {(previous || next) && (
        <nav className="mt-16 flex items-stretch justify-between gap-4 border-t border-separator pt-6">
          {previous ? (
            <a
              href={href(previous.slug)}
              className="flex flex-1 flex-col gap-1 rounded-xl border border-separator p-4 transition-colors duration-150 hover:bg-default"
              style={{ transitionTimingFunction: EASE }}
            >
              <span className="text-[12px] text-foreground-muted">Previous</span>
              <span className="text-[14px] font-medium">{previous.name}</span>
            </a>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <a
              href={href(next.slug)}
              className="flex flex-1 flex-col items-end gap-1 rounded-xl border border-separator p-4 transition-colors duration-150 hover:bg-default"
              style={{ transitionTimingFunction: EASE }}
            >
              <span className="text-[12px] text-foreground-muted">Next</span>
              <span className="text-[14px] font-medium">{next.name}</span>
            </a>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}
    </article>
  )
}
