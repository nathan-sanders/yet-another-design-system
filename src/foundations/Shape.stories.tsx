import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section, ShowcaseTable, ShowcaseTd, ShowcaseTh } from './Showcase'
import { borderWidths, opacities, radii, radiusModes, radiusRoles } from './tokens'

/**
 * Corner radius, stroke weight and opacity — the non-color parts of how a
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
 * Components mostly do not pick from this directly. Where Figma binds a corner to
 * one of the Border Radius roles — Button, Input, Container Outer and the rest —
 * the component rounds with the role (`rounded-button`), and the role picks the
 * step per mode. The scale is what a role points at, and what the few unbound
 * corners use: pills, avatars, charts.
 */
export const Radius: Story = {
  render: () => (
    <Page
      title="Shape"
      lede={
        <>
          {radii.length} radii, eight corner roles, six stroke weights and a twenty-one step opacity scale. The last two are
          reference-only — Tailwind already generates <Mono>border-*</Mono> and <Mono>opacity-*</Mono>{' '}
          utilities, so the tokens exist to keep Figma and code naming the same values.
        </>
      }
    >
      <Section title="Radius">
        <Panel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
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

      <Section
        title="Radius roles"
        hint={
          <>
            What a component rounds with. Switched by <Mono>{'<html data-radius="soft">'}</Mono> — the
            Radius toolbar here. The last column is drawn live, so it follows that switch.
          </>
        }
      >
        <ShowcaseTable label="Each radius role and the step it takes in every mode">
          <thead>
            <tr>
              <ShowcaseTh className="w-48">Role</ShowcaseTh>
              {radiusModes.map((m) => (
                <ShowcaseTh key={m} className="capitalize">
                  {m}
                </ShowcaseTh>
              ))}
              <ShowcaseTh className="w-24">Now</ShowcaseTh>
            </tr>
          </thead>
          <tbody>
            {radiusRoles.map((r) => (
              <tr key={r.name}>
                <ShowcaseTd>
                  <Mono>rounded-{r.name}</Mono>
                </ShowcaseTd>
                {r.modes.map((m) => (
                  <ShowcaseTd key={m.mode}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-6 border border-surface-border bg-surface-background-subtle"
                        style={{ borderRadius: m.value }}
                      />
                      <Mono muted>{m.step}</Mono>
                    </div>
                  </ShowcaseTd>
                ))}
                <ShowcaseTd>
                  <div
                    className="size-6 border border-surface-border-emphasized bg-surface-background-emphasized"
                    style={{ borderRadius: `var(--shape-${r.name})` }}
                  />
                </ShowcaseTd>
              </tr>
            ))}
          </tbody>
        </ShowcaseTable>
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
