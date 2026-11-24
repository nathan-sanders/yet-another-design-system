import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { ProgressBar } from '../components/ProgressBar'
import { Radio } from '../components/Radio'
import { Slider } from '../components/Slider'
import { Switch } from '../components/Switch'
import { Mono, Page, Panel, Section, ShowcaseTable, ShowcaseTd, ShowcaseTh } from './Showcase'
import {
  paint,
  primaryMode,
  primaryThemes,
  primaryTokens,
  readAlias,
  resolve,
  semanticGroups,
  semanticTokenCount,
} from './tokens'
import type { SemanticToken } from './tokens'

/**
 * The mapping layer: which primitive each semantic token points at, in each
 * theme.
 *
 * This is the page the whole system turns on. A component never names a
 * color — it names a *role* (`bg-action-primary-background`), and this table
 * is where that role is cashed in for a step on a ramp. Dark mode is not a set
 * of `dark:` classes anywhere in the library; it is the right-hand column.
 */
const meta = {
  title: 'Foundations/Semantic Color',
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
  feedback: 'Success, info, warning, danger. Each one aliases a decorative family rather than naming a color twice.',
  decorative: 'The eighteen hue families, each with a background, highlight and foreground that already contrast.',
  'data-viz': 'Chart color: the categorical order, the diverging scale, sentiment and the mono ramp.',
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
    <ShowcaseTable label={`${group} tokens, with their light and dark targets`}>
      <thead>
        <tr>
          <ShowcaseTh className="w-14">Live</ShowcaseTh>
          <ShowcaseTh>Token</ShowcaseTh>
          <ShowcaseTh>Light</ShowcaseTh>
          <ShowcaseTh>Dark</ShowcaseTh>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => (
          <tr key={t.token}>
            <ShowcaseTd>
              <div
                className="h-8 w-10 rounded-xs border border-surface-border"
                style={{ background: `var(--${t.token})` }}
              />
            </ShowcaseTd>
            <ShowcaseTd>
              <Mono>{t.label}</Mono>
            </ShowcaseTd>
            <ShowcaseTd>
              <Target value={t.light} theme="light" />
            </ShowcaseTd>
            <ShowcaseTd>
              <Target value={t.dark} theme="dark" />
            </ShowcaseTd>
          </tr>
        ))}
      </tbody>
    </ShowcaseTable>
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
 * Seven of them point at the primary theme instead, which names its light and
 * dark values apart (`primary-background-light`), so the same holds. Those chips
 * follow **Primary** in the toolbar.
 *
 * A `·` followed by a percentage means the token is a `color-mix` — that
 * primitive at that opacity over whatever is behind it.
 */
