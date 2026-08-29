import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section } from './Showcase'
import {
  chromaticRamps,
  durations,
  neutralRamps,
  radii,
  paint,
  readAlias,
  semanticGroups,
  semanticTokenCount,
  shadows,
  swappableNeutrals,
  typeScale,
} from './tokens'

/**
 * The way in. Everything under Foundations is one of the tiers described here.
 */
const meta = {
  title: 'Foundations/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The token the worked example follows all the way down. */
const EXAMPLE = 'action-primary-background'

const exampleToken = semanticGroups
  .flatMap((g) => g.tokens)
  .find((t) => t.token === EXAMPLE)

function Tier({
  step,
  name,
  detail,
  swatch,
  children,
}: {
  step: number
  name: string
  detail: string
  swatch?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border border-surface-border bg-surface-background-primary p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-surface-background-subtle font-mono text-xs text-content-subtle">
          {step}
        </span>
        <h3 className="text-base font-semibold text-content-emphasized">{name}</h3>
      </div>
      {swatch && (
        <div
          className="h-10 rounded-sm border border-surface-border"
          style={{ background: swatch }}
        />
      )}
      <div className="font-mono text-sm break-all text-content-primary">{children}</div>
      <p className="text-sm text-content-subtle">{detail}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-bold text-content-emphasized">{value}</span>
      <span className="text-sm text-content-subtle">{label}</span>
    </div>
  )
}

/**
 * How the token layer is put together, and why it has more tiers than it looks
 * like it needs.
 *
 * Everything on these pages is parsed out of `src/styles/theme.css` at load
 * time. That file is generated from `tokens/*.json` by `generate.py`, which is
 * generated in turn from Figma — so these pages cannot drift from the system
 * they document. Add a ramp or rename a role and the documentation follows on
 * the next reload, because there is no second list to update.
 */
export const Overview: Story = {
  render: () => {
    const alias = exampleToken ? readAlias(exampleToken.light).alias : 'neutral-800'
    const rampStep = alias.replace(/^neutral-/, '')
    return (
      <Page
        title="Foundations"
        lede={
          <>
            The token layer, tier by tier. A component never names a colour, a size or a duration —
            it names a <em>role</em>, and the tiers below decide what that role is worth today.
          </>
        }
      >
        <Section title="By the numbers">
          <Panel>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              <Stat value={chromaticRamps.length + neutralRamps.length} label="Primitive ramps" />
              <Stat value={swappableNeutrals.length} label="Swappable neutrals" />
              <Stat value={semanticTokenCount} label="Semantic tokens" />
              <Stat value={typeScale.length} label="Type steps" />
              <Stat value={radii.length} label="Radii" />
              <Stat value={durations.length} label="Durations" />
            </div>
          </Panel>
        </Section>

        <Section
          title="One token, all the way down"
          hint={
            <>
              Following <Mono>{EXAMPLE}</Mono> — the fill of a primary Button — from the palette to
              the class you type.
            </>
          }
        >
          <div className="flex flex-col gap-4 lg:flex-row">
            <Tier
              step={1}
              name="Primitive"
              swatch={paint(`var(--color-stone-${rampStep})`)}
              detail="The raw palette, in OKLCH. Theme-independent: this step is the same colour in dark mode. Nothing paints with it directly."
            >
              --color-stone-{rampStep}
            </Tier>
            <Tier
              step={2}
              name="Ramp"
              swatch={`var(--neutral-${rampStep})`}
              detail="An indirection so the system's neutral is one attribute on <html>. Deliberately not in @theme, so it generates no utilities of its own."
            >
              --neutral-{rampStep}
            </Tier>
            <Tier
              step={3}
              name="Semantic"
              swatch={`var(--${EXAMPLE})`}
              detail="The role. This is the only tier that knows about light and dark — it picks a different step in each, which is why no component carries a dark: class."
            >
              --{EXAMPLE}
            </Tier>
            <Tier
              step={4}
              name="Utility"
              swatch={`var(--${EXAMPLE})`}
              detail="Tailwind builds a class from the semantic tier. This is all a component ever writes."
            >
              bg-{EXAMPLE}
            </Tier>
          </div>
        </Section>

        <Section
          title="The two switches"
          hint="Both are attributes on <html>, and both are orthogonal — the same public mechanism a consumer gets. The Storybook toolbar sets them."
        >
          <Panel className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Mono>class="dark"</Mono>
              <p className="text-base text-content-subtle">
                Re-declares the semantic tier. Every role points at a different step; nothing else in
                the system changes, and no component participates.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Mono>data-neutral="taupe"</Mono>
              <p className="text-base text-content-subtle">
                Repoints the ramp tier at a different neutral scale. Theme-independent, so the two
                switches compose: {swappableNeutrals.length} neutrals × 2 themes, from one set of
                components.
              </p>
            </div>
          </Panel>
        </Section>

        <Section
          title="What is on these pages"
          hint="Each one is generated from theme.css, so it is the system as shipped rather than a description of it."
        >
          <Panel>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                ['Colour', `The ${chromaticRamps.length + neutralRamps.length} primitive ramps, and the swappable neutral tier.`],
                ['Semantic Colour', `All ${semanticTokenCount} roles, with their light and dark targets side by side.`],
                ['Typography', `Two families, three weights, ${typeScale.length} steps that carry their own line height.`],
                ['Space', 'One base number, and the multiples every layout is built from.'],
                ['Shape', `${radii.length} radii, six stroke weights, twenty-one opacities.`],
                ['Elevation', `${shadows.length} shadows whose colour is itself a token, so they adapt in dark mode.`],
                ['Motion', `${durations.length} durations in three tiers, and one easing curve.`],
              ].map(([term, def]) => (
                <div key={term} className="flex flex-col gap-0.5">
                  <dt className="text-base font-semibold text-content-emphasized">{term}</dt>
                  <dd className="text-base text-content-subtle">{def}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </Section>
      </Page>
    )
  },
}
