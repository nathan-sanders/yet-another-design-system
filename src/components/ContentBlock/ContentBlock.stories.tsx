import { Fragment } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, ArrowUpRight, Ellipsis, Eye, Info, TrendingUp, Users } from 'lucide-react'

import { ContentBlock, type ContentBlockEmphasis } from './ContentBlock'
import { Badge } from '../Badge'
import { Button } from '../Button'

const emphases = ['default', 'subtle', 'accent'] as const

const meta = {
  title: 'Components/ContentBlock',
  component: ContentBlock,
  argTypes: {
    emphasis: { control: 'select', options: emphases },
    floating: { control: 'boolean' },
    headingLevel: { control: 'select', options: [2, 3, 4, 5, 6] },
  },
  args: {
    emphasis: 'default',
    floating: false,
    headingLevel: 3,
    // `children` is required on the component, so the meta has to carry one for
    // `satisfies Meta` to hold. Every story below renders its own.
    children: null,
  },
} satisfies Meta<typeof ContentBlock>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One block, with controls — use the Theme switch in the toolbar for dark mode.
 *
 * The block is a container: the metric inside it is ordinary content, not
 * something the component draws. That is the line this component holds, and it
 * is why one block can be a number, a chart or a list without gaining a prop.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-100">
      <ContentBlock {...args}>
        <ContentBlock.Header
          icon={Users}
          titleSlot={<Badge color="green" startIcon={TrendingUp}>13.5%</Badge>}
          actions={
            <Button
              appearance={args.emphasis === 'accent' ? 'overlay' : 'ghost'}
              startIcon={Ellipsis}
              aria-label="Block options"
            />
          }
        >
          Total followers
        </ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-4xl font-semibold">3.5k</p>
          <p className="text-sm opacity-70">In the last 30 days</p>
        </ContentBlock.Content>
      </ContentBlock>
    </div>
  ),
}

/**
 * The `emphasis` axis against `floating`. Figma draws the top row only; `subtle`
 * and `accent` are code-first, and exist because a bento view needs a way to say
 * which compartment matters most that is not just "make it bigger".
 *
 * Every colour here is a semantic token pair, so the whole grid works in dark
 * mode with no `dark:` class anywhere — switch the Theme toolbar and nothing
 * below changes but the tokens.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    // A grid, not a <table>: ContentBlock is `w-full` and takes its width from
    // its container, and an auto-layout table cell has none to give — the same
    // trap Banner's story documents.
    <div className="grid w-fit grid-cols-[max-content_repeat(2,18rem)] items-start gap-x-6 gap-y-3">
      <span />
      <span className="text-sm text-content-subtle">Floating off</span>
      <span className="text-sm text-content-subtle">Floating on</span>

      {emphases.map((emphasis) => (
        <Fragment key={emphasis}>
          <span className="text-sm text-content-subtle">{emphasis}</span>
          {[false, true].map((floating) => (
            <ContentBlock key={String(floating)} emphasis={emphasis} floating={floating}>
              <ContentBlock.Header>Block header</ContentBlock.Header>
              <ContentBlock.Content>
                <p className="text-2xl font-semibold">3.5k</p>
              </ContentBlock.Content>
            </ContentBlock>
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

/**
 * The header's slots, which Figma models as booleans. Reading left to right:
 * the `icon`, the heading, the `titleSlot` — anything that belongs *with* the
 * title, usually a delta Badge — and then `actions`, pushed to the right edge.
 *
 * The last block has no header at all. `ContentBlock.Content` notices it is the
 * first child and puts back the 16px of top padding the header would otherwise
 * have supplied.
 */
export const HeaderAnatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-fit grid-cols-[max-content_18rem] items-center gap-x-6 gap-y-3">
      <span className="text-sm text-content-subtle">Title only</span>
      <ContentBlock>
        <ContentBlock.Header>Engagement rate</ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
        </ContentBlock.Content>
      </ContentBlock>

      <span className="text-sm text-content-subtle">With icon</span>
      <ContentBlock>
        <ContentBlock.Header icon={Info}>Engagement rate</ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
        </ContentBlock.Content>
      </ContentBlock>

      <span className="text-sm text-content-subtle">With title slot</span>
      <ContentBlock>
        <ContentBlock.Header
          titleSlot={<Badge color="green" startIcon={TrendingUp}>0.6%</Badge>}
        >
          Engagement rate
        </ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
        </ContentBlock.Content>
      </ContentBlock>

      <span className="text-sm text-content-subtle">With actions</span>
      <ContentBlock>
        <ContentBlock.Header
          actions={
            <Button
              appearance="ghost"
              startIcon={ArrowUpRight}
              aria-label="Open engagement report"
            />
          }
        >
          Engagement rate
        </ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
        </ContentBlock.Content>
      </ContentBlock>

      <span className="text-sm text-content-subtle">Everything</span>
      <ContentBlock>
        <ContentBlock.Header
          icon={Info}
          titleSlot={<Badge color="green">0.6%</Badge>}
          actions={
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="Block options"
            />
          }
        >
          Engagement rate
        </ContentBlock.Header>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
        </ContentBlock.Content>
      </ContentBlock>

      <span className="text-sm text-content-subtle">No header</span>
      <ContentBlock>
        <ContentBlock.Content>
          <p className="text-2xl font-semibold">3.9%</p>
          <p className="text-sm text-content-subtle">Engagement rate, last 30 days</p>
        </ContentBlock.Content>
      </ContentBlock>
    </div>
  ),
}

