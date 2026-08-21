import { Fragment } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpRight, Ellipsis, Eye, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react'

import { BentoGrid } from './BentoGrid'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'

const columns = [2, 3, 4] as const

const meta = {
  title: 'Components/BentoGrid',
  component: BentoGrid,
  argTypes: {
    columns: { control: 'inline-radio', options: columns },
    gap: { control: 'inline-radio', options: ['default', 'loose'] },
  },
  args: {
    columns: 4,
    gap: 'default',
    children: null,
  },
} satisfies Meta<typeof BentoGrid>

export default meta
type Story = StoryObj<typeof meta>

/** A tile with a number in it, so the stories below are about the layout. */
function Tile({ title, value, span }: { title: string; value: string; span?: string }) {
  return (
    <ContentBlock>
      <ContentBlock.Header>{title}</ContentBlock.Header>
      <ContentBlock.Content>
        <p className="text-2xl font-semibold text-content-emphasized">{value}</p>
        {span && <p className="text-sm text-content-subtle">{span}</p>}
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The grid with controls — change `columns` and `gap`, and narrow the canvas
 * past 768px to watch the whole thing become one column.
 *
 * The anchor cell is the only one with a `BentoGrid.Cell` around it. A block
 * that covers one column needs no cell; it goes straight in.
 */
export const Playground: Story = {
  render: (args) => (
    <BentoGrid {...args}>
      <BentoGrid.Cell colSpan={2} rowSpan={2}>
        <ContentBlock emphasis="accent">
          <ContentBlock.Header>Total sales</ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-4xl font-semibold">12,847</p>
            <p className="text-sm opacity-70">+8.2% vs. last week</p>
          </ContentBlock.Content>
        </ContentBlock>
      </BentoGrid.Cell>
      <Tile title="Active customers" value="5,689" />
      <Tile title="Total revenue" value="$87,632" />
      <Tile title="Refund requests" value="274" />
      <Tile title="Orders" value="1,204" />
    </BentoGrid>
  ),
}

/**
 * The `columns` axis. Below `md` every one of these is a single column, which is
 * the whole of the mobile story — the column count and the spans are both
 * written behind the same breakpoint, so a 2-wide cell can never end up in a
 * 1-wide grid.
 */
export const Columns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      {columns.map((count) => (
        <div key={count} className="flex flex-col gap-2">
          <span className="text-sm text-content-subtle">columns={count}</span>
          <BentoGrid columns={count}>
            <BentoGrid.Cell colSpan={2}>
              <Tile title="Anchor" value="12,847" />
            </BentoGrid.Cell>
            {Array.from({ length: count }, (_, index) => (
              <Tile key={index} title={`Tile ${index + 1}`} value="274" />
            ))}
          </BentoGrid>
        </div>
      ))}
    </div>
  ),
}

/**
 * The two gutters — `spacing/4` and `spacing/6`. One value for both axes, so a
 * cell spanning two columns is exactly two tiles plus one gap wide and the
 * mosaic stays on its grid.
 */
export const Gap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      {(['default', 'loose'] as const).map((gap) => (
        <div key={gap} className="flex flex-col gap-2">
          <span className="text-sm text-content-subtle">gap={gap}</span>
          <BentoGrid columns={3} gap={gap}>
            <Tile title="Followers" value="3.5k" />
            <Tile title="Engagement" value="3.9%" />
            <Tile title="Posts" value="350" />
          </BentoGrid>
        </div>
      ))}
    </div>
  ),
}

/**
 * Every span, against a four-column grid. `colSpan` is clamped by CSS at the
 * grid's width, so a cell wider than the grid is not an error — it is just a
 * full-width cell, which reads as a mistake. Keep it at or under `columns`.
 *
 * A `rowSpan` covers content-sized rows plus the gutter between them: the grid
 * deliberately does not equalise row heights, because a dashboard's rows are
 * genuinely different sizes.
 */
export const Spans: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">colSpan</span>
        <BentoGrid>
          {([1, 2, 3, 4] as const).map((colSpan) => (
            <Fragment key={colSpan}>
              <BentoGrid.Cell colSpan={colSpan}>
                <Tile title={`colSpan=${colSpan}`} value="—" />
              </BentoGrid.Cell>
              {/* Filler so each span starts its own row and can be read. */}
              {Array.from({ length: 4 - colSpan }, (_, index) => (
                <div key={index} />
              ))}
            </Fragment>
          ))}
        </BentoGrid>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">rowSpan</span>
        <BentoGrid columns={3}>
          <BentoGrid.Cell rowSpan={2}>
            <Tile title="rowSpan=2" value="—" />
          </BentoGrid.Cell>
          <BentoGrid.Cell rowSpan={3}>
            <Tile title="rowSpan=3" value="—" />
          </BentoGrid.Cell>
          <Tile title="Tile" value="—" />
          <Tile title="Tile" value="—" />
          <Tile title="Tile" value="—" />
        </BentoGrid>
      </div>
    </div>
  ),
}

