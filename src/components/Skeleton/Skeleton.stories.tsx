import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Skeleton } from './Skeleton'
import type { SkeletonTextSize } from './Skeleton'

import { Card } from '../Card'
import { Table } from '../Table'

const appearances = ['default', 'subtle'] as const
const sizes = ['sm', 'base', 'lg', 'xl'] as const

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  argTypes: {
    appearance: { control: 'inline-radio', options: appearances },
    inverse: { control: 'boolean' },
  },
  args: {
    appearance: 'default',
    inverse: false,
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Both props with controls, at the 160×24 Figma draws the component — use the
 * Theme switch in the toolbar for dark mode. The inverse pair is shown on
 * `surface-background-emphasized`, which is what `inverse` is for.
 *
 * The pulse is the `skeleton-pulse` keyframe: opacity 1 → 0.5 and back,
 * `duration-slow` (975ms) each way with `alternate`, so one full breath is
 * 1950ms. That is shadcn's 2s pulse to within 2.5%, spelled as a token.
 */
export const Playground: Story = {
  render: (args) => (
    <div
      className={
        args.inverse
          ? 'inline-flex rounded-md bg-surface-background-emphasized p-4'
          : 'inline-flex p-4'
      }
    >
      <Skeleton {...args} className="h-6 w-40" data-testid="skeleton" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const skeleton = canvas.getByTestId('skeleton')
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true')

    const animations = skeleton.getAnimations()
    await expect(animations).toHaveLength(1)
    const [pulse] = animations as CSSAnimation[]
    await expect(pulse.animationName).toBe('skeleton-pulse')
    const timing = pulse.effect!.getTiming()
    await expect(timing.duration).toBe(975)
    await expect(timing.iterations).toBe(Infinity)
    await expect(timing.direction).toBe('alternate')
    // A CSS animation's timing function is applied per keyframe, so the
    // effect's own `easing` reads `linear` whatever the stylesheet says.
    await expect((pulse.effect as KeyframeEffect).getKeyframes()[0].easing).toBe('ease-in-out')
  },
}

/**
 * The whole Figma component set (node 40005222:44292) — Appearance across,
 * Inverse down. Every cell is `Content/Primary` (or `Content/Inverse`) at the
 * opacity Figma sets on the node: 20 / 10% upright, 30 / 20% inverse. The
 * inverse pair sits on `surface-background-emphasized` so the white has
 * something to read against.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-4">
      <thead>
        <tr>
          <th>
            <span className="sr-only">Inverse</span>
          </th>
          {appearances.map((appearance) => (
            <th
              key={appearance}
              className="text-left text-sm font-normal text-content-subtle capitalize"
            >
              {appearance}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[false, true].map((inverse) => (
          <tr key={String(inverse)}>
            <td className="text-sm text-content-subtle whitespace-nowrap">
              {inverse ? 'Inverse' : 'Upright'}
            </td>
            {appearances.map((appearance) => (
              <td key={appearance}>
                <div
                  className={
                    inverse
                      ? 'inline-flex rounded-md bg-surface-background-emphasized p-4'
                      : 'inline-flex p-4'
                  }
                >
                  <Skeleton appearance={appearance} inverse={inverse} className="h-6 w-40" />
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

const sample: Record<SkeletonTextSize, string> = {
  sm: 'text-sm — 12 on 20',
  base: 'text-base — 14 on 24',
  lg: 'text-lg — 16 on 28',
  xl: 'text-xl — 18 on 32',
}

// Spelled out rather than `text-${size}`: Tailwind only generates a class it
// can read whole in the source.
const textClass: Record<SkeletonTextSize, string> = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

/**
 * `Skeleton.Text`, the Figma set "Skeleton - Text" (node 40005222:44301): a
 * line of text at each of the four sizes, and beside it the skeleton that
 * stands in for one. The box is the size's line-height and the bar inside it
 * is the font-size, so the two columns are the same height row for row — a
 * stack of these takes exactly the space the paragraph will.
 *
 * `base` is the default, because `text-base` is the body size.
 */
export const Text: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} className="grid grid-cols-2 items-start gap-6">
          <span className={`${textClass[size]} text-content-primary`}>{sample[size]}</span>
          <Skeleton.Text size={size} data-testid={`text-${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const expected: Record<SkeletonTextSize, [box: number, bar: number]> = {
      sm: [20, 12],
      base: [24, 14],
      lg: [28, 16],
      xl: [32, 18],
    }
    for (const size of sizes) {
      const box = canvas.getByTestId(`text-${size}`)
      const bar = box.firstElementChild as HTMLElement
      await expect(box.getBoundingClientRect().height).toBe(expected[size][0])
      await expect(bar.getBoundingClientRect().height).toBe(expected[size][1])
      // The box is the same height as the real line beside it.
      const line = canvas.getByText(sample[size])
      await expect(line.getBoundingClientRect().height).toBe(expected[size][0])
    }
  },
}

/**
 * Size and shape come from `className`, as in shadcn. The recipe's `rounded-xs`
 * is a default, not a rule: `rounded-full` on a square makes an avatar, and
 * `cn` merges the two so the caller's radius wins.
 */
export const Shapes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <Skeleton className="size-9 rounded-full" data-testid="circle" />
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-24 w-40 rounded-lg" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const circle = within(canvasElement).getByTestId('circle')
    await expect(getComputedStyle(circle).borderRadius).toBe('9999px')
  },
}

/**
 * A profile card and a table, both still loading. Every placeholder matches
 * the shape of what will replace it: a 36px circle for the base Avatar, a
 * `Skeleton.Text` per line at the size that line will be, and one per cell in
 * the table — which is where `Table`'s record parked this component.
 *
 * The skeletons themselves are `aria-hidden`; the *region* says it is loading.
 * `aria-busy` on the container plus a visually hidden "Loading…" is the whole
 * of it, and the skeletons are removed — not hidden — once the content lands.
 *
 * The card's lines are fractions (`w-2/5`) and the table's are fixed (`w-28`),
 * and the difference is not taste. A percentage needs a parent with a width,
 * and `Table.Cell` wraps its content in a flex item that hugs — so `w-4/5`
 * there measures 0px and the cell looks empty. Inside a cell, say the width.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-6" aria-busy="true">
      <span className="sr-only">Loading…</span>

      <Card>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Skeleton.Text className="w-2/5" />
            <Skeleton.Text size="sm" appearance="subtle" className="w-3/5" />
          </div>
        </div>
        <div className="flex flex-col">
          <Skeleton.Text />
          <Skeleton.Text />
          <Skeleton.Text className="w-4/5" />
        </div>
      </Card>

      <div
        tabIndex={0}
        role="region"
        aria-label="Members"
        className="overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary"
      >
        <table className="w-full table-fixed border-separate border-spacing-0 font-sans">
          <caption className="sr-only">Members</caption>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head align="right">Seats</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[0, 1, 2, 3].map((row) => (
              <Table.Row key={row}>
                <Table.Cell>
                  <Skeleton.Text className="w-28" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton.Text appearance="subtle" className="w-20" />
                </Table.Cell>
                <Table.Cell align="right">
                  <Skeleton.Text className="w-8" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </table>
      </div>
    </div>
  ),
}
