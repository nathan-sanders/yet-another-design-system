import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  Bell,
  ChartNoAxesColumn,
  CircleHelp,
  Ellipsis,
  Folder,
  House,
  Inbox,
  Info,
  PanelRight,
  Pencil,
  Trash,
} from 'lucide-react'

import { AppShell } from '../AppShell'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { BentoGrid } from '../BentoGrid'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Field } from '../Field'
import { Input } from '../Input'
import { Menu } from '../Menu'
import { MobileNav, NavItem, SideNav, TopNav } from '../Nav'
import { Logo } from '../Nav/story-logo'
import { TextArea } from '../TextArea'
import { TopBar } from '../TopBar'
import { Panel } from './Panel'

// ---------------------------------------------------------------------------
// Fixtures: the rail, the phone bar, a page of blocks, and what the panel
// holds. The same in every story so the only thing that changes is the panel.

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

function Rail() {
  return (
    <SideNav aria-label="Main" logo={<Logo />} utilities={<UtilityRows />}>
      {sections}
    </SideNav>
  )
}

function PhoneBar() {
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
    >
      {sections}
      <SideNav.Section header="Account">
        <UtilityRows />
      </SideNav.Section>
    </MobileNav>
  )
}

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

/** The page: a bar whose one action toggles the panel, and a grid of blocks under it. */
function Page({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <AppShell.Page>
      <TopBar
        end={
          <Button
            appearance="ghost"
            startIcon={PanelRight}
            aria-label="Details"
            aria-pressed={open}
            onClick={() => onOpenChange(!open)}
          />
        }
      />
      <AppShell.Content>
        <BentoGrid columns={2}>
          <BentoGrid.Cell colSpan={2}>
            <Block title="Overview">
              <p className="text-content-subtle">
                Open the details panel from the bar. It pushes this page over rather than covering
                it, and you can work in either.
              </p>
            </Block>
          </BentoGrid.Cell>
          <BentoGrid.Cell>
            <Block title="Activity">
              <p className="text-content-subtle">Nothing yet.</p>
            </Block>
          </BentoGrid.Cell>
          <BentoGrid.Cell>
            <Block title="Notes">
              <p className="text-content-subtle">Nothing yet.</p>
            </Block>
          </BentoGrid.Cell>
        </BentoGrid>
      </AppShell.Content>
    </AppShell.Page>
  )
}

/** What the panel holds: a title row, and a form that scrolls under it. */
function Details() {
  return (
    <>
      <Panel.Header
        icon={Info}
        actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Details options" />}
      >
        Details
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <Field label="Name">
          <Input defaultValue="Q3 engagement report" />
        </Field>
        <Field label="Owner">
          <Input defaultValue="Nathan Sanders" />
        </Field>
        <Field label="Description">
          <TextArea rows={4} placeholder="What this report is for" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button appearance="secondary">Discard</Button>
          <Button>Save</Button>
        </div>
      </Panel.Body>
    </>
  )
}

/**
 * A region beside the page that **pushes** the page over to make room, where
 * a `Drawer` slides over it. Non-modal: it is an `<aside>` — a landmark next
 * to the `<main>` — with no scrim and no focus trap, so the user works in
 * either and moves between them. Focus goes in when it opens and comes back
 * out when it closes; Escape closes it from inside.
 *
 * Every story fills the viewport, the AppShell stories' way: the shell is
 * `h-dvh` and the global decorator's padding is off.
 */
