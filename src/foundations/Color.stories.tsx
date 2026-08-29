import type { Meta, StoryObj } from '@storybook/react-vite'

import { Chip, Mono, Page, Panel, RampRow, RampScale, Section, Table, Td, Th } from './Showcase'
import { chromaticRamps, neutralRamps, neutralSteps, paint, swappableNeutrals } from './tokens'

/**
 * Tier one: the raw palette. Every color in the system is one of these steps —
 * nothing else is allowed to invent one.
 */
const meta = {
  title: 'Foundations/Color',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

/**
 * The nine options in `data-neutral` order rather than palette order, so the
 * default is the first row rather than the fifth.
 */
const orderedNeutrals = swappableNeutrals.flatMap(
  (name) => neutralRamps.find((r) => r.name === name) ?? [],
)

/**
 * The primitive ramps, exactly as `theme.css` writes them: eighteen chromatic
 * families and nine neutrals, eleven steps each, in OKLCH.
 *
 * These are theme-independent. `red-700` is the same color in dark mode as in
 * light — what changes is which step the semantic layer reaches for. That is
 * the whole trick, and it is why this page has no theme switch of its own.
 *
 * **Nothing should paint with these directly.** They exist to be pointed at.
 */
export const Primitives: Story = {
  render: () => (
    <Page
      title="Color primitives"
      lede={
        <>
          The palette, before it means anything. {chromaticRamps.length} chromatic families and{' '}
          {neutralRamps.length} neutrals — <Mono>--color-red-500</Mono>, <Mono>--color-stone-950</Mono>
          . Theme-independent by construction: dark mode changes which step a role points at, never
          what the step is.
        </>
      }
    >
      <Section
        title="Chromatic"
        hint="Tailwind's default hues, re-exported through the token layer so Figma and code name the same steps."
      >
        <Panel className="flex flex-col gap-4">
          <RampScale steps={STEPS} />
          {chromaticRamps.map((r) => (
            <RampRow key={r.name} name={r.name} steps={r.steps} />
          ))}
        </Panel>
      </Section>

      <Section
        title="Neutrals"
        hint={
          <>
            Nine of them, and the choice is a running one — see <strong>The neutral ramp</strong>.
            Five are this system's own (<Mono>taupe</Mono>, <Mono>mauve</Mono>, <Mono>mist</Mono>,{' '}
            <Mono>olive</Mono> alongside <Mono>stone</Mono>); the rest come from Tailwind.
          </>
        }
      >
        <Panel className="flex flex-col gap-4">
          <RampScale steps={STEPS} />
          {neutralRamps.map((r) => (
            <RampRow key={r.name} name={r.name} steps={r.steps} />
          ))}
        </Panel>
      </Section>

      <Section title="Absolutes" hint="No ramp, no steps — and the only two colors the semantic layer names outright.">
        <Panel>
          <div className="grid max-w-md grid-cols-2 gap-4">
            {['white', 'black'].map((name) => (
              <div key={name} className="flex flex-col gap-1.5">
                <Chip value={paint(`var(--color-${name})`)} className="h-12" title={name} />
                <Mono muted>{name}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </Page>
  ),
}

/**
 * Tier one-and-a-half: the indirection that makes the neutral swappable.
 *
 * Every neutral in the semantic layer goes through `--neutral-50` … `--neutral-950`
 * rather than naming a scale, so re-skinning the entire system is one attribute
 * on `<html>`. Try it: the **Neutral** switch in the toolbar sets
 * `data-neutral`, which is the same public mechanism a consumer gets.
 *
 * These eleven steps are deliberately **not** in `@theme`. If they were,
 * Tailwind would generate `bg-neutral-*` utilities that shadow the real Neutral
 * primitive scale's. This tier is plumbing for the semantic layer, not a palette
 * anyone paints with.
 */
export const NeutralRamp: Story = {
  render: () => (
    <Page
      title="The neutral ramp"
      lede={
        <>
          One attribute — <Mono>&lt;html data-neutral="taupe"&gt;</Mono> — repoints every neutral in
          the system. The row below is live; the table under it is what each option resolves to.
        </>
      }
    >
      <Section
        title="Live"
        hint="The eleven steps as they resolve right now. Change Neutral in the toolbar and this row moves — and so does every component in Storybook."
      >
        <Panel className="flex flex-col gap-3">
          <RampScale steps={neutralSteps} />
          <div className="flex overflow-hidden rounded-sm border border-surface-border">
            {neutralSteps.map((step) => (
              <div
                key={step}
                className="h-14 flex-1"
                style={{ background: `var(--neutral-${step})` }}
                title={`neutral-${step}`}
              />
            ))}
          </div>
        </Panel>
      </Section>

      <Section
        title="The nine options"
        hint="Stone is the default, and also has its own data-neutral block so the attribute is never a lie."
      >
        <Table label="What each data-neutral value resolves to">
          <thead>
            <tr>
              <Th className="w-40">data-neutral</Th>
              <Th>Resolves to</Th>
            </tr>
          </thead>
          <tbody>
            {orderedNeutrals.map((ramp) => (
              <tr key={ramp.name}>
                <Td>
                  <Mono>{ramp.name}</Mono>
                  {ramp.name === swappableNeutrals[0] && (
                    <span className="ml-2 text-sm text-content-subtle">default</span>
                  )}
                </Td>
                <Td>
                  <div className="flex overflow-hidden rounded-xs border border-surface-border">
                    {ramp.steps.map((s) => (
                      <div
                        key={s.step}
                        className="h-6 flex-1"
                        style={{ background: s.value }}
                        title={`${ramp.name}-${s.step}`}
                      />
                    ))}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Page>
  ),
}