/**
 * A long title wraps and grows the header rather than pushing the actions off
 * the edge — the header is `min-h-12`, not `h-12`, and the title group is
 * `min-w-0`. Both blocks below are the same component at the same width.
 */
export const LongTitle: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-fit grid-cols-2 items-start gap-6">
      {['Reach', 'Average engagement rate across every connected page'].map((heading) => (
        <div key={heading} className="w-64">
          <ContentBlock>
            <ContentBlock.Header
              icon={Eye}
              actions={
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label="Block options"
                />
              }
            >
              {heading}
            </ContentBlock.Header>
            <ContentBlock.Content>
              <p className="text-2xl font-semibold">3.9%</p>
            </ContentBlock.Content>
          </ContentBlock>
        </div>
      ))}
    </div>
  ),
}

/**
 * `headingLevel` puts the title in the page outline at the right depth. This
 * story is what makes that visible: the three blocks below sit under an `h2`,
 * so their titles are `h3` — which is the default, and the reason the default
 * is 3.
 *
 * Getting this wrong is an axe `heading-order` failure, not a matter of taste,
 * so the prop exists rather than a guess.
 */
export const HeadingLevels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-100 flex-col gap-4">
      <h2 className="text-lg font-semibold text-content-emphasized">Performance</h2>
      {[
        { level: 3, title: 'Total followers', body: '3.5k' },
        { level: 4, title: 'Reach', body: '2.1k', icon: Eye },
        { level: 4, title: 'Interactions', body: '1.4k', icon: Activity },
      ].map(({ level, title, body, icon }) => (
        <ContentBlock key={title} headingLevel={level as 3 | 4}>
          <ContentBlock.Header icon={icon}>{title}</ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold">{body}</p>
          </ContentBlock.Content>
        </ContentBlock>
      ))}
    </div>
  ),
}

/**
 * Content that should reach the block's edges leaves `ContentBlock.Content` out
 * and goes straight in — a chart, a table, an image. The header keeps its own
 * padding either way.
 *
 * This is the shape that would have needed a `padded={false}` prop if the
 * component were not compound, and is most of why it is.
 */
export const FullBleedContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-100">
      <ContentBlock>
        <ContentBlock.Header>Posts published</ContentBlock.Header>
        {/* A stand-in for a chart: a strip that runs to both borders. */}
        <div className="flex h-24 items-end gap-1 bg-surface-background-subtle px-1 pb-1">
          {[40, 65, 30, 80, 55, 95, 70].map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-sm bg-action-primary-background"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </ContentBlock>
    </div>
  ),
}

/**
 * On the anchor cell, use `appearance="overlay"` for anything in `actions`. A
 * ghost Button's foreground is Action/Ghost — the same stone the accent
 * background is — so it would be invisible; overlay's background is a
 * translucent wash that works on any surface. Banner made this call first, for
 * its four feedback backgrounds.
 */
export const ActionsOnAccent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-fit grid-cols-[max-content_18rem] items-center gap-x-6 gap-y-3">
      {(['ghost', 'overlay'] as const).map((appearance) => (
        <Fragment key={appearance}>
          <span className="text-sm text-content-subtle">{appearance}</span>
          <ContentBlock emphasis="accent">
            <ContentBlock.Header
              actions={
                <Button
                  appearance={appearance}
                  startIcon={Ellipsis}
                  aria-label={`Block options (${appearance})`}
                />
              }
            >
              Total sales
            </ContentBlock.Header>
            <ContentBlock.Content>
              <p className="text-2xl font-semibold">12,847</p>
            </ContentBlock.Content>
          </ContentBlock>
        </Fragment>
      ))}
    </div>
  ),
}

/**
 * Emphasis exists to be used sparingly: one accent block in a view, and the
 * eye goes there first. Three of them, and it goes nowhere.
 *
 * This story shows the working version — the anchor plus its neighbours, all at
 * the same size, so the only thing separating them is the surface. Vary the
 * sizes too and you have a bento layout; see `BentoGrid`.
 */
export const EmphasisInContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-3xl grid-cols-3 gap-4">
      {(
        [
          { title: 'Total sales', value: '12,847', emphasis: 'accent' },
          { title: 'Active customers', value: '5,689', emphasis: 'default' },
          { title: 'Refund requests', value: '274', emphasis: 'subtle' },
        ] as const
      ).map(({ title, value, emphasis }) => (
        <ContentBlock key={title} emphasis={emphasis as ContentBlockEmphasis}>
          <ContentBlock.Header>{title}</ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm opacity-70">vs. last week</p>
          </ContentBlock.Content>
        </ContentBlock>
      ))}
    </div>
  ),
}
