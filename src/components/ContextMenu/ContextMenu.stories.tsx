import { useState } from 'react'
import type { ComponentPropsWithRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  Archive,
  ClipboardPaste,
  Copy,
  Ellipsis,
  FolderInput,
  Pencil,
  Scissors,
  Share2,
  Star,
  Trash,
} from 'lucide-react'

import { ContextMenu } from './ContextMenu'
import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Menu } from '../Menu'

/**
 * The dashed area every story right-clicks on.
 *
 * It spreads `...props` onto its `<div>`, and that is load-bearing rather than
 * tidiness: `render` hands the element Base UI's own `onContextMenu`, its ref
 * and its data attributes, so a component that drops them is a trigger that
 * never triggers. Written without the spread first, and the menu simply never
 * opened.
 */
function Surface({
  className,
  children = 'Right-click this area',
  ...props
}: ComponentPropsWithRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'flex h-48 w-96 items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-background-subtle text-base text-content-subtle select-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  parameters: { controls: { disable: true } },
  decorators: [
    // The menu opens at the pointer, so it needs room on every side or the
    // collision logic flips it somewhere unexpected inside the story frame.
    // Menu's decorator, for the same reason.
    (Story) => (
      <div className="flex min-h-96 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Right-click the area — or long-press it on a touch screen. The menu opens at
 * the pointer rather than against an edge of the trigger, which is Base UI's
 * doing: it anchors to the click point and this component leaves `side`
 * undefined so that it can.
 *
 * Once it is open everything works as it does in a `Menu`: arrow keys, typeahead,
 * Escape. That is not a resemblance — these rows *are* `Menu`'s rows.
 */
export const Playground: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger render={<Surface />} />
      <ContextMenu.Popup>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Scissors}>Cut</ContextMenu.Item>
          <ContextMenu.Item startIcon={Copy}>Copy</ContextMenu.Item>
          <ContextMenu.Item startIcon={ClipboardPaste}>Paste</ContextMenu.Item>
        </ContextMenu.Group>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Trash} destructive>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Popup>
    </ContextMenu>
  ),
}

/**
 * **Opened by a real right-click**, so every row is visible at once.
 *
 * This story exists for a second reason, and it is the reason it has a `play`
 * function rather than an `open` prop. The suite's axe run happens after the
 * story settles, and a closed menu has no popup in the DOM at all — without one
 * that opens, the accessibility check would pass by looking at nothing. That is
 * Toast's lesson, and Menu applied it with `<Menu.Root open>`.
 *
 * That trick does not work here: `ContextMenu.Root` seeds its anchor as a
 * zero-size rectangle at the top-left of the viewport, so a force-open context
 * menu renders in the corner over the page rather than where it belongs. Firing
 * the actual gesture is both the honest fix and the only story in the library
 * that tests one.
 */
export const Open: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger render={<Surface>Opened for you</Surface>} />
      <ContextMenu.Popup>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Pencil}>Rename</ContextMenu.Item>
          <ContextMenu.Item startIcon={Copy}>Duplicate</ContextMenu.Item>
          <ContextMenu.Item startIcon={FolderInput} disabled>
            Move to folder
          </ContextMenu.Item>
        </ContextMenu.Group>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Archive}>Archive</ContextMenu.Item>
          <ContextMenu.Item startIcon={Trash} destructive>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Popup>
    </ContextMenu>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByText('Opened for you')
    await userEvent.pointer({ target: trigger, keys: '[MouseRight]' })
    // The popup is portalled to <body>, so it is not inside the canvas element.
    const menu = await within(document.body).findByRole('menu')
    await expect(menu).toBeVisible()

    // Pointing at a row focuses it. That is the mechanism behind the ring bug:
    // Chrome calls this scripted focus `:focus-visible`, because a right-click
    // on a non-focusable trigger never sets the pointer modality, so the plain
    // focus ring would paint under the cursor.
    const rename = within(menu).getByRole('menuitem', { name: 'Rename' })
    await userEvent.hover(rename)
    await expect(rename).toHaveFocus()

    // The suppression itself cannot be asserted from here, and it is worth
    // saying why rather than writing a test that passes for the wrong reason:
    // a synthesised hover dispatches mouse events but never moves the real
    // pointer, so CSS `:hover` stays false and the bug cannot reproduce in this
    // runner. That is checked by hand in a browser.
    //
    // What these two do catch is the silent half. The row has to carry the
    // *scoped* utility rather than the plain ring — and because `:hover` is
    // false here, the ring must still paint, which is only true if Tailwind
    // actually emitted a rule for `not-hover`. A class that generates nothing
    // paints nothing and says so nowhere, which is exactly how the ring would
    // quietly come back.
    await expect(rename.className).toContain('focus-visible:not-hover:ring-2')
    await expect(getComputedStyle(rename).boxShadow).toContain('0px 0px 0px 4px')
  },
}

/**
 * Figma's `Group Header`, and the two rows Figma does not draw for a context
 * menu at all — a checkbox and a radio. They arrive for nothing, because these
 * are `Menu`'s rows, and a right-click menu with a "Show grid" tick in it is an
 * ordinary thing to want.
 *
 * A group with a label announces itself: Base UI wires `aria-labelledby` from
 * the group to its label, so a screen reader reads "Sort, group" before the
 * options inside it.
 */
