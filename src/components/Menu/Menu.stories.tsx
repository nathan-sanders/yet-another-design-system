import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Archive,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Ellipsis,
  FolderInput,
  Pencil,
  Scissors,
  Share2,
  Star,
  Trash,
  Undo2,
} from 'lucide-react'

import { Menu } from './Menu'
import { Button } from '../Button'
import { Kbd } from '../Kbd'

const sides = ['top', 'right', 'bottom', 'left'] as const

const meta = {
  title: 'Components/Menu',
  component: Menu,
  parameters: { controls: { disable: true } },
  decorators: [
    // A menu needs room, or the collision logic flips it somewhere unexpected
    // inside the story frame. Tooltip's decorator, for the same reason.
    (Story) => (
      <div className="flex min-h-96 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The shape most menus have: a Button trigger and a few groups of actions.
 * Figma draws the chevron as the Button's own `endIcon`, so Menu does not add
 * one — the trigger is whatever you pass it.
 *
 * Open it and use the arrow keys. Typeahead works too: type "s" to jump to
 * Share. Escape closes, and focus goes back to the trigger.
 */
export const Playground: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger render={<Button endIcon={ChevronDown}>Song</Button>} />
      <Menu.Popup>
        <Menu.Group>
          <Menu.Item>Add to Library</Menu.Item>
          <Menu.Submenu label="Add to Playlist">
            <Menu.Group>
              <Menu.Item>Get Up!</Menu.Item>
              <Menu.Item>Inside Out</Menu.Item>
              <Menu.Item>Night Beats</Menu.Item>
            </Menu.Group>
            <Menu.Group>
              <Menu.Item>New playlist…</Menu.Item>
            </Menu.Group>
          </Menu.Submenu>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item>Play Next</Menu.Item>
          <Menu.Item>Play Last</Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item>Favorite</Menu.Item>
          <Menu.Item>Share</Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  ),
}

/**
 * **Held open**, built from the raw parts so every row is visible at once —
 * the same trick Tooltip's matrix story uses.
 *
 * This story exists for a second reason: the story suite's axe run happens on
 * first render, and a closed menu has no popup in the DOM at all. Without a
 * menu that starts open, the accessibility check would pass by looking at
 * nothing. That is Toast's lesson, applied on purpose.
 */
export const Open: Story = {
  render: () => (
    <Menu.Root open>
      <Menu.Trigger render={<Button endIcon={ChevronDown}>Song</Button>} />
      <Menu.Popup>
        <Menu.Group>
          <Menu.Item startIcon={Pencil}>Rename</Menu.Item>
          <Menu.Item startIcon={Copy}>Duplicate</Menu.Item>
          <Menu.Item startIcon={FolderInput} disabled>
            Move to folder
          </Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item startIcon={Archive}>Archive</Menu.Item>
          <Menu.Item startIcon={Trash} destructive>
            Delete
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu.Root>
  ),
}

/**
 * Figma's `Group Header`. A group with a label announces itself — Base UI wires
 * `aria-labelledby` from the group to its label, so a screen reader reads "Sort,
 * group" before the options inside it.
 *
 * The header sits at `px-5` while items sit at `p-2` plus `px-3`. Both land text
 * 20px from the popup edge, which is the whole reason the header padding is 20
 * and not 12.
 */
export const Groups: Story = {
  render: function GroupsStory() {
    const [sort, setSort] = useState('date')
    const [panels, setPanels] = useState({ minimap: false, search: true, sidebar: true })

    return (
      <Menu.Root open>
        <Menu.Trigger render={<Button endIcon={ChevronDown}>View</Button>} />
        <Menu.Popup>
          <Menu.Group label="Sort">
            <Menu.RadioGroup value={sort} onValueChange={setSort}>
              <Menu.RadioItem value="date">Date</Menu.RadioItem>
              <Menu.RadioItem value="name">Name</Menu.RadioItem>
              <Menu.RadioItem value="type">Type</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Group>
          <Menu.Group label="Workspace">
            <Menu.CheckboxItem
              checked={panels.minimap}
              onCheckedChange={(v) => setPanels({ ...panels, minimap: v })}
            >
              Minimap
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={panels.search}
              onCheckedChange={(v) => setPanels({ ...panels, search: v })}
            >
              Search
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={panels.sidebar}
              onCheckedChange={(v) => setPanels({ ...panels, sidebar: v })}
            >
              Sidebar
            </Menu.CheckboxItem>
          </Menu.Group>
        </Menu.Popup>
      </Menu.Root>
    )
  },
}

/**
 * An icon-only trigger — the overflow menu for a table row or a card, where a
 * text button would take too much space. The Button's own union prop type
 * requires `aria-label`, so an unlabelled trigger will not compile.
 */
export const IconTrigger: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger
        render={<Button appearance="secondary" startIcon={Ellipsis} aria-label="More actions" />}
      />
      <Menu.Popup>
        <Menu.Group>
          <Menu.Item startIcon={Pencil}>Rename</Menu.Item>
          <Menu.Item startIcon={Copy}>Duplicate</Menu.Item>
          <Menu.Item startIcon={FolderInput}>Move to folder</Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item startIcon={Archive}>Archive</Menu.Item>
          <Menu.Item startIcon={Trash} destructive>
            Delete
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  ),
}

