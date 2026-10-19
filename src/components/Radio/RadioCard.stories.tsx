import { useId } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  ChartArea,
  ChartColumn,
  ChartLine,
  ChartPie,
  Gauge,
  Megaphone,
  Swords,
  Table as TableIcon,
  type LucideIcon,
} from 'lucide-react'

import { Radio } from './Radio'
import { Field } from '../Field'
import { Icon } from '../Icon'
import { Text } from '../Text'

const emphases = ['default', 'ghost'] as const
const paddings = [0, 2, 3, 4] as const

const meta = {
  title: 'Components/RadioCard',
  component: Radio.Card,
  argTypes: {
    emphasis: { control: 'select', options: emphases },
    padding: { control: 'select', options: paddings },
    disabled: { control: 'boolean' },
  },
  args: {
    // Required on a radio; every story's options override it.
    value: 'line',
    children: null,
    emphasis: 'default',
    padding: 3,
    disabled: false,
  },
} satisfies Meta<typeof Radio.Card>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Paint a probe with the token and read it back, so a color is compared with
 * a color through the same serializer rather than regexed out of a string.
 */
function tokenColor(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

/** The selected card wears Clickable Card's Selected; the rest wear its rest state. */
async function expectSurfaces(canvas: ReturnType<typeof within>, checkedName: string) {
  const radios = canvas.getAllByRole('radio')
  // The card's colors transition, and a theme switch starts that transition on
  // every card; finish it, or the read lands on the old theme's value.
  for (const radio of radios) radio.getAnimations().forEach((a: Animation) => a.finish())
  const checked = canvas.getByRole('radio', { name: checkedName })
  await expect(checked).toHaveAttribute('aria-checked', 'true')
  await expect(checked).not.toHaveAttribute('aria-current')
  const on = getComputedStyle(checked)
  await expect(on.backgroundColor).toBe(tokenColor('surface-background-subtle'))
  await expect(on.borderTopColor).toBe(tokenColor('surface-border-emphasized'))

  const rest = radios.find((r: HTMLElement) => r !== checked)!
  const off = getComputedStyle(rest)
  await expect(off.backgroundColor).toBe(tokenColor('surface-background-primary'))
  await expect(off.borderTopColor).toBe(tokenColor('surface-border'))
  // Card's box: 8px radius, 1px border, 12px padding at padding={3}.
  await expect(off.borderTopLeftRadius).toBe('8px')
  await expect(off.borderTopWidth).toBe('1px')
  await expect(off.paddingTop).toBe('12px')
}

const viz: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'line', label: 'Line', icon: ChartLine },
  { value: 'area', label: 'Area', icon: ChartArea },
  { value: 'bar', label: 'Bar', icon: ChartColumn },
  { value: 'donut', label: 'Donut', icon: ChartPie },
  { value: 'gauge', label: 'Gauge', icon: Gauge },
  { value: 'table', label: 'Table', icon: TableIcon },
]

