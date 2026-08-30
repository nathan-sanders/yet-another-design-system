import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Filter, MoreHorizontal, Share2 } from 'lucide-react'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Divider } from '../Divider'
import { Link } from '../Link'
import { Menu } from '../Menu'
import { Popover } from './Popover'

const meta = {
  title: 'Components/Popover',
  component: Popover,
  // A compound component: everything interesting lives on `Popover.Popup`, not
  // on the root, so there is nothing for Storybook's controls to drive. Menu's
  // convention, for Menu's reason.
  parameters: { controls: { disable: true } },
  // Every story needs room around the trigger, or a 324x-something panel gets
  // clipped by the story frame and the collision logic flips it somewhere
  // unexpected. Tooltip's and Menu's decorator, roomier because this is a panel.
  decorators: [
    (Story) => (
      <div className="flex min-h-128 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The ordinary shape: a title, a body, and a row of actions. Click the trigger
 * to open it; Escape, an outside click, or either button closes it, and focus
 * returns to the trigger on the way out.
 *
 * Note what is *not* a prop. `side`, `align` and `sideOffset` go to the
 * positioner rather than a `tv()` variant, because the positioner flips them to
 * keep the panel on screen — a variant that could be contradicted by the
 * viewport is not a variant.
 */
export const Playground: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger render={<Button appearance="secondary">Share file</Button>} />
      <Popover.Popup>
        <div className="flex items-start justify-between gap-2">
          <Popover.Title>Share this file</Popover.Title>
          <Popover.Close />
        </div>
        <Popover.Description>
          Anyone with the link can view it. You can revoke access at any time.
        </Popover.Description>
        <div className="flex justify-end gap-2">
          <Popover.Close render={<Button appearance="secondary">Cancel</Button>} />
          <Popover.Close render={<Button>Copy link</Button>} />
        </div>
      </Popover.Popup>
    </Popover>
  ),
}

/**
 * Figma's own drawing, and the story the geometry is measured against: a
 * secondary Button trigger and a 4:5 media block filling the content column.
 * 324 wide on 12 of padding, `rounded-lg`, a 1px `Surface/Border` and the
 * Medium elevation.
 *
 * **It starts open on purpose.** A closed popover has no popup in the DOM at
 * all, so without this the suite's axe run would pass by looking at nothing —
 * Menu's and Toast's lesson.
 *
 * **And it is why `label` exists.** There is no title here, and Base UI names
 * the `role="dialog"` from `Popover.Title` via `aria-labelledby` — so as Figma
 * draws it, this panel would have no accessible name and fail axe's
 * `aria-dialog-name`. `label` names it instead. Prefer a real Title: it names
 * the dialog *and* shows the name to everybody.
 */
export const Anatomy: Story = {
  render: () => (
    <Popover defaultOpen>
      <Popover.Trigger render={<Button appearance="secondary">Cat picture</Button>} />
      <Popover.Popup label="Cat picture">
        <div className="aspect-4/5 w-full rounded-md bg-surface-background-subtle" />
      </Popover.Popup>
    </Popover>
  ),
}

/**
 * Astryx's first example, and the second of the two open stories — deliberately,
 * because it exercises the *other* naming path. `Anatomy` is named by `label`;
 * this one is named by its `Popover.Title`, through `aria-labelledby`. They are
 * different code paths and axe should see both.
 *
 * `Popover.Close` appears in both of its forms here: the `×` in the header, and
 * "Cancel" in the footer via `render`. That is why it is one part rather than
 * two — a variant deciding which shape it takes would be worse than the default
 * plus an override.
 */
export const ConfirmAction: Story = {
  render: () => (
    <Popover defaultOpen>
      <Popover.Trigger render={<Button appearance="destructive">Delete project</Button>} />
      <Popover.Popup width={300}>
        <div className="flex items-start justify-between gap-2">
          <Popover.Title>Delete project?</Popover.Title>
          <Popover.Close />
        </div>
        <Popover.Description>
          This permanently deletes the project and all of its data. It cannot be undone.
        </Popover.Description>
        <div className="flex justify-end gap-2">
          <Popover.Close render={<Button appearance="secondary">Cancel</Button>} />
          <Popover.Close render={<Button appearance="destructive">Delete</Button>} />
        </div>
      </Popover.Popup>
    </Popover>
  ),
}

/**
 * Figma's Docs frame draws two triggers, a secondary Button and a Link, and both
 * are reached the same way: `render` hands Base UI the caller's own element
 * instead of wrapping it in a Base UI `<button>`. Tooltip's move.
 *
 * **The Link needs `nativeButton={false}` and it is not optional.** Base UI
 * assumes a real `<button>`; against an `<a>` with no `href` it dev-warns, and
 * the anchor cannot take focus at all — so the trigger silently does nothing for
 * a keyboard. The flag adds `role="button"`, `tabIndex=0` and Space activation.
 * ContextMenu's "the render target has to hold up its end" trap, in a new
 * spelling: nothing errors, it just quietly fails.
 */
export const Triggers: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Popover>
        <Popover.Trigger render={<Button appearance="secondary">Cat picture</Button>} />
        <Popover.Popup label="Cat picture">
          <div className="aspect-4/5 w-full rounded-md bg-surface-background-subtle" />
        </Popover.Popup>
      </Popover>

      <Popover>
        <Popover.Trigger
          nativeButton={false}
          render={<Link>Another cat picture</Link>}
        />
        <Popover.Popup label="Another cat picture">
          <div className="aspect-4/5 w-full rounded-md bg-surface-background-subtle" />
        </Popover.Popup>
      </Popover>
    </div>
  ),
}