const meta = {
  title: 'Components/Panel',
  component: Panel,
  parameters: {
    layout: 'fullscreen',
    canvasPadding: false,
    controls: { disable: true },
  },
  // Every story renders its own shell; these only satisfy the required props.
  args: { 'aria-label': 'Details', children: null },
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

/** The elements every assertion reads. */
function measure(canvasElement: HTMLElement) {
  const shell = canvasElement.querySelector<HTMLElement>('#shell')!
  const page = shell.querySelector<HTMLElement>('main')!.parentElement!
  const aside = () => within(canvasElement).queryByRole('complementary', { name: 'Details' })
  const card = () => aside()?.firstElementChild?.firstElementChild as HTMLElement | undefined
  const handle = () =>
    within(canvasElement)
      .queryAllByRole('separator', { name: 'Resize Details' })
      .find((element) => element.checkVisibility())
  return { shell, page, aside, card, handle }
}

// ---------------------------------------------------------------------------
// Each story that changes state has a driven twin, DragAndDrop's arrangement:
// Storybook runs a play function the moment a story opens, and a Playground
// that opened, resized and closed itself on load read as an animation bug.
// The twins render the identical tree through the same function and drive it;
// the demos sit still. Stories whose play only *measures* keep it.

/** A shell with the panel on a `useState`, closed or open to start. */
function Shell({
  defaultOpen = false,
  resizable = false,
  side = 'right',
  mode,
  frame,
  floating,
  phone = false,
}: {
  defaultOpen?: boolean
  resizable?: boolean
  side?: 'right' | 'left'
  mode?: 'floating' | 'contained'
  frame?: boolean
  floating?: boolean
  phone?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panel = (
    <Panel
      aria-label="Details"
      side={side}
      open={open}
      onOpenChange={setOpen}
      resizable={resizable}
      floating={floating}
    >
      <Details />
    </Panel>
  )
  return (
    <AppShell id="shell" mode={mode} frame={frame}>
      <Rail />
      {side === 'left' && panel}
      <Page open={open} onOpenChange={setOpen} />
      {side === 'right' && panel}
      {phone && <PhoneBar />}
    </AppShell>
  )
}

/**
 * The ordinary shape: the bar's Details button toggles the panel, which slides
 * in from the right and pushes the page over. Closed, it is not in the DOM —
 * the page has the whole row, with no gap left where the panel was.
 */
export const Playground: Story = {
  render: () => <Shell />,
}

/** The same shell, driven: opened, measured, closed by Escape and by the ×. */
export const PlaygroundDriven: Story = {
  name: 'Playground, driven',
  render: () => <Shell />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const { shell, page, aside } = measure(canvasElement)
    const toggle = canvas.getByRole('button', { name: 'Details' })

    await step('closed, there is no panel and no gap', async () => {
      await expect(aside()).toBeNull()
      await expect(page.getBoundingClientRect().right).toBe(shell.getBoundingClientRect().right - 8)
    })

    await step('open, it is a landmark beside the page, 384 wide, 8 from it', async () => {
      await userEvent.click(toggle)
      const panel = await canvas.findByRole('complementary', {
        name: 'Details',
      })
      // It slides in over `duration-medium`; the number is at the end of it.
      await waitFor(() => expect(panel.getBoundingClientRect().width).toBe(384))
      await expect(panel.getBoundingClientRect().left).toBe(page.getBoundingClientRect().right + 8)
      await expect(panel.getBoundingClientRect().height).toBe(page.getBoundingClientRect().height)
      // Focus moved in — to the landmark itself, so a screen reader says its name.
      await expect(panel.contains(document.activeElement)).toBe(true)
      // And the page is not inert: both are live.
      await expect(canvasElement.closest('[aria-hidden="true"]')).toBeNull()
    })

    await step(
      'settled, nothing clips: the transition marker is gone and the shadow paints',
      async () => {
        const panel = aside()!
        await waitFor(() => expect(panel.hasAttribute('data-transitioning')).toBe(false))
        await expect(getComputedStyle(panel.firstElementChild!).overflow).toBe('visible')
        await expect(
          getComputedStyle(panel.firstElementChild!.firstElementChild!).boxShadow,
        ).not.toBe('none')
      },
    )

    await step("the header is the TopBar's height, with a close on the end", async () => {
      const panel = canvas.getByRole('complementary', { name: 'Details' })
      const heading = within(panel).getByRole('heading', {
        name: 'Details',
        level: 2,
      })
      const header = heading.closest('div')!.parentElement!
      await expect(header.getBoundingClientRect().height).toBe(56)
      await expect(getComputedStyle(header).paddingTop).toBe('12px')
      await expect(within(panel).getByRole('button', { name: 'Close' })).toBeVisible()
    })

    await step('Escape closes it from inside, and focus returns to the toggle', async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(aside()).toBeNull())
      await expect(document.activeElement).toBe(toggle)
      await expect(page.getBoundingClientRect().right).toBe(shell.getBoundingClientRect().right - 8)
    })

    await step('the × closes it too', async () => {
      await userEvent.click(toggle)
      const panel = await canvas.findByRole('complementary', {
        name: 'Details',
      })
      await userEvent.click(within(panel).getByRole('button', { name: 'Close' }))
      await waitFor(() => expect(aside()).toBeNull())
      await expect(document.activeElement).toBe(toggle)
    })
  },
}

