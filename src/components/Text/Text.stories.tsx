import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Text } from './Text'
import { Heading } from './Heading'
import { Card } from '../Card'
import { Badge } from '../Badge'
import { Button } from '../Button'

const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const
const weights = ['normal', 'semibold', 'bold'] as const
const colors = ['primary', 'subtle', 'emphasized', 'danger', 'inverse', 'inherit'] as const

/** The px each size should render at, and its line height — Figma's text styles, read from the file. */
const FIGMA: Record<(typeof sizes)[number], [number, number]> = {
  xs: [10, 16],
  sm: [12, 20],
  base: [14, 24],
  lg: [16, 28],
  xl: [18, 32],
  '2xl': [24, 32],
  '3xl': [30, 36],
  '4xl': [36, 40],
  '5xl': [48, 48],
  '6xl': [60, 60],
}

/** A token's computed color, through the same serializer the element's goes through. */
function tokenColor(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

const meta = {
  title: 'Components/Text',
  component: Text,
  argTypes: {
    size: { control: 'select', options: sizes },
    weight: { control: 'inline-radio', options: weights },
    color: { control: 'select', options: colors },
    mono: { control: 'boolean' },
    italic: { control: 'boolean' },
    truncate: { control: 'number' },
    children: { control: 'text' },
  },
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

/** One run of text with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/**
 * Every size at every weight — the same grid as Figma's text styles, named the
 * same way. The test measures each one against the file's px and line height,
 * because a size that resolved to nothing would still render, at the inherited
 * 16px, and look entirely deliberate.
 */
export const Scale: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex items-baseline gap-6">
          <Text render={<span />} size="sm" color="subtle" mono className="w-28 shrink-0">
            text-{size}
          </Text>
          {weights.map((weight) => (
            <Text
              key={weight}
              render={<span />}
              size={size}
              weight={weight}
              data-testid={`${size}/${weight}`}
              className="whitespace-nowrap"
            >
              {weight}
            </Text>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await step('every size is the Figma text style, size and line height together', async () => {
      for (const size of sizes) {
        const style = getComputedStyle(canvas.getByTestId(`${size}/normal`))
        const [px, lh] = FIGMA[size]
        await expect(style.fontSize).toBe(`${px}px`)
        await expect(style.lineHeight).toBe(`${lh}px`)
      }
    })
    await step('the three weights are 400, 600 and 700 — nothing falls back', async () => {
      const style = (w: string) => getComputedStyle(canvas.getByTestId(`base/${w}`)).fontWeight
      await expect(style('normal')).toBe('400')
      await expect(style('semibold')).toBe('600')
      await expect(style('bold')).toBe('700')
    })
  },
}

/**
 * The five Content tokens, and `inherit`. `inverse` is shown on the emphasized
 * surface it is for; `inherit` takes the Badge's own foreground, which is the
 * case it exists for.
 */
export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      <Text color="primary" data-testid="primary">Primary — body copy</Text>
      <Text color="subtle" data-testid="subtle">Subtle — supporting text, captions, metadata</Text>
      <Text color="emphasized" data-testid="emphasized">Emphasized — the darkest text, for what leads</Text>
      <Text color="danger" data-testid="danger">Danger — an error said in words</Text>
      <div className="rounded-md bg-surface-background-emphasized px-3 py-2">
        <Text color="inverse" data-testid="inverse">Inverse — on an emphasized surface</Text>
      </div>
      <div>
        <Badge color="blue">
          <Text render={<span />} size="sm" color="inherit" data-testid="inherit">
            Inherit — takes its color from the badge
          </Text>
        </Badge>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const token of ['primary', 'subtle', 'emphasized', 'danger', 'inverse']) {
      await expect(getComputedStyle(canvas.getByTestId(token)).color).toBe(
        tokenColor(`content-${token}`),
      )
    }
    const inherit = canvas.getByTestId('inherit')
    await expect(getComputedStyle(inherit).color).toBe(
      getComputedStyle(inherit.parentElement!).color,
    )
  },
}

/** Geist Mono, for anything a person could type, and italic — Figma's `mono` and `italic` styles. */
export const MonoAndItalic: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Text>
        Your API key ends in{' '}
        <Text render={<span />} mono data-testid="mono">
          sk_live_4eC3
        </Text>
        .
      </Text>
      <Text italic color="subtle" data-testid="italic">
        Last edited by you, a moment ago.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(canvas.getByTestId('mono')).fontFamily).toContain('Geist Mono')
    await expect(getComputedStyle(canvas.getByTestId('italic')).fontStyle).toBe('italic')
  },
}

const LONG =
  'A design system is a set of decisions made once, so that nobody has to make them again on a Tuesday afternoon with a deadline. Every component here exists because the same thing had been built by hand more than once.'

/** One line, then three. The full text stays in the DOM for a screen reader. */
export const Truncate: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Text truncate data-testid="one">
        {LONG}
      </Text>
      <Text truncate={3} color="subtle" data-testid="three">
        {LONG}
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const one = canvas.getByTestId('one')
    await expect(one.getBoundingClientRect().height).toBe(24)
    await expect(getComputedStyle(one).textOverflow).toBe('ellipsis')
    // Three lines of text-base is 3 × 24.
    await expect(canvas.getByTestId('three').getBoundingClientRect().height).toBe(72)
    await expect(one).toHaveTextContent(LONG)
  },
}

/**
 * The two together on the surface they usually sit on — what the hand-written
 * `<h2 className="text-lg font-semibold">` and `<p className="text-sm
 * text-content-subtle">` pairs across the stories become.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="flex w-96 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Heading level={2}>Invite your team</Heading>
        <Text color="subtle">
          Everyone you invite can view and edit every project in this workspace.
        </Text>
      </div>
      <Text size="sm" color="subtle">
        3 of 10 seats used
      </Text>
      <div>
        <Button>Send invites</Button>
      </div>
    </Card>
  ),
}
