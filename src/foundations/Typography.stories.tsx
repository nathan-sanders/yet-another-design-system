import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section, Table, Td, Th } from './Showcase'
import { fontFamilies, fontWeights, typeScale } from './tokens'

/**
 * Type: two families, three weights, and a scale whose line heights are part of
 * the token rather than a decision made per component.
 */
const meta = {
  title: 'Foundations/Typography',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE = 'The quick brown fox jumps'

/** `0.875rem` -> `14px`. Storybook and Figma both talk in px; the tokens do not. */
function px(rem: string): string {
  const n = Number.parseFloat(rem)
  return Number.isNaN(n) ? rem : `${Math.round(n * 16)}px`
}

/** Only the first family in the stack is the one Figma named; the rest are fallbacks. */
function primary(stack: string): string {
  return stack.split(',')[0].replace(/"/g, '').trim()
}

/**
 * The whole type layer on one page.
 *
 * **Line height ships with the size.** `--text-base` carries
 * `--text-base--line-height` alongside it, so `text-base` sets both and no
 * component has to remember the pairing. That is why the scale is not simply a
 * list of font sizes.
 *
 * The steps are Figma's, and they are **not** Tailwind's defaults — `base` is
 * 14px here, not 16. Everything shifts down one notch, which is the single most
 * common surprise when reading this code against Tailwind's documentation.
 */
export const Typography: Story = {
  render: () => (
    <Page
      title="Typography"
      lede={
        <>
          Inter for interface text, Geist Mono for anything you could type. Both are self-hosted via{' '}
          <Mono>@fontsource</Mono>, so the system does not depend on a network it might not have.
        </>
      }
    >
      <Section title="Families">
        <Panel className="flex flex-col gap-6">
          {fontFamilies.map((f) => (
            <div key={f.name} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <Mono>{f.name.slice(2)}</Mono>
                <span className="text-sm text-content-subtle">{primary(f.value)}</span>
              </div>
              <p
                className="text-3xl text-content-emphasized"
                style={{ fontFamily: `var(${f.name})` }}
              >
                {SAMPLE}
              </p>
              <p className="text-base text-content-subtle" style={{ fontFamily: `var(${f.name})` }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &amp;@#$%
              </p>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        title="Weights"
        hint="Three, and no more. A design system with five weights has two nobody can tell apart."
      >
        <Panel className="flex flex-col gap-3">
          {fontWeights.map((w) => (
            <div key={w.name} className="flex items-baseline gap-4">
              <Mono muted>{w.name.slice('--font-weight-'.length)}</Mono>
              <span className="text-sm text-content-subtle">{w.value}</span>
              <span className="text-xl text-content-emphasized" style={{ fontWeight: w.value }}>
                {SAMPLE}
              </span>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        title="Scale"
        hint={
          <>
            Each step sets its own line height. Note that <Mono>base</Mono> is 14px — the scale is
            Figma's, not Tailwind's.
          </>
        }
      >
        <Table label="The type scale, with size, line height and a specimen">
          <thead>
            <tr>
              <Th className="w-24">Token</Th>
              <Th className="w-24">Size</Th>
              <Th className="w-32">Line height</Th>
              <Th>Specimen</Th>
            </tr>
          </thead>
          <tbody>
            {typeScale.map((t) => (
              <tr key={t.name}>
                <Td>
                  <Mono>text-{t.name}</Mono>
                </Td>
                <Td>
                  <span className="whitespace-nowrap font-mono text-sm text-content-subtle">
                    {px(t.size)}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap font-mono text-sm text-content-subtle">
                    {t.lineHeight ? px(t.lineHeight) : '—'}
                  </span>
                </Td>
                <Td>
                  <span
                    className="text-content-emphasized"
                    style={{ fontSize: t.size, lineHeight: t.lineHeight || undefined }}
                  >
                    {SAMPLE}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </Page>
  ),
}
