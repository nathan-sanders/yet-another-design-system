import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
 * rail that does not move with it. `canvas` is the one that follows, and
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
              // The status dot rings itself in the surface behind it so it
              // reads as a cut-out, and it cannot work out what that is — hence
              // the prop. `nav` is the navigation theme's own background, which
              // is what Figma binds this ring to.
              surface="nav"
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
 * Collapsed, a group cannot open downward — a 56px rail would hold a column of
 * indistinguishable icons — so it opens **sideways**, at the width it would have
 * had in the expanded rail.
 *
 * It opens on hover after 200ms as well as on click, which is what makes a rail
 * browsable without committing; Escape and an outside click close it, and so
 * does following a row out of it. The group trigger is the one collapsed row
 * with no tooltip: the flyout answers the same hover, and it carries the group's
 * name in its own header.
 */
export const CollapsedFlyout: Story = {
  parameters: { controls: { disable: true } },
  args: { defaultCollapsed: true },
  play: async ({ canvasElement }) => {
    const rail = within(canvasElement)
    // The trigger has no children collapsed, so its name is the `label` prop.
    await userEvent.click(await rail.findByRole('button', { name: 'Atlas' }))

    // Portalled to <body>, so it is not inside the canvas element.
    const flyout = await within(document.body).findByRole('dialog')
    // `findByRole` resolves on the frame the popup is inserted, which is the
    // frame it still carries `data-starting-style` — opacity 0, and
    // `toBeVisible` is right to say so. Dialog's finding, same shape.
    await waitFor(() => expect(flyout).toBeVisible())

    // Named by the popup's `label`, which is the group's own name. Not a
    // `Popover.Title`: that renders a real heading, and `SideNav.Section`
    // already decided group labels do not belong in the page outline.
    await expect(flyout).toHaveAccessibleName('Atlas')

    // The rows are inside it, with their labels back — the whole point of
    // opening sideways rather than downward.
    await expect(within(flyout).getByRole('link', { name: 'Overview' })).toBeVisible()
    await expect(within(flyout).getByRole('link', { name: 'Tasks' })).toBeVisible()

    // Focus moves into the panel, so the rows are reachable straight away —
    // which is what you want from a flyout you opened deliberately.
    //
    // Dialog's story says a popover "leaves focus on the trigger", and both are
    // true: that one is `defaultOpen`, where nothing the user did asked for
    // focus. Opened by click, Base UI moves it. Asserted rather than assumed,
    // because the first version of this test assumed the other way round and
    // failed.
    await waitFor(() => expect(flyout.contains(document.activeElement)).toBe(true))
  },
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
      <div className="flex h-full gap-2 p-2">
        <SideNav {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <p className="self-start text-base text-content-subtle">
          The rail is {collapsed ? 'collapsed' : 'expanded'}. Watch the logo while it moves — it
          stays where it is, and only the rail around it changes width.
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
    // 8px around the rail and 8px between it and the page — the app frame both
    // Figma examples draw (`pad:8 gap:8` on the frame holding the two).
    <div className="flex h-full gap-2 p-2">
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
    <div className="flex h-full gap-2 rounded-lg border border-surface-border p-2">
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
