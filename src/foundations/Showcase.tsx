/**
 * Layout for the Foundations pages.
 *
 * Nothing here is part of the published library — these are documentation
 * primitives. They are built from the same semantic tokens the components use,
 * so a broken token layer breaks its own documentation, visibly.
 *
 * Swatches are painted with an inline `var(--token)` rather than a Tailwind
 * utility on purpose: the token names are read out of `theme.css` at runtime, so
 * there is no literal class string for Tailwind to find at build time. A
 * `bg-${name}` template would compile to nothing at all.
 */
import type { CSSProperties, ReactNode } from 'react'

/** Behind a translucent swatch, so `0%` alpha reads as empty rather than broken. */
const CHECKS: CSSProperties = {
  backgroundImage:
    'repeating-conic-gradient(var(--surface-border) 0% 25%, transparent 0% 50%)',
  backgroundSize: '12px 12px',
}

export function Page({ title, lede, children }: { title: string; lede: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-content-emphasized">{title}</h1>
        <div className="max-w-2xl text-base text-content-subtle">{lede}</div>
      </header>
      {children}
    </main>
  )
}

export function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-content-emphasized">{title}</h2>
        {hint && <p className="max-w-2xl text-base text-content-subtle">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** A bordered white-card surface — the frame every specimen sits on. */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-surface-border bg-surface-background-primary p-5 ${className}`}
    >
      {children}
    </div>
  )
}

/** A token name, always in mono so it reads as something you can type. */
export function Mono({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <code className={`font-mono text-sm ${muted ? 'text-content-subtle' : 'text-content-primary'}`}>
      {children}
    </code>
  )
}

/**
 * One colour chip. `value` is any CSS colour — a live `var(--surface-canvas)`
 * for a token that should follow the toolbar, or a literal for a primitive.
 * See `paint` in `tokens.ts` for why primitives cannot be read as variables.
 */
export function Chip({
  value,
  className = 'h-10',
  title,
}: {
  value: string
  className?: string
  title?: string
}) {
  return (
    <div className={`overflow-hidden rounded-sm border border-surface-border ${className}`} style={CHECKS}>
      <div className="h-full w-full" style={{ background: value }} title={title} />
    </div>
  )
}

/** A full ramp: eleven steps welded into one bar. */
export function RampRow({ name, steps }: { name: string; steps: { step: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-sm text-content-primary">{name}</span>
      <div className="flex overflow-hidden rounded-sm border border-surface-border">
        {steps.map((s) => (
          <div
            key={s.step}
            className="h-10 flex-1"
            style={{ background: s.value }}
            title={`${name}-${s.step}`}
          />
        ))}
      </div>
    </div>
  )
}

/** Column headings for a ramp block, aligned to the eleven steps. */
export function RampScale({ steps }: { steps: string[] }) {
  return (
    <div className="flex gap-0 pl-0">
      {steps.map((s) => (
        <span key={s} className="flex-1 text-center font-mono text-xs text-content-subtle">
          {s}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------- table */

/**
 * A table in a horizontally scrollable frame.
 *
 * `tabIndex` and the label are not decoration: a region you can only reach by
 * dragging is unreachable from a keyboard, and axe fails the story for it
 * (`scrollable-region-focusable`). Giving the frame focus makes the arrow keys
 * scroll it, and the label is what a screen reader announces on arrival.
 */
export function Table({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={label}
      className="overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary"
    >
      <table className="w-full border-collapse text-base">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`border-b border-surface-border px-4 py-2.5 text-left text-sm font-semibold text-content-subtle ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-surface-border px-4 py-2.5 align-middle ${className}`}>{children}</td>
}