/**
 * `Type=Nested`. Hover or press the right arrow to open the flyout; the left
 * arrow or Escape closes it again.
 *
 * The offsets come off Figma's composed example: the flyout overlaps its parent
 * by exactly the popup's own `p-2`, so the two menus' inner padding boxes line
 * up rather than their borders.
 */
export const Submenu: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger render={<Button endIcon={ChevronDown}>Song</Button>} />
      <Menu.Popup>
        <Menu.Group>
          <Menu.Item>Add to Library</Menu.Item>
          <Menu.Submenu label="Add to Playlist" startIcon={Star}>
            <Menu.Group>
              <Menu.Item>Get Up!</Menu.Item>
              <Menu.Item>Inside Out</Menu.Item>
              <Menu.Submenu label="More">
                <Menu.Group>
                  <Menu.Item>Night Beats</Menu.Item>
                  <Menu.Item>Slow Burn</Menu.Item>
                </Menu.Group>
              </Menu.Submenu>
            </Menu.Group>
            <Menu.Group>
              <Menu.Item>New playlist…</Menu.Item>
            </Menu.Group>
          </Menu.Submenu>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item startIcon={Share2}>Share</Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu>
  ),
}

/**
 * Sub-labels — Figma's `Sub label` slot, hidden by default on the component.
 * A second line for the option that needs a sentence rather than a longer name.
 */
export const WithDescriptions: Story = {
  render: () => (
    <Menu.Root open>
      <Menu.Trigger render={<Button endIcon={ChevronDown}>Export</Button>} />
      <Menu.Popup className="min-w-72">
        <Menu.Group>
          <Menu.Item description="Everything, at full resolution.">PNG</Menu.Item>
          <Menu.Item description="Vector, for print and further editing.">SVG</Menu.Item>
          <Menu.Item description="One page per artboard." disabled>
            PDF
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu.Root>
  ),
}

/**
 * `endSlot` — Figma's `End Slot`, which the file draws holding a `Kbd`. The
 * label column has `flex-1`, so the slot is pushed to the trailing edge and the
 * row's own `gap-3` keeps it 12px clear of the longest label.
 *
 * The slot takes any node, but a keyboard shortcut is what it is for. Note the
 * destructive row: `Kbd` stays `Content/Primary` rather than following the red,
 * because the key is a key on every row — it is the label that is dangerous.
 */
export const Shortcuts: Story = {
  render: () => (
    <Menu.Root open>
      <Menu.Trigger render={<Button endIcon={ChevronDown}>Edit</Button>} />
      <Menu.Popup className="min-w-56">
        <Menu.Group>
          <Menu.Item startIcon={Undo2} endSlot={<Kbd keys="mod+z" />}>
            Undo
          </Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item startIcon={Scissors} endSlot={<Kbd keys="mod+x" />}>
            Cut
          </Menu.Item>
          <Menu.Item startIcon={Copy} endSlot={<Kbd keys="mod+c" />}>
            Copy
          </Menu.Item>
          <Menu.Item startIcon={ClipboardPaste} endSlot={<Kbd keys="mod+shift+v" />}>
            Paste and Match Style
          </Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item startIcon={Trash} destructive endSlot={<Kbd keys="mod+backspace" />}>
            Delete
          </Menu.Item>
        </Menu.Group>
      </Menu.Popup>
    </Menu.Root>
  ),
}

/**
 * `side` and `align` go to Base UI's positioner, which is also what flips the
 * popup when it would leave the viewport — so they are behaviour, not `tv()`
 * variants. The same call Tooltip's docblock makes.
 */
export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      {sides.map((side) => (
        <Menu key={side}>
          <Menu.Trigger
            render={
              <Button appearance="secondary" endIcon={ChevronDown}>
                {side}
              </Button>
            }
          />
          <Menu.Popup side={side}>
            <Menu.Group>
              <Menu.Item>Play Next</Menu.Item>
              <Menu.Item>Play Last</Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu>
      ))}
    </div>
  ),
}

/**
 * In context — a row of actions on a card, which is where the icon-only trigger
 * earns its place. The destructive item is separated into its own group, which
 * is what Astryx's guidance asks for: keep the irreversible action away from the
 * one above it.
 */
export const InContext: Story = {
  render: () => (
    <div className="flex w-96 items-center justify-between rounded-lg border border-surface-border bg-surface-card-primary p-4">
      <div className="flex flex-col">
        <span className="text-base font-semibold text-content-emphasized">Q3 roadmap</span>
        <span className="text-sm text-content-subtle">Edited 2 days ago</span>
      </div>
      <Menu>
        <Menu.Trigger
          render={<Button appearance="ghost" startIcon={Ellipsis} aria-label="Document actions" />}
        />
        <Menu.Popup align="end">
          <Menu.Group>
            <Menu.Item startIcon={Pencil}>Rename</Menu.Item>
            <Menu.Item startIcon={Copy}>Duplicate</Menu.Item>
            <Menu.Submenu label="Move to" startIcon={FolderInput}>
              <Menu.Group>
                <Menu.Item>Drafts</Menu.Item>
                <Menu.Item>Archive</Menu.Item>
              </Menu.Group>
            </Menu.Submenu>
          </Menu.Group>
          <Menu.Group>
            <Menu.Item startIcon={Trash} destructive>
              Delete
            </Menu.Item>
          </Menu.Group>
        </Menu.Popup>
      </Menu>
    </div>
  ),
}