/**
 * A dashboard — seven blocks, which is inside the nine a bento view should stay
 * under. Everything the pattern asks for is visible here at once:
 *
 * - **Compartmentalisation** — every figure has its own bordered cell.
 * - **Hierarchy** — the anchor is 2x2 *and* `emphasis="accent"`; size and
 *   surface pull the same way rather than competing.
 * - **Chunking** — the two platform figures share one block instead of taking a
 *   cell each, because they answer the same question.
 * - **Restraint** — seven cells, one accent, one chart.
 *
 * Every scale in here is at its default, per the house rule — including the
 * icon-only Buttons, which were `small` at first on the assumption that a 48px
 * header row was tight. It is not: the row is `min-h-12` with 8px of padding
 * either side, so it has exactly 32px of room, and a default Button is `h-8`.
 */
export const Dashboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-content-emphasized">Overview</h2>

      <BentoGrid columns={4}>
        <BentoGrid.Cell colSpan={2} rowSpan={2}>
          <ContentBlock emphasis="accent" headingLevel={3}>
            <ContentBlock.Header
              icon={ShoppingCart}
              actions={
                <Button
                  appearance="overlay"
                  startIcon={ArrowUpRight}
                  aria-label="Open the sales report"
                />
              }
            >
              Total sales
            </ContentBlock.Header>
            <ContentBlock.Content>
              <p className="text-5xl font-semibold">12,847</p>
              <p className="text-sm opacity-70">+8.2% vs. last week</p>
              <div className="mt-4 flex gap-6 border-t border-current/20 pt-4">
                <div>
                  <p className="text-xl font-semibold">308</p>
                  <p className="text-sm opacity-70">Shopify</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">274</p>
                  <p className="text-sm opacity-70">Amazon</p>
                </div>
              </div>
            </ContentBlock.Content>
          </ContentBlock>
        </BentoGrid.Cell>

        <ContentBlock>
          <ContentBlock.Header
            icon={Users}
            titleSlot={
              <Badge color="green" startIcon={TrendingUp}>
                2.2%
              </Badge>
            }
          >
            Customers
          </ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold text-content-emphasized">5,689</p>
            <p className="text-sm text-content-subtle">Active this month</p>
          </ContentBlock.Content>
        </ContentBlock>

        <ContentBlock>
          <ContentBlock.Header
            icon={Wallet}
            titleSlot={
              <Badge color="green" startIcon={TrendingUp}>
                8.2%
              </Badge>
            }
          >
            Revenue
          </ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold text-content-emphasized">$87,632</p>
            <p className="text-sm text-content-subtle">Net of refunds</p>
          </ContentBlock.Content>
        </ContentBlock>

        <ContentBlock emphasis="subtle">
          <ContentBlock.Header icon={Eye}>Sessions</ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold text-content-emphasized">42.1k</p>
            <p className="text-sm text-content-subtle">Last 30 days</p>
          </ContentBlock.Content>
        </ContentBlock>

        <ContentBlock emphasis="subtle">
          <ContentBlock.Header>Refunds</ContentBlock.Header>
          <ContentBlock.Content>
            <p className="text-2xl font-semibold text-content-emphasized">274</p>
            <p className="text-sm text-content-subtle">1.0% of orders</p>
          </ContentBlock.Content>
        </ContentBlock>

        <BentoGrid.Cell colSpan={3}>
          <ContentBlock>
            <ContentBlock.Header
              actions={
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label="Chart options"
                />
              }
            >
              Profit, month by month
            </ContentBlock.Header>
            {/* No ContentBlock.Content: the chart runs to the block's edges. */}
            <div className="flex h-40 flex-1 items-end gap-2 px-4 pb-4">
              {[35, 62, 48, 30, 55, 92, 44, 78, 40, 66, 52, 84].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm bg-action-primary-background"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </ContentBlock>
        </BentoGrid.Cell>

        <ContentBlock>
          <ContentBlock.Header>Top products</ContentBlock.Header>
          <ContentBlock.Content>
            {[
              ['Wallet', '$310'],
              ['Sunglasses', '$210'],
              ['Bag', '$170'],
              ['Watch', '$299'],
            ].map(([name, price]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-content-primary">{name}</span>
                <span className="font-semibold text-content-emphasized">{price}</span>
              </div>
            ))}
          </ContentBlock.Content>
        </ContentBlock>
      </BentoGrid>
    </div>
  ),
}
