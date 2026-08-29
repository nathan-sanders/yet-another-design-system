import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section } from './Showcase'
import { blurs, insetShadows, shadows } from './tokens'

/**
 * Elevation, and the blur that goes with the overlays that use it.
 */
const meta = {
  title: 'Foundations/Elevation',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function label(name: string, prefix: string): string {
  return name.slice(prefix.length + 3)
}

/**
 * Four heights, plus the directional variants a popup needs when it opens
 * upward or sideways.
 *
 * **The shadow colour is itself a semantic token.** Every shadow here is
 * `… var(--surface-drop-shadow)`, so elevation adapts in dark mode without a
 * second set of shadow tokens — the same reason nothing in the library carries a
 * `dark:` class. Flip **Theme** in the toolbar and the shadows below change
 * colour, not size.
 */
export const Shadows: Story = {
  render: () => (
    <Page
      title="Elevation"
      lede={
        <>
          Height is a shadow, and the shadow's colour is a token — so the scale is written once and
          works in both themes.
        </>
      }
    >
      <Section title="Drop shadows">
        <Panel className="bg-surface-canvas">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {shadows.map((s) => (
              <div key={s.name} className="flex flex-col gap-2">
                <div
                  className="h-20 rounded-lg bg-surface-background-primary"
                  style={{ boxShadow: s.value }}
                />
                <Mono muted>{label(s.name, 'shadow')}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section
        title="Inset shadows"
        hint="The scroll-edge fades — what tells you a list continues past the fold."
      >
        <Panel className="bg-surface-canvas">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {insetShadows.map((s) => (
              <div key={s.name} className="flex flex-col gap-2">
                <div
                  className="h-20 rounded-lg border border-surface-border bg-surface-background-primary"
                  style={{ boxShadow: s.value }}
                />
                <Mono muted>{label(s.name, 'inset-shadow')}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section title="Blur" hint="For the backdrop behind a modal, and nothing else so far.">
        <Panel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {blurs.map((b) => (
              <div key={b.name} className="flex flex-col gap-1.5">
                <div className="h-16 overflow-hidden rounded-sm border border-surface-border">
                  <div
                    className="h-full w-full"
                    style={{
                      filter: `blur(${b.value})`,
                      backgroundImage:
                        'repeating-linear-gradient(45deg, var(--surface-background-emphasized) 0 8px, var(--surface-background-primary) 8px 16px)',
                    }}
                  />
                </div>
                <Mono muted>{label(b.name, 'blur')}</Mono>
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </Page>
  ),
}
