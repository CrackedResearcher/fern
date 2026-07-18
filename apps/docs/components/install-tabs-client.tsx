"use client"

import { useState, type ReactNode } from "react"
import { CodeActions } from "@/components/code-actions"
import { cn } from "@/components/cn"

export interface InstallCommand {
  id: string
  text: string
  node: ReactNode
}

/** The tab row takes the place of the filename bar, so this reads as the same
 *  block as every other one on the page. */
export function InstallTabsClient({
  commands,
}: {
  commands: InstallCommand[]
}) {
  const [active, setActive] = useState(commands[0]?.id)
  const current = commands.find((c) => c.id === active) ?? commands[0]

  return (
    <div className="code-section not-prose relative my-4 rounded-xl border border-separator bg-surface-secondary px-1 pb-1">
      <div className="flex items-center justify-between gap-3 py-1 pr-1 pl-2">
        <div role="tablist" aria-label="Package manager" className="flex gap-1">
          {commands.map((command) => (
            <button
              key={command.id}
              type="button"
              role="tab"
              aria-selected={command.id === active}
              onClick={() => setActive(command.id)}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-xs transition-colors",
                command.id === active
                  ? "bg-surface text-foreground dark:bg-background"
                  : "text-muted hover:text-foreground",
              )}
            >
              {command.id}
            </button>
          ))}
        </div>
        <CodeActions />
      </div>

      <div className="docs-code-block-wrapper rounded-lg bg-surface dark:bg-background">
        {current?.node}
      </div>
    </div>
  )
}