/**
 * `resizable` draws the handle on the seam — exactly the shell's 8px gap, on
 * the panel's near edge. Drag it, or focus it and use the arrows: ArrowLeft
 * grows a right-hand panel, because the panel is on the far side of the line.
 */
export const Resizable: Story = {
  render: () => <Shell defaultOpen resizable />,
}

/** The same shell, driven by the keyboard. */
export const ResizableKeyboard: Story = {
  name: 'Resizable, keyboard',
  render: () => <Shell defaultOpen resizable />,
  play: async ({ canvasElement, step }) => {
    const { page, aside, handle } = measure(canvasElement)
    const panel = aside()!
    const separator = handle()!
    const width = () => panel.getBoundingClientRect().width

    await step("the handle is the gap: 8 wide, from the page's edge to the panel's", async () => {
      await expect(separator).toHaveAttribute('aria-orientation', 'vertical')
      await expect(separator).toHaveAttribute('aria-valuenow', '384')
      await expect(separator).toHaveAttribute('aria-valuemin', '320')
      await expect(separator).toHaveAttribute('aria-valuemax', '640')
      await expect(separator).toHaveAttribute('aria-valuetext', '384 pixels')
      const rect = separator.getBoundingClientRect()
      await expect(rect.width).toBe(8)
      await expect(rect.left).toBe(page.getBoundingClientRect().right)
      await expect(rect.right).toBe(panel.getBoundingClientRect().left)
      await expect(width()).toBe(384)
    })

    await step('ArrowLeft grows it, and the page gives way', async () => {
      separator.focus()
      await userEvent.keyboard('{ArrowLeft}')
      await expect(separator).toHaveAttribute('aria-valuenow', '392')
      await waitFor(() => expect(width()).toBe(392))
      await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}')
      await expect(separator).toHaveAttribute('aria-valuenow', '432')
      await userEvent.keyboard('{ArrowRight}')
      await expect(separator).toHaveAttribute('aria-valuenow', '424')
      await userEvent.keyboard('{End}')
      await expect(separator).toHaveAttribute('aria-valuenow', '640')
      await waitFor(() => expect(width()).toBe(640))
      await userEvent.keyboard('{Home}')
      await expect(separator).toHaveAttribute('aria-valuenow', '320')
      await waitFor(() => expect(width()).toBe(320))
      // Still exactly the gap.
      const rect = separator.getBoundingClientRect()
      await expect(rect.left).toBe(page.getBoundingClientRect().right)
      await expect(rect.right).toBe(panel.getBoundingClientRect().left)
    })

    await step('a panel that starts open takes no focus', async () => {
      await expect(panel.contains(document.activeElement)).toBe(true)
      // …only the handle we just focused. Blur it and nothing inside is focused.
      separator.blur()
      await expect(panel.contains(document.activeElement)).toBe(false)
    })
  },
}

/**
 * `side="left"`: written **before** the page, so it sits between the rail and
 * the page, enters from the left, and carries its handle on its right edge.
 * DOM order is layout order, and tab order.
 */
export const Left: Story = {
  render: () => <Shell defaultOpen resizable side="left" />,
}

/** The same shell, driven: the handle is on the right edge and ArrowRight grows it. */
export const LeftKeyboard: Story = {
  name: 'Left, keyboard',
  render: () => <Shell defaultOpen resizable side="left" />,
  play: async ({ canvasElement }) => {
    const { page, aside, handle } = measure(canvasElement)
    const panel = aside()!
    const separator = handle()!
    await expect(panel.getBoundingClientRect().right).toBe(page.getBoundingClientRect().left - 8)
    const rect = separator.getBoundingClientRect()
    await expect(rect.left).toBe(panel.getBoundingClientRect().right)
    await expect(rect.right).toBe(page.getBoundingClientRect().left)
    separator.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(separator).toHaveAttribute('aria-valuenow', '392')
    await waitFor(() => expect(panel.getBoundingClientRect().width).toBe(392))
  },
}

/**
 * The floating shell: the panel takes its shadow from the shell the way the
 * rail does, so a caller who wrote `mode="floating"` gets a lifted card
 * without saying so twice. An explicit `floating={false}` still wins.
 */
