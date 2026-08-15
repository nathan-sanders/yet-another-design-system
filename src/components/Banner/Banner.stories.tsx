import { Fragment, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Rocket } from 'lucide-react'

import { Banner } from './Banner'
import { Button } from '../Button'

const types = ['info', 'success', 'warning', 'danger'] as const

const meta = {
  title: 'Components/Banner',
  component: Banner,
  argTypes: {
    type: { control: 'select', options: types },
    floating: { control: 'boolean' },
    title: { control: 'text' },
    children: { control: 'text' },
  },
  args: {
    type: 'info',
    title: 'Banner title',
    children: 'Description',
  },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

/** Single banner with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-100">
      <Banner {...args} />
    </div>
  ),
}

/**
 * The four feedback types across the slots Figma models as booleans. Each type
 * pairs a `feedback-*` background with the foreground already tuned for contrast
 * on it, so the whole grid works in both themes without a single `dark:` class.
 */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    // A grid, not Badge's <table>. Banner is `w-full` and takes its width from
    // its container, and an auto-layout table cell has no width to give —
    // the banners collapse to the width of their longest word.
    //
    // The label column is `max-content`, not `auto`: a grid hands leftover space
    // to its `auto` tracks, so on a wide viewport `auto` stretches the labels
    // away from the banners instead of hugging them. `w-fit` then stops the grid
    // itself from filling the canvas.
    <div className="grid w-fit grid-cols-[max-content_repeat(3,20rem)] items-center gap-x-6 gap-y-3">
      {/* An empty corner cell, not Badge's `sr-only` one: `sr-only` is
          position-absolute, so it would drop out of grid flow and shift every
          row one column left. A grid has no header semantics to preserve. */}
      <span />
      <span className="text-sm text-content-subtle">Title only</span>
      <span className="text-sm text-content-subtle">With description</span>
      <span className="text-sm text-content-subtle">Action + dismiss</span>
      {types.map((type) => (
        <Fragment key={type}>
          <span className="text-sm text-content-subtle capitalize">{type}</span>
          <Banner type={type} title="Banner title" />
          <Banner {...args} type={type} />
          <Banner
            {...args}
            type={type}
            action={
              <Button appearance="overlay" size="small">
                Button
              </Button>
            }
            onDismiss={() => {}}
          />
        </Fragment>
      ))}
    </div>
  ),
}

/**
 * Figma's `Floating` property — the medium drop shadow, for a banner that should
 * read as an overlay above the page rather than as part of it. Inline is the
 * default.
 */
export const Floating: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex max-w-100 flex-col gap-6">
      <Banner {...args} title="Inline" floating={false}>
        The default — the banner sits in the flow of the page.
      </Banner>
      <Banner {...args} title="Floating" floating>
        Raised on the medium drop shadow, so it reads as an overlay.
      </Banner>
    </div>
  ),
}

/**
 * The action slot takes a node, not a label, so it can hold whatever the message
 * needs. A small overlay Button is the pairing Figma draws: overlay is the one
 * appearance that works on all four feedback backgrounds, because its own
 * background is a dark translucent wash rather than a theme colour.
 */
export const WithAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-100 flex-col gap-4">
      <Banner
        type="warning"
        title="Your trial expires in 3 days"
        action={
          <Button appearance="overlay" size="small">
            Upgrade
          </Button>
        }
      >
        Upgrade now to keep access to all features.
      </Banner>
      <Banner
        type="danger"
        title="Payment failed"
        action={
          <Button appearance="overlay" size="small">
            Retry
          </Button>
        }
      >
        We could not process your last payment.
      </Banner>
      <Banner type="success" title="Deployment complete" icon={Rocket}>
        Version 3.2.0 is now live in production. The status glyph is overridden here.
      </Banner>
    </div>
  ),
}

/**
 * Passing `onDismiss` renders the close button. The Banner does not hide itself —
 * the caller owns whether it is on screen, which is why this story keeps the
 * dismissed ids in state.
 */
function DismissableDemo() {
  const [dismissed, setDismissed] = useState<string[]>([])
  const notices = [
    { id: 'deploy', type: 'success' as const, title: 'Deployment complete', body: 'Version 3.2.0 is now live in production.' },
    { id: 'maintenance', type: 'warning' as const, title: 'Scheduled maintenance tonight', body: 'The system will be briefly unavailable from 2:00–3:00 AM.' },
    { id: 'feature', type: 'info' as const, title: 'New feature available', body: 'Try the new dashboard layout in Settings.' },
  ]
  const visible = notices.filter((notice) => !dismissed.includes(notice.id))

  return (
    <div className="flex max-w-100 flex-col gap-4">
      {visible.map((notice) => (
        <Banner
          key={notice.id}
          type={notice.type}
          title={notice.title}
          onDismiss={() => setDismissed((ids) => [...ids, notice.id])}
        >
          {notice.body}
        </Banner>
      ))}
      {visible.length < notices.length && (
        <Button appearance="secondary" size="small" onClick={() => setDismissed([])}>
          Bring them back
        </Button>
      )}
    </div>
  )
}

export const Dismissable: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DismissableDemo />,
}

/**
 * A banner is full-width by default and takes its size from whatever contains
 * it — Figma's 400px is a canvas frame, not a constraint. This shows one at the
 * top of a page section and one inside a card.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6">
      <Banner
        type="warning"
        title="Scheduled downtime"
        action={
          <Button appearance="overlay" size="small">
            Details
          </Button>
        }
        onDismiss={() => {}}
      >
        All services will be unavailable on Sunday from 2:00–4:00 AM.
      </Banner>
      <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface-card-primary p-4">
        <p className="text-base font-semibold text-content-emphasized">Billing</p>
        <Banner type="danger" title="Card declined">
          Update your billing information to continue.
        </Banner>
        <p className="text-base text-content-subtle">
          Your next invoice is scheduled for 1 September.
        </p>
      </div>
    </div>
  ),
}
