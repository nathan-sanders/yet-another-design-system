import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section, Table, Td, Th } from './Showcase'
import {
  chromaticRamps,
  durations,
  navMode,
  navThemes,
  navTokens,
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

/**
 * Three of the nav modes, one per shape of alias the tier uses — a mode reaching
 * into the ramp tier, one reaching into the semantics, and one naming a
 * primitive outright. Which three is a judgement call, so the
 * names are written here; what they resolve to is not, and a mode that has been
 * renamed drops its column rather than showing an invented value.
 */
const NAV_SHAPES = [
  { mode: 'neutral-inverse', title: 'Neutral Inverse' },
  { mode: 'canvas', title: 'Canvas' },
  { mode: 'blue-inverse', title: 'Blue Inverse' },
]

const navShapes = NAV_SHAPES.flatMap(({ mode, title }) => {
  const decls = navMode(mode)
  if (!decls.length) return []
  const alias = new Map(decls.map((d) => [d.name.slice(2), readAlias(d.value).alias]))
  return [{ mode, title, alias }]
})

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
            The token layer, tier by tier. A component never names a color, a size or a duration —
            it names a <em>role</em>, and the tiers below decide what that role is worth today.
          </>
        }
      >
        <Section title="By the numbers">
          <Panel>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
              <Stat value={chromaticRamps.length + neutralRamps.length} label="Primitive ramps" />
              <Stat value={swappableNeutrals.length} label="Swappable neutrals" />
              <Stat value={semanticTokenCount} label="Semantic tokens" />
              <Stat value={navThemes.length} label="Nav themes" />
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
              detail="The raw palette, in OKLCH. Theme-independent: this step is the same color in dark mode. Nothing paints with it directly."
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
          title="The tier beside the semantics"
          hint={
            <>
              One tier does not sit in that chain. The navigation components paint with a set of
              roles of their own, switched by <Mono>data-nav-theme</Mono> rather than by the theme —
              try the Nav control in the toolbar above.
            </>
          }
        >
          <Table label="The navigation roles, in three of their modes">
            <thead>
              <tr>
                <Th className="w-14">Live</Th>
                <Th>Role</Th>
                {navShapes.map((shape) => (
                  <Th key={shape.mode}>{shape.title}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {navTokens.map((token) => (
                <tr key={token}>
                  <Td>
                    <div
                      className="h-8 w-10 rounded-xs border border-surface-border"
                      style={{ background: `var(--${token})` }}
                    />
                  </Td>
                  <Td>
                    <Mono>{token.slice('nav-'.length)}</Mono>
                  </Td>
                  {navShapes.map((shape) => (
                    <Td key={shape.mode}>
                      <span className="whitespace-nowrap font-mono text-sm text-content-subtle">
                        {shape.alias.get(token) ?? '—'}
                      </span>
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="max-w-3xl text-base text-content-subtle">
            The Live column follows the Nav control in the toolbar; the three after it are fixed, and
            they are the three shapes the tier uses. Neutral Inverse aliases the <em>ramp</em> tier,
            so it moves with the neutral. Canvas aliases the <em>semantic</em> tier, so it moves with
            the theme. Blue Inverse names a <em>primitive</em>, so it moves with neither — and that
            is the point. A navigation surface is a brand decision rather than a reading surface, so
            all but Canvas are absolute: the page can go dark underneath a nav that does not.
          </p>
          <p className="max-w-3xl text-base text-content-subtle">
            It is the one exception to painting with semantics, and it is the same rule a tier over:
            a nav component writes <Mono>bg-nav-background</Mono> and never reaches past it, and no
            other component may write a <Mono>--nav-*</Mono> role at all. There is no page of its own
            below because there is no second thing to show — the tier is the table above. Nine of the
            modes come from Figma's Navigation Theme collection, which is full at nine, and{' '}
            <Mono>generate.py</Mono> derives the rest from the remaining Tailwind ramps.
            That is more than anyone can check by eye, so <Mono>nav-contrast.test.ts</Mono> measures
            every pair the components actually paint, in every mode, and a ramp that fails cannot
            ship.
          </p>
        </Section>

        <Section
          title="The three switches"
          hint="All three are attributes on <html>, and all three are orthogonal — the same public mechanism a consumer gets. The Storybook toolbar sets them."
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
                Repoints the ramp tier at a different neutral scale. Theme-independent, so those
                two compose: {swappableNeutrals.length} neutrals × 2 themes, from one set of
                components.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Mono>data-nav-theme="blue-inverse"</Mono>
              <p className="text-base text-content-subtle">
                Repoints the navigation tier, and only it. Orthogonal to both of the others because
                it is mostly absolute — the page can go dark underneath a nav that does not move.
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
                ['Color', `The ${chromaticRamps.length + neutralRamps.length} primitive ramps, and the swappable neutral tier.`],
                ['Semantic Color', `All ${semanticTokenCount} roles, with their light and dark targets side by side.`],
                ['Typography', `Two families, three weights, ${typeScale.length} steps that carry their own line height.`],
                ['Space', 'One base number, and the multiples every layout is built from.'],
                ['Shape', `${radii.length} radii, six stroke weights, twenty-one opacities.`],
                ['Elevation', `${shadows.length} shadows whose color is itself a token, so they adapt in dark mode.`],
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