/**
 * `side` and `align` are a *preference*. The positioner flips and shifts the
 * panel to keep it on screen, which is exactly why they are behavior rather than
 * `tv()` variants — a variant the viewport can overrule is not a variant.
 *
 * Figma's own numbers are the defaults: both Docs previews put the panel 8px
 * below its trigger with their left edges flush, so `side="bottom"`,
 * `align="start"`, `sideOffset={8}`.
 *
 * Unlike Tooltip's equivalent these are **not** forced open. Several open
 * dialogs means several focus managers arguing over `document.activeElement` on
 * mount; a story that needs them open at once wants `initialFocus={false}`.
 */
export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Popover key={side}>
          <Popover.Trigger
            render={
              <Button appearance="secondary" className="capitalize">
                {side}
              </Button>
            }
          />
          <Popover.Popup side={side} width={240}>
            <Popover.Title>On the {side}</Popover.Title>
            <Popover.Description>
              Move the story frame and watch it flip rather than run off the edge.
            </Popover.Description>
          </Popover.Popup>
        </Popover>
      ))}
    </div>
  ),
}

/**
 * `width` in pixels, defaulting to Figma's 324.
 *
 * It is the one axis the file can never carry: Figma's four property kinds are
 * VARIANT, BOOLEAN, TEXT and INSTANCE_SWAP, and none of them is a number — the
 * same wall Card's padding hit. So the component in Figma keeps drawing 324 and
 * this stays a code-only prop. Astryx has the same one, and uses a different
 * value in all four of its examples.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex items-start gap-8">
      {[240, 280, 324].map((width) => (
        <Popover key={width}>
          <Popover.Trigger render={<Button appearance="secondary">{width}px</Button>} />
          <Popover.Popup width={width}>
            <Popover.Title>{width} wide</Popover.Title>
            <Popover.Description>
              The panel is fixed at this width; its content column is 2px narrower,
              because the border is inside it.
            </Popover.Description>
          </Popover.Popup>
        </Popover>
      ))}
    </div>
  ),
}

/**
 * Astryx's filter panel — the case a popover exists for, and a Menu does not
 * cover. A Menu is rows of actions; this is a small form that stays open while
 * you work in it.
 *
 * Real form controls keep their own focus rings inside a portalled dialog, and
 * the Popover adds none of its own — a container that rings identically wherever
 * focus is inside it says nothing.
 *
 * **Focus does not move into the panel, and that is right.** Measured: opening
 * this by click *or* by Enter leaves focus on the Filter button, and Tab walks
 * into the checkboxes from there. A popover is non-modal — `modal` defaults to
 * `false` — so it behaves like a disclosure rather than a dialog you are put
 * inside. Base UI parks focus on the popup itself only when there is nothing
 * tabbable in it at all, which is the `Anatomy` case and the reason the panel
 * carries `outline-none`.
 */
export const FilterPanel: Story = {
  render: function FilterPanelStory() {
    const [value, setValue] = useState<string[]>(['active', 'drafts'])

    return (
      <Popover>
        <Popover.Trigger
          render={
            <Button appearance="secondary" startIcon={Filter}>
              Filter
            </Button>
          }
        />
        <Popover.Popup width={240}>
          <Popover.Title>Filter by status</Popover.Title>
          <Divider />
          <Checkbox.Group value={value} onValueChange={setValue} aria-label="Status">
            <Checkbox name="active" label="Active" />
            <Checkbox name="archived" label="Archived" />
            <Checkbox name="drafts" label="Drafts" />
            <Checkbox name="shared" label="Shared with me" />
          </Checkbox.Group>
          <Divider />
          <div className="flex justify-end gap-2">
            <Button appearance="secondary" onClick={() => setValue([])}>
              Reset
            </Button>
            <Popover.Close render={<Button>Apply</Button>} />
          </div>
        </Popover.Popup>
      </Popover>
    )
  },
}

/**
 * A real screen, at the default width and with default-size Buttons throughout.
 *
 * The Menu beside it is the point: the two open from adjacent buttons and are
 * different tools. The Menu is a list of actions you pick one of and it closes;
 * the Popover is a panel you read, or fill in, and dismiss. Reach for a Menu
 * when every row is a verb.
 */
export const InContext: Story = {
  render: () => (
    <div className="w-160 rounded-lg border border-surface-border bg-surface-background-primary p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold">Q3 engagement report</span>
          <span className="text-sm text-content-subtle">Edited 2 hours ago</span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <Popover.Trigger
              render={
                <Button appearance="secondary" startIcon={Share2}>
                  Share
                </Button>
              }
            />
            <Popover.Popup>
              <div className="flex items-start justify-between gap-2">
                <Popover.Title>Share this file</Popover.Title>
                <Popover.Close />
              </div>
              <Popover.Description>
                Anyone with the link can view it. You can revoke access at any time.
              </Popover.Description>
              <div className="flex justify-end gap-2">
                <Popover.Close render={<Button appearance="secondary">Cancel</Button>} />
                <Popover.Close render={<Button>Copy link</Button>} />
              </div>
            </Popover.Popup>
          </Popover>

          <Menu>
            <Menu.Trigger
              render={<Button appearance="ghost" startIcon={MoreHorizontal} aria-label="More" />}
            />
            <Menu.Popup align="end">
              <Menu.Item>Rename</Menu.Item>
              <Menu.Item>Duplicate</Menu.Item>
              <Menu.Item destructive>Delete</Menu.Item>
            </Menu.Popup>
          </Menu>
        </div>
      </div>
    </div>
  ),
}