/**
 * The Pulse widget editor's Visualization picker — Figma's `_Measure Viz
 * Option` (`40005872:24935`), a glyph over a word in a Clickable Card, with
 * `State=Selected` on the chosen chart. Six cards, one radio group: one tab
 * stop, and the arrow keys move *and* select.
 *
 * The content is the name — "Line", "Area" — so there is nothing to wire.
 * Centering is the caller's `className`; a card's children stack at 8px.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="flex max-w-96 flex-col gap-2">
      <Text id="viz-label" render={<span />} weight="semibold">
        Visualization
      </Text>
      <Radio.Group aria-labelledby="viz-label" defaultValue="line" className="grid grid-cols-3">
        {viz.map((option) => (
          <Radio.Card
            {...args}
            key={option.value}
            value={option.value}
            className="items-center gap-1 text-center"
          >
            <Icon icon={option.icon} />
            <Text render={<span />} size="sm">
              {option.label}
            </Text>
          </Radio.Card>
        ))}
      </Radio.Group>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radiogroup', { name: 'Visualization' })).toBeInTheDocument()
    await expect(canvas.getAllByRole('radio')).toHaveLength(6)
    await expect(canvas.getByRole('radio', { name: 'Area' })).toBeInTheDocument()
    await expectSurfaces(canvas, 'Line')
  },
}

const reportTypes = [
  {
    value: 'brand',
    icon: Megaphone,
    label: 'Brand pulse',
    description: 'How often your brand is mentioned, and how people feel about it.',
    includes: ['Mentions over time', 'Sentiment', 'Top posts'],
  },
  {
    value: 'competitive',
    icon: Swords,
    label: 'Competitive',
    description: 'Your share of the conversation against the brands you name.',
    includes: ['Share of voice', 'Sentiment by brand'],
  },
  {
    value: 'blank',
    icon: ChartColumn,
    label: 'Blank',
    description: 'Start with an empty board and add the widgets you want.',
    includes: [],
  },
]

function ReportTypeCard({ option }: { option: (typeof reportTypes)[number] }) {
  const id = useId()
  return (
    <Radio.Card
      value={option.value}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-description`}
    >
      <Icon icon={option.icon} aria-hidden />
      <span className="flex min-w-0 flex-col gap-1">
        <Text id={`${id}-label`} render={<span />} weight="semibold">
          {option.label}
        </Text>
        <span id={`${id}-description`} className="flex flex-col gap-1">
          <Text render={<span />} color="subtle">
            {option.description}
          </Text>
          {option.includes.length ? (
            <Text render={<span />} size="sm" color="subtle">
              Includes {option.includes.join(' · ')}
            </Text>
          ) : null}
        </span>
      </span>
    </Radio.Card>
  )
}

/**
 * Yet Social's New report type picker: a card with a title, a sentence and a
 * list of what it opens with. **Name it by its title.** Left alone, the card is
 * named by everything in it — the whole paragraph, read as the option's name
 * on every arrow press. Point `aria-labelledby` at the title and
 * `aria-describedby` at the rest; the caller's ids win over the default.
 *
 * The children are phrasing content, because the card is a `<button>`: spans
 * and `Text render={<span />}`, never a `<div>` or a heading.
 */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Radio.Group
      aria-label="Report type"
      defaultValue="brand"
      className="grid max-w-160 grid-cols-2"
    >
      {reportTypes.map((option) => (
        <ReportTypeCard key={option.value} option={option} />
      ))}
    </Radio.Group>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const brand = canvas.getByRole('radio', { name: 'Brand pulse' })
    await expect(brand).toHaveAccessibleDescription(
      'How often your brand is mentioned, and how people feel about it. Includes Mentions over time · Sentiment · Top posts',
    )
    await expect(canvas.getByRole('radio', { name: 'Blank' })).toHaveAccessibleDescription(
      'Start with an empty board and add the widgets you want.',
    )
  },
}

/**
 * Clickable Card's two emphases. `ghost` has no edge until it is picked, so it
 * belongs on a `surface-background-primary` parent — here, a white panel; on
 * the canvas it would be a white block. Picked, both wear the same Selected
 * surface, which is the file's: Surface/Background Subtle on Surface/Border
 * Emphasized for either emphasis.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-96 flex-col gap-6">
      {emphases.map((emphasis) => (
        <div
          key={emphasis}
          className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-background-primary p-4"
        >
          <Text id={`emphasis-${emphasis}`} render={<span />} weight="semibold">
            {emphasis}
          </Text>
          <Radio.Group
            aria-labelledby={`emphasis-${emphasis}`}
            defaultValue="area"
            className="grid grid-cols-3"
          >
            {viz.slice(0, 3).map((option) => (
              <Radio.Card
                key={option.value}
                value={option.value}
                emphasis={emphasis}
                className="items-center gap-1 text-center"
              >
                <Icon icon={option.icon} />
                <Text render={<span />} size="sm">
                  {option.label}
                </Text>
              </Radio.Card>
            ))}
          </Radio.Group>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const ghost = within(canvas.getByRole('radiogroup', { name: 'ghost' }))
    const picked = ghost.getByRole('radio', { name: 'Area' })
    await expect(getComputedStyle(picked).borderTopColor).toBe(
      tokenColor('surface-border-emphasized'),
    )
    // A ghost card at rest: the edge is its own fill, so it is there and invisible.
    const rest = getComputedStyle(ghost.getByRole('radio', { name: 'Line' }))
    await expect(rest.borderTopColor).toBe(tokenColor('surface-background-primary'))
    await expect(rest.borderTopColor).toBe(rest.backgroundColor)
  },
}

/**
 * Disabled, on one option and on a whole group. Base UI sets `data-disabled`
 * on every card a disabled `Radio.Group` (or `Field`) reaches, and the surface
 * reads that attribute, so one prop on the group greys every card — a boolean
 * per card could not. Clickable Card's Disabled: 40% and inert.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-96 flex-col gap-6">
      <Radio.Group aria-label="One disabled" defaultValue="line" className="grid grid-cols-3">
        {viz.slice(0, 3).map((option) => (
          <Radio.Card
            key={option.value}
            value={option.value}
            disabled={option.value === 'bar'}
            className="items-center gap-1 text-center"
          >
            <Icon icon={option.icon} />
            <Text render={<span />} size="sm">
              {option.label}
            </Text>
          </Radio.Card>
        ))}
      </Radio.Group>
      <Radio.Group
        aria-label="All disabled"
        defaultValue="line"
        disabled
        className="grid grid-cols-3"
      >
        {viz.slice(0, 3).map((option) => (
          <Radio.Card
            key={option.value}
            value={option.value}
            className="items-center gap-1 text-center"
          >
            <Icon icon={option.icon} />
            <Text render={<span />} size="sm">
              {option.label}
            </Text>
          </Radio.Card>
        ))}
      </Radio.Group>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const one = within(canvas.getByRole('radiogroup', { name: 'One disabled' }))
    const bar = one.getByRole('radio', { name: 'Bar' })
    await expect(bar).toBeDisabled()
    await expect(getComputedStyle(bar).opacity).toBe('0.4')
    await expect(getComputedStyle(one.getByRole('radio', { name: 'Line' })).opacity).toBe('1')

    const all = within(canvas.getByRole('radiogroup', { name: 'All disabled' }))
    for (const radio of all.getAllByRole('radio')) {
      await expect(radio).toBeDisabled()
      await expect(getComputedStyle(radio).opacity).toBe('0.4')
    }
  },
}

/**
 * The keyboard contract, asserted. One Tab reaches the group and a second
 * leaves it; the arrows move *and* select, all four of them, wrapping at the
 * ends; Space picks the focused card; **Enter does not** — a radio activates
 * on Space only, which Base UI enforces on the `<button>` it renders.
 */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-96 flex-col gap-4">
      <button type="button" className="self-start">
        Before
      </button>
      <Radio.Group aria-label="Chart" className="grid grid-cols-3">
        {viz.slice(0, 3).map((option) => (
          <Radio.Card
            key={option.value}
            value={option.value}
            className="items-center gap-1 text-center"
          >
            <Icon icon={option.icon} />
            <Text render={<span />} size="sm">
              {option.label}
            </Text>
          </Radio.Card>
        ))}
      </Radio.Group>
      <button type="button" className="self-start">
        After
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [line, area, bar] = ['Line', 'Area', 'Bar'].map((name) =>
      canvas.getByRole('radio', { name }),
    )

    canvas.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    await expect(line).toHaveFocus()
    await expect(line).toHaveAttribute('aria-checked', 'false')

    await userEvent.keyboard('{Enter}')
    await expect(line).toHaveAttribute('aria-checked', 'false')
    await userEvent.keyboard(' ')
    await expect(line).toHaveAttribute('aria-checked', 'true')

    await userEvent.keyboard('{ArrowRight}')
    await expect(area).toHaveFocus()
    await expect(area).toHaveAttribute('aria-checked', 'true')
    await expect(line).toHaveAttribute('aria-checked', 'false')
    await userEvent.keyboard('{ArrowDown}')
    await expect(bar).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await expect(line).toHaveFocus()
    await expect(line).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowLeft}')
    await expect(bar).toHaveFocus()

    // The ring is the shared one, on the card itself.
    await expect(getComputedStyle(bar).boxShadow).toContain(tokenColor('focus-focus-outer-border'))

    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(bar).toHaveFocus()
  },
}

