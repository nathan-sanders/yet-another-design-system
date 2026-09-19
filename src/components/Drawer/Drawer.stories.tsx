import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Ellipsis, ListFilter, Pencil, Trash } from 'lucide-react'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Field } from '../Field'
import { Input } from '../Input'
import { Menu } from '../Menu'
import { Drawer } from './Drawer'

/**
 * A surface that slides in from an edge of the screen, **over** the page —
 * where a `Panel` pushes the page aside. Modal by default: a scrim, a focus
 * trap, and the page inert until it is dismissed. Swipe it toward its edge
 * to dismiss on a touch screen; Escape, the scrim and the × do it everywhere.
 *
 * Below 768 a side drawer becomes a bottom sheet.
 */
const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  // A compound component: everything interesting lives on `Drawer.Popup` and
  // on the Root's behavior props. Dialog's convention, for its reason.
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="flex min-h-128 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

/** What every drawer here holds: a title row, a form, a footer. */
function Filters() {
  return (
    <>
      <Drawer.Header
        icon={ListFilter}
        actions={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Filter options" />}
      >
        Filters
      </Drawer.Header>
      <Drawer.Body className="flex flex-col gap-4">
        <Field label="Search">
          <Input placeholder="Name or owner" />
        </Field>
        <Checkbox.Group aria-label="Status" defaultValue={['draft']}>
          <Checkbox name="draft" label="Draft" />
          <Checkbox name="review" label="In review" />
          <Checkbox name="published" label="Published" />
        </Checkbox.Group>
        <div className="flex justify-end gap-2">
          <Drawer.Close render={<Button appearance="secondary">Reset</Button>} />
          <Drawer.Close render={<Button>Apply</Button>} />
        </div>
      </Drawer.Body>
    </>
  )
}

function renderPlayground() {
  return (
    <Drawer>
      <Drawer.Trigger
        render={
          <Button appearance="secondary" startIcon={ListFilter}>
            Filters
          </Button>
        }
      />
      <Drawer.Popup>
        <Filters />
      </Drawer.Popup>
    </Drawer>
  )
}

/**
 * The ordinary shape. Click the trigger to open it; Escape, the scrim, the ×
 * or either button closes it, and focus returns to the trigger on the way out.
 *
 * **Opened in `play`, never `defaultOpen`** — a modal drawer inerts everything
 * outside its portal, and on a docs page that is every other story. Dialog's
 * rule, for Dialog's reason. It opens and stays open; the closing is driven
 * in the twin below, so this one sits still once it is there.
 */
export const Playground: Story = {
  render: renderPlayground,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Filters' })

    await step('open: a dialog named by its title, focus inside, the page inert', async () => {
      await userEvent.click(trigger)
      const dialog = await within(document.body).findByRole('dialog')
      await waitFor(() => expect(dialog).toBeVisible())
      await expect(dialog).toHaveAccessibleName('Filters')
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
      await expect(canvasElement.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    await step('flush to the right edge, 384 wide, the full height', async () => {
      const dialog = within(document.body).getByRole('dialog')
      // It slides in over `duration-medium`; the numbers are at the end of it.
      await waitFor(() => expect(dialog.getBoundingClientRect().right).toBe(window.innerWidth))
      const rect = dialog.getBoundingClientRect()
      await expect(rect.width).toBe(384)
      await expect(rect.top).toBe(0)
      await expect(rect.height).toBe(window.innerHeight)
      await expect(dialog).toHaveAttribute('data-swipe-direction', 'right')
      const style = getComputedStyle(dialog)
      await expect(style.borderTopLeftRadius).toBe('12px')
      await expect(style.borderTopRightRadius).toBe('0px')
      await expect(style.borderLeftWidth).toBe('1px')
    })

    await step("the header is the TopBar's height, with a close on the end", async () => {
      const dialog = within(document.body).getByRole('dialog')
      const heading = within(dialog).getByRole('heading', {
        name: 'Filters',
        level: 2,
      })
      const header = heading.closest('div')!.parentElement!
      await expect(header.getBoundingClientRect().height).toBe(56)
      await expect(getComputedStyle(header).paddingTop).toBe('12px')
      await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeVisible()
    })
  },
}

/** The same drawer, driven through a close: Escape shuts it and focus returns to the trigger. */
export const PlaygroundDriven: Story = {
  name: 'Playground, driven',
  render: renderPlayground,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', {
      name: 'Filters',
    })
    await userEvent.click(trigger)
    const dialog = await within(document.body).findByRole('dialog')
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await expect(document.activeElement).toBe(trigger)
  },
}

/** `side="left"`: the mirror image, swiping left to dismiss. */
export const Left: Story = {
  render: () => (
    <Drawer side="left">
      <Drawer.Trigger render={<Button appearance="secondary">Open from the left</Button>} />
      <Drawer.Popup>
        <Filters />
      </Drawer.Popup>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open from the left' }))
    const dialog = await within(document.body).findByRole('dialog')
    await waitFor(() => expect(dialog.getBoundingClientRect().left).toBe(0))
    await expect(dialog.getBoundingClientRect().width).toBe(384)
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'left')
    const style = getComputedStyle(dialog)
    await expect(style.borderTopRightRadius).toBe('12px')
    await expect(style.borderTopLeftRadius).toBe('0px')
  },
}

