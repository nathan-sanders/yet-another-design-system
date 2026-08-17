import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, Inbox, LayoutGrid, Send, Settings } from 'lucide-react'

import { Tabs, type TabsSize } from './Tabs'
import { Badge } from '../Badge'
import { Button } from '../Button'

const sizes = ['small', 'default', 'large'] as const

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  argTypes: {
    size: { control: 'select', options: sizes },
    layout: { control: 'inline-radio', options: ['hug', 'fill'] },
  },
  args: {
    size: 'default',
    layout: 'hug',
    defaultValue: 'overview',
    children: (
      <>
        <Tabs.List aria-label="Project sections">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="activity">Activity</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" className="py-4 text-base text-content-primary">
          Everything at a glance.
        </Tabs.Panel>
        <Tabs.Panel value="activity" className="py-4 text-base text-content-primary">
          Who did what, and when.
        </Tabs.Panel>
        <Tabs.Panel value="settings" className="py-4 text-base text-content-primary">
          Knobs and switches.
        </Tabs.Panel>
      </>
    ),
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click between tabs and watch the underline slide rather than blink.
 *
 * Focus a tab and press the arrow keys: focus moves but the panel does not
 * change until Enter or Space. That is the opposite of SegmentedControl, where
 * selection follows focus, and it is deliberate — arrowing past a tab on your
 * way to another one should not swap the content underneath you.
 */
export const Playground: Story = {}

/**
 * Every size — the Figma `Size` axis. Each strip shows both halves of `Active`
 * at once: the selected tab is Content/Emphasized at semibold with the 2px
 * underline, the rest are Content/Primary at regular weight.
 *
 * The heights are Button's: 24 / 32 / 40, plus 4px of breathing room above and
 * below, so a `default` strip is 40px tall overall.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-sm text-content-subtle capitalize">{size}</span>
          <Tabs {...args} size={size}>
            <Tabs.List aria-label={`Project sections, ${size}`}>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="settings">Settings</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>
      ))}
    </div>
  ),
}

/**
 * Hover and focus are real browser states, not props — hover any tab (the
 * active one has a hover state too, which is what Figma draws), and press Tab
 * to see the shared focus ring. Tab lands on the *selected* tab only: the strip
 * is one tab stop and the arrow keys move within it.
 *
 * A disabled tab sits at 40% opacity and cannot be activated — but the arrow
 * keys still land on it. Base UI builds tabs with `focusableWhenDisabled`, so a
 * disabled tab is announced rather than silently missing, which is why it
 * carries `aria-disabled` instead of the native `disabled` attribute.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">Default</span>
        <Tabs {...args}>
          <Tabs.List aria-label="Project sections, default">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="activity">Activity</Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">One tab disabled</span>
        <Tabs {...args}>
          <Tabs.List aria-label="Project sections, one disabled">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="activity" disabled>
              Activity
            </Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-content-subtle">Disabled tab selected</span>
        <Tabs {...args} defaultValue="activity">
          <Tabs.List aria-label="Project sections, disabled selected">
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="activity" disabled>
              Activity
            </Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
    </div>
  ),
}

/**
 * The Figma "Start Icon" slot. Pass a Lucide icon component — the tab renders it
 * through <Icon>, so the glyph size (12px at small, 16px otherwise) and stroke
 * weight come from the design system rather than the call site.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <Tabs key={size} {...args} size={size}>
          <Tabs.List aria-label={`Project sections, ${size}`}>
            <Tabs.Tab value="overview" startIcon={LayoutGrid}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="activity" startIcon={Activity}>
              Activity
            </Tabs.Tab>
            <Tabs.Tab value="settings" startIcon={Settings}>
              Settings
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      ))}
    </div>
  ),
}

/**
 * Figma's "End Slot Items" frame takes any node, not a `LucideIcon` — because
 * the thing that usually goes there is a count. A Badge drops straight in and
 * keeps its own 20px height, which is why the small strip is the one to check:
 * a 20px badge inside a 24px tab leaves 2px either side, so the strip stays 24 /
 * 32 / 40 tall with counts in it.
 */
export const WithEndSlot: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <Tabs key={size} {...args} size={size} defaultValue="inbox">
          <Tabs.List aria-label={`Mailboxes, ${size}`}>
            <Tabs.Tab value="inbox" startIcon={Inbox} endSlot={<Badge color="red">5</Badge>}>
              Inbox
            </Tabs.Tab>
            <Tabs.Tab value="sent" startIcon={Send}>
              Sent
            </Tabs.Tab>
            <Tabs.Tab value="drafts" endSlot={<Badge>2</Badge>}>
              Drafts
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      ))}
    </div>
  ),
}

