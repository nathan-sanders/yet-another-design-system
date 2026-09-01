import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bell, ChartNoAxesColumn, CircleHelp, Folder, House, Inbox, Share, Users } from 'lucide-react'

import { Autocomplete } from '../Autocomplete'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Breadcrumbs } from '../Breadcrumbs'
import { Button } from '../Button'
import { NavItem, SideNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { ThemeControl, type Theme } from '../ThemeControl'
import { TopBar } from './TopBar'

const recent = [
  { value: 'annual report', label: 'annual report' },
  { value: 'brand guidelines', label: 'brand guidelines' },
  { value: 'design tokens', label: 'design tokens' },
]

/*
  `appearance="ghost"`, which is what Figma's Top Bar instantiates:
  `Input Group / Appearance=Ghost`. It draws no border until you focus it, so
  the bar reads as a magnifier and a placeholder rather than a boxed field —
  the default appearance puts a second rectangle under the one the bar already
  has. The 16rem stays: the hit area is the full width either way.
*/
const search = <Autocomplete items={recent} placeholder="Search…" appearance="ghost" />

const actions = (
  <>
    <Button appearance="ghost" startIcon={Share} aria-label="Share" />
    <ThemeControl />
  </>
)

const trail = (
  <Breadcrumbs>
    <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#projects">Projects</Breadcrumbs.Item>
    <Breadcrumbs.Item>Atlas</Breadcrumbs.Item>
  </Breadcrumbs>
)

/** Two trails on one page need two names, or they are one landmark twice over. */
const trailNamed = (label: string) => (
  <Breadcrumbs aria-label={label}>
    <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
    <Breadcrumbs.Item href="#projects">Projects</Breadcrumbs.Item>
    <Breadcrumbs.Item>Atlas</Breadcrumbs.Item>
  </Breadcrumbs>
)

/**
 * The page header that sits above the content, beside a `SideNav`.
 *
 * Unlike `SideNav` and `TopNav` this draws from the ordinary semantic tokens,
 * not the navigation theme — it is part of the page rather than part of the
 * navigation surface, so it follows light and dark like everything else and the
 * **Nav** toolbar does nothing to it.
 */
const meta = {
  title: 'Components/TopBar',
  component: TopBar,
  args: {
    search,
    actions,
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

/** Figma's `Type=Default`: no trail, so the search sits at the left edge. */
export const Playground: Story = {}

/**
 * Figma's `Type=Breadcrumbs`. There is no `type` prop — passing `breadcrumbs`
 * is what selects this arrangement, and it is also what centres the search,
 * because the trail and the actions are equal `flex-1` ends.
 */
export const WithBreadcrumbs: Story = {
  args: { breadcrumbs: trail },
}

/**
 * Each slot is optional, and the bar keeps its 56px whatever is in it.
 *
 * **Every example is wrapped in a `<section>`, and that is not decoration.** A
 * `<header>` at the top level of a document is the *banner* landmark and a page
 * gets exactly one; four of them is an axe failure, which is how this story
 * first ran. Nesting each one inside a labelled `<section>` takes the banner
 * role away and leaves an ordinary header — which is also the escape hatch for a
 * real page that genuinely needs two of these.
 *
 * The trails carry distinct names for the same reason: two `<nav>`s both called
 * "Breadcrumb" are indistinguishable in a screen reader's landmark list.
 */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const examples = [
      { label: 'search + actions', node: <TopBar search={search} actions={actions} /> },
      {
        label: 'breadcrumbs + actions',
        node: <TopBar breadcrumbs={trailNamed('Projects trail')} actions={actions} />,
      },
      { label: 'breadcrumbs only', node: <TopBar breadcrumbs={trailNamed('Archive trail')} /> },
      { label: 'actions only', node: <TopBar actions={actions} /> },
    ]
    return (
      <div className="flex flex-col gap-6">
        {examples.map((e) => (
          <section key={e.label} aria-label={e.label} className="flex flex-col gap-1">
            <code className="text-sm text-content-subtle">{e.label}</code>
            {e.node}
          </section>
        ))}
      </div>
    )
  },
}

/**
 * What it is for: docked beside a `SideNav`, in the 8px app frame both Figma
 * examples draw. The rail is the navigation theme and does not follow the
 * page's light/dark; the bar and the content do.
 *
 * The `ThemeControl` here is wired to the document, so pressing it moves the
 * page around the rail — which is the clearest way to see that the two tiers
 * are independent by design.
 */
export const WithSideNav: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [theme, setTheme] = useState<Theme>('light')
    return (
      <div className="flex h-[calc(100dvh-3rem)] gap-2 p-2">
        <SideNav aria-label="Main" logo={<Logo />} utilities={<UtilityRows />}>
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
              <NavItem href="#overview">Overview</NavItem>
              <NavItem href="#tasks">Tasks</NavItem>
            </SideNav.Group>
            <NavItem href="#team" startIcon={Users}>
              Team
            </NavItem>
          </SideNav.Section>
        </SideNav>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-background-primary">
          <TopBar
            breadcrumbs={trail}
            search={search}
            actions={
              <>
                <Button appearance="ghost" startIcon={Share} aria-label="Share" />
                <ThemeControl
                  theme={theme}
                  onThemeChange={(next) => {
                    setTheme(next)
                    document.documentElement.classList.toggle('dark', next === 'dark')
                  }}
                />
              </>
            }
          />
          <main className="flex-1 p-6">
            <h1 className="text-lg font-semibold text-content-emphasized">Atlas</h1>
            <p className="mt-2 text-base text-content-subtle">
              The rail keeps its navigation theme through the switch. The bar and this page follow
              it.
            </p>
          </main>
        </div>
      </div>
    )
  },
}

function UtilityRows() {
  return (
    <>
      <NavItem href="#help" startIcon={CircleHelp}>
        Help
      </NavItem>
      <NavItem href="#alerts" startIcon={Bell} newIndicator>
        Notifications
      </NavItem>
      <NavItem
        href="#account"
        start={<Avatar name="Nathan Sanders" size="x-small" status="online" surface="nav" />}
      >
        Hi, Nathan!
      </NavItem>
    </>
  )
}
