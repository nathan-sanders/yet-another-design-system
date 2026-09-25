import { useContext, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
import { MobileNav, NavItem, ResponsiveNav, SideNav, TopNav } from '../Nav'
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

/**
 * The navigation, written once. The rail takes it as `children`, and so does
 * the phone sheet — `MobileNav` takes the same tree on purpose, so a responsive
 * app never keeps two copies in step.
 */
const sections = (
  <>
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
  </>
)

function Rail(props: { defaultCollapsed?: boolean; floating?: boolean; resizable?: boolean }) {
  return (
    <SideNav aria-label="Main" logo={<Logo />} utilities={<UtilityRows />} {...props}>
      {sections}
    </SideNav>
  )
}

/**
 * The phone bar. Its `utilities` are icon-only — a 56px bar has no room for
 * the rail's labelled rows — and those rows go into the sheet instead, as one
 * more section under the navigation, which is where a phone keeps them.
 */
function Phone(props: { placement?: 'bottom' | 'top' }) {
  return (
    <MobileNav
      aria-label="Main"
      logo={<Logo />}
      utilities={
        <>
          <NavItem href="#help" startIcon={CircleHelp} aria-label="Help" />
          <NavItem href="#alerts" startIcon={Bell} aria-label="Notifications" newIndicator />
        </>
      }
      {...props}
    >
      {sections}
      <SideNav.Section header="Account">
        <UtilityRows />
      </SideNav.Section>
    </MobileNav>
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
      middle={<Autocomplete items={recent} placeholder="Search…" appearance="ghost" />}
      end={
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
    // The shell is the viewport, so the *document* must not scroll — only
    // `<main>` does. It did once: every chart's screen-reader table wore
    // `sr-only` itself, a table cannot be 1px tall, and the absolutely
    // positioned box hung 161px below the fold. See ChartContainer.
    const doc = document.documentElement
    await expect(doc.scrollHeight).toBe(doc.clientHeight)
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

/**
 * `resizable` on the `SideNav`: drag the seam between the rail and the page to
 * set the rail's width, between 192 and 400. The handle is the shell's 8px gap
 * — the same width, sitting exactly in it — and the arrow keys step it too.
 * Collapse the rail and drag the seam again: it expands to wherever you let go.
 */
export const ResizableRail: Story = {
  name: 'Resizable rail',
  args: {
    children: (
      <>
        <Rail resizable />
        <Page />
      </>
    ),
  },
  parameters: { controls: { disable: true } },
}

/**
 * The same shell, driven. The handle is a `separator` that says the rail's
 * width, fills the gap exactly, steps by keyboard, and — collapsed — expands
 * the rail on the first step rather than sizing the icon rail.
 */
export const ResizableRailKeyboard: Story = {
  name: 'Resizable rail, keyboard',
  args: ResizableRail.args,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    const page = canvasElement.querySelector<HTMLElement>('main')!.parentElement!
    const handle = canvas.getByRole('separator', { name: 'Resize Main' })
    const navWidth = () => nav.getBoundingClientRect().width

    await step('the handle is the gap: 8 wide, from the rail\'s edge to the page\'s', async () => {
      await expect(handle).toHaveAttribute('aria-valuenow', '224')
      await expect(handle).toHaveAttribute('aria-valuemin', '192')
      await expect(handle).toHaveAttribute('aria-valuemax', '400')
      await expect(handle).toHaveAttribute('aria-valuetext', '224 pixels')
      const rect = handle.getBoundingClientRect()
      await expect(rect.width).toBe(8)
      await expect(rect.left).toBe(nav.getBoundingClientRect().right)
      await expect(rect.right).toBe(page.getBoundingClientRect().left)
      await expect(navWidth()).toBe(224)
    })

    await step('the arrows step the width and it reaches the layout', async () => {
      handle.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(handle).toHaveAttribute('aria-valuenow', '232')
      // The rail eases there over `duration-medium`.
      await waitFor(() => expect(navWidth()).toBe(232))
      await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
      await expect(handle).toHaveAttribute('aria-valuenow', '272')
      await userEvent.keyboard('{End}')
      await expect(handle).toHaveAttribute('aria-valuenow', '400')
      await waitFor(() => expect(navWidth()).toBe(400))
      await userEvent.keyboard('{Home}')
      await expect(handle).toHaveAttribute('aria-valuenow', '192')
      await waitFor(() => expect(navWidth()).toBe(192))
      // The page moved with it: the handle is still exactly the gap.
      const rect = handle.getBoundingClientRect()
      await expect(rect.left).toBe(nav.getBoundingClientRect().right)
      await expect(rect.right).toBe(page.getBoundingClientRect().left)
    })

    await step('collapsed, the handle says so and shrinking does nothing', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Collapse' }))
      await waitFor(() => expect(navWidth()).toBe(56))
      await expect(handle).toHaveAttribute('aria-valuenow', '56')
      await expect(handle).toHaveAttribute('aria-valuemin', '56')
      await expect(handle).toHaveAttribute('aria-valuetext', 'Collapsed')
      handle.focus()
      await userEvent.keyboard('{ArrowLeft}')
      await expect(handle).toHaveAttribute('aria-valuenow', '56')
      await expect(navWidth()).toBe(56)
    })

    await step('growing a collapsed rail expands it, no narrower than the minimum', async () => {
      await userEvent.keyboard('{ArrowRight}')
      await expect(handle).toHaveAttribute('aria-valuenow', '192')
      await expect(handle).toHaveAttribute('aria-valuemin', '192')
      await expect(canvas.getByRole('button', { name: 'Collapse' })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      await waitFor(() => expect(navWidth()).toBe(192))
    })
  },
}

/**
 * Docked, there is no gap for the handle to be, so it straddles the seam —
 * still 8px, centred on the rail's edge, 4px over the rail's own padding and
 * 4px over the page's. `Table`'s arrangement.
 */
export const ResizableRailDocked: Story = {
  name: 'Resizable rail, docked',
  args: { ...ResizableRail.args, frame: false },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    const handle = canvas.getByRole('separator', { name: 'Resize Main' })
    const rect = handle.getBoundingClientRect()
    await expect(rect.width).toBe(8)
    await expect(rect.left + 4).toBe(nav.getBoundingClientRect().right)
  },
}

// ---------------------------------------------------------------------------
// Responsive: the shell swaps to a `MobileNav` below 768.

/**
 * A phone, the size of Figma's Mobile Navigation frames (393 × 852). The test
 * runner sets the browser to it for the stories that name it; in Storybook
 * pick it from the Viewport toolbar, or just drag the canvas under 768.
 */
const phone = {
  viewport: {
    options: {
      phone: { name: 'Phone', styles: { width: '393px', height: '852px' } },
    },
  },
}

/** Every measurement the responsive stories make, read off the two bars. */
function measureBars(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<HTMLElement>('#shell')!
  const wide = root.querySelector<HTMLElement>('nav[data-wide-nav]')!
  const mobile = root.querySelector<HTMLElement>('nav[data-mobile-nav]')!
  return { root, wide, mobile, shell: getComputedStyle(root) }
}

/**
 * **Give the shell a `MobileNav` and it swaps to it on a phone.** No prop:
 * the shell reads the bar's presence in CSS, so below 768 the rail hides, the
 * frame turns into a column, and the bar sits at the bottom of it — *in* the
 * frame, not pinned over the page. The shell's 8px is exactly the inset Figma
 * draws round the phone bar, the content needs no padding for a bar that
 * covers nothing, and `frame={false}` docks it to the edge like the rail.
 *
 * The sheet is the rail's own tree (`sections`, written once), plus the
 * account rows as a last section; the bar's utilities are icon-only. Above
 * 768 the same children are the ordinary rail-and-page shell, untouched.
 *
 * Write the bar **after** the page for the bottom, before it for the top —
 * where it appears is where it is in the DOM, so the tab order matches.
 */
export const Responsive: Story = {
  args: {
    children: (
      <>
        <Rail />
        <Page />
        <Phone />
      </>
    ),
  },
  parameters: { ...phone, controls: { disable: true } },
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement, step }) => {
    const { root, wide, mobile, shell } = measureBars(canvasElement)
    const canvas = within(canvasElement)

    await step('the rail is gone and the bar is the one landmark named Main', async () => {
      await expect(getComputedStyle(wide).display).toBe('none')
      await expect(mobile.checkVisibility()).toBe(true)
      const visible = [...canvasElement.querySelectorAll('nav[aria-label="Main"]')].filter((n) =>
        n.checkVisibility(),
      )
      await expect(visible).toHaveLength(1)
      await expect(visible[0]).toBe(mobile)
    })

    await step('the bar sits in the frame, not over the page', async () => {
      await expect(shell.flexDirection).toBe('column')
      await expect(getComputedStyle(mobile).position).toBe('static')
      // 8 in from the bottom and both sides — Figma's 377 in 393 — with the
      // shell's own padding doing it, and the shadow the floating shell gives.
      const frame = root.getBoundingClientRect()
      const bar = mobile.getBoundingClientRect()
      await expect(frame.width).toBe(393)
      await expect(bar.left).toBe(frame.left + 8)
      await expect(bar.width).toBe(frame.width - 16)
      await expect(bar.bottom).toBe(frame.bottom - 8)
      await expect(getComputedStyle(mobile).boxShadow).not.toBe('none')
      // The page ends 8 above the bar: the frame's gap, nothing overlapped.
      const page = canvasElement.querySelector<HTMLElement>('main')!.parentElement!
      await expect(page.getBoundingClientRect().bottom).toBe(bar.top - 8)
      // Still one scroll region, and it is not the document.
      const doc = document.documentElement
      await expect(doc.scrollHeight).toBe(doc.clientHeight)
    })

    await step('the pill opens the sheet, on the rail\'s tree', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Dashboard/ }))
      const sheet = await within(document.body).findByRole('dialog', { name: 'Main' })
      // It slides in over `duration-medium`, a Drawer's bottom sheet; the
      // numbers are at the end of it. Portalled to <body>, so the viewport.
      await waitFor(() => expect(sheet.getBoundingClientRect().bottom).toBe(window.innerHeight))
      await expect(sheet).toHaveAttribute('data-swipe-direction', 'down')
      await expect(within(sheet).getByRole('link', { name: /Inbox/ })).toBeVisible()
      await expect(within(sheet).getByRole('link', { name: /Hi, Nathan!/ })).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    })
  },
}

