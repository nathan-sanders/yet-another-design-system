import type { Meta, StoryObj } from '@storybook/react-vite'

import { Mono, Page, Panel, Section, Table, Td, Th } from './Showcase'
import { readAlias, resolve, semanticGroups, semanticTokenCount } from './tokens'
import type { SemanticToken } from './tokens'

/**
 * The mapping layer: which primitive each semantic token points at, in each
 * theme.
 *
 * This is the page the whole system turns on. A component never names a
 * colour — it names a *role* (`bg-action-primary-background`), and this table
 * is where that role is cashed in for a step on a ramp. Dark mode is not a set
 * of `dark:` classes anywhere in the library; it is the right-hand column.
 */
const meta = {
  title: 'Foundations/Semantic Colour',
  parameters: { controls: { disable: true } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const GROUP_NOTES: Record<string, string> = {
  surface: 'Canvas, cards, borders — everything a component sits on rather than draws.',
  content: 'Text and icons. Shown as fills here so the steps are comparable.',
  action: 'The tiers a Button is built from: primary, secondary, destructive, ghost, overlay, link.',
  input: 'Fields and their selected state. Separate from action because an input is not a button.',
  focus: 'The two-ring focus indicator — an inner light ring and an outer dark one, so it survives on any background.',
  feedback: 'Success, info, warning, danger. Each one aliases a decorative family rather than naming a colour twice.',
  decorative: 'The eighteen hue families, each with a background, highlight and foreground that already contrast.',
  'data-viz': 'Chart colour: the categorical order, the diverging scale, sentiment and the mono ramp.',
}

/** One theme's target, as a chip plus the alias it was written as. */
function Target({ value, theme }: { value: string; theme: 'light' | 'dark' }) {
  const { alias, mix } = readAlias(value)
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="size-6 shrink-0 rounded-xs border border-surface-border"
        style={{ background: resolve(value, theme) }}
      />
      <span className="whitespace-nowrap font-mono text-sm text-content-primary">
        {alias}
        {mix && <span className="text-content-subtle"> · {mix}</span>}
      </span>
    </div>
  )
}

function MappingTable({ group, tokens }: { group: string; tokens: SemanticToken[] }) {
  return (
    <Table label={`${group} tokens, with their light and dark targets`}>
      <thead>
        <tr>
          <Th className="w-14">Live</Th>
          <Th>Token</Th>
          <Th>Light</Th>
          <Th>Dark</Th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => (
          <tr key={t.token}>
            <Td>
              <div
                className="h-8 w-10 rounded-xs border border-surface-border"
                style={{ background: `var(--${t.token})` }}
              />
            </Td>
            <Td>
              <Mono>{t.label}</Mono>
            </Td>
            <Td>
              <Target value={t.light} theme="light" />
            </Td>
            <Td>
              <Target value={t.dark} theme="dark" />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/**
 * Every semantic token, grouped by tier, with both themes side by side.
 *
 * **Why both columns can be shown at once.** The light and dark values point at
 * the *ramp* tier (`neutral-800`) or a primitive (`red-700`), and neither
 * depends on the theme — only the choice between them does. So the two target
 * chips are always truthful, whichever theme you are reading in. The `Live`
 * column is the token as it actually resolves right now; flip **Theme** in the
 * toolbar and it should land on whichever of the two columns you switched to.
 *
 * A `·` followed by a percentage means the token is a `color-mix` — that
 * primitive at that opacity over whatever is behind it.
 */
export const Mapping: Story = {
  render: () => (
    <Page
      title="Semantic colour"
      lede={
        <>
          {semanticTokenCount} tokens, each one a <em>role</em> rather than a colour. Components paint
          with these and nothing else, which is why there is not a single <Mono>dark:</Mono> class in
          the library — the dark column below does that job for all of them at once.
        </>
      }
    >
      {semanticGroups.map((g) => (
        <Section key={g.name} title={g.name} hint={GROUP_NOTES[g.name]}>
          <MappingTable group={g.name} tokens={g.tokens} />
        </Section>
      ))}
    </Page>
  ),
}

/**
 * The same tokens as flat swatch walls, for when you want to compare colours
 * rather than read a mapping. These follow the toolbar's **Theme** and
 * **Neutral** switches, so this is the fastest way to see what changing the
 * ramp actually does to the system.
 */
export const Swatches: Story = {
  render: () => (
    <Page
      title="Semantic colour, as swatches"
      lede="Every semantic token painted at its current value. Change Theme or Neutral in the toolbar and the whole wall moves."
    >
      {semanticGroups.map((g) => (
        <Section key={g.name} title={g.name}>
          <Panel>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.tokens.map((t) => (
                <div key={t.token} className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="size-8 shrink-0 rounded-xs border border-surface-border"
                    style={{ background: `var(--${t.token})` }}
                  />
                  <span className="truncate font-mono text-xs text-content-subtle" title={t.token}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </Section>
      ))}
    </Page>
  ),
}
