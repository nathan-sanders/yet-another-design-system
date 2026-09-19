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
import { MobileNav, NavItem, SideNav } from '../Nav'
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
        actions={
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
          actions={
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
