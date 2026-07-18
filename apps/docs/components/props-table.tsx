import type { ReactNode } from "react"

export interface PropRow {
  name: string
  type: string
  /** Omit for props with no default — rendered as a dash rather than blank. */
  default?: string
  description: ReactNode
}

/**
 * Built to HeroUI's Table primary variant — a grey root with the body as a card
 * inside it — read off packages/styles/components/table.css on the v3 branch.
 * They ship no Table to this app, so this is a rebuild, not a wrapper.
 *
 * Their cells use border-separator-tertiary, which this app does not define;
 * falls back to separator/50. `not-prose` stops the typography styles putting
 * table borders back on top.
 */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="not-prose my-6 grid w-full grid-cols-[minmax(0,1fr)] overflow-clip rounded-[20px] bg-surface-secondary px-1 pb-1">
      {/* Scrolls horizontally on its own so a long type signature can never
          push the page sideways. The grid column above is the hard width
          boundary that table layout cannot grow past. */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-separator/50 bg-surface-secondary">
            <tr>
              {["Prop", "Type", "Default", "Description"].map(
                (heading, index, all) => (
                  <th
                    key={heading}
                    scope="col"
                    className={[
                      "relative px-4 py-2.5 text-left text-xs font-medium text-muted",
                      // Their column separator: a short vertical rule on the
                      // trailing edge, omitted on the last column.
                      index < all.length - 1 &&
                        "after:pointer-events-none after:absolute after:end-0 after:top-1/2 after:h-4 after:w-px after:-translate-y-1/2 after:rounded-sm after:bg-separator after:content-['']",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          {/* r16 on the four outer cells. border-radius on <tbody> itself has
              no effect, so the corners have to come from the cells. */}
          <tbody className="[&>tr:first-child>td:first-child]:rounded-tl-2xl [&>tr:first-child>td:last-child]:rounded-tr-2xl [&>tr:last-child>td:first-child]:rounded-bl-2xl [&>tr:last-child>td:last-child]:rounded-br-2xl">
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-separator/50 last:border-b-0">
                <td className="bg-surface px-4 py-3 align-middle">
                  <Chip>{row.name}</Chip>
                </td>
                <td className="bg-surface px-4 py-3 align-middle">
                  <Chip>{row.type}</Chip>
                </td>
                <td className="bg-surface px-4 py-3 align-middle">
                  <Chip>{row.default ?? "–"}</Chip>
                </td>
                <td className="bg-surface px-4 py-3 align-middle text-sm text-foreground">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Monospace pill, so the three scannable columns do not read at the same
 *  weight as the prose beside them. */
function Chip({ children }: { children: ReactNode }) {
  return (
    <code className="inline-block rounded-md bg-surface-secondary px-2 py-1 font-mono text-[13px] whitespace-nowrap text-foreground">
      {children}
    </code>
  )
}