export const Floating: Story = {
  render: () => <Shell defaultOpen />,
  play: async ({ canvasElement }) => {
    const { card } = measure(canvasElement)
    const style = getComputedStyle(card()!)
    await expect(style.boxShadow).not.toBe('none')
    await expect(style.borderTopLeftRadius).toBe('12px')
    await expect(style.borderTopWidth).toBe('1px')
  },
}

/**
 * The same shell with `floating={false}` on the panel: flat, by the caller's
 * word rather than the shell's.
 */
export const FloatingOverridden: Story = {
  name: 'Floating, overridden',
  render: () => <Shell defaultOpen floating={false} />,
  play: async ({ canvasElement }) => {
    const { card } = measure(canvasElement)
    await expect(getComputedStyle(card()!).boxShadow).toBe('none')
  },
}

/**
 * A contained shell on the canvas nav theme: the page is a card and the panel
 * is a second one, flush like the rail, 8 apart. The panel is opened from a
 * Menu item rather than a button — the ordinary relationship between the two
 * — and `finalFocus` says where focus goes when it closes, because the item
 * that opened it is gone by then.
 */
function ContainedShell() {
  const [open, setOpen] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)
  return (
    <AppShell id="shell" mode="contained">
      <Rail />
      <AppShell.Page>
        <TopBar
          end={
            <Menu>
              <Menu.Trigger
                render={
                  <Button ref={moreRef} appearance="ghost" startIcon={Ellipsis} aria-label="More" />
                }
              />
              <Menu.Popup align="end">
                <Menu.Group>
                  <Menu.Item startIcon={Pencil} onClick={() => setOpen(true)}>
                    Edit details
                  </Menu.Item>
                  <Menu.Item startIcon={Trash} destructive>
                    Delete
                  </Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
          }
        />
        <AppShell.Content>
          <BentoGrid columns={2}>
            <BentoGrid.Cell colSpan={2}>
              <Block title="Overview">
                <p className="text-content-subtle">Open the details from the More menu.</p>
              </Block>
            </BentoGrid.Cell>
          </BentoGrid>
        </AppShell.Content>
      </AppShell.Page>
      <Panel aria-label="Details" open={open} onOpenChange={setOpen} finalFocus={moreRef}>
        <Details />
      </Panel>
    </AppShell>
  )
}

export const InContext: Story = {
  globals: { navTheme: 'canvas' },
  render: () => <ContainedShell />,
}

/** The same screen, driven: the menu opens it, the × closes it, focus lands on More. */
export const InContextDriven: Story = {
  name: 'InContext, driven',
  globals: { navTheme: 'canvas' },
  render: () => <ContainedShell />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const { page, aside, card } = measure(canvasElement)

    await step('a menu item opens it, and focus lands inside', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'More' }))
      await userEvent.click(
        await within(document.body).findByRole('menuitem', {
          name: 'Edit details',
        }),
      )
      const panel = await canvas.findByRole('complementary', {
        name: 'Details',
      })
      await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))
      await waitFor(() =>
        expect(panel.getBoundingClientRect().left).toBe(page.getBoundingClientRect().right + 8),
      )
    })

    await step('flush in a contained shell: a bordered card, no shadow', async () => {
      const style = getComputedStyle(card()!)
      await expect(style.borderTopLeftRadius).toBe('12px')
      await expect(style.borderTopWidth).toBe('1px')
      await expect(style.boxShadow).toBe('none')
      await expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    })

    await step('closing from the × puts focus on the More button', async () => {
      const panel = aside()!
      await userEvent.click(within(panel).getByRole('button', { name: 'Close' }))
      await waitFor(() => expect(aside()).toBeNull())
      await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'More' }))
    })
  },
}

/**
 * `frame={false}`: the panel squares its corners and drops its shadow like
 * the rail, and the handle straddles the seam — still 8, 4 over each side.
 */
export const Docked: Story = {
  render: () => <Shell defaultOpen resizable frame={false} />,
  play: async ({ canvasElement }) => {
    const { page, aside, card, handle } = measure(canvasElement)
    const panel = aside()!
    const style = getComputedStyle(card()!)
    await expect(style.borderTopLeftRadius).toBe('0px')
    await expect(style.boxShadow).toBe('none')
    await expect(panel.getBoundingClientRect().left).toBe(page.getBoundingClientRect().right)
    const rect = handle()!.getBoundingClientRect()
    await expect(rect.width).toBe(8)
    await expect(rect.left + 4).toBe(panel.getBoundingClientRect().left)
  },
}

