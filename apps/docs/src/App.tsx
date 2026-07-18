import { useState } from "react"
import { CATEGORIES, REGISTRY, type BlockDoc, type PropDoc } from "./registry"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

const EASE = "cubic-bezier(0.2, 0, 0, 1)"

/* -------------------------------------------------------------------------- */

export function App() {
  const [dark, setDark] = useState(
    () => new URLSearchParams(window.location.search).get("theme") !== "light",
  )
  const [slug, setSlug] = useState(REGISTRY[0]!.slug)
  const block = REGISTRY.find((entry) => entry.slug === slug)!

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-bg text-fg">
        <Header dark={dark} onToggleTheme={() => setDark((value) => !value)} />
        <div className="mx-auto flex max-w-[1400px]">
          <Sidebar slug={slug} onSelect={setSlug} />
          <main className="min-w-0 flex-1 px-8 py-10 lg:px-14">
            <BlockPage block={block} />
          </main>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Header({
  dark,
  onToggleTheme,
}: {
  dark: boolean
  onToggleTheme: () => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-divider bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-6">
        <a href="/" className="flex items-center gap-2">
          <FernMark />
          <span className="text-[15px] font-semibold tracking-tight">fern</span>
        </a>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-fg-muted">
          0.1.0
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            className={cn(
              "grid size-9 place-items-center rounded-xl",
              "text-fg-muted",
              "transition-[background-color,scale] duration-150 active:scale-[0.96]",
              "hover:bg-black/5 dark:hover:bg-white/10",
              "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <a
            href="https://github.com/CrackedResearcher/fern"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className={cn(
              "grid size-9 place-items-center rounded-xl",
              "text-fg-muted",
              "transition-[background-color,scale] duration-150 active:scale-[0.96]",
              "hover:bg-black/5 dark:hover:bg-white/10",
              "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */

function Sidebar({
  slug,
  onSelect,
}: {
  slug: string
  onSelect: (slug: string) => void
}) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-black/[0.07] px-4 py-8 md:block dark:border-white/[0.08]">
      <nav className="flex flex-col gap-7">
        {CATEGORIES.map((category) => (
          <div key={category} className="flex flex-col gap-1">
            <h2 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {category}
            </h2>
            {REGISTRY.filter((block) => block.category === category).map(
              (block) => {
                const active = block.slug === slug
                const planned = block.status === "planned"
                return (
                  <button
                    key={block.slug}
                    type="button"
                    disabled={planned}
                    onClick={() => onSelect(block.slug)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-left text-[13.5px]",
                      "transition-colors duration-150",
                      "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
                      planned && "cursor-not-allowed opacity-45",
                      active
                        ? "bg-surface-2 font-medium text-fg"
                        : !planned && "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
                    )}
                    style={{ transitionTimingFunction: EASE }}
                  >
                    {block.name}
                    {planned && (
                      <span className="rounded-md bg-neutral-200/70 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        Soon
                      </span>
                    )}
                  </button>
                )
              },
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */

function BlockPage({ block }: { block: BlockDoc }) {
  const [demoIndex, setDemoIndex] = useState(0)
  const demo = block.demos?.[demoIndex]

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-balance">
        {block.name}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-fg-muted">
        {block.description}
      </p>

      {block.install && (
        <div className="mt-6">
          <CopyableCommand command={block.install} />
        </div>
      )}

      {block.demos && demo && (
        <section className="mt-12">
          <SectionHeading>Usage</SectionHeading>

          {/* Tabs only earn their space when there is more than one demo. */}
          <div
            className={cn(
              "mt-4 flex-wrap gap-1.5",
              block.demos.length > 1 ? "flex" : "hidden",
            )}
          >
            {block.demos.map((entry, index) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => setDemoIndex(index)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
                  index === demoIndex
                    ? "bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-black/[0.05] dark:text-neutral-400 dark:hover:bg-white/[0.08]",
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                {entry.name}
              </button>
            ))}
          </div>

          {/* Preview surface: a subtle grid keeps translucent colors readable. */}
          <div
            className="mt-4 grid min-h-[420px] place-items-center rounded-2xl border border-black/[0.07] p-10 dark:border-white/[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "16px 16px",
              color: "rgba(128,128,128,0.22)",
            }}
          >
            {demo.render()}
          </div>

          <CodeBlock code={demo.code} />
        </section>
      )}

      {block.props && (
        <section className="mt-14">
          <SectionHeading>API reference</SectionHeading>
          <PropsTable props={block.props} />
        </section>
      )}

      {block.status === "planned" && (
        <div className="mt-10 rounded-2xl border border-dashed border-black/15 p-10 text-center text-[14px] text-neutral-500 dark:border-white/15 dark:text-neutral-400">
          Not built yet.
        </div>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------------- */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[20px] font-semibold tracking-[-0.01em]">{children}</h2>
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
    <div className="flex items-center gap-2 rounded-xl bg-surface-2 py-1 pl-4 pr-1">
      <code className="flex-1 font-mono text-[13px] text-neutral-700 dark:text-neutral-300">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          "text-fg-muted",
          "transition-[background-color,scale] duration-150 active:scale-[0.96]",
          "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]",
          "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

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
    <div className="group relative mt-3">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          "absolute right-3 top-3 grid size-8 place-items-center rounded-lg",
          "bg-white/70 text-neutral-500 backdrop-blur dark:bg-neutral-800/70 dark:text-neutral-400",
          "opacity-0 transition-[opacity,background-color,scale] duration-150",
          "group-hover:opacity-100 focus-visible:opacity-100 active:scale-[0.96]",
          "hover:bg-white dark:hover:bg-neutral-700",
          "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {/* Wide code scrolls inside its own container so the page never does. */}
      <pre className="overflow-x-auto rounded-2xl bg-neutral-950 p-5 dark:bg-neutral-900/70 dark:ring-1 dark:ring-white/[0.06]">
        <code className="font-mono text-[13px] leading-relaxed text-neutral-200">
          {code}
        </code>
      </pre>
    </div>
  )
}

function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-divider">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-divider bg-surface-2/50">
            {["Prop", "Type", "Default", "Description"].map((heading) => (
              <th
                key={heading}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr
              key={prop.name}
              className="border-b border-black/[0.05] last:border-0 dark:border-white/[0.06]"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] font-medium">
                {prop.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-blue-600 dark:text-blue-400">
                {prop.type}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-fg-muted">
                {prop.defaultValue ?? "—"}
              </td>
              <td className="px-4 py-3 text-[13px] text-pretty text-fg-muted">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function FernMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21V8m0 0c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Zm0 5c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Zm0 4c0-3-2-5-5-5 0 3 2 5 5 5Zm0-1c0-3 2-5 5-5 0 3-2 5-5 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

function CopyIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10Z" />
    </svg>
  )
}