/**
 * The bar before the page, so it sits at the top of the frame. Same 8px, from
 * the other edge; the sheet still comes from the bottom, where the hand is.
 */
export const ResponsiveTop: Story = {
  name: 'Responsive, top placement',
  args: {
    children: (
      <>
        <Rail />
        <Phone placement="top" />
        <Page />
      </>
    ),
  },
  parameters: { ...phone, controls: { disable: true } },
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    const { root, wide, mobile } = measureBars(canvasElement)
    await expect(getComputedStyle(wide).display).toBe('none')
    const frame = root.getBoundingClientRect()
    const bar = mobile.getBoundingClientRect()
    await expect(bar.top).toBe(frame.top + 8)
    await expect(bar.left).toBe(frame.left + 8)
    const page = canvasElement.querySelector<HTMLElement>('main')!.parentElement!
    await expect(page.getBoundingClientRect().top).toBe(bar.bottom + 8)
  },
}

/**
 * `frame={false}` on a phone: the bar is full-bleed against the bottom edge,
 * square-cornered and flush, for the reason the docked rail is — a rounded
 * corner at the edge of the screen shows canvas behind it.
 */
export const ResponsiveDocked: Story = {
  name: 'Responsive, docked',
  args: { ...Responsive.args, frame: false },
  parameters: { ...phone, controls: { disable: true } },
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    const { root, mobile } = measureBars(canvasElement)
    const frame = root.getBoundingClientRect()
    const bar = mobile.getBoundingClientRect()
    await expect(bar.left).toBe(frame.left)
    await expect(bar.width).toBe(frame.width)
    await expect(bar.bottom).toBe(frame.bottom)
    await expect(getComputedStyle(mobile).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(mobile).boxShadow).toBe('none')
  },
}

