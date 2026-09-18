import { useContext, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  Bell,
  Calendar,
  CalendarPlus,
  ChartNoAxesColumn,
  CircleHelp,
  Ellipsis,
  Folder,
  House,
  Inbox,
  ListFilter,
  Share,
  ShoppingCart,
} from 'lucide-react'

import { Autocomplete } from '../Autocomplete'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { BentoGrid } from '../BentoGrid'
import { Button } from '../Button'
import { formatFullNumber } from '../Chart/axes'
import { dailyData, radarData, sliceData } from '../Chart/sample-data'
import { ContentBlock } from '../ContentBlock'
import { Donut } from '../Donut'
import { LineSeries } from '../LineSeries'
import { MetricCard, MetricGrid } from '../Metric'
import { NavItem, SideNav, TopNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { Radar } from '../Radar'
import { ThemeControl, type Theme } from '../ThemeControl'
import { TopBar } from '../TopBar'
import { AppShell } from './AppShell'
import { AppShellContext } from './context'

// ---------------------------------------------------------------------------
// Fixtures: the rail, the bar and the page from Figma's Example 1
// (`40005257:45475`). Same content in every story so the only thing that
// changes between them is the shell.

const recent = [
  { value: 'annual report', label: 'annual report' },
  { value: 'brand guidelines', label: 'brand guidelines' },
  { value: 'design tokens', label: 'design tokens' },
]

function Rail(props: { defaultCollapsed?: boolean; floating?: boolean }) {
  return (
    <SideNav aria-label="Main" logo={<Logo />} utilities={<UtilityRows />} {...props}>
      <SideNav.Section header="Workspace">
        <NavItem href="#dashboard" startIcon={House} selected>
          Dashboard
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
        <SideNav.Group label="Beacon" startIcon={Folder}>
          <NavItem href="#beacon-overview">Overview</NavItem>
        </SideNav.Group>
      </SideNav.Section>
    </SideNav>
  )
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

/**
 * The `ThemeControl` is wired to the document so pressing it moves the page
 * around the rail — the quickest way to see that the two tiers are independent,
 * and that only the `canvas` nav theme follows.
 */
function Bar() {
  const [theme, setTheme] = useState<Theme>('light')
  return (
    <TopBar
      search={<Autocomplete items={recent} placeholder="Search…" appearance="ghost" />}
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
  )
}

/**
 * Figma's "Page Title" row. In Example 1 it is inset `spacing/4` while the
 * grid under it is flush — the title lines up with the block titles inside the
 * grid, which are `px-4` themselves. Where the content already carries its own
 * 16px (`contained`, or docked) the row is flush with it instead.
 */
function PageTitle() {
  const shell = useContext(AppShellContext)
  const inset = shell?.mode === 'floating' && shell.frame
  return (
    <div
      className={
        inset
          ? 'flex flex-wrap items-center justify-between gap-4 px-4'
          : 'flex flex-wrap items-center justify-between gap-4'
      }
    >
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-content-emphasized">Dashboard</h1>
        <p className="text-base text-content-subtle">Subtitle goes here</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button appearance="secondary" startIcon={Calendar}>
          Last month
        </Button>
        <Button appearance="secondary" startIcon={CalendarPlus}>
          Add compare
        </Button>
        <Button appearance="secondary" startIcon={ListFilter}>
          Filter
        </Button>
        <Button appearance="secondary" startIcon={Ellipsis} aria-label="More" />
      </div>
    </div>
  )
}

const SERIES = [
  { key: 'sessions', label: 'Dataset 1' },
  { key: 'signups', label: 'Dataset 2' },
  { key: 'conversions', label: 'Dataset 3' },
]
const SLICES = sliceData(6)
const TOTAL = SLICES.reduce((sum, row) => sum + (row.sessions as number), 0)

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ContentBlock headingLevel={2} className="h-full">
      <ContentBlock.Header
        actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label={`${title} options`} />}
      >
        {title}
      </ContentBlock.Header>
      <ContentBlock.Content>{children}</ContentBlock.Content>
    </ContentBlock>
  )
}

