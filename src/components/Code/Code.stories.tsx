import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { Code } from './Code'
import { Text } from '../Text'

/** The value a token resolves to, read through the same path the element's own color takes. */
function tokenColor(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

const meta = {
  title: 'Components/Code',
  component: Code,
  argTypes: {
    children: { control: 'text' },
    color: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['sm', 'base', 'lg'] },
  },
  args: {
    children: 'useState',
  },
} satisfies Meta<typeof Code>

export default meta
type Story = StoryObj<typeof meta>

/** One inline code run with controls. */
export const Playground: Story = {}

/**
 * Figma's six variants: two colors across three sizes. Each size is a type
 * step — `text-sm/mono`, `text-base/mono`, `text-lg/mono` — and sets its own
 * line height, so the box is 20, 24 and 28px tall with no vertical padding.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-fit grid-cols-[auto_auto_auto_auto] items-center gap-x-8 gap-y-4">
      <span />
      {(['sm', 'base', 'lg'] as const).map((size) => (
        <Text key={size} size="sm" color="subtle">
          {size}
        </Text>
      ))}
      {(['primary', 'secondary'] as const).map((color) => (
        <div key={color} className="contents">
          <Text size="sm" color="subtle">
            {color}
          </Text>
          {(['sm', 'base', 'lg'] as const).map((size) => (
            <div key={size}>
              <Code color={color} size={size} data-variant={`${color}-${size}`}>
                useState
              </Code>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const heights = { sm: 20, base: 24, lg: 28 }
    for (const color of ['primary', 'secondary'] as const) {
      for (const size of ['sm', 'base', 'lg'] as const) {
        const code = canvasElement.querySelector<HTMLElement>(`[data-variant="${color}-${size}"]`)!
        const style = getComputedStyle(code)
        // Geist Mono by the component's own class, not only Preflight's.
        await expect(code.className).toContain('font-mono')
        await expect(style.fontFamily).toContain('Geist Mono')
        await expect(code.getBoundingClientRect().height).toBe(heights[size])
        await expect([style.paddingLeft, style.paddingRight, style.paddingTop]).toEqual([
          '4px',
          '4px',
          '0px',
        ])
        await expect(style.borderRadius).toBe('4px')
        await expect(style.backgroundColor).toBe(tokenColor('surface-overlay-subtle'))
        await expect(style.color).toBe(
          tokenColor(color === 'primary' ? 'content-primary' : 'content-subtle'),
        )
      }
    }
  },
}

/**
 * Figma's Preview: code inside sentences, one step below the prose — `sm` in
 * `text-base`, `secondary` in subtle helper copy. A long path wraps with the
 * column instead of pushing past the edge — inside its own box, because Code is
 * for short references and a box one line tall is what the file draws.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-140 flex-col gap-4">
      <Text render={<p />}>
        Call <Code>useState</Code> at the top of a component to add a state variable. It hands back
        the current value and a <Code>setCount</Code> function that updates it.
      </Text>
      <Text render={<p />}>
        Run <Code>npm run dev</Code> to start the local server, then edit <Code>src/App.tsx</Code>{' '}
        and save to see the change.
      </Text>
      <Text render={<p />} size="sm" color="subtle">
        Needs <Code color="secondary">node 20</Code> or later. Set{' '}
        <Code color="secondary">VITE_API_URL</Code> in your env file before the first build.
      </Text>
      <Text render={<p />} size="lg">
        At <Code size="base">text-lg</Code>, reach for{' '}
        <Code size="base">size=&quot;base&quot;</Code>.
      </Text>
      <div className="w-60">
        <Text render={<p />}>
          The config lives in{' '}
          <Code data-testid="long">src/components/CodeBlock/CodeBlock.stories.tsx</Code> for now.
        </Text>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The long path breaks rather than overflowing its 240px column.
    const long = canvasElement.querySelector<HTMLElement>('[data-testid="long"]')!
    await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(240)
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(20)
    await expect(long.parentElement!.scrollWidth).toBeLessThanOrEqual(240)
  },
}