/**
 * The same children at a desktop width: the rail, the page, and no phone bar
 * anywhere — `display: none`, so out of the accessibility tree, which is what
 * lets both bars share one `aria-label`.
 */
export const ResponsiveWide: Story = {
  name: 'Responsive, wide',
  args: Responsive.args,
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const { wide, mobile, shell } = measureBars(canvasElement)
    await expect(shell.flexDirection).toBe('row')
    await expect(getComputedStyle(mobile).display).toBe('none')
    await expect(wide.checkVisibility()).toBe(true)
    await expect(wide.getBoundingClientRect().width).toBe(224)
    const visible = [...canvasElement.querySelectorAll('nav[aria-label="Main"]')].filter((n) =>
      n.checkVisibility(),
    )
    await expect(visible).toHaveLength(1)
  },
}

/**
 * `navigation="top"` needs nothing new: `ResponsiveNav` is already a `TopNav`
 * and a `MobileNav` side by side, and inside the shell the phone bar takes its
 * place in the frame like any other. The bar lands at the bottom because the
 * `ResponsiveNav` renders it after the top bar — put the `ResponsiveNav`
 * after the page if the phone bar should be under the content.
 */
export const ResponsiveTopNavigation: Story = {
  name: 'Responsive, top navigation',
  args: {
    navigation: 'top',
    children: (
      <>
        <ResponsiveNav
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
          pages={
            <>
              <NavItem href="#home" selected>
                Home
              </NavItem>
              <NavItem href="#products">Products</NavItem>
              <NavItem href="#about">About</NavItem>
            </>
          }
          sections={
            <SideNav.Section header="Shop">
              <NavItem href="#home" startIcon={House} selected>
                Home
              </NavItem>
              <NavItem href="#products" startIcon={ShoppingCart}>
                Products
              </NavItem>
              <NavItem href="#about">About</NavItem>
            </SideNav.Section>
          }
        />
        <AppShell.Page>
          <AppShell.Content>
            <PageTitle />
            <Dashboard />
          </AppShell.Content>
        </AppShell.Page>
      </>
    ),
  },
  parameters: { ...phone, controls: { disable: true } },
  globals: { viewport: { value: 'phone' } },
  play: async ({ canvasElement }) => {
    const { root, wide, mobile } = measureBars(canvasElement)
    await expect(getComputedStyle(wide).display).toBe('none')
    await expect(getComputedStyle(mobile).position).toBe('static')
    const frame = root.getBoundingClientRect()
    const bar = mobile.getBoundingClientRect()
    await expect(bar.top).toBe(frame.top + 8)
    await expect(bar.width).toBe(frame.width - 16)
  },
}
