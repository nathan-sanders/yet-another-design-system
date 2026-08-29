import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section, Table, Td, Th } from './Showcase'
import { spacingBase } from './tokens'

/**
 * Space is one number. Everything else is arithmetic Tailwind does for you.
 */
const meta = {
  title: 'Foundations/Space',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The steps worth documenting — the ones the components actually reach for. */
const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

const BASE_PX = Number.parseFloat(spacingBase) * 16

/**
 * The whole spacing scale from a single token.
 *
 * `--spacing: 0.25rem` is the only number in the file. Tailwind multiplies it,
 * so `p-4` is four times the base and `gap-1.5` is one and a half — including
 * the half steps, which is why a 4px base is worth having rather than an 8px
 * one that would force every fine adjustment into an arbitrary value.
 *
 * The bar widths below are computed the same way the utilities are —
 * `calc(var(--spacing) * n)` — so if the base ever changes, this page changes
 * with it.
 */
export const Spacing: Story = {
  render: () => (
    <Page
      title="Space"
      lede={
        <>
          One token, <Mono>--spacing: {spacingBase}</Mono> ({BASE_PX}px), and a multiplier. Every{' '}
          <Mono>p-*</Mono>, <Mono>gap-*</Mono>, <Mono>m-*</Mono> and <Mono>size-*</Mono> in the
          library is a multiple of it.
        </>
      }
    >
      <Section title="Scale" hint="Half steps exist and are used — a 4px base is what makes them land on whole pixels.">
        <Table label="The spacing scale, as multiples of the base">
          <thead>
            <tr>
              <Th className="w-24">Step</Th>
              <Th className="w-24">Computed</Th>
              <Th>Width</Th>
            </tr>
          </thead>
          <tbody>
            {STEPS.map((n) => (
              <tr key={n}>
                <Td>
                  <Mono>{n}</Mono>
                </Td>
                <Td>
                  <span className="whitespace-nowrap font-mono text-sm text-content-subtle">
                    {BASE_PX * n}px
                  </span>
                </Td>
                <Td>
                  <div
                    className="h-4 rounded-xs bg-surface-background-emphasized"
                    style={{ width: `calc(var(--spacing) * ${n})` }}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section
        title="In use"
        hint="The same three steps, as the padding and gap of a stack — which is all any layout in the library is."
      >
        <Panel className="flex flex-col gap-4">
          {[2, 4, 6].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <Mono muted>p-{n}</Mono>
              <div
                className="flex gap-2 rounded-md border border-surface-border bg-surface-background-subtle"
                style={{ padding: `calc(var(--spacing) * ${n})` }}
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="size-8 rounded-xs bg-surface-background-emphasized" />
                ))}
              </div>
            </div>
          ))}
        </Panel>
      </Section>
    </Page>
  ),
}