/**
 * Icon-only: an icon and no label. Each tab becomes a square at its size
 * (24 / 32 / 40), so a strip mixing labelled and icon-only tabs still lines up.
 *
 * There is no visible text, so `aria-label` is what names each tab — it is
 * required by the types, and a missing one will not compile.
 */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <Tabs key={size} {...args} size={size}>
          <Tabs.List aria-label={`Project sections, ${size}`}>
            <Tabs.Tab value="overview" startIcon={LayoutGrid} aria-label="Overview" />
            <Tabs.Tab value="activity" startIcon={Activity} aria-label="Activity" />
            <Tabs.Tab value="settings" startIcon={Settings} aria-label="Settings" />
          </Tabs.List>
        </Tabs>
      ))}
    </div>
  ),
}

/**
 * `layout="fill"` stretches the tabs to equal widths across the container, for a
 * panel or sidebar where a hugging strip would look adrift. Both are shown in
 * the same 320px column.
 */
export const FillLayout: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <div className="flex w-80 flex-col gap-8">
      <Tabs {...args} layout="fill">
        <Tabs.List aria-label="Range, fill">
          <Tabs.Tab value="overview">Daily</Tabs.Tab>
          <Tabs.Tab value="activity">Weekly</Tabs.Tab>
          <Tabs.Tab value="settings">Monthly</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <Tabs {...args} layout="hug">
        <Tabs.List aria-label="Range, hug">
          <Tabs.Tab value="overview">Daily</Tabs.Tab>
          <Tabs.Tab value="activity">Weekly</Tabs.Tab>
          <Tabs.Tab value="settings">Monthly</Tabs.Tab>
        </Tabs.List>
      </Tabs>
    </div>
  ),
}

/**
 * `divider={false}` drops the rule under the strip — for a set of tabs that
 * already sits on a border, or inside a card that draws its own. The indicator
 * stays where it is; it is the rule that goes.
 */
export const WithoutDivider: Story = {
  parameters: { controls: { disable: true } },
  render: ({ children: _children, ...args }) => (
    <Tabs {...args}>
      <Tabs.List aria-label="Project sections, no divider" divider={false}>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ),
}

/**
 * A controlled page header. Extracted into its own component because `useState`
 * cannot live in a story's `render` arrow — the rules-of-hooks lint reads a
 * lowercase function as "not a component".
 */
function PageHeader({ size }: { size: TabsSize }) {
  const [section, setSection] = useState('overview')

  return (
    <Tabs size={size} value={section} onValueChange={(value) => setSection(value as string)}>
      <div className="flex items-center justify-between gap-4">
        <Tabs.List aria-label="Project sections" divider={false} className="grow">
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="activity" endSlot={<Badge>12</Badge>}>
            Activity
          </Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
        </Tabs.List>
        <Button size={size}>New item</Button>
      </div>
      <Tabs.Panel value="overview" className="py-4 text-base text-content-primary">
        Everything at a glance.
      </Tabs.Panel>
      <Tabs.Panel value="activity" className="py-4 text-base text-content-primary">
        Who did what, and when.
      </Tabs.Panel>
      <Tabs.Panel value="settings" className="py-4 text-base text-content-primary">
        Knobs and switches.
      </Tabs.Panel>
    </Tabs>
  )
}

/**
 * Controlled, driving real panels, with an action Button beside the strip — the
 * page-header pattern. Match the Button's size to the tabs' and the two line up
 * on a shared baseline: the size scales are the same 24 / 32 / 40.
 *
 * The rule is turned off on the strip here because it would stop short of the
 * button; a header like this wants one line under the whole row, which is the
 * caller's layout, not the component's.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => <PageHeader size={args.size ?? 'default'} />,
}