export const Groups: Story = {
  render: function GroupsStory() {
    const [sort, setSort] = useState('name')
    const [shown, setShown] = useState({ grid: true, rulers: false })

    return (
      <ContextMenu>
        <ContextMenu.Trigger render={<Surface>Right-click for view options</Surface>} />
        <ContextMenu.Popup>
          <ContextMenu.Group label="Sort by">
            <ContextMenu.RadioGroup value={sort} onValueChange={setSort}>
              <ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
              <ContextMenu.RadioItem value="date">Date modified</ContextMenu.RadioItem>
              <ContextMenu.RadioItem value="size">Size</ContextMenu.RadioItem>
            </ContextMenu.RadioGroup>
          </ContextMenu.Group>
          <ContextMenu.Group label="Show">
            <ContextMenu.CheckboxItem
              checked={shown.grid}
              onCheckedChange={(v) => setShown({ ...shown, grid: v })}
            >
              Grid
            </ContextMenu.CheckboxItem>
            <ContextMenu.CheckboxItem
              checked={shown.rulers}
              onCheckedChange={(v) => setShown({ ...shown, rulers: v })}
            >
              Rulers
            </ContextMenu.CheckboxItem>
          </ContextMenu.Group>
        </ContextMenu.Popup>
      </ContextMenu>
    )
  },
}

/**
 * `Type=Nested`. Hover or press the right arrow to open the flyout; the left
 * arrow or Escape closes it again.
 *
 * The submenu needs no adjustment for living inside a context menu. Base UI
 * types a submenu's parent as a plain menu whatever opened the menu above it, so
 * the cursor-anchoring rule does not reach it and `Menu.Submenu`'s measured
 * offsets — the ones that line the flyout up with the column of items it came
 * from — are still the right ones.
 */
export const Submenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger render={<Surface>Right-click a track</Surface>} />
      <ContextMenu.Popup>
        <ContextMenu.Group>
          <ContextMenu.Item>Add to Library</ContextMenu.Item>
          <ContextMenu.Submenu label="Add to Playlist" startIcon={Star}>
            <ContextMenu.Group>
              <ContextMenu.Item>Get Up!</ContextMenu.Item>
              <ContextMenu.Item>Inside Out</ContextMenu.Item>
              <ContextMenu.Submenu label="More">
                <ContextMenu.Group>
                  <ContextMenu.Item>Night Beats</ContextMenu.Item>
                  <ContextMenu.Item>Slow Burn</ContextMenu.Item>
                </ContextMenu.Group>
              </ContextMenu.Submenu>
            </ContextMenu.Group>
            <ContextMenu.Group>
              <ContextMenu.Item>New playlist…</ContextMenu.Item>
            </ContextMenu.Group>
          </ContextMenu.Submenu>
        </ContextMenu.Group>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Share2}>Share</ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Popup>
    </ContextMenu>
  ),
}

/**
 * `disabled` gives the browser's own menu back. That is the right behaviour
 * rather than swallowing the gesture: a region that suppresses right-click and
 * then offers nothing has taken something away from the user. Astryx's
 * `isDisabled` means exactly this.
 */
export const Disabled: Story = {
  render: () => (
    <ContextMenu disabled>
      <ContextMenu.Trigger render={<Surface>Right-click gets the browser menu</Surface>} />
      <ContextMenu.Popup>
        <ContextMenu.Group>
          <ContextMenu.Item startIcon={Copy}>Copy</ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Popup>
    </ContextMenu>
  ),
}

/**
 * In context — a file row, where right-click is the gesture people already
 * reach for.
 *
 * **The same actions are on the ellipsis button as well**, and that is the point
 * of the story rather than decoration. There is no keyboard way to open a
 * context menu, so Astryx's rule is that it must never be the only route to an
 * action: *"Don't use a ContextMenu as the only way to access important
 * actions."* The `Menu` beside it is that second route.
 *
 * The trigger also `render`s the row itself rather than wrapping it in a bare
 * `div`, which is the shape to copy — when the trigger is something already
 * focusable, the Menu key and Shift+F10 fire `contextmenu` on it for free.
 */
export const InContext: Story = {
  render: () => {
    const items = (Namespace: typeof ContextMenu | typeof Menu) => (
      <>
        <Namespace.Group>
          <Namespace.Item startIcon={Pencil}>Rename</Namespace.Item>
          <Namespace.Item startIcon={Copy}>Duplicate</Namespace.Item>
          <Namespace.Submenu label="Move to" startIcon={FolderInput}>
            <Namespace.Group>
              <Namespace.Item>Drafts</Namespace.Item>
              <Namespace.Item>Archive</Namespace.Item>
            </Namespace.Group>
          </Namespace.Submenu>
        </Namespace.Group>
        <Namespace.Group>
          <Namespace.Item startIcon={Trash} destructive>
            Delete
          </Namespace.Item>
        </Namespace.Group>
      </>
    )

    return (
      <ContextMenu>
        <ContextMenu.Trigger
          render={
            <div className="flex w-96 items-center justify-between rounded-lg border border-surface-border bg-surface-background-primary p-4">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-content-emphasized">Q3 roadmap</span>
                <span className="text-sm text-content-subtle">Edited 2 days ago</span>
              </div>
              <Menu>
                <Menu.Trigger
                  render={
                    <Button appearance="ghost" startIcon={Ellipsis} aria-label="Document actions" />
                  }
                />
                <Menu.Popup align="end">{items(Menu)}</Menu.Popup>
              </Menu>
            </div>
          }
        />
        <ContextMenu.Popup label="Q3 roadmap actions">{items(ContextMenu)}</ContextMenu.Popup>
      </ContextMenu>
    )
  },
}
