import { useState } from "react"
import { ColorPicker } from "@fern/color-picker"

const SWATCHES = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400">
        {title}
      </h2>
      {children}
    </div>
  )
}

export function App() {
  const [color, setColor] = useState("#3b82f6")
  const [dark, setDark] = useState(false)

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-neutral-50 px-10 py-12 antialiased dark:bg-neutral-950">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 text-balance dark:text-neutral-50">
                Color picker
              </h1>
              <p className="mt-1 text-sm text-neutral-500 text-pretty dark:text-neutral-400">
                Current value:{" "}
                <code className="font-mono tabular-nums">{color}</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="h-9 rounded-xl bg-white px-3 text-sm text-neutral-700 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-transform duration-150 active:scale-[0.96] dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </header>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-10">
            <Panel title="Default">
              <ColorPicker value={color} onChange={setColor} />
            </Panel>

            <Panel title="Alpha + swatches">
              <ColorPicker
                defaultValue="#8b5cf6cc"
                alpha
                swatches={SWATCHES}
                eyedropper
              />
            </Panel>

            <Panel title="HSL output">
              <ColorPicker defaultValue="#22c55e" format="hsl" swatches={SWATCHES} />
            </Panel>

            <Panel title="Disabled">
              <ColorPicker defaultValue="#f97316" disabled />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
