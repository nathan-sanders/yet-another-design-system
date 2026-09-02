import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Bell, ChartNoAxesColumn, CircleHelp, Folder, House, Inbox, Users } from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { MobileNav } from './MobileNav'
import { NavItem } from './NavItem'
import { SideNav } from './SideNav'
import { Logo } from './story-logo'

/**
 * A phone frame that a `fixed` child actually stays inside.
 *
 * `transform-gpu` is load-bearing, not a performance hint: a `fixed` element
 * resolves against the nearest ancestor carrying a `transform`, so without one
 * the bar would span the whole Storybook canvas and the story would silently
 * stop being a phone mockup. The same transform is what makes the sheet's
 * backdrop scope to the frame once it is portalled here.
 */
function Phone({ label, children }: { label: string; children: (el: HTMLElement | null) => ReactNode }) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div className="flex flex-col gap-2">
      <code className="text-sm text-content-subtle">{label}</code>
      <div
        ref={(node) => {
          ref.current = node
          setFrame(node)
        }}
        className="relative h-[680px] w-[360px] transform-gpu overflow-hidden rounded-2xl border border-surface-border bg-surface-canvas"
      >
        {children(frame)}
      </div>
    </div>
  )
}

const sections = (
  <>
    <SideNav.Section header="Workspace">
      <NavItem href="#home" startIcon={House} selected>
        Home
      </NavItem>
      <NavItem href="#inbox" startIcon={Inbox} end={<Badge>3</Badge>}>
        Inbox
      </NavItem>
      <NavItem href="#analytics" startIcon={ChartNoAxesColumn}>
        Analytics
      </NavItem>
    </SideNav.Section>
    <SideNav.Section header="Projects">
      <SideNav.Group label="Atlas" startIcon={Folder} defaultOpen>
        <NavItem href="#overview">Overview</NavItem>
        <NavItem href="#tasks">Tasks</NavItem>
      </SideNav.Group>
      <NavItem href="#team" startIcon={Users}>
        Team
      </NavItem>
    </SideNav.Section>
  </>
)

const utilities = (
  <>
    <NavItem startIcon={CircleHelp} aria-label="Help" />
    <NavItem startIcon={Bell} aria-label="Notifications" newIndicator />
    <NavItem
      href="#account"
      aria-label="Hi, Nathan!"
      start={<Avatar name="Nathan Sanders" size="x-small" status="online" surface="nav" />}
    />
  </>
)

/**
 * The phone navigation bar, and the sheet its trigger opens.
 *
 * This is the component `TopNav`'s record was waiting for: a responsive
 * collapse was left undone there because which breakpoint and what it collapses
 * into were questions the file had not answered. It has now, and the answer is
 * not a narrower `TopNav` — it is a different bar with a section trigger and a
 * sheet behind it.
 *
 * Its colors come from the **navigation theme** tier, so the **Nav** toolbar
 * moves it through all seven modes and only `transparent` follows light/dark.
 */
const meta = {
  title: 'Components/MobileNav',
  component: MobileNav,
  parameters: { layout: 'centered' },
  argTypes: {
    placement: { control: 'inline-radio', options: ['bottom', 'top'] },
    floating: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Main',
    logo: <Logo />,
    section: 'Home',
    sectionIcon: House,
    utilities,
    placement: 'bottom',
    floating: true,
    children: sections,
  },
} satisfies Meta<typeof MobileNav>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The default: pinned to the bottom edge, 8px in on three sides, which is what
 * Figma's example frame draws with constraints. Press the pill to open the
 * sheet.
 */
export const Playground: Story = {
  render: (args) => (
    <Phone label="placement=&quot;bottom&quot;">
      {(frame) => <MobileNav {...args} container={frame} />}
    </Phone>
  ),
}

/**
 * Both placements, and the thing worth noticing: **the sheet comes from the
 * bottom either way**. Figma draws it bottom-anchored in both example frames,
 * and that is right — the sheet opens where the hand is, not where its trigger
 * is.
 */
export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex gap-6">
      {/*
        Distinct names, not decoration: two `<nav>`s both called "Main" are one
        landmark twice over as far as `landmark-unique` is concerned, and this
        story failed on exactly that the first time it ran.
      */}
      <Phone label="placement=&quot;bottom&quot; · the default">
        {(frame) => (
          <MobileNav {...args} aria-label="Bottom placement" placement="bottom" container={frame} />
        )}
      </Phone>
      <Phone label="placement=&quot;top&quot;">
        {(frame) => (
          <MobileNav {...args} aria-label="Top placement" placement="top" container={frame} />
        )}
      </Phone>
    </div>
  ),
}

/**
 * `floating={false}` — Figma's `Floating=False`, which drops the drop shadow
 * and changes nothing else. The radius and the inset stay, exactly as on
 * `SideNav` and `TopNav`.
 */
export const Docked: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Phone label="floating={false}">
      {(frame) => <MobileNav {...args} floating={false} container={frame} />}
    </Phone>
  ),
}

/**
 * The sheet, opened by the play function rather than by `defaultOpen`.
 *
 * A modal dialog `aria-hidden`s the rest of the page while it is open, so a
 * `defaultOpen` story would make every other story on this docs page inert —
 * which is why `Dialog` has none either. Opening it with a click gets the same
 * coverage, and the a11y addon runs after the play function, so axe still sees
 * a real open sheet.
 *
 * Note that the sheet covers the bar in the bottom placement. Figma draws that
 * too; the trigger is not visible while the sheet it opened is standing over
 * it.
 */
export const SheetOpen: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Phone label="the sheet, open">
      {(frame) => <MobileNav {...args} container={frame} />}
    </Phone>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /Home/ }))

    // Portalled — into the phone frame here rather than <body>, but either way
    // it is not where the trigger is.
    const sheet = await within(canvasElement).findByRole('dialog')
    // `waitFor`, because `findByRole` resolves on the frame the popup is
    // inserted, which is the frame it still carries `data-starting-style` — so
    // it is translated fully out of view and `toBeVisible` is right to say so.
    // Dialog's finding, and the reason this component's motion is worth
    // asserting rather than eyeballing.
    await waitFor(() => expect(sheet).toBeVisible())

    // Named by the bar's own aria-label. Figma draws no title in the sheet, so
    // there is no `Dialog.Title` to name it from.
    await expect(sheet).toHaveAccessibleName('Main')

    // The sections are inside it, with the same rows the rail would show.
    // "Inbox 3", not "Inbox": the Badge in the row's end slot is part of its
    // accessible name, which is correct — the count is information, not
    // decoration — and worth pinning here rather than matching loosely.
    await expect(within(sheet).getByRole('link', { name: 'Inbox 3' })).toBeVisible()
    await expect(within(sheet).getByText('Workspace')).toBeVisible()

    // A modal puts you inside it, unlike a popover.
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
  },
}
