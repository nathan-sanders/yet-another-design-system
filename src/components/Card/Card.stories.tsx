import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ellipsis, Heart, MessageCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { expect, within } from 'storybook/test'

import { Card } from './Card'
import type { CardEmphasis } from './styles'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Text } from '../Text'

const emphases = ['default', 'subtle', 'accent'] as const
const paddings = [0, 2, 3, 4] as const

const meta = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    emphasis: { control: 'select', options: emphases },
    floating: { control: 'boolean' },
    padding: { control: 'select', options: paddings },
    selected: { control: 'boolean' },
  },
  args: {
    emphasis: 'default',
    floating: false,
    padding: 3,
    // `children` is required on the component, so the meta has to carry one for
    // `satisfies Meta` to hold. Every story below renders its own.
    children: null,
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One card, with controls — use the Theme switch in the toolbar for dark mode.
 *
 * The card is a container and nothing else: the title and the copy inside it are
 * ordinary content, not something the component draws. Figma's anatomy is a
 * single `Content` slot, so there is no `Card.Header` to reach for. If you want
 * a titled region with actions in its corner, that is `ContentBlock`.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-80">
      <Card {...args}>
        <Text weight="semibold" color="inherit">Card Title</Text>
        <p className={args.emphasis === 'accent' ? 'opacity-80' : 'text-content-subtle'}>
          Card content goes here. This is a flexible container for organizing related information.
        </p>
      </Card>
    </div>
  ),
}

/**
 * The three surfaces, on the canvas.
 *
 * **`subtle` is invisible here, and that is the finding rather than a bug.**
 * `--surface-background-subtle` and `--surface-canvas` are the same stone in both
 * themes, and unlike `ContentBlock` the card binds its border to its own fill —
 * so there is no outline left to see it by. It is a well, meant for use inside
 * another surface; `InsideContentBlock` below is where it does its job.
 */
export const Emphasis: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-200 gap-3 sm:grid-cols-3">
      {emphases.map((emphasis) => (
        <Card key={emphasis} emphasis={emphasis}>
          <Text weight="semibold" color="inherit">Card Title</Text>
          <p className={emphasis === 'accent' ? 'opacity-80' : 'text-content-subtle'}>
            Card content goes here. This is a flexible container for organizing related
            information.
          </p>
        </Card>
      ))}
    </div>
  ),
}

/**
 * `floating` adds Figma's Elevation/Drop Shadow/Low. Raise a card only when it
 * has to sit above what is around it — a card that floats for decoration is a
 * card that has spent the one signal it had.
 */
export const Floating: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-140 gap-3 sm:grid-cols-2">
      {[false, true].map((floating) => (
        <Card key={String(floating)} floating={floating}>
          <Text weight="semibold" color="inherit">{floating ? 'floating' : 'flat'}</Text>
          <Text color="subtle">
            {floating ? 'Lifted off the surface below it.' : 'Sits on the surface below it.'}
          </Text>
        </Card>
      ))}
    </div>
  ),
}

/**
 * The padding scale, named by the spacing token step — `padding={4}` binds what
 * `spacing/4` binds, so a designer overriding an instance in Figma and a caller
 * writing this prop are saying the same word.
 *
 * `3` is what the file draws. Figma gets no `Padding` variant: it has no numeric
 * property kind, and a string axis would take this set from 6 variants to 24.
 * The override lives on the instance and is always a token rebind.
 */
export const Padding: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-200 gap-3 sm:grid-cols-2">
      {paddings.map((padding) => (
        <Card key={padding} padding={padding}>
          <Text weight="semibold" color="inherit">padding={`{${padding}}`}</Text>
          <Text color="subtle">
            {padding === 0
              ? 'spacing/0 — content reaches the border. See FullBleed below.'
              : `spacing/${padding} — ${padding * 4}px on every side.`}
          </Text>
        </Card>
      ))}
    </div>
  ),
}

/**
 * `padding={0}` is the one step with a structural job: content that has to
 * reach the card's edges. `ContentBlock` solves this by letting you leave out
 * `ContentBlock.Content`; a single-slot card has no such seam, so it needs the
 * value.
 *
 * The media itself has to round its own bottom corners — the card does not clip,
 * because Figma's `overflow-clip` is not ported here (a clipped card slices the
 * focus ring of anything on its first or last line).
 */
export const FullBleed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-80">
      <Card padding={0}>
        <div className="bg-surface-background-emphasized text-content-inverse flex h-32 items-center justify-center rounded-t-md">
          Media
        </div>
        <div className="flex flex-col gap-1 p-3">
          <Text weight="semibold" color="inherit">Full-bleed header</Text>
          <Text color="subtle">The padding comes back on the part that needs it.</Text>
        </div>
      </Card>
    </div>
  ),
}

