"use client"

/** The list's presentational leaves, kept out of the shell so the component
 *  file reads as composition. */

import * as React from "react"
import { compactPrice, type Model } from "./model"
import { matchRange } from "./search"
import { CheckIcon, LockIcon } from "./icons"

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(" ")

const SURFACE = "var(--fern-surface, #ffffff)"
const FG = "var(--fern-foreground, #18181b)"
const MUTED = "var(--fern-muted, #71717a)"

/**
 * Fade at a scroll boundary, so rows dissolve into the edge instead of being
 * sliced by it. Anywhere content scrolls under something — a sticky header, the
 * end of a panel — the hard cut reads as a rendering fault.
 */
export function ScrollFade({ side }: { side: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      data-slot="scroll-fade"
      className={cn(
        // inset-x-0: the panel's own padding already insets this wrapper, so
        // a second inset left the row edges poking out past the fade.
        "pointer-events-none absolute inset-x-0 z-20",
        // Asymmetric: the bottom fade hides a row you cannot reach yet, the
        // top one sits over the row you are about to click and washes it grey
        // at any greater height.
        side === "top" ? "h-4" : "h-6",
        // The panel is r16 with 4px of padding, so its inner corner is r12.
        // Square corners here overhang that curve and sit on the border.
        side === "top" ? "top-0 rounded-t-xl" : "bottom-0 rounded-b-xl",
      )}
      style={{
        background: `linear-gradient(to ${side === "top" ? "bottom" : "top"}, ${SURFACE}, transparent)`,
      }}
    />
  )
}

/**
 * Bolds the matched run inside a label.
 *
 * Weight rather than a background tint: the row already uses background to say
 * where the cursor is and what is selected, and a third meaning painted in the
 * same channel is one meaning too many.
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const range = matchRange(text, query)
  if (!range) return <>{text}</>
  const [start, end] = range
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-transparent font-semibold" style={{ color: "inherit" }}>
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  )
}

/**
 * The provider mark, drawn straight into the row — no plate or ring, which
 * would read as a favicon pasted in and compete with the name beside it.
 *
 * A monochrome black mark is therefore invisible on a dark panel; nothing here
 * can know what is inside the file, so `logoBackground` exists for brands that
 * need a filled tile. A missing or broken logo falls back to the provider's
 * initial rather than a shared placeholder, which would remove the one thing
 * the eye uses to find a row again.
 */