/**
 * Inside a `Field`, which names the group, carries the message and marks every
 * card invalid. Two things asserted. **Each card is still named by its own
 * content** — Base UI would otherwise hand each one the Field's label, so all
 * three would be announced as "Default chart". And **invalid beats checked**:
 * an answer that is wrong keeps the danger edge even when it is the chosen one.
 */
export const InField: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Field
      label="Default chart"
      description="New widgets open as this chart."
      error="Gauges need a target, and this measure has none."
      className="max-w-96"
    >
      <Radio.Group defaultValue="gauge" className="grid grid-cols-3">
        {viz.slice(2, 5).map((option) => (
          <Radio.Card
            key={option.value}
            value={option.value}
            className="items-center gap-1 text-center"
          >
            <Icon icon={option.icon} />
            <Text render={<span />} size="sm">
              {option.label}
            </Text>
          </Radio.Card>
        ))}
      </Radio.Group>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radiogroup', { name: 'Default chart' })).toBeInTheDocument()
    const gauge = canvas.getByRole('radio', { name: 'Gauge' })
    await expect(canvas.getByRole('radio', { name: 'Bar' })).toBeInTheDocument()
    await expect(gauge).toHaveAttribute('aria-checked', 'true')
    await expect(getComputedStyle(gauge).borderTopColor).toBe(
      tokenColor('feedback-danger-highlight'),
    )
    await expect(getComputedStyle(gauge).backgroundColor).toBe(
      tokenColor('surface-background-subtle'),
    )
    await expect(getComputedStyle(canvas.getByRole('radio', { name: 'Bar' })).borderTopColor).toBe(
      tokenColor('feedback-danger-highlight'),
    )
  },
}

/**
 * The Playground in dark. No `dark:` class anywhere — the tokens swap — so the
 * same assertions hold, and axe checks the contrast in this theme too.
 */
export const Dark: Story = {
  ...Playground,
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement).toHaveClass('dark')
    await expectSurfaces(within(canvasElement), 'Line')
  },
}
