import type { Meta, StoryObj } from '@storybook/react-vite'

import { Divider } from './Divider'

const orientations = ['horizontal', 'vertical'] as const
const lineStyles = ['solid', 'dashed'] as const
const emphases = ['default', 'emphasized'] as const

const meta = {
  title: 'Components/Divider',
  component: Divider,
  argTypes: {
    orientation: { control: 'inline-radio', options: orientations },
    lineStyle: { control: 'inline-radio', options: lineStyles },
    emphasis: { control: 'inline-radio', options: emphases },
  },
  args: {
    orientation: 'horizontal',
    lineStyle: 'solid',
    emphasis: 'default',
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

/**
 * All three props with controls — use the Theme switch in the toolbar for dark
 * mode. The vertical orientation is shown inside a flex row so `self-stretch`
 * has something to stretch against.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="flex h-24 max-w-md items-center">
      <Divider {...args} />
    </div>
  ),
}

/**
 * The whole Figma component set (node 40002032:610) — all eight variants, laid
 * out the way the Figma frame is: Emphasis across, Orientation × Line Style down.
 * Every one is a 1px line.
 *
 * Dashed is drawn with a repeating gradient rather than `border-dashed`, because
 * Figma specifies `stroke-dasharray="4 4"` — 4px on, 4px off — and CSS leaves the
 * dash length up to the browser.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-4">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Orientation and line style</span>
          </th>
          {emphases.map((emphasis) => (
            <th
              key={emphasis}
              className="text-left text-sm font-normal text-content-subtle capitalize"
            >
              {emphasis}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orientations.flatMap((orientation) =>
          lineStyles.map((lineStyle) => (
            <tr key={`${orientation}-${lineStyle}`}>
              <td className="text-sm text-content-subtle capitalize whitespace-nowrap">
                {orientation} · {lineStyle}
              </td>
              {emphases.map((emphasis) => (
                <td key={emphasis}>
                  <div className="flex h-10 w-40 items-center">
                    <Divider orientation={orientation} lineStyle={lineStyle} emphasis={emphasis} />
                  </div>
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
  ),
}

/**
 * Weight. `default` is Surface/Border — the quiet line that separates related
 * content. `emphasized` is Surface/Border/Emphasized, for a boundary that should
 * read as a real edge rather than a hint.
 *
 * The idea came from Astryx, which calls it subtle/strong. Figma had no weight
 * property when this was built, but the tokens for both already existed — so it
 * was a gap in the file rather than an invention, and `Emphasis` has since been
 * added there, the same way Badge's four missing hues were.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      {emphases.map((emphasis) => (
        <div key={emphasis} className="flex flex-col gap-3">
          <span className="text-sm text-content-subtle capitalize">{emphasis}</span>
          {lineStyles.map((lineStyle) => (
            <Divider key={lineStyle} lineStyle={lineStyle} emphasis={emphasis} />
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Where dividers actually go. Horizontal lines break a card into sections;
 * vertical lines separate figures sitting side by side.
 *
 * The vertical dividers here are the point of `self-stretch`: none of them is
 * given a height, and each one ends up exactly as tall as the row of stats.
 * Reach for spacing and layout first — a divider earns its place only when
 * whitespace alone leaves the grouping ambiguous.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface-background-primary p-4 shadow-low">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-content-primary">Order summary</span>
          <span className="text-sm text-content-subtle">3 items</span>
        </div>

        <Divider />

        <div className="flex flex-col gap-2 text-sm text-content-primary">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>$127.00</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$7.99</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>$10.16</span>
          </div>
        </div>

        <Divider emphasis="emphasized" />

        <div className="flex justify-between text-base font-semibold text-content-primary">
          <span>Total</span>
          <span>$145.15</span>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-lg border border-surface-border bg-surface-background-primary p-4 shadow-low">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-content-subtle">Revenue</span>
          <span className="text-xl font-semibold text-content-primary">$24,500</span>
        </div>

        <Divider orientation="vertical" />

        <div className="flex flex-col gap-1">
          <span className="text-sm text-content-subtle">Users</span>
          <span className="text-xl font-semibold text-content-primary">1,240</span>
        </div>

        <Divider orientation="vertical" />

        <div className="flex flex-col gap-1">
          <span className="text-sm text-content-subtle">Conversion</span>
          <span className="text-xl font-semibold text-content-primary">3.2%</span>
        </div>
      </div>
    </div>
  ),
}
