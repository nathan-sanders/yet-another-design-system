import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Bell,
  ChartNoAxesColumn,
  CircleHelp,
  Folder,
  House,
  Inbox,
  Settings,
  Users,
} from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Logo } from './story-logo'
import { NavItem } from './NavItem'
import { SideNav } from './SideNav'

/**
 * The vertical navigation rail of an application.
 *
 * Its colors come from the **navigation theme** tier, which is switched by
 * `<html data-nav-theme="…">` — the **Nav** toolbar above. Six of the seven
 * modes are absolute, so switching **Theme** to Dark moves the page around a
 * rail that does not move with it. `transparent` is the one that follows, and
 * the two neutral modes follow the **Neutral** ramp as well.
 */
const meta = {
  title: 'Components/SideNav',
  component: SideNav,
  argTypes: {
    collapsed: { control: 'boolean' },
    'aria-label': { control: 'text' },
  },
  args: {
    'aria-label': 'Main',
    logo: <Logo />,
    defaultCollapsed: false,
    children: (
      <>
        <SideNav.Section header="Workspace">
          <NavItem href="#home" startIcon={House} selected>
            Home
          </NavItem>
          <NavItem href="#inbox" startIcon={Inbox} end={<Badge>3</Badge>}>
            Inbox
          </NavItem>
          <NavItem href="#reports" startIcon={ChartNoAxesColumn}>
            Reports
          </NavItem>
        </SideNav.Section>
        <SideNav.Section header="Projects">
          <SideNav.Group label="Atlas" startIcon={Folder} defaultOpen>
            <NavItem href="#atlas-overview">Overview</NavItem>
            <NavItem href="#atlas-tasks">Tasks</NavItem>
          </SideNav.Group>
          <SideNav.Group label="Beacon" startIcon={Folder}>
            <NavItem href="#beacon-overview">Overview</NavItem>
          </SideNav.Group>
          <NavItem href="#team" startIcon={Users}>
            Team
          </NavItem>
        </SideNav.Section>
      </>
    ),
    utilities: (
      <>
        <NavItem href="#help" startIcon={CircleHelp}>
          Help
        </NavItem>
        <NavItem href="#alerts" startIcon={Bell} newIndicator>
          Notifications
        </NavItem>
        <NavItem
          href="#account"
          start={
            <Avatar
              name="Nathan Sanders"
              size="x-small"
              status="online"
              /*
                The status dot rings itself in the surface behind it so it reads
                as a cut-out, and `surface` only knows the semantic surfaces —
                there is no `nav` among them, so the default `canvas` ring is a
                pale disc on a dark rail. Figma binds that ring to the nav
                Background. Re-pointed here rather than by widening Avatar's
                enum, which is a change to a different component.
              */
              className="[&_[data-status]]:ring-nav-background"
            />
          }
        >
          Hi, Nathan!
        </NavItem>
      </>
    ),
  },
  decorators: [
    (Story) => (
      // The rail is `h-full`, so it needs a parent with a real height to fill.
      // 100dvh less the 3rem the global preview decorator's `p-6` takes off the
      // top and bottom — which makes the story as tall as the frame it is in,
      // and puts the utilities where a real app would have them.
      <div className="h-[calc(100dvh-3rem)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SideNav>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/**
 * Collapsed to the 56px rail. Every label comes off the row and becomes both
 * the accessible name and a tooltip on the right — the one thing here that
 * Figma does not draw, and the reason is in `NavItem`'s doc: an unlabelled
 * icon button has no name at all, which axe fails and a screen reader cannot
 * describe.
 *
 * The section headers go too, matching the Figma variant. A heading over a
 * column of unlabelled icons says nothing.
 */
export const Collapsed: Story = {
  args: { defaultCollapsed: true },
}

/**
 * The toggle drives the rail. Uncontrolled by default, as here; pass
 * `collapsed` and `onCollapsedChange` to hold the state yourself — for a rail
 * whose width is remembered between sessions, which is the usual reason to.
 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [collapsed, setCollapsed] = useState(false)
    return (
      <div className="flex h-full gap-4">
        <SideNav {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <p className="self-start text-base text-content-subtle">
          The rail is {collapsed ? 'collapsed' : 'expanded'}.
        </p>
      </div>
    )
  },
}

/**
 * In place, beside the page it navigates — which is the only way to see that
 * the rail does not follow the theme. Switch **Theme** to Dark: the canvas
 * moves and a `neutral-inverse` rail stays exactly where it was.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex h-full gap-6">
      <SideNav {...args} />
      <main className="flex-1 rounded-lg border border-surface-border bg-surface-background-primary p-6">
        <h1 className="text-lg font-semibold text-content-emphasized">Home</h1>
        <p className="mt-2 text-base text-content-subtle">
          The page keeps its own semantic tokens. Only the rail is drawn from the navigation
          theme.
        </p>
      </main>
    </div>
  ),
}

/**
 * `floating={false}` — Figma's `Floating=False`, which drops the drop shadow and
 * changes nothing else. The docs frame draws this one: the rail docked inside
 * the app window against the page it navigates, still rounded, just not lifted
 * off it.
 */
export const Docked: Story = {
  parameters: { controls: { disable: true } },
  args: { floating: false },
  render: (args) => (
    <div className="flex h-full gap-0 overflow-hidden rounded-lg border border-surface-border bg-surface-background-primary p-2">
      <SideNav {...args} />
      <main className="flex-1 p-6">
        <h1 className="text-lg font-semibold text-content-emphasized">Home</h1>
      </main>
    </div>
  ),
}

/**
 * Without a group or a section header — a flat rail, which is what a small app
 * wants. `Settings` sits in the utilities rather than the list, because it is
 * not one of the pages.
 */
export const Flat: Story = {
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <NavItem href="#home" startIcon={House} selected>
          Home
        </NavItem>
        <NavItem href="#inbox" startIcon={Inbox}>
          Inbox
        </NavItem>
      </>
    ),
    utilities: (
      <NavItem href="#settings" startIcon={Settings}>
        Settings
      </NavItem>
    ),
  },
}