/** A column shell: a top bar, the page, and the panel under it. */
function TopShell() {
  const [open, setOpen] = useState(true)
  return (
    <AppShell id="shell" navigation="top">
      <TopNav aria-label="Main" logo={<Logo />}>
        <NavItem href="#home" selected>
          Home
        </NavItem>
        <NavItem href="#products">Products</NavItem>
        <NavItem href="#about">About</NavItem>
      </TopNav>
      <Page open={open} onOpenChange={setOpen} />
      <Panel aria-label="Details" open={open} onOpenChange={setOpen} resizable>
        <Details />
      </Panel>
    </AppShell>
  )
}

/**
 * **A `navigation="top"` shell is a column, so the panel is under the page at
 * every width** — full width, sized by height, the handle horizontal — the
 * phone's arrangement read off the shell's context rather than the
 * breakpoint. A column has no "beside the page" to be.
 */
export const TopNavigation: Story = {
  name: 'Top navigation',
  render: () => <TopShell />,
}

/** The same shell, driven: the column measured and the split dragged by keyboard. */
export const TopNavigationKeyboard: Story = {
  name: 'Top navigation, keyboard',
  render: () => <TopShell />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const { shell, page, aside, handle } = measure(canvasElement)
    const panel = aside()!

    await step('under the page, full width, 320 tall', async () => {
      await expect(getComputedStyle(shell).flexDirection).toBe('column')
      const rect = panel.getBoundingClientRect()
      const frame = shell.getBoundingClientRect()
      await expect(rect.top).toBe(page.getBoundingClientRect().bottom + 8)
      await expect(rect.width).toBe(frame.width - 16)
      await expect(rect.height).toBe(320)
      await expect(rect.bottom).toBe(frame.bottom - 8)
    })

    await step('the handle is horizontal at a desktop width', async () => {
      await expect(canvas.getAllByRole('separator', { name: 'Resize Details' })).toHaveLength(1)
      const separator = handle()!
      await expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
      await expect(separator.getBoundingClientRect().height).toBe(8)
      await expect(separator.getBoundingClientRect().top).toBe(page.getBoundingClientRect().bottom)
      separator.focus()
      await userEvent.keyboard('{ArrowUp}')
      await expect(separator).toHaveAttribute('aria-valuenow', '328')
      await waitFor(() => expect(panel.getBoundingClientRect().height).toBe(328))
    })
  },
}

/**
 * A phone, the size of Figma's Mobile Navigation frames (393 × 852). The test
 * runner sets the browser to it; in Storybook pick it from the Viewport
 * toolbar, or drag the canvas under 768.
 */
const phone = {
  viewport: {
    options: {
      phone: { name: 'Phone', styles: { width: '393px', height: '852px' } },
    },
  },
}

/**
 * **Below 768 the panel is under the page, not beside it.** The shell turns
 * into a column, the panel takes the full width and a height instead, and
 * the handle turns horizontal so the user drags the page/panel split —
 * ArrowUp grows it, because the panel is below the line. The phone bar stays
 * under both. Above 768 the same children are the desktop shell.
 */
export const Phone: Story = {
  parameters: phone,
  globals: { viewport: { value: 'phone' } },
  render: () => <Shell defaultOpen resizable phone />,
}

