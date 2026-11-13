import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ChatMessage } from '../components/Chat'
import { Checkbox } from '../components/Checkbox'
import { ContentBlock } from '../components/ContentBlock'
import { Field } from '../components/Field'
import { Input } from '../components/Input'
import { SegmentedControl } from '../components/SegmentedControl'
import { Token } from '../components/Token'
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
          {radii.length} radii, six stroke weights and a twenty-one step opacity scale. The last two are
          reference-only — Tailwind already generates <Mono>border-*</Mono> and <Mono>opacity-*</Mono>{' '}
          utilities, so the tokens exist to keep Figma and code naming the same values.
        </>
      }
    >
      <Section
        title="Radius"
        hint={
          <>
            The scale. Components round with a role that points into it — see{' '}
            <strong>Radius Roles</strong>, the next page.
          </>
        }
      >
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

/**
 * The `--shape-*` overrides that put a subtree in one mode. The tier lives on
 * `<html>`, but the roles are custom properties and custom properties inherit,
 * so re-declaring them on a wrapper re-shapes everything inside it — which is
 * how four modes can sit side by side on one page.
 */
function modeVars(mode: string): CSSProperties {
  return Object.fromEntries(
    radiusRoles.map((r) => [`--shape-${r.name}`, r.modes.find((m) => m.mode === mode)?.value]),
  ) as CSSProperties
}

/** One of each corner role, in the components that use it. */
function Sample({ id }: { id: string }) {
  return (
    <ContentBlock>
      <ContentBlock.Header>Notifications</ContentBlock.Header>
      <ContentBlock.Content>
        <div className="flex flex-col gap-3">
          <Card>
            <div className="flex flex-col gap-3">
              <Field label="Email">
                <Input defaultValue="hello@example.com" />
              </Field>
              <SegmentedControl defaultValue="daily" aria-label={`Frequency, ${id}`} layout="fill">
                <SegmentedControl.Item value="daily">Daily</SegmentedControl.Item>
                <SegmentedControl.Item value="weekly">Weekly</SegmentedControl.Item>
              </SegmentedControl>
              <Checkbox inContainer defaultChecked label="Mentions" description="When someone @-mentions you." />
              <div className="flex flex-wrap gap-2">
                <Token>Design</Token>
                <Token>Research</Token>
              </div>
            </div>
          </Card>
          <div className="flex flex-col gap-2">
            <ChatMessage direction="received">
              <ChatMessage.Bubble>Can we ship Friday?</ChatMessage.Bubble>
            </ChatMessage>
            <ChatMessage direction="sent">
              <ChatMessage.Bubble>Yes, once it is reviewed.</ChatMessage.Bubble>
            </ChatMessage>
          </div>
          <div className="flex gap-2">
            <Button>Save</Button>
            <Button appearance="secondary">Cancel</Button>
          </div>
        </div>
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * Figma's Border Radius collection: eight corner roles, four modes.
 *
 * A component never names a radius. It rounds with a role — `rounded-button`,
 * `rounded-container-outer` — and the role points at a step of the scale, so
 * re-shaping the entire system is one attribute on `<html>`. Try it: the
 * **Radius** switch in the toolbar sets `data-radius`, which is the same public
 * mechanism a consumer gets. Default is the radius every component had before
 * the roles existed, so it changes nothing on screen.
 */
export const RadiusRoles: Story = {
  render: () => (
    <Page
      title="The radius roles"
      lede={
        <>
          One attribute — <Mono>&lt;html data-radius="soft"&gt;</Mono> — re-shapes every component.
          The sample below is live; the four after it are each pinned to one mode, and the table
          says which step every role takes in each.
        </>
      }
    >
      <Section
        title="Live"
        hint="As it resolves right now. Change Radius in the toolbar and this moves — and so does every component in Storybook."
      >
        <div className="max-w-sm">
          <Sample id="live" />
        </div>
      </Section>

      <Section
        title={`The ${radiusModes.length} options`}
        hint="Default is the default, and also has its own data-radius block so the attribute is never a lie. Each column ignores the toolbar."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {radiusModes.map((mode) => (
            <div key={mode} className="flex flex-col gap-2" style={modeVars(mode)}>
              <div className="flex items-baseline gap-2">
                <Mono>data-radius="{mode}"</Mono>
                {mode === radiusModes[0] && <span className="text-sm text-content-subtle">default</span>}
              </div>
              <Sample id={mode} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="The roles"
        hint="The step each role takes in every mode. The last column is drawn live, so it follows the toolbar."
      >
        <ShowcaseTable label="Each radius role and the step it takes in every mode">
          <thead>
            <tr>
              <ShowcaseTh className="w-56">Role</ShowcaseTh>
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
    </Page>
  ),
}
