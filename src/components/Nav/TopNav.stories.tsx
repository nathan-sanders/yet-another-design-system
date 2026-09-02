import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bell, CircleHelp, Search, ShoppingCart } from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Logo } from './story-logo'
import { NavItem } from './NavItem'
import { TopNav } from './TopNav'

/**
 * The horizontal navigation bar — of an application, or of a marketing or
 * commerce site, which is the case that has no side rail at all.
 *
 * Same navigation theme tier as `SideNav`, so the **Nav** toolbar moves it
 * through all thirty-seven modes and only `canvas` follows light/dark.
 */
const meta = {
  title: 'Components/TopNav',
  component: TopNav,
  argTypes: {
    'aria-label': { control: 'text' },
  },
  args: {
    'aria-label': 'Main',
    logo: <Logo />,
    children: (
      <>
        <NavItem href="#home" selected>
          Home
        </NavItem>
        <NavItem href="#inbox">Inbox</NavItem>
        <NavItem href="#calendar">Calendar</NavItem>
        <NavItem href="#analytics">Analytics</NavItem>
      </>
    ),
    utilities: (
      <>
        <NavItem startIcon={Search} aria-label="Search" />
        <NavItem startIcon={Bell} aria-label="Notifications" newIndicator />
        <NavItem
          href="#account"
          start={
            <Avatar
              name="Nathan Sanders"
              size="x-small"
              status="online"
              // See the SideNav story: the ring has to name what is behind it.
              surface="nav"
            />
          }
          aria-label="Hi, Nathan!"
        />
      </>
    ),
  },
} satisfies Meta<typeof TopNav>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/**
 * A marketing site: a wordmark, a few pages, and one call to action. No
 * utilities, so the list sits centered between the logo and empty space —
 * which is what Figma's FILL / HUG / FILL layout does.
 */
export const Marketing: Story = {
  parameters: { controls: { disable: true } },
  args: {
    children: (
      <>
        <NavItem href="#product" selected>
          Product
        </NavItem>
        <NavItem href="#pricing">Pricing</NavItem>
        <NavItem href="#docs">Docs</NavItem>
      </>
    ),
    utilities: <NavItem href="#signin">Sign in</NavItem>,
  },
}

/**
 * Icon-only utilities, which is Figma's composition. An item with no children
 * has no accessible name, so the type requires an `aria-label` — it will not
 * compile without one.
 */
export const IconUtilities: Story = {
  parameters: { controls: { disable: true } },
  args: {
    utilities: (
      <>
        <NavItem startIcon={CircleHelp} aria-label="Help" />
        <NavItem startIcon={Bell} aria-label="Notifications" />
      </>
    ),
  },
}

/**
 * `floating={false}` on the `canvas` nav theme — the combination the marketing
 * example in the docs frame draws. The shadow goes and the bar takes the page's
 * own background colour, so it sits flush with the page and only the selected
 * pill says where you are. Switch the **Nav** toolbar to Canvas to see it as
 * drawn.
 */
export const Docked: Story = {
  parameters: { controls: { disable: true } },
  args: {
    floating: false,
    children: (
      <>
        <NavItem href="#home" selected>
          Home
        </NavItem>
        <NavItem href="#products">Products</NavItem>
        <NavItem href="#about">About</NavItem>
        <NavItem href="#resources">Resources</NavItem>
      </>
    ),
    utilities: (
      <>
        <NavItem href="#signin">Sign in</NavItem>
        <NavItem href="#cart" startIcon={ShoppingCart} end={<Badge>3</Badge>} aria-label="Cart" />
      </>
    ),
  },
}

/**
 * Over the page it navigates. On `canvas` — the **Nav** toolbar's last mode —
 * the bar paints the page's own background and follows light and dark like
 * everything else, which is the mode a marketing site usually wants.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <TopNav {...args} />
      <main className="rounded-lg border border-surface-border bg-surface-background-primary p-6">
        <h1 className="text-lg font-semibold text-content-emphasized">Home</h1>
        <p className="mt-2 text-base text-content-subtle">
          The page keeps its own semantic tokens. Only the bar is drawn from the navigation
          theme.
        </p>
      </main>
    </div>
  ),
}