/** The same phone, driven: the column measured and the split dragged by keyboard. */
export const PhoneKeyboard: Story = {
  name: 'Phone, keyboard',
  parameters: phone,
  globals: { viewport: { value: 'phone' } },
  render: () => <Shell defaultOpen resizable phone />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const { shell, page, aside, handle } = measure(canvasElement)
    const panel = aside()!
    const bar = shell.querySelector<HTMLElement>('nav[data-mobile-nav]')!
    const height = () => panel.getBoundingClientRect().height

    await step('a column: page, panel, bar, each 8 apart', async () => {
      await expect(getComputedStyle(shell).flexDirection).toBe('column')
      const frame = shell.getBoundingClientRect()
      await expect(frame.width).toBe(393)
      const rect = panel.getBoundingClientRect()
      await expect(rect.top).toBe(page.getBoundingClientRect().bottom + 8)
      await expect(rect.left).toBe(frame.left + 8)
      await expect(rect.width).toBe(frame.width - 16)
      await expect(rect.height).toBe(320)
      await expect(bar.getBoundingClientRect().top).toBe(rect.bottom + 8)
      // Still one scroll region, and it is not the document.
      const doc = document.documentElement
      await expect(doc.scrollHeight).toBe(doc.clientHeight)
    })

    await step('the handle is horizontal, on the seam above the panel', async () => {
      // Two in the DOM, one in the accessibility tree: the role query already
      // skips the `display: none` one, which is the point of the swap.
      await expect(panel.querySelectorAll('[role="separator"]')).toHaveLength(2)
      const separators = canvas.getAllByRole('separator', {
        name: 'Resize Details',
      })
      await expect(separators).toHaveLength(1)
      const separator = separators[0]
      await expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
      await expect(separator).toHaveAttribute('aria-valuenow', '320')
      const rect = separator.getBoundingClientRect()
      await expect(rect.height).toBe(8)
      await expect(rect.top).toBe(page.getBoundingClientRect().bottom)
      await expect(rect.bottom).toBe(panel.getBoundingClientRect().top)
    })

    await step('ArrowUp grows the panel and the page gives way', async () => {
      const separator = handle()!
      separator.focus()
      await userEvent.keyboard('{ArrowUp}')
      await expect(separator).toHaveAttribute('aria-valuenow', '328')
      await waitFor(() => expect(height()).toBe(328))
      await userEvent.keyboard('{ArrowDown}')
      await expect(separator).toHaveAttribute('aria-valuenow', '320')
      await waitFor(() => expect(height()).toBe(320))
      await expect(bar.getBoundingClientRect().top).toBe(panel.getBoundingClientRect().bottom + 8)
    })
  },
}

// ---------------------------------------------------------------------------
// Stacking: a panel written inside a panel.

/**
 * A three-level stack: Details, an Edit owner panel opened from its body, and
 * a Confirm panel opened from *that* one's Save. Each is an ordinary `Panel`
 * on a `useState`, written inside the parent's Body — the nesting is the
 * whole API, Base UI's arrangement for its drawers.
 */
function Stack({
  depth = 1,
  resizable = false,
  phone = false,
}: {
  depth?: 0 | 1 | 2
  resizable?: boolean
  phone?: boolean
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(depth >= 1)
  const [confirming, setConfirming] = useState(depth >= 2)
  return (
    <AppShell id="shell">
      <Rail />
      <Page open={open} onOpenChange={setOpen} />
      <Panel aria-label="Details" open={open} onOpenChange={setOpen} resizable={resizable}>
        <Panel.Header icon={Info}>Details</Panel.Header>
        <Panel.Body className="flex flex-col gap-4">
          <Field label="Name">
            <Input defaultValue="Q3 engagement report" />
          </Field>
          <Field label="Owner">
            <Input value="Nathan Sanders" readOnly />
          </Field>
          <div className="flex justify-end">
            <Button appearance="secondary" startIcon={Pencil} onClick={() => setEditing(true)}>
              Edit owner
            </Button>
          </div>
          <Panel aria-label="Edit owner" open={editing} onOpenChange={setEditing}>
            <Panel.Header icon={Pencil}>Edit owner</Panel.Header>
            <Panel.Body className="flex flex-col gap-4">
              <Field label="Owner">
                <Input defaultValue="Priya Natarajan" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button appearance="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setConfirming(true)}>Save</Button>
              </div>
              <Panel aria-label="Confirm change" open={confirming} onOpenChange={setConfirming}>
                <Panel.Header>Confirm change</Panel.Header>
                <Panel.Body className="flex flex-col gap-4">
                  <p className="text-content-subtle">
                    Reassign this report to Priya? They will be notified, and you will lose the
                    ability to edit it.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button appearance="secondary" onClick={() => setConfirming(false)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setConfirming(false)
                        setEditing(false)
                      }}
                    >
                      Reassign
                    </Button>
                  </div>
                </Panel.Body>
              </Panel>
            </Panel.Body>
          </Panel>
        </Panel.Body>
      </Panel>
      {phone && <PhoneBar />}
    </AppShell>
  )
}

/** The three asides and their cards, by name. */
function level(canvasElement: HTMLElement, name: string) {
  const aside = within(canvasElement).queryByRole('complementary', { name })
  const card = aside?.firstElementChild?.firstElementChild as HTMLElement | undefined
  const content = card?.firstElementChild as HTMLElement | undefined
  return { aside, card, content }
}