function Dashboard() {
  return (
    <BentoGrid columns={4}>
      <BentoGrid.Cell colSpan={4}>
        <Block title="Metric grid">
          <MetricGrid>
            <MetricCard label="Metric Label" value="1,234" trend={8} />
            <MetricCard label="Metric Label" value="1,234" trend={8} />
            <MetricCard label="Metric Label" value="1,234" trend={8} />
            <MetricCard label="Metric Label" value="1,234" trend={8} />
          </MetricGrid>
        </Block>
      </BentoGrid.Cell>
      <BentoGrid.Cell colSpan={4}>
        <Block title="Line series">
          <LineSeries
            data={dailyData(31)}
            xKey="date"
            series={SERIES}
            label="Three datasets over 31 days"
            height={260}
          />
        </Block>
      </BentoGrid.Cell>
      <BentoGrid.Cell colSpan={2}>
        <Block title="Donut chart">
          <Donut
            data={SLICES}
            nameKey="browser"
            valueKey="sessions"
            label="Sessions by browser"
            height={260}
            interactiveLegend
            center={
              <>
                <span className="text-sm text-content-subtle">Total</span>
                <span className="text-2xl font-semibold text-content-emphasized">
                  {formatFullNumber(TOTAL)}
                </span>
              </>
            }
          />
        </Block>
      </BentoGrid.Cell>
      <BentoGrid.Cell colSpan={2}>
        <Block title="Radar chart">
          <Radar
            data={radarData(5)}
            axisKey="dimension"
            series={[
              { key: 'modelA', label: 'Dataset 1' },
              { key: 'modelB', label: 'Dataset 2' },
              { key: 'modelC', label: 'Dataset 3' },
            ]}
            label="Three datasets across five dimensions"
            height={260}
            interactiveLegend
          />
        </Block>
      </BentoGrid.Cell>
    </BentoGrid>
  )
}

function Page() {
  return (
    <AppShell.Page>
      <Bar />
      <AppShell.Content>
        <PageTitle />
        <Dashboard />
      </AppShell.Content>
    </AppShell.Page>
  )
}

/**
 * The frame an application sits in — a nav, and the page beside or below it.
 *
 * Two modes, and they are about the page rather than the nav. **Floating** puts
 * the blocks straight on the canvas with the nav lifted above it on its shadow,
 * and works on any nav theme. **Contained** puts the page in a bordered
 * `surface-background-primary` panel with the nav flush against the canvas, and
 * reads best with the **Nav** toolbar on `canvas` — that mode paints the rail in
 * the page's own background, so the panel is the only surface on screen.
 *
 * Every story here fills the viewport: the shell is `h-dvh`, and the global
 * decorator's 24px is switched off (`canvasPadding: false`) so the only padding
 * on screen is the shell's own 8px frame.
 */
