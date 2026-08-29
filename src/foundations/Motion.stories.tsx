import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'
import { Mono, Page, Panel, Section, Table, Td, Th } from './Showcase'
import { durations, easings } from './tokens'

/**
 * Motion, as tokens rather than a library.
 */
const meta = {
  title: 'Foundations/Motion',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** `fast-min` -> `fast`; the tier is what a designer picks, the min/max are room to tune. */
function tier(name: string): string {
  return name.replace(/-(min|max)$/, '')
}

/** The control points of `cubic-bezier(a, b, c, d)`, for drawing the curve. */
function points(value: string): [number, number, number, number] | null {
  const m = /cubic-bezier\(([^)]+)\)/.exec(value)
  if (!m) return null
  const n = m[1].split(',').map((s) => Number.parseFloat(s))
  return n.length === 4 && n.every((v) => !Number.isNaN(v)) ? [n[0], n[1], n[2], n[3]] : null
}

/** The easing curve, drawn from its own control points rather than traced by hand. */
function Curve({ value }: { value: string }) {
  const p = points(value)
  if (!p) return null
  const [x1, y1, x2, y2] = p
  const X = (v: number) => 10 + v * 100
  const Y = (v: number) => 110 - v * 100
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`Easing curve for ${value}`}>
      <rect
        x="10"
        y="10"
        width="100"
        height="100"
        fill="none"
        stroke="var(--surface-border)"
        strokeWidth="1"
      />
      <path
        d={`M ${X(0)} ${Y(0)} C ${X(x1)} ${Y(y1)}, ${X(x2)} ${Y(y2)}, ${X(1)} ${Y(1)}`}
        fill="none"
        stroke="var(--content-emphasized)"
        strokeWidth="2"
      />
    </svg>
  )
}

/**
 * The duration scale, live.
 *
 * These are **Astryx's** durations, shipped as CSS custom properties rather than
 * wired to a JavaScript animation library — which means they compose with
 * Tailwind's `duration-*` and `ease-*` utilities and cost nothing at runtime.
 *
 * Each tier has a `-min` and `-max` either side of it. The tier is what you
 * choose; the bounds are the room you have to tune within it before you are
 * really choosing a different tier.
 *
 * **Reduced motion is handled globally.** `theme.css` collapses every duration
 * to 1ms under `prefers-reduced-motion`, so no component has to remember to —
 * and 1ms rather than 0 because Base UI decides when a popup may unmount by
 * asking `element.getAnimations()`, and a zero-length transition can mean no
 * animation is ever observed.
 */
export const Durations: Story = {
  render: function Render() {
    const [run, setRun] = useState(false)
    return (
      <Page
        title="Motion"
        lede={
          <>
            Nine durations in three tiers and one easing curve, as CSS tokens. Press{' '}
            <strong>Play</strong> to run the whole scale at once — the gaps between the tiers are the
            point.
          </>
        }
      >
        <Section title="Durations">
          <Panel className="flex flex-col gap-4">
            <div>
              <button
                type="button"
                onClick={() => setRun((r) => !r)}
                className={cn(
                  'inline-flex h-8 items-center rounded-md border border-action-secondary-border bg-action-secondary-background px-3 text-base font-semibold text-action-secondary-foreground hover:bg-action-secondary-background-hover',
                  focusRing,
                )}
              >
                {run ? 'Reset' : 'Play'}
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {durations.map((d) => (
                <div key={d.name} className="flex items-center gap-4">
                  <Mono muted>
                    <span className="inline-block w-40 whitespace-nowrap">duration-{d.name}</span>
                  </Mono>
                  <span className="w-16 shrink-0 text-right font-mono text-sm text-content-subtle">
                    {d.value}
                  </span>
                  <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-background-subtle">
                    <div
                      className="h-full rounded-full bg-surface-background-emphasized"
                      style={{
                        width: run ? '100%' : '0%',
                        transitionProperty: 'width',
                        transitionDuration: d.value,
                        transitionTimingFunction: easings[0]?.value,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </Section>

        <Section
          title="Tiers"
          hint="What each one is for. The bounds either side exist so a component can tune within a tier without leaving it."
        >
          <Table label="What each duration tier is for">
            <thead>
              <tr>
                <Th className="w-28">Tier</Th>
                <Th className="w-56">Range</Th>
                <Th>Use for</Th>
              </tr>
            </thead>
            <tbody>
              {['fast', 'medium', 'slow'].map((t) => {
                const inTier = durations.filter((d) => tier(d.name) === t)
                const mid = inTier.find((d) => d.name === t)
                return (
                  <tr key={t}>
                    <Td>
                      <Mono>{t}</Mono>
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap font-mono text-sm text-content-subtle">
                        {inTier[0]?.value} – {inTier[inTier.length - 1]?.value}
                        {mid && <span className="text-content-primary"> · {mid.value}</span>}
                      </span>
                    </Td>
                    <Td>
                      {t === 'fast' && 'State changes you should barely notice — hover, focus, a checkbox.'}
                      {t === 'medium' && 'Something appearing or leaving — a popup, a toast, a panel.'}
                      {t === 'slow' && 'Movement across the whole screen, or anything you are meant to watch.'}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Easing"
          hint="One curve, deliberately. A system with four easings has three nobody can justify."
        >
          <Panel className="flex flex-wrap items-center gap-8">
            {easings.map((e) => (
              <div key={e.name} className="flex items-center gap-5">
                <Curve value={e.value} />
                <div className="flex flex-col gap-1">
                  <Mono>ease-{e.name}</Mono>
                  <span className="font-mono text-xs text-content-subtle">{e.value}</span>
                  <span className="max-w-56 text-sm text-content-subtle">
                    Fast out of the gate, long settle. Motion that starts immediately reads as
                    responsive even when it takes a while to finish.
                  </span>
                </div>
              </div>
            ))}
          </Panel>
        </Section>
      </Page>
    )
  },
}