export function Logo({
  model,
  size = 22,
  eager = false,
}: {
  model: Model
  size?: number
  eager?: boolean
}) {
  const [failed, setFailed] = React.useState(false)

  // Reset when the model changes, or the trigger keeps a previous model's
  // failure and shows an initial for a logo that would have loaded.
  const [lastId, setLastId] = React.useState(model.id)
  if (lastId !== model.id) {
    setLastId(model.id)
    setFailed(false)
  }

  const filled = !!model.logoBackground
  const plate: React.CSSProperties = filled
    ? {
        background: model.logoBackground,
        boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
      }
    : {}

  if (model.logo && !failed) {
    return (
      <img
        src={model.logo}
        alt=""
        width={size}
        height={size}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        data-slot="logo"
        className="shrink-0 rounded-full object-contain"
        style={{
          width: size,
          height: size,
          // A filled tile needs the mark inset off its own edge; a bare mark
          // wants the whole box, or it renders smaller than its neighbours.
          padding: filled ? size * 0.2 : 0,
          ...plate,
        }}
      />
    )
  }

  return (
    <span
      aria-hidden
      data-slot="logo"
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        color: filled ? "#ffffff" : MUTED,
        ...plate,
      }}
    >
      {(model.provider ?? model.name).trim().charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * Built like the country picker's dial badge, so the two blocks read as one
 * family.
 *
 * The fill is a tint of the foreground, not `--fern-default` — that is also the
 * hovered-row background, and a badge painted in it disappears on exactly the
 * row you are pointing at.
 */
export function RowPrice({ model }: { model: Model }) {
  const label = compactPrice(model.price)
  if (!label) return null
  return (
    <span
      data-slot="price"
      className="shrink-0 rounded px-1 py-px font-mono text-[11px] leading-[1.45] tabular-nums"
      style={{
        backgroundColor: `color-mix(in oklab, ${FG} 7%, transparent)`,
        color: MUTED,
      }}
    >
      {label}
    </span>
  )
}

const ROW_SKIP = (tall: boolean): React.CSSProperties => ({
  // Lets the browser skip layout and paint for rows outside the scrollport,
  // which is what keeps a long catalogue cheap without a virtualiser and its
  // scroll-restoration problems. The intrinsic size supplies the height the
  // row would have had, so the scrollbar does not jump as rows render.
  contentVisibility: "auto",
  containIntrinsicSize: tall ? "auto 56px" : "auto 40px",
})

export function Row({
  model,
  index,
  id,
  query,
  active,
  selected,
  showLogo,
  showPrice,
  /** No room for the detail column, so the row carries the description. */
  inlineDetails,
  onSelect,
  onHover,
}: {
  model: Model
  index: number
  id: string
  query: string
  active: boolean
  selected: boolean
  showLogo: boolean
  showPrice: boolean
  inlineDetails: boolean
  onSelect: (model: Model) => void
  onHover: (index: number) => void
}) {
  const locked = !!model.disabled
  const sub = inlineDetails ? (model.description ?? model.provider) : undefined

  return (
    <div
      id={id}
      data-slot="option"
      data-index={index}
      role="option"
      aria-selected={selected}
      aria-disabled={locked || undefined}
      aria-describedby={locked || model.description ? `${id}-desc` : undefined}
      onClick={() => onSelect(model)}
      onPointerMove={() => onHover(index)}
      style={ROW_SKIP(!!sub)}
      className={cn(
        // The country picker's row geometry exactly, so the two stacked in one
        // app are the same object. `min-h-10` is the one addition: its 38px row
        // is under fern's 40px floor for an interactive target.
        "flex min-h-10 items-center gap-2.5 rounded-lg px-2 py-2",
        // Two distinct states: the keyboard/pointer cursor is a neutral wash,
        // the current selection is tinted with the accent — otherwise "where I
        // am" and "what I chose" are indistinguishable.
        active && !selected && "bg-[var(--fern-default,#ebebec)]",
        selected &&
          "bg-[color-mix(in_oklab,var(--fern-focus,#0485f7)_12%,transparent)]",
        selected &&
          active &&
          "bg-[color-mix(in_oklab,var(--fern-focus,#0485f7)_20%,transparent)]",
        locked ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      {showLogo && (
        <span className={cn(locked && "opacity-50")}>
          <Logo model={model} />
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn("min-w-0 truncate text-[14px]", locked && "opacity-60")}
            style={{ color: FG }}
          >
            <Highlight text={model.name} query={query} />
          </span>
          {model.badge && <Badge label={model.badge} />}
          {/* Beside the name, like the badge — at the row's end it reads as a
              status of the row rather than of the model. */}
          {locked && (
            <span className="shrink-0" style={{ color: MUTED }}>
              <LockIcon size={12} />
            </span>
          )}
        </span>
        {sub && (
          <span
            className="truncate text-[12px] leading-[1.45]"
            style={{ color: MUTED }}
          >
            {sub}
          </span>
        )}
      </span>

      {showPrice && <RowPrice model={model} />}

      {/* After the badge, as in the country picker. A reserved slot would keep
          the badge column still but leave a permanent gap on every row. */}
      {selected && (
        <span className="shrink-0" style={{ color: "var(--fern-focus, #0485f7)" }}>
          <CheckIcon />
        </span>
      )}

      {/* Read after the name when the cursor lands, so the reason a row cannot
          be chosen reaches a screen reader at the moment it matters — the
          detail column beside the list is visual reinforcement and is hidden. */}
      {(locked || model.description) && (
        <span id={`${id}-desc`} className="sr-only">
          {locked ? (model.disabledReason ?? "Unavailable") : model.description}
        </span>
      )}
    </div>
  )
}

/** Status word beside a name — "New", "Beta". Quiet enough not to outweigh the
 *  name it is attached to. */
export function Badge({ label }: { label: string }) {
  return (
    <span
      data-slot="badge"
      className="shrink-0 rounded px-1 py-px text-[10px] font-medium tracking-[0.04em] uppercase"
      style={{
        color: "var(--fern-focus, #0485f7)",
        background:
          "color-mix(in oklab, var(--fern-focus, #0485f7) 11%, transparent)",
      }}
    >
      {label}
    </span>
  )
}

/**
 * Sticky section heading. Its background fades out over the last stretch so a
 * row scrolling underneath dissolves rather than being cut in half by the edge.
 */
/**
 * Section heading. Deliberately not sticky, unlike the country picker's letter
 * header.
 *
 * A pinned heading either lets the row behind show through it or guillotines
 * that row at an invisible line, and two headings stack when the last section
 * is too short to push the previous one out. That cost is worth paying for 198
 * countries, where losing the current letter loses your place; a catalogue of a
 * dozen models is one flick from end to end.
 */
export function SectionHeader({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      data-slot="section"
      className="px-3 pt-3 pb-1.5 text-[11px] font-medium tracking-wide"
      style={{ color: MUTED }}
    >
      {label}
    </div>
  )
}