const meta = {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen', canvasPadding: false },
  args: {
    mode: 'floating',
    navigation: 'side',
    frame: true,
    children: (
      <>
        <Rail />
        <Page />
      </>
    ),
    // For the play functions: the shell is the one thing on the page with no
    // role of its own to query by. `id` because `data-*` is not in the props type.
    id: 'shell',
  },
  argTypes: {
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------

/** The two numbers every assertion below reads off the shell. */
function measure(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<HTMLElement>('#shell')!
  const nav = root.querySelector<HTMLElement>('nav')!
  const main = root.querySelector<HTMLElement>('main')!
  const page = main.parentElement!
  return {
    root: getComputedStyle(root),
    nav: getComputedStyle(nav),
    page: getComputedStyle(page),
    main: getComputedStyle(main),
  }
}

/**
 * Figma's Example 1: the blocks on the canvas, the rail lifted above it, the
 * TopBar's rule the only chrome on the page. Content is `py-4` with no side
 * padding, so the grid lines up with the bar's edges.
 */
export const Floating: Story = {
  play: async ({ canvasElement }) => {
    const { root, nav, page, main } = measure(canvasElement)
    await expect(root.flexDirection).toBe('row')
    await expect(root.gap).toBe('8px')
    await expect(root.padding).toBe('8px')
    // The rail casts; the page paints nothing.
    await expect(nav.boxShadow).not.toBe('none')
    await expect(page.borderTopWidth).toBe('0px')
    await expect(page.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    // px-0 py-4, with the 4px clip push-out taken back by the margin.
    await expect(main.paddingTop).toBe('16px')
    await expect(main.paddingLeft).toBe('4px')
    await expect(main.marginLeft).toBe('-4px')
    await expect(main.overflowY).toBe('auto')
    // The title row is inset 16 while the grid under it is flush.
    const title = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(getComputedStyle(title.parentElement!.parentElement!).paddingLeft).toBe('16px')
  },
}

/**
 * Figma's Example 2: the page is a `surface-background-primary` panel inside a
 * `surface-border` at `rounded-lg`, the content sits in it with `spacing/4`
 * all round, and the rail is flush — no shadow, because the shell told it so.
 *
 * The **Nav** toolbar is set to `canvas` for this story, which is the pairing
 * the mode is drawn for. Switch it to `neutral-inverse` to see the same shell
 * with a dark rail; it still works, it just has two surfaces instead of one.
 */
export const Contained: Story = {
  args: { mode: 'contained' },
  globals: { navTheme: 'canvas' },
  play: async ({ canvasElement }) => {
    const { nav, page, main } = measure(canvasElement)
    await expect(nav.boxShadow).toBe('none')
    await expect(page.borderTopWidth).toBe('1px')
    await expect(page.borderTopLeftRadius).toBe('12px')
    await expect(page.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    await expect(page.overflow).toBe('clip')
    await expect(main.padding).toBe('16px')
    await expect(main.marginLeft).toBe('0px')
  },
}

/**
 * The prop wins. A `SideNav` that says `floating` inside a `contained` shell
 * keeps its shadow — the shell only supplies the default.
 */
export const ContainedFloatingRail: Story = {
  name: 'Contained, rail overridden',
  args: {
    mode: 'contained',
    children: (
      <>
        <Rail floating />
        <Page />
      </>
    ),
  },
  globals: { navTheme: 'canvas' },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const { nav } = measure(canvasElement)
    await expect(nav.boxShadow).not.toBe('none')
  },
}

/**
 * `frame={false}` — Figma's second pair of frames, with the rail docked to the
 * window edge and the page hard against it. No padding, no gap, no shadow on
 * the rail and no corners on it either — a rounded corner at the edge of the
 * screen shows a sliver of canvas behind it. The content takes 16px at the
 * sides instead, since there is no frame to hold the blocks off the edge.
 */
export const Docked: Story = {
  args: { frame: false },
  play: async ({ canvasElement }) => {
    const { root, nav, main } = measure(canvasElement)
    // An unset gap computes to `normal`, not `0px`.
    await expect(root.gap).toMatch(/^(normal|0px)$/)
    await expect(root.padding).toBe('0px')
    await expect(nav.boxShadow).toBe('none')
    // Square against the window edge, where a framed rail keeps its corners.
    await expect(nav.borderTopLeftRadius).toBe('0px')
    // No frame to hold the blocks off the edge, so the content does it.
    await expect(main.paddingLeft).toBe('16px')
    await expect(main.marginLeft).toBe('0px')
  },
}

/**
 * Both axes off the default at once: the page is a bordered panel and the
 * frame is gone. The panel squares its corners for the same reason the rail
 * does — hard against the window edge, a rounded corner shows canvas behind
 * it — and keeps its border, which is what separates it from the rail.
 */
export const ContainedDocked: Story = {
  name: 'Contained, docked',
  args: { mode: 'contained', frame: false },
  globals: { navTheme: 'canvas' },
  play: async ({ canvasElement }) => {
    const { nav, page, main } = measure(canvasElement)
    await expect(nav.borderTopLeftRadius).toBe('0px')
    await expect(page.borderTopLeftRadius).toBe('0px')
    await expect(page.borderTopWidth).toBe('1px')
    await expect(main.padding).toBe('16px')
  },
}

/**
 * `navigation="top"`: the frame becomes a column, and the nav is a `TopNav`.
 * No `TopBar` — Nav's own rule says the two full-width strips do not stack,
 * so the actions live in the bar's `utilities`.
 */
export const TopNavigation: Story = {
  args: {
    navigation: 'top',
    children: (
      <>
        <TopNav
          aria-label="Main"
          logo={<Logo />}
          utilities={
            <>
              <NavItem href="#signin">Sign in</NavItem>
              <NavItem
                href="#cart"
                startIcon={ShoppingCart}
                end={<Badge>3</Badge>}
                aria-label="Cart"
              />
            </>
          }
        >
          <NavItem href="#home" selected>
            Home
          </NavItem>
          <NavItem href="#products">Products</NavItem>
          <NavItem href="#about">About</NavItem>
          <NavItem href="#resources">Resources</NavItem>
        </TopNav>
        <AppShell.Page>
          <AppShell.Content>
            <PageTitle />
            <Dashboard />
          </AppShell.Content>
        </AppShell.Page>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const { root, nav } = measure(canvasElement)
    await expect(root.flexDirection).toBe('column')
    await expect(nav.boxShadow).not.toBe('none')
  },
}

/** The rail starts collapsed; the page takes the room. */
export const CollapsedRail: Story = {
  args: {
    children: (
      <>
        <Rail defaultCollapsed />
        <Page />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Main' })
    await expect(nav.getBoundingClientRect().width).toBe(56)
  },
}