/**
 * The KPI row from the Figma composition (`40004220:13045`): four cards inside
 * one `ContentBlock`.
 *
 * **This is the pairing the two components are drawn for.** The block owns the
 * titled region and its actions; each card owns one metric. Note the corners —
 * 8px inside 12px — which is the geometric reason these are separate components
 * rather than one with a `header` prop.
 *
 * The cards end level without `h-full`: they are flex children, and flex
 * stretches them by default. `ContentBlock` carries `h-full` because a bento
 * tile has to; a card does not.
 */
export const KpiRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const metrics = [
      { label: 'Page Views', value: '1,860', prev: '1,456', delta: '8%', up: true },
      { label: 'Visitors', value: '326', prev: '224', delta: '9.6%', up: true },
      { label: 'Clicks', value: '271', prev: '437', delta: '8%', up: false },
      { label: 'Orders', value: '1,123', prev: '913', delta: '4.4%', up: true },
    ]

    return (
      <div className="max-w-280">
        <ContentBlock>
          <ContentBlock.Header
            actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Block options" />}
          >
            KPI metrics
          </ContentBlock.Header>
          <ContentBlock.Content>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <Card key={metric.label} emphasis="subtle">
                  <Text weight="semibold" color="inherit">{metric.label}</Text>
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex flex-col">
                      <Text size="2xl" weight="semibold" color="inherit" mono>{metric.value}</Text>
                      <Text size="sm" color="subtle">vs {metric.prev} last period</Text>
                    </div>
                    <Badge
                      color={metric.up ? 'green' : 'neutral'}
                      startIcon={metric.up ? TrendingUp : TrendingDown}
                    >
                      {metric.delta}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ContentBlock.Content>
        </ContentBlock>
      </div>
    )
  },
}

/**
 * The nesting, on its own, so the radii are easy to compare: an 8px card inside
 * a 12px block. Inner corners smaller than outer is what makes concentric boxes
 * look drawn rather than stacked, and it is the check to run if either radius
 * ever moves.
 *
 * It also shows what `subtle` is *for*. Against the block's
 * `surface-background-primary` it is a recessed well; on the canvas two stories up it
 * was nothing at all.
 */
export const InsideContentBlock: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-100">
      <ContentBlock>
        <ContentBlock.Header>Content Block, 12px corners</ContentBlock.Header>
        <ContentBlock.Content>
          {(['default', 'subtle'] as CardEmphasis[]).map((emphasis) => (
            <Card key={emphasis} emphasis={emphasis}>
              <Text weight="semibold" color="inherit">Card, 8px corners</Text>
              <Text color="subtle">emphasis="{emphasis}"</Text>
            </Card>
          ))}
        </ContentBlock.Content>
      </ContentBlock>
    </div>
  ),
}

/**
 * `selected` marks the card whose detail is open, for a card that cannot be a
 * `ClickableCard` because it holds controls of its own — a mention with Like
 * and Reply. Same surface as `ClickableCard`'s selected (Surface/Background
 * Subtle under Surface/Border Emphasized), and `aria-current` on the card.
 * Figma: `Selected=True` on the two Default variants.
 */
export const Selected: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      {['Maria Lopez', 'Skylar Chen', 'Rayna Patel'].map((name, i) => (
        <Card key={name} selected={i === 1} aria-label={`Mention from ${name}`}>
          <Text weight="semibold">{name}</Text>
          <Text color="subtle">Is the corn back for good this summer?</Text>
          <div className="flex gap-2">
            <Button appearance="ghost" startIcon={Heart} aria-label={`Like ${name}'s mention`} />
            <Button appearance="ghost" startIcon={MessageCircle}>Reply</Button>
          </div>
        </Card>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const open = canvas.getByLabelText('Mention from Skylar Chen')
    await expect(open).toHaveAttribute('aria-current', 'true')
    await expect(canvas.getByLabelText('Mention from Maria Lopez')).not.toHaveAttribute('aria-current')

    // The surface is the selected tokens, compared through the same serializer.
    const probe = document.createElement('div')
    probe.style.background = 'var(--surface-background-subtle)'
    probe.style.borderColor = 'var(--surface-border-emphasized)'
    canvasElement.append(probe)
    const want = getComputedStyle(probe)
    const fill = want.backgroundColor
    const edge = want.borderTopColor
    probe.remove()
    await expect(getComputedStyle(open).backgroundColor).toBe(fill)
    await expect(getComputedStyle(open).borderTopColor).toBe(edge)
  },
}