/**
 * **A panel inside a panel stacks.** Write a `Panel` inside a `Panel.Body`
 * and it slides in over its parent; each level behind the front one steps
 * 12px toward the page and loses 12px at each end — Figma's `Panel Stacking`
 * — and the page moves over by the same 12. The parent's content fades and
 * goes inert while it is covered; Escape and the × close only the front one.
 * Nested panels take the root's side and width, so only the root has a
 * handle.
 */
export const Stacked: Story = {
  render: () => <Stack />,
}

/** The same stack, driven: two levels opened, measured against the mock, and closed one at a time. */
export const StackedDriven: Story = {
  name: 'Stacked, driven',
  render: () => <Stack depth={0} resizable />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const { page, handle } = measure(canvasElement)
    const root = () => level(canvasElement, 'Details')
    const middle = () => level(canvasElement, 'Edit owner')
    const front = () => level(canvasElement, 'Confirm change')
    const rect = (element: Element | null | undefined) => element!.getBoundingClientRect()

    await step('a control inside the panel opens a second one over it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit owner' }))
      const aside = await canvas.findByRole('complementary', {
        name: 'Edit owner',
      })
      await expect(aside).toHaveAttribute('data-nested')
      // Portalled into the root's aside, not into the row.
      await expect(root().aside!.contains(aside)).toBe(true)
      await waitFor(() => expect(rect(aside).width).toBe(384))
      await expect(aside.contains(document.activeElement)).toBe(true)
    })

    await step('and a third from the second', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
      await canvas.findByRole('complementary', { name: 'Confirm change' })
      await waitFor(() => expect(rect(root().aside).width).toBe(384 + 24))
    })

    await step(
      "the mock's numbers: 12 toward the page and 12 off each end, per level",
      async () => {
        const region = rect(root().aside)
        await expect(root().aside).toHaveAttribute('data-nested-panel-open')
        await expect(root().aside!.style.getPropertyValue('--nested-panels')).toBe('2')
        await expect(middle().aside).toHaveAttribute('data-nested-panel-open')
        await expect(front().aside).not.toHaveAttribute('data-nested-panel-open')

        const top = rect(front().card)
        await expect(top.right).toBe(region.right)
        await expect(top.top).toBe(region.top)
        await expect(top.height).toBe(region.height)
        await expect(top.width).toBe(384)

        const behind = rect(middle().card)
        await expect(behind.right).toBe(region.right - 12)
        await expect(behind.top).toBe(region.top + 12)
        await expect(behind.height).toBe(region.height - 24)
        await expect(behind.width).toBe(384)

        const back = rect(root().card)
        await expect(back.right).toBe(region.right - 24)
        await expect(back.top).toBe(region.top + 24)
        await expect(back.height).toBe(region.height - 48)
        await expect(back.width).toBe(384)

        // The page moved over 24 more, and the handle is still on the seam.
        await expect(rect(page).right).toBe(region.left - 8)
        await expect(rect(handle()).left).toBe(rect(page).right)
        await expect(rect(handle()).right).toBe(region.left)
      },
    )

    await step('a covered panel keeps its surface and loses its content', async () => {
      await expect(root().content).toHaveProperty('inert', true)
      await expect(middle().content).toHaveProperty('inert', true)
      await expect(front().content).toHaveProperty('inert', false)
      await waitFor(() => expect(getComputedStyle(root().content!).opacity).toBe('0'))
      await expect(getComputedStyle(root().card!).boxShadow).not.toBe('none')
      await expect(getComputedStyle(front().content!).opacity).toBe('1')
    })

    await step(
      'Escape closes only the front panel, and focus returns to what opened it',
      async () => {
        await userEvent.keyboard('{Escape}')
        await waitFor(() => expect(front().aside).toBeNull())
        await expect(middle().aside).not.toBeNull()
        await expect(root().aside).not.toBeNull()
        await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Save' }))
        await waitFor(() => expect(rect(root().aside).width).toBe(384 + 12))
        await expect(root().content).toHaveProperty('inert', true)
        await expect(middle().content).toHaveProperty('inert', false)
      },
    )

    await step('the × on the second closes it, and the root is whole again', async () => {
      await userEvent.click(within(middle().aside!).getByRole('button', { name: 'Close' }))
      await waitFor(() => expect(middle().aside).toBeNull())
      await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Edit owner' }))
      await waitFor(() => expect(rect(root().aside).width).toBe(384))
      await expect(root().aside).not.toHaveAttribute('data-nested-panel-open')
      await expect(root().content).toHaveProperty('inert', false)
      await waitFor(() => expect(getComputedStyle(root().content!).opacity).toBe('1'))
      await expect(rect(root().card).height).toBe(rect(root().aside).height)
    })

    await step('the peeking edge of a level is a way back to it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit owner' }))
      await canvas.findByRole('complementary', { name: 'Edit owner' })
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
      await canvas.findByRole('complementary', { name: 'Confirm change' })
      await waitFor(() => expect(rect(root().aside).width).toBe(384 + 24))
      await expect(getComputedStyle(middle().card!).cursor).toBe('pointer')
      await expect(getComputedStyle(front().card!).cursor).not.toBe('pointer')

      // One level: a click on the middle card's edge closes the front panel only.
      await userEvent.click(middle().card!)
      await waitFor(() => expect(front().aside).toBeNull())
      await expect(middle().aside).not.toBeNull()
      // Focus went where the click went — the middle panel's landmark.
      await expect(document.activeElement).toBe(middle().aside)

      // A click inside the front panel is not a click on the card behind it.
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
      await canvas.findByRole('complementary', { name: 'Confirm change' })
      await userEvent.click(within(front().aside!).getByRole('button', { name: 'Back' }))
      await waitFor(() => expect(front().aside).toBeNull())
      await expect(middle().aside).not.toBeNull()

      // Two levels: a click on the root card's edge closes everything in front of it.
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
      await canvas.findByRole('complementary', { name: 'Confirm change' })
      await userEvent.click(root().card!)
      await waitFor(() => expect(front().aside).toBeNull())
      await waitFor(() => expect(middle().aside).toBeNull())
      await expect(document.activeElement).toBe(root().aside)
      await waitFor(() => expect(rect(root().aside).width).toBe(384))
      await expect(getComputedStyle(root().card!).cursor).not.toBe('pointer')
    })
  },
}

