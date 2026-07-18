import type { PropDoc } from "../registry"

/**
 * Built on the foundation's own table classes rather than hand-rolled
 * utilities, so column separators, row hover, header treatment and the
 * corner-rounding rules come from the same place their docs get them.
 *
 * The secondary variant is the one their documentation tables use: a
 * standalone rounded header strip over transparent rows, rather than the
 * primary variant's white card sunk into a grey tray.
 */
export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="table-root table-root--secondary mt-4">
      <div className="table__scroll-container">
        <table className="table__content min-w-[680px]">
          <thead className="table__header">
            <tr>
              {["Prop", "Type", "Default", "Description"].map((heading) => (
                <th key={heading} className="table__column">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table__body">
            {props.map((prop) => (
              <tr key={prop.name} className="table__row">
                <td className="table__cell font-mono text-[12.5px] font-medium whitespace-nowrap">
                  {prop.name}
                  {prop.required && (
                    <span className="ml-1 text-danger" title="Required">
                      *
                    </span>
                  )}
                </td>
                <td className="table__cell font-mono text-[12.5px] text-accent">
                  {prop.type}
                </td>
                <td className="table__cell font-mono text-[12.5px] whitespace-nowrap text-muted">
                  {prop.defaultValue ?? "—"}
                </td>
                <td className="table__cell text-[13px] text-pretty text-muted">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
