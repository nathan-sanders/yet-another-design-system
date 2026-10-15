import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Heading, type HeadingLevel } from './Heading'
import { Text } from './Text'

const levels = [1, 2, 3, 4, 5, 6] as const

const meta = {
  title: 'Components/Heading',
  component: Heading,
  argTypes: {
    level: { control: 'inline-radio', options: levels },
    size: {
      control: 'select',
      options: [undefined, 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
    },
    weight: { control: 'inline-radio', options: ['normal', 'semibold', 'bold'] },
    color: {
      control: 'select',
      options: ['emphasized', 'primary', 'subtle', 'danger', 'inverse', 'inherit'],
    },
    truncate: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    level: 2,
    children: 'Project settings',
  },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

/** One heading with controls. Leave `size` empty to see the size its level picks. */
export const Playground: Story = {}

/** Each size its level draws at — the default, when `size` is not given. */
const EXPECTED: Record<HeadingLevel, [number, number]> = {
  1: [24, 32],
  2: [18, 32],
  3: [16, 28],
  4: [14, 24],
  5: [14, 24],
  6: [12, 20],
}

/**
 * All six levels at their default sizes. The test checks the element is the
 * level — that is what a screen reader lists — as well as the size it drew at.
 */
export const Levels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      {levels.map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const level of levels) {
      const heading = canvas.getByRole('heading', { level })
      await expect(heading.tagName).toBe(`H${level}`)
      const style = getComputedStyle(heading)
      const [px, lh] = EXPECTED[level]
      await expect(style.fontSize).toBe(`${px}px`)
      await expect(style.lineHeight).toBe(`${lh}px`)
      await expect(style.fontWeight).toBe('600')
    }
  },
}

/**
 * The level and the size are separate. A dialog's title is the page's second
 * level but draws at body size; a dashboard's hero number sits under a small
 * heading that is still an `<h3>`.
 */
export const LevelIsNotSize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Heading level={2} size="base" data-testid="small-h2">
          Delete this project?
        </Heading>
        <Text color="subtle">An h2, drawn at text-base — how a dialog titles itself.</Text>
      </div>
      <div className="flex flex-col gap-1">
        <Heading level={3} size="sm" color="subtle">
          Monthly revenue
        </Heading>
        <Text size="2xl" weight="semibold" color="emphasized">
          $48,210
        </Text>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const h2 = canvas.getByTestId('small-h2')
    await expect(h2.tagName).toBe('H2')
    await expect(getComputedStyle(h2).fontSize).toBe('14px')
  },
}