/**
 * **On a phone the stack peeks out above the front card.** The panel is under
 * the page there, so the page side is the top: each level behind steps 12px
 * up and 12px in from each side, and the split grows by the same 12.
 */
export const StackedPhone: Story = {
  name: 'Stacked, phone',
  parameters: phone,
  globals: { viewport: { value: 'phone' } },
  render: () => <Stack depth={2} phone />,
  play: async ({ canvasElement }) => {
    const { shell, page } = measure(canvasElement)
    const root = level(canvasElement, 'Details')
    const middle = level(canvasElement, 'Edit owner')
    const front = level(canvasElement, 'Confirm change')
    const rect = (element: Element | null | undefined) => element!.getBoundingClientRect()
    const bar = shell.querySelector<HTMLElement>('nav[data-mobile-nav]')!

    await expect(getComputedStyle(shell).flexDirection).toBe('column')
    // The chain reports up after it mounts, and the height eases to the count.
    await waitFor(() => expect(rect(root.aside).height).toBe(320 + 24))
    const region = rect(root.aside)
    await expect(region.width).toBe(393 - 16)
    await expect(region.top).toBe(rect(page).bottom + 8)
    await expect(rect(bar).top).toBe(region.bottom + 8)

    const top = rect(front.card)
    await expect(top.bottom).toBe(region.bottom)
    await expect(top.left).toBe(region.left)
    await expect(top.width).toBe(region.width)
    await expect(top.height).toBe(320)

    const behind = rect(middle.card)
    await expect(behind.bottom).toBe(region.bottom - 12)
    await expect(behind.left).toBe(region.left + 12)
    await expect(behind.width).toBe(region.width - 24)
    await expect(behind.height).toBe(320)

    const back = rect(root.card)
    await expect(back.top).toBe(region.top)
    await expect(back.left).toBe(region.left + 24)
    await expect(back.width).toBe(region.width - 48)
    await expect(back.height).toBe(320)

    // The front card is the one on top — a `defaultOpen` chain once painted
    // the middle over it — and the levels behind are inert.
    const hit = document.elementFromPoint(top.left + top.width / 2, top.top + top.height / 2)
    await expect(hit!.closest('aside')).toBe(front.aside)
    await waitFor(() => expect(middle.content).toHaveProperty('inert', true))
    await expect(root.content).toHaveProperty('inert', true)
    await expect(front.content).toHaveProperty('inert', false)

    // Still one scroll region, and it is not the document.
    const doc = document.documentElement
    await expect(doc.scrollHeight).toBe(doc.clientHeight)
  },
}
