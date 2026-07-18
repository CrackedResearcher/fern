import type { ReactNode } from "react"

export interface PropRow {
  name: string
  type: string
  /** Omit for props with no default — rendered as a dash rather than blank. */
  default?: string
  description: ReactNode
}

/**
 * The props reference, built to HeroUI's `Table` primary variant.
 *
 * Their design is a grey root with the body as a white card nested inside it:
 * `.table-root--primary` is `bg-surface-secondary px-1 pb-1` at r20, and
 * `.table__cell` is `bg-surface`, so the 4px of side and bottom padding is what
 * shows as a frame around the body. No top padding — the header sits flush and
 * reads as part of the frame rather than as a row of the card.
 *
 * Read off packages/styles/components/table.css on the v3 branch rather than
 * eyeballed. HeroUI v3 does not ship a Table component to this app — there is
 * no table CSS in @heroui/styles and no `Table` export in @heroui/react — so
 * this is a rebuild against their published rules, not a wrapper.
 *
 * One deviation: their cells use `border-separator-tertiary/50`, which this app
 * does not define. Falls back to `separator/50`, the same token their row
 * borders use.
 *
 * `not-prose` because the surrounding typography styles would otherwise put
 * their own table borders and cell padding back on top of these.
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

/**
 * Monospace pill for the three scannable columns.
 *
 * A plain markdown table renders the name, type and default in the same weight
 * as the description, so the three things a reader scans for are the three
 * hardest to pick out. `whitespace-nowrap` keeps a union type from wrapping
 * mid-token — the horizontal scroll above is the escape hatch instead.
 */
function Chip({ children }: { children: ReactNode }) {
  return (
    <code className="inline-block rounded-md bg-surface-secondary px-2 py-1 font-mono text-[13px] whitespace-nowrap text-foreground">
      {children}
    </code>
  )
}
