import { highlight } from "fumadocs-core/highlight"
import { InstallTabsClient } from "@/components/install-tabs-client"

const MANAGERS = [
  { id: "bun", command: (pkg: string) => `bun add ${pkg}` },
  { id: "npm", command: (pkg: string) => `npm install ${pkg}` },
  { id: "pnpm", command: (pkg: string) => `pnpm add ${pkg}` },
  { id: "yarn", command: (pkg: string) => `yarn add ${pkg}` },
]

/**
 * Install command, per package manager.
 *
 * Highlighted here rather than in the client half so the commands go through
 * the same Shiki pass as every other block — rendering them as plain text was
 * the one place on the page where code had no colour.
 */
export async function InstallTabs({ pkg }: { pkg: string }) {
  const commands = await Promise.all(
    MANAGERS.map(async (manager) => ({
      id: manager.id,
      text: manager.command(pkg),
      node: await highlight(manager.command(pkg), {
        lang: "bash",
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      }),
    })),
  )

  return <InstallTabsClient commands={commands} />
}
