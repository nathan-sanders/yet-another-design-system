import { useEffect, useState } from 'react'

import { cn } from './lib/cn'
import { focusRing } from './lib/focus'

/**
 * Dev playground. Not part of the published library — it exists to prove the
 * token pipeline works: Figma -> theme.css -> Tailwind utilities -> screen.
 *
 * Every swatch below is painted with a *semantic* token utility. Flip the
 * dark-mode switch and they should all change without a single `dark:` class,
 * because the colour lives in the token layer, not the component.
 */

function useDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return [dark, setDark] as const
}

/** The nine neutral ramps, stone first — the same list and order as generate.py. */
const NEUTRALS = ['stone', 'taupe', 'mauve', 'mist', 'olive',
                  'slate', 'gray', 'zinc', 'neutral'] as const

/**
 * Which primitive ramp the semantic neutrals resolve to. Orthogonal to dark
 * mode: the ramp is theme-independent, and the semantic layer picks which of
 * its eleven steps each theme uses. Same public mechanism a consumer gets.
 */
function useNeutral() {
  const [neutral, setNeutral] = useState<string>(NEUTRALS[0])
  useEffect(() => {
    document.documentElement.dataset.neutral = neutral
  }, [neutral])
  return [neutral, setNeutral] as const
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content-emphasized">{title}</h2>
        {hint && <p className="text-sm text-content-subtle">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** One colour chip. `className` must be a complete literal so Tailwind sees it. */
function Swatch({ className, name }: { className: string; name: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className={`h-12 rounded-md border border-surface-border ${className}`} />
      <span className="truncate font-mono text-xs text-content-subtle" title={name}>
        {name}
      </span>
    </div>
  )
}

function Swatches({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map(([cls, name]) => (
        <Swatch key={name} className={cls} name={name} />
      ))}
    </div>
  )
}

const surfaces: [string, string][] = [
  ['bg-surface-canvas', 'surface-canvas'],
  ['bg-surface-card-primary', 'surface-card-primary'],
  ['bg-surface-card-subtle', 'surface-card-subtle'],
  ['bg-surface-card-emphasized', 'surface-card-emphasized'],
  ['bg-surface-canvas-overlay', 'surface-canvas-overlay'],
  ['bg-surface-border', 'surface-border'],
  ['bg-surface-border-emphasized', 'surface-border-emphasized'],
]

const content: [string, string][] = [
  ['bg-content-emphasized', 'content-emphasized'],
  ['bg-content-primary', 'content-primary'],
  ['bg-content-subtle', 'content-subtle'],
  ['bg-content-inverse', 'content-inverse'],
  ['bg-content-danger', 'content-danger'],
]

const action: [string, string][] = [
  ['bg-action-primary-background', 'action-primary-background'],
  ['bg-action-primary-background-hover', 'action-primary-background-hover'],
  ['bg-action-primary-foreground', 'action-primary-foreground'],
  ['bg-action-secondary-background', 'action-secondary-background'],
  ['bg-action-secondary-background-hover', 'action-secondary-background-hover'],
  ['bg-action-secondary-foreground', 'action-secondary-foreground'],
  ['bg-action-destructive-background', 'action-destructive-background'],
  ['bg-action-destructive-background-hover', 'action-destructive-background-hover'],
  ['bg-action-destructive-foreground', 'action-destructive-foreground'],
  ['bg-action-ghost-background-hover', 'action-ghost-background-hover'],
  ['bg-action-ghost-foreground', 'action-ghost-foreground'],
  ['bg-action-overlay-background', 'action-overlay-background'],
  ['bg-action-overlay-background-hover', 'action-overlay-background-hover'],
  ['bg-action-overlay-foreground', 'action-overlay-foreground'],
  ['bg-action-link-foreground', 'action-link-foreground'],
  ['bg-action-link-foreground-hover', 'action-link-foreground-hover'],
]

const feedback: [string, string][] = [
  ['bg-feedback-success-background', 'feedback-success-background'],
  ['bg-feedback-success-highlight', 'feedback-success-highlight'],
  ['bg-feedback-success-foreground', 'feedback-success-foreground'],
  ['bg-feedback-info-background', 'feedback-info-background'],
  ['bg-feedback-info-highlight', 'feedback-info-highlight'],
  ['bg-feedback-info-foreground', 'feedback-info-foreground'],
  ['bg-feedback-warning-background', 'feedback-warning-background'],
  ['bg-feedback-warning-highlight', 'feedback-warning-highlight'],
  ['bg-feedback-warning-foreground', 'feedback-warning-foreground'],
  ['bg-feedback-danger-background', 'feedback-danger-background'],
  ['bg-feedback-danger-highlight', 'feedback-danger-highlight'],
  ['bg-feedback-danger-foreground', 'feedback-danger-foreground'],
]

const decorative: [string, string][] = [
  ['bg-decorative-neutral-background', 'neutral'],
  ['bg-decorative-red-background', 'red'],
  ['bg-decorative-orange-background', 'orange'],
  ['bg-decorative-amber-background', 'amber'],
  ['bg-decorative-yellow-background', 'yellow'],
  ['bg-decorative-lime-background', 'lime'],
  ['bg-decorative-green-background', 'green'],
  ['bg-decorative-emerald-background', 'emerald'],
  ['bg-decorative-teal-background', 'teal'],
  ['bg-decorative-cyan-background', 'cyan'],
  ['bg-decorative-sky-background', 'sky'],
  ['bg-decorative-blue-background', 'blue'],
  ['bg-decorative-indigo-background', 'indigo'],
  ['bg-decorative-violet-background', 'violet'],
  ['bg-decorative-purple-background', 'purple'],
  ['bg-decorative-fuchsia-background', 'fuchsia'],
  ['bg-decorative-pink-background', 'pink'],
  ['bg-decorative-rose-background', 'rose'],
]

// The diverging scale: 8 negative steps (red) through 8 positive (blue).
const diverging: [string, string][] = [
  ['bg-data-viz-diverging-neg-08', 'neg-08'],
  ['bg-data-viz-diverging-neg-07', 'neg-07'],
  ['bg-data-viz-diverging-neg-06', 'neg-06'],
  ['bg-data-viz-diverging-neg-05', 'neg-05'],
  ['bg-data-viz-diverging-neg-04', 'neg-04'],
  ['bg-data-viz-diverging-neg-03', 'neg-03'],
  ['bg-data-viz-diverging-neg-02', 'neg-02'],
  ['bg-data-viz-diverging-neg-01', 'neg-01'],
  ['bg-data-viz-diverging-pos-01', 'pos-01'],
  ['bg-data-viz-diverging-pos-02', 'pos-02'],
  ['bg-data-viz-diverging-pos-03', 'pos-03'],
  ['bg-data-viz-diverging-pos-04', 'pos-04'],
  ['bg-data-viz-diverging-pos-05', 'pos-05'],
  ['bg-data-viz-diverging-pos-06', 'pos-06'],
  ['bg-data-viz-diverging-pos-07', 'pos-07'],
  ['bg-data-viz-diverging-pos-08', 'pos-08'],
]

const dataViz: [string, string][] = [
  ['bg-data-viz-categorical-01', 'categorical-01'],
  ['bg-data-viz-categorical-02', 'categorical-02'],
  ['bg-data-viz-categorical-03', 'categorical-03'],
  ['bg-data-viz-categorical-04', 'categorical-04'],
  ['bg-data-viz-categorical-05', 'categorical-05'],
  ['bg-data-viz-categorical-06', 'categorical-06'],
  ['bg-data-viz-categorical-07', 'categorical-07'],
  ['bg-data-viz-categorical-08', 'categorical-08'],
  ['bg-data-viz-categorical-09', 'categorical-09'],
  ['bg-data-viz-categorical-10', 'categorical-10'],
  ['bg-data-viz-categorical-11', 'categorical-11'],
  ['bg-data-viz-categorical-12', 'categorical-12'],
  ['bg-data-viz-categorical-13', 'categorical-13'],
  ['bg-data-viz-categorical-14', 'categorical-14'],
  ['bg-data-viz-sentiment-positive', 'sentiment-positive'],
  ['bg-data-viz-sentiment-neutral', 'sentiment-neutral'],
  ['bg-data-viz-sentiment-negative', 'sentiment-negative'],
  ['bg-data-viz-categorical-benchmark', 'categorical-benchmark'],
]

const typeScale: [string, string][] = [
  ['text-xs', 'text-xs'],
  ['text-sm', 'text-sm'],
  ['text-base', 'text-base'],
  ['text-lg', 'text-lg'],
  ['text-xl', 'text-xl'],
  ['text-2xl', 'text-2xl'],
  ['text-3xl', 'text-3xl'],
  ['text-4xl', 'text-4xl'],
]

const radii: [string, string][] = [
  ['rounded-none', 'none'],
  ['rounded-xs', 'xs'],
  ['rounded-sm', 'sm'],
  ['rounded-md', 'md'],
  ['rounded-lg', 'lg'],
  ['rounded-xl', 'xl'],
  ['rounded-2xl', '2xl'],
  ['rounded-3xl', '3xl'],
  ['rounded-4xl', '4xl'],
  ['rounded-full', 'full'],
]

const shadows: [string, string][] = [
  ['shadow-extra-low', 'extra-low'],
  ['shadow-low', 'low'],
  ['shadow-medium', 'medium'],
  ['shadow-high', 'high'],
]

export default function App() {
  const [dark, setDark] = useDarkMode()
  const [neutral, setNeutral] = useNeutral()

  return (
    <div className="min-h-screen bg-surface-canvas font-sans text-content-primary">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-surface-border bg-surface-card-primary px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-content-emphasized">Yet Another Design System</h1>
          <p className="text-sm text-content-subtle">Token playground — every swatch is a semantic token</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="neutral-ramp">
            Neutral ramp
          </label>
          <select
            id="neutral-ramp"
            value={neutral}
            onChange={(e) => setNeutral(e.target.value)}
            className={cn(
              'h-8 rounded-md border border-input-border bg-input-background px-2 text-base font-semibold text-content-primary hover:border-input-border-hover',
              focusRing,
            )}
          >
            {NEUTRALS.map((n) => (
              <option key={n} value={n}>
                {n[0].toUpperCase() + n.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-2 rounded-md border border-action-secondary-border bg-action-secondary-background px-3 text-base font-semibold text-action-secondary-foreground hover:bg-action-secondary-background-hover',
              focusRing,
            )}
          >
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <Section title="Surfaces" hint="Backgrounds, cards and borders.">
          <Swatches items={surfaces} />
        </Section>

        <Section title="Content" hint="Text colours, shown here as fills so you can compare them.">
          <Swatches items={content} />
        </Section>

        <Section title="Action" hint="The tokens the Button is built from.">
          <Swatches items={action} />
        </Section>

        <Section title="Feedback">
          <Swatches items={feedback} />
        </Section>

        <Section title="Decorative">
          <Swatches items={decorative} />
        </Section>

        <Section title="Data visualisation">
          <Swatches items={dataViz} />
        </Section>

        <Section
          title="Diverging scale"
          hint="Runs negative (red) to positive (blue). Every step should be filled — a gap means a token failed to resolve."
        >
          <div className="flex overflow-hidden rounded-md border border-surface-border">
            {diverging.map(([cls, name]) => (
              <div key={name} className={`h-12 flex-1 ${cls}`} title={name} />
            ))}
          </div>
        </Section>

        <Section title="Type scale" hint="Sizes and line heights come from --text-*.">
          <div className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-card-primary p-5">
            {typeScale.map(([cls, name]) => (
              <div key={name} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 font-mono text-xs text-content-subtle">{name}</span>
                <span className={`${cls} text-content-primary`}>The quick brown fox</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radii">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {radii.map(([cls, name]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-12 border border-surface-border bg-action-secondary-background ${cls}`} />
                <span className="font-mono text-xs text-content-subtle">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation" hint="Shadow colour is itself a token, so it adapts in dark mode.">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {shadows.map(([cls, name]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-16 rounded-lg bg-surface-card-primary ${cls}`} />
                <span className="font-mono text-xs text-content-subtle">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Fonts">
          <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface-card-primary p-5">
            <p className="font-sans text-lg text-content-primary">Inter — font-sans — 0123456789</p>
            <p className="font-mono text-lg text-content-primary">Geist Mono — font-mono — 0123456789</p>
          </div>
        </Section>
      </main>
    </div>
  )
}