export const Mapping: Story = {
  render: () => (
    <Page
      title="Semantic color"
      lede={
        <>
          {semanticTokenCount} tokens, each one a <em>role</em> rather than a color. Components paint
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
 * The same tokens as flat swatch walls, for when you want to compare colors
 * rather than read a mapping. These follow the toolbar's **Theme** and
 * **Neutral** switches, so this is the fastest way to see what changing the
 * ramp actually does to the system.
 */
export const Swatches: Story = {
  render: () => (
    <Page
      title="Semantic color, as swatches"
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

/* ----------------------------------------------------------- primary theme */

const isInverse = (mode: string) => mode.endsWith('-inverse')

const titleCase = (mode: string) =>
  mode
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/** The controls the theme paints, each in the state that shows it. */
function Controls({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-4">
      <Button>Save</Button>
      <Checkbox defaultChecked aria-label={`Checkbox, ${id}`} />
      {/* A group fills its width; here it sits beside the others. */}
      <div className="w-fit">
        <Radio.Group defaultValue="on" aria-label={`Radio, ${id}`}>
          <Radio value="on" aria-label={`Radio, ${id}`} />
        </Radio.Group>
      </div>
      <Switch defaultChecked aria-label={`Switch, ${id}`} />
    </div>
  )
}

/** One mode, pinned: the attribute on a section, on the surface that mode is for. */
function Pinned({ mode }: { mode: string }) {
  return (
    <div
      data-primary-theme={mode}
      data-testid={mode}
      className={
        isInverse(mode)
          ? 'rounded-container-outer border border-surface-border-emphasized bg-surface-background-emphasized p-4'
          : 'rounded-container-outer border border-surface-border bg-surface-background-primary p-4'
      }
    >
      <Controls id={mode} />
    </div>
  )
}

/** A step, as a chip plus the name it was written as. */
function Step({ value }: { value: string | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-6 shrink-0 rounded-xs border border-surface-border"
        style={{ background: paint(value) }}
      />
      <span className="whitespace-nowrap font-mono text-xs text-content-subtle">
        {readAlias(value).alias}
      </span>
    </div>
  )
}

const PRIMARY_COLUMNS = ['light', 'dark'].flatMap((theme) =>
  ['foreground', 'background', 'background-hover'].map((role) => ({
    name: `--primary-${role}-${theme}`,
    title: `${{ foreground: 'Label', background: 'Fill', 'background-hover': 'Hover' }[role]}, ${theme}`,
  })),
)

/** What the browser makes of a color, so two spellings of one color compare equal. */
function computed(section: HTMLElement, background: string): string {
  const probe = document.createElement('div')
  probe.style.background = background
  section.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

/**
 * Figma's Primary Theme collection: the color of the primary Button and of every
 * selected control, with an inverse of each.
 *
 * Unlike the other switches it works on any element, the way Figma applies a
 * mode to a frame. `<html data-primary-theme="blue">` is the whole app; the same
 * attribute on a `<section>` is that section and nothing else. An inverse mode
 * is for an emphasized surface, where the default would disappear into it.
 *
 * A popup is portalled to `<body>`, so a Select opened inside a themed section
 * wears the page's theme.
 */
export const PrimaryTheme: Story = {
  render: () => (
    <Page
      title="The primary theme"
      lede={
        <>
          {primaryThemes.length} modes: neutral and every color ramp, each with an inverse. One
          attribute, <Mono>data-primary-theme="blue"</Mono>, moves {primaryTokens.length} semantic
          tokens, and every component that paints with them follows.
        </>
      }
    >
      <Section
        title="Live"
        hint="As it resolves right now. Change Primary in the toolbar and this moves, and so does every component in Storybook."
      >
        <Panel className="flex max-w-md flex-col gap-5">
          <Controls id="live" />
          <Slider defaultValue={60} aria-label="Slider, live" />
          <ProgressBar value={60} aria-label="Progress, live" />
        </Panel>
      </Section>

      <Section
        title="Default"
        hint="For an ordinary surface: the canvas, a card, a dialog. Each tile ignores the toolbar, because the attribute is on the tile."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryThemes
            .filter((m) => !isInverse(m))
            .map((m) => (
              <div key={m} className="flex flex-col gap-2">
                <Mono>{m}</Mono>
                <Pinned mode={m} />
              </div>
            ))}
        </div>
      </Section>

      <Section
        title="Inverse"
        hint="For an emphasized surface, dark in light mode and light in dark. Neutral Inverse is the canvas color, so on the canvas itself it would be invisible."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {primaryThemes.filter(isInverse).map((m) => (
            <div key={m} className="flex flex-col gap-2">
              <Mono>{m}</Mono>
              <Pinned mode={m} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="The values"
        hint="The first ten are Figma's. The other ramps are derived from Red's steps or Green's, because a Figma collection holds ten modes: white on step 600 clears 4.5:1 on eight ramps, and the other nine take 700 as Green does. The border is always the fill."
      >
        <ShowcaseTable label="Each primary theme and the step it takes for every value">
          <thead>
            <tr>
              <ShowcaseTh>Mode</ShowcaseTh>
              {PRIMARY_COLUMNS.map((c) => (
                <ShowcaseTh key={c.name}>{c.title}</ShowcaseTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {primaryThemes.map((m) => {
              const values = primaryMode(m)
              return (
                <tr key={m}>
                  <ShowcaseTd>
                    <span className="whitespace-nowrap text-base text-content-primary">{titleCase(m)}</span>
                  </ShowcaseTd>
                  {PRIMARY_COLUMNS.map((c) => (
                    <ShowcaseTd key={c.name}>
                      <Step value={values.get(c.name)} />
                    </ShowcaseTd>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </ShowcaseTable>
      </Section>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    // The tiles are the claim: an attribute on a section moves that section and
    // not its neighbor, in both themes, whatever the page itself is set to.
    const canvas = within(canvasElement)
    const html = document.documentElement
    const before = { dark: html.classList.contains('dark'), primary: html.dataset.primaryTheme }
    try {
      html.dataset.primaryTheme = 'teal'
      for (const theme of ['light', 'dark'] as const) {
        html.classList.toggle('dark', theme === 'dark')
        for (const mode of ['red', 'neutral', 'yellow', 'blue-inverse']) {
          const section = canvas.getByTestId(mode)
          const values = primaryMode(mode)
          const fill = computed(section, paint(values.get(`--primary-background-${theme}`)!))
          await expect(computed(section, 'var(--action-primary-background)')).toBe(fill)
          await expect(computed(section, 'var(--input-selected)')).toBe(fill)
        }
        const page = computed(canvasElement, paint(primaryMode('teal').get(`--primary-background-${theme}`)!))
        await expect(computed(canvasElement, 'var(--action-primary-background)')).toBe(page)
      }
    } finally {
      html.classList.toggle('dark', before.dark)
      if (before.primary) html.dataset.primaryTheme = before.primary
      else delete html.dataset.primaryTheme
    }
  },
}
