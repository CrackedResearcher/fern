import type { PropDoc } from "../registry"

export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-divider">
      <table className="w-full min-w-[680px] border-collapse text-left">
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
              className="border-b border-divider last:border-0 align-top"
            >
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] font-medium">
                {prop.name}
                {prop.required && (
                  <span className="ml-1 text-red-500" title="Required">
                    *
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-[12.5px] text-blue-600 dark:text-blue-400">
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
