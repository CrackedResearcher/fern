"use client"

import {
  Button,
  ButtonGroup,
  Description,
  Dropdown,
  Label,
} from "@heroui/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/utils/cn"

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5"
      clipRule="evenodd"
    />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const ChevronDown = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden className={className}>
    <path
      fillRule="evenodd"
      d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06"
      clipRule="evenodd"
    />
  </svg>
)

const ExternalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
)

/**
 * Copy the page as Markdown, plus a dropdown of ways to hand it to an
 * assistant. Mirrors their ViewOptions, minus the "Add to Cursor" / "Add to
 * VS Code" rows — both are MCP deep-links to @heroui/react-mcp, and fern has
 * no MCP server, so they would install nothing.
 */
export function CopyMarkdown({
  markdown,
  markdownUrl,
}: {
  markdown: string
  markdownUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const [origin, setOrigin] = useState("")
  const timer = useRef<number | undefined>(undefined)

  // window is not available while prerendering; reading it during render would
  // disagree with the server pass and throw away the tree on hydration.
  useEffect(() => setOrigin(window.location.origin), [])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine.
    }
  }

  const fullUrl = origin ? `${origin}${markdownUrl}` : markdownUrl
  const query = `Read ${fullUrl} so I can ask questions about it.`

  const items = [
    {
      key: "markdown",
      title: "View as Markdown",
      description: "View this page as plain text",
      href: markdownUrl,
      external: false,
    },
    {
      key: "chatgpt",
      title: "Open in ChatGPT",
      description: "Ask questions about this page",
      href: `https://chatgpt.com/?${new URLSearchParams({ hints: "search", q: query })}`,
      external: true,
    },
    {
      key: "claude",
      title: "Open in Claude",
      description: "Ask questions about this page",
      href: `https://claude.ai/new?${new URLSearchParams({ q: query })}`,
      external: true,
    },
  ]

  return (
    <ButtonGroup>
      <Button variant="tertiary" onPress={copy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy Markdown"}
      </Button>

      <Dropdown isOpen={isOpen} onOpenChange={setOpen}>
        <Button isIconOnly aria-label="More options" variant="tertiary">
          <ButtonGroup.Separator />
          <ChevronDown
            className={cn(
              "size-3.5 text-muted transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            onAction={(key) => {
              const item = items.find((entry) => entry.key === key)
              if (item?.external) {
                window.open(item.href, "_blank", "noreferrer noopener")
              }
            }}
          >
            {items.map((item) => (
              <Dropdown.Item
                key={item.key}
                id={item.key}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer noopener" : undefined}
                textValue={item.title}
              >
                <div className="flex w-full flex-col">
                  <Label className="flex gap-0.5">{item.title}</Label>
                  <Description>{item.description}</Description>
                </div>
                {item.external && <ExternalIcon className="size-3.5 text-foreground/70" />}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </ButtonGroup>
  )
}

export interface ResourceLink {
  label: string
  href: string
  icon?: React.ReactNode
}

const GitHubMark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
    />
  </svg>
)

const NpmMark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className="text-[#cb3837]">
    <path fill="currentColor" d="M1.763 0h20.474C23.212 0 24 .788 24 1.763v20.474c0 .975-.788 1.763-1.763 1.763H1.763A1.763 1.763 0 0 1 0 22.237V1.763C0 .788.788 0 1.763 0Zm3.3 5.3v13.4h6.7V8.65h3.35v10.05h3.35V5.3H5.063Z" />
  </svg>
)

/** Keyed by label so a page's frontmatter stays plain data — an MDX file
 *  cannot carry a React element. Unknown labels simply render without a mark,
 *  which is better than shipping a wrong one. */
const MARKS: Record<string, () => React.ReactNode> = {
  Source: GitHubMark,
  GitHub: GitHubMark,
  npm: NpmMark,
}

export function ResourceLinks({ links }: { links: ResourceLink[] }) {
  if (links.length === 0) return null
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {links.map((link) => {
        const Mark = link.icon ? null : MARKS[link.label]
        return (
          <Button
            key={link.href}
            size="sm"
            variant="tertiary"
            className="relative gap-2 dark:bg-default/70"
            onPress={() => window.open(link.href, "_blank", "noreferrer")}
          >
            {link.icon ?? (Mark ? <Mark /> : null)}
            {link.label}
          </Button>
        )
      })}
    </div>
  )
}