/**
 * `side="bottom"`: the sheet Base UI's drawer was built for. As wide as the
 * viewport, as tall as its content up to 85% of the screen, swiping down to
 * dismiss. MobileNav's sheet is this shape.
 */
export const Bottom: Story = {
  render: () => (
    <Drawer side="bottom">
      <Drawer.Trigger render={<Button appearance="secondary">Open from the bottom</Button>} />
      <Drawer.Popup>
        <Filters />
      </Drawer.Popup>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Open from the bottom',
      }),
    )
    const dialog = await within(document.body).findByRole('dialog')
    await waitFor(() => expect(dialog.getBoundingClientRect().bottom).toBe(window.innerHeight))
    const rect = dialog.getBoundingClientRect()
    await expect(rect.left).toBe(0)
    await expect(rect.width).toBe(window.innerWidth)
    await expect(rect.height).toBeLessThan(window.innerHeight)
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'down')
    const style = getComputedStyle(dialog)
    await expect(style.borderTopLeftRadius).toBe('12px')
    await expect(style.borderBottomLeftRadius).toBe('0px')
  },
}

/**
 * `modal={false}`: no scrim, no focus trap, the page stays live — and
 * `disablePointerDismissal` so a click on the page does not close it. This
 * is the shape to reach for when the page and the drawer are used together;
 * if that is the *usual* case, it is a `Panel`.
 */
export const NonModal: Story = {
  name: 'Non-modal',
  render: () => (
    <div className="flex items-center gap-4">
      <Drawer modal={false} disablePointerDismissal>
        <Drawer.Trigger render={<Button appearance="secondary">Open non-modal</Button>} />
        <Drawer.Popup>
          <Filters />
        </Drawer.Popup>
      </Drawer>
      <Button appearance="ghost">Still clickable</Button>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open non-modal' }))
    const dialog = await within(document.body).findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())

    await step('no scrim, nothing inert', async () => {
      await expect(canvasElement.closest('[aria-hidden="true"]')).toBeNull()
      // The popup's siblings in the portal: a Backdrop would be one.
      const portal = dialog.parentElement!.parentElement!
      await expect(portal.children).toHaveLength(1)
    })

    await step('the page is still usable while it is open', async () => {
      const other = canvas.getByRole('button', { name: 'Still clickable' })
      await userEvent.click(other)
      await expect(document.activeElement).toBe(other)
      await expect(within(document.body).queryByRole('dialog')).not.toBeNull()
    })
  },
}

/**
 * A real screen: the drawer is opened from a Menu item rather than a trigger,
 * so it is controlled, and `finalFocus` says where focus goes when it closes
 * — the item that opened it is gone by then. Dialog's InContext, for a drawer.
 */
function InContextScreen() {
  const [open, setOpen] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="w-160 rounded-lg border border-surface-border bg-surface-background-primary p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold">Q3 engagement report</span>
          <span className="text-sm text-content-subtle">Edited 2 hours ago</span>
        </div>

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
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Popup finalFocus={moreRef}>
          <Drawer.Header>Edit details</Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <Drawer.Description>Changes save when you apply them.</Drawer.Description>
            <Field label="Name">
              <Input defaultValue="Q3 engagement report" />
            </Field>
            <div className="flex justify-end gap-2">
              <Drawer.Close render={<Button appearance="secondary">Cancel</Button>} />
              <Drawer.Close render={<Button>Apply</Button>} />
            </div>
          </Drawer.Body>
        </Drawer.Popup>
      </Drawer>
    </div>
  )
}

export const InContext: Story = {
  render: () => <InContextScreen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'More' }))
    await userEvent.click(
      await within(document.body).findByRole('menuitem', {
        name: 'Edit details',
      }),
    )
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Edit details',
    })
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    await expect(dialog).toHaveAccessibleDescription('Changes save when you apply them.')
  },
}

/** The same screen, driven through a close: Apply shuts it and focus lands on More. */
export const InContextDriven: Story = {
  name: 'InContext, driven',
  render: () => <InContextScreen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'More' }))
    await userEvent.click(
      await within(document.body).findByRole('menuitem', {
        name: 'Edit details',
      }),
    )
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Edit details',
    })
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'More' }))
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
 * **Below 768 a side drawer is a bottom sheet.** The same `side="right"` as
 * the Playground, on a phone: it comes from the bottom, fills the width, and
 * swipes down — a 384-wide column on a 393-wide screen would be a bottom
 * sheet with a worse gesture. Read with `matchMedia`, the library's one use
 * of it, because a closed drawer has no first paint to get wrong.
 */
export const Phone: Story = {
  parameters: phone,
  globals: { viewport: { value: 'phone' } },
  render: renderPlayground,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }))
    const dialog = await within(document.body).findByRole('dialog')
    await waitFor(() => expect(dialog.getBoundingClientRect().bottom).toBe(window.innerHeight))
    const rect = dialog.getBoundingClientRect()
    await expect(window.innerWidth).toBe(393)
    await expect(rect.left).toBe(0)
    await expect(rect.width).toBe(393)
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'down')
    await expect(getComputedStyle(dialog).borderTopLeftRadius).toBe('12px')
  },
}
