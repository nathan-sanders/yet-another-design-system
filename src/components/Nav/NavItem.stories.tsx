import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bell, CircleHelp, House, Inbox, Settings } from 'lucide-react'

import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { NavItem } from './NavItem'

const sizes = ['default', 'small'] as const

/**
 * One row of a navigation bar. Every part of `SideNav` and `TopNav` is built
 * out of this: the pages, the collapse toggle, the utilities.
 *
 * Its colors come from the navigation theme tier, so it only looks right on a
 * nav surface — which is what the wrapper in these stories is. Use the **Nav**
 * toolbar to move it through the thirty-seven themes; all but `canvas` do not follow the
 * light/dark switch, on purpose.
 */
const meta = {
  title: 'Components/NavItem',
  component: NavItem,
  argTypes: {
    size: { control: 'inline-radio', options: sizes },
    selected: { control: 'boolean' },
    newIndicator: { control: 'boolean' },
    disabled: { control: 'boolean' },
    indent: { control: 'boolean' },
    expandable: { control: 'boolean' },
  },
  args: {
    children: 'Inbox',
    startIcon: Inbox,
    size: 'default',
    selected: false,
  },
  decorators: [
    (Story) => (
      <div className="w-56 rounded-lg bg-nav-background p-2 shadow-low">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavItem>

export default meta

/*
  `StoryObj<typeof NavItem>` rather than `StoryObj<typeof meta>`, which is what
  every other story file uses. NavItem's props are a union — an item with no
  children must carry an `aria-label` — and inferring story args from the meta
  makes TypeScript demand that each story pick an arm, so a story that only
  overrides `render` fails to compile. Taking the args from the component
  instead keeps the union's guarantee at the call sites, where it does the work.
*/
type Story = StoryObj<typeof NavItem>

export const Playground: Story = {}

/**
 * Figma's six variants: `Type` × `State`, here as `size` × the states the
 * browser owns. Hover is not a prop — it is `:hover`, so point at a row to see
 * it. Selected is, because it says which page you are on rather than what the
 * pointer is doing.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col">
          <span className="px-3 py-1 text-sm text-nav-content-subtle">
            {size === 'default' ? 'Default — Figma Primary' : 'Small — Figma Secondary'}
          </span>
          <NavItem size={size} startIcon={House}>
            Default
          </NavItem>
          <NavItem size={size} startIcon={Inbox} selected>
            Selected
          </NavItem>
          <NavItem size={size} startIcon={Settings} disabled>
            Disabled
          </NavItem>
        </div>
      ))}
    </div>
  ),
}

/**
 * The slots. A start slot takes an icon or an `Avatar`; the end slot takes
 * whatever the row needs to say, a `Badge` in Figma's composition. The status
 * dot draws its ring in the nav background, so it stays a cut-out on every one
 * of the thirty-seven themes.
 */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col">
      <NavItem startIcon={Inbox} end={<Badge>3</Badge>}>
        With a badge
      </NavItem>
      <NavItem startIcon={Bell} newIndicator>
        With a newIndicator dot
      </NavItem>
      <NavItem start={<Avatar name="Nathan Sanders" size="x-small" />}>Hi, Nathan!</NavItem>
      <NavItem startIcon={CircleHelp} aria-label="Help" />
      <NavItem startIcon={House}>Parent</NavItem>
      <NavItem indent>Indented child</NavItem>
    </div>
  ),
}

/**
 * As a link, as a button, and as neither — `render` takes the router link of
 * whatever framework is in front of it. `href` alone decides between `<a>` and
 * `<button>`; a disabled link becomes a `<span>`, because an `<a>` has no
 * disabled attribute and would otherwise stay in the tab order.
 */
export const Elements: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col">
      <NavItem href="#inbox" startIcon={Inbox}>
        An anchor
      </NavItem>
      <NavItem startIcon={Settings} onClick={() => {}}>
        A button
      </NavItem>
      <NavItem href="#gone" startIcon={CircleHelp} disabled>
        A disabled link
      </NavItem>
    </div>
  ),
}
