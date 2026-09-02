import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Bell, ChartNoAxesColumn, CircleHelp, Folder, House, Inbox, Users } from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { NavItem } from './NavItem'
import { ResponsiveNav } from './ResponsiveNav'
import { SideNav } from './SideNav'
import { Logo } from './story-logo'

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
 * `TopNav` above 768px, `MobileNav` below it.
 *
 * The breakpoint is `md:` and the component owns it — the same 768px
 * `BentoGrid` collapses at, and for the reason its record gives: the caller
 * should not have to write a breakpoint of their own. There is no prop to move
 * it, because two components disagreeing about where a phone stops is worse
 * than not being able to move the line.
 *
 * **Drag the Storybook canvas narrower than 768px** and the bars swap. It is a
 * CSS swap rather than a `matchMedia` hook, so it works on a server, through
 * hydration and on the first paint — no flash of the wrong bar.
 */
const meta = {
  title: 'Components/ResponsiveNav',
  component: ResponsiveNav,
  parameters: { layout: 'fullscreen' },
  args: {
    'aria-label': 'Main',
    logo: <Logo />,
    utilities,
  },
} satisfies Meta<typeof ResponsiveNav>

export default meta

/*
  `StoryObj<typeof ResponsiveNav>` rather than `StoryObj<typeof meta>`, the same
  decoupling `NavItem.stories.tsx` makes and for a related reason: `pages` and
  `sections` are required, and inferring story args from the meta makes
  TypeScript demand them there even when the story builds them in `render` —
  which it must, because they depend on state.
*/
type Story = StoryObj<typeof ResponsiveNav>

/**
 * Resize the canvas across 768px. Above it you get the wide bar's centred page
 * list; below it, the pill and the sheet behind it.
 *
 * Note the two trees. `pages` is the handful that fits a top bar; `sections` is
 * the whole navigation, headers and groups included. They are separate because
 * flattening one into the other would have to throw the structure away.
 */
export const Playground: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [current, setCurrent] = useState('Home')
    const page = (label: string, icon?: typeof House) => (
      <NavItem
        key={label}
        startIcon={icon}
        selected={current === label}
        onClick={() => setCurrent(label)}
      >
        {label}
      </NavItem>
    )
    return (
      <div className="min-h-dvh">
        <ResponsiveNav
          {...args}
          pages={
            <>
              {page('Home')}
              {page('Inbox')}
              {page('Analytics')}
            </>
          }
          sections={
            <>
              <SideNav.Section header="Workspace">
                {page('Home', House)}
                <NavItem
                  startIcon={Inbox}
                  end={<Badge>3</Badge>}
                  selected={current === 'Inbox'}
                  onClick={() => setCurrent('Inbox')}
                >
                  Inbox
                </NavItem>
                {page('Analytics', ChartNoAxesColumn)}
              </SideNav.Section>
              <SideNav.Section header="Projects">
                <SideNav.Group label="Atlas" startIcon={Folder} defaultOpen>
                  {page('Overview')}
                  {page('Tasks')}
                </SideNav.Group>
                {page('Team', Users)}
              </SideNav.Section>
            </>
          }
        />
        <main className="p-6 pt-20">
          <h1 className="text-lg font-semibold text-content-emphasized">{current}</h1>
          <p className="mt-2 text-base text-content-subtle">
            Narrow the canvas past 768px and the bar swaps. Both render; the one that does not
            apply is <code>display: none</code>, so only one is ever in the accessibility tree.
          </p>
        </main>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    // The canvas in this runner is wider than 768, so the top bar is the live
    // one and the phone bar is display:none — which is what keeps a single
    // `aria-label` legal across both. A hidden element is out of the
    // accessibility tree entirely, so there is no duplicate landmark to
    // disambiguate, and axe agrees on every run of this story.
    const navs = canvasElement.querySelectorAll('nav[aria-label="Main"]')
    await expect(navs).toHaveLength(2)
    const visible = [...navs].filter((n) => n.checkVisibility())
    await expect(visible).toHaveLength(1)
    // …and it is the wide one, which is the bar in normal flow.
    await expect(visible[0]).not.toHaveClass(/md:hidden/)
    await expect(within(canvasElement).getByRole('link', { name: 'Hi, Nathan!' })).toBeVisible()
  },
}
