import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section } from './Showcase'
import { borderWidths, opacities, radii } from './tokens'

/**
 * Corner radius, stroke weight and opacity — the non-colour parts of how a
 * surface is drawn.
 */
const meta = {
  title: 'Foundations/Shape',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * The radius scale, from square to pill.
 *
 * Components pick from this and expose the choice as a `radius` prop only where
 * Figma models it as a variant — `Token` has `md` and `sm`, most things have
 * one radius and no prop. A scale is not an invitation to use all of it.
 */
export const Radius: Story = {
  render: () => (
    <Page
      title="Shape"
      lede={
        <>
          Ten radii, six stroke weights and a twenty-one step opacity scale. The last two are
          reference-only — Tailwind already generates <Mono>border-*</Mono> and <Mono>opacity-*</Mono>{' '}
          utilities, so the tokens exist to keep Figma and code naming the same values.
        </>
      }
    >
      <Section title="Radius">
        <Panel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {radii.map((r) => (
              <div key={r.name} className="flex flex-col gap-1.5">
                <div
                  className="h-16 border border-surface-border bg-surface-background-subtle"
                  style={{ borderRadius: r.value }}
                />
                <Mono muted>{r.name.slice('--radius-'.length)}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section title="Border width" hint="One pixel is the system default; the rest are for emphasis and dividers.">
        <Panel>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {borderWidths.map((b) => (
              <div key={b.name} className="flex flex-col gap-1.5">
                <div
                  className="h-16 rounded-sm border-surface-border-emphasized bg-surface-background-subtle"
                  style={{ borderStyle: 'solid', borderWidth: b.value }}
                />
                <Mono muted>{b.value}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section title="Opacity" hint="Five-point steps, 0 through 100.">
        <Panel>
          <div className="flex flex-wrap gap-2">
            {opacities.map((o) => (
              <div key={o.name} className="flex w-14 flex-col gap-1.5">
                <div
                  className="h-10 rounded-xs border border-surface-border bg-surface-background-emphasized"
                  style={{ opacity: o.value }}
                />
                <span className="font-mono text-xs text-content-subtle">
                  {o.name.slice('--opacity-'.length)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </Page>
  ),
}
