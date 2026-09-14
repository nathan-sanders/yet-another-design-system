import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ExternalLink, File, FileCode, Folder, FolderOpen, Inbox, Settings } from 'lucide-react'

import { TreeList } from './TreeList'
import type { TreeListItem } from './TreeList'
import { Badge } from '../Badge'
import { Card } from '../Card'
import { Icon } from '../Icon'

/**
 * Astryx's own example, and the fixture every story here starts from: three
 * levels, two closed parents, and a leaf at the top level so the chevron
 * spacer has something to line up.
 */
const files: TreeListItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      { id: 'lib', label: 'lib', children: [{ id: 'cn', label: 'cn.ts' }] },
      { id: 'app', label: 'App.tsx' },
    ],
  },
  { id: 'public', label: 'public', children: [{ id: 'favicon', label: 'favicon.ico' }] },
  { id: 'readme', label: 'README.md' },
]

const meta = {
  title: 'Components/TreeList',
  component: TreeList,
  argTypes: {
    guides: { control: 'boolean' },
    items: { control: false },
    header: { control: 'text' },
    expandedIds: { control: false },
    selectedId: { control: false },
  },
  args: {
    'aria-label': 'Project files',
    items: files,
    guides: true,
    // Open from the start, so the very first story renders `role="group"`
    // rows for axe to see — a collapsed panel is unmounted, not hidden.
    defaultExpandedIds: ['src', 'components'],
  },
  // Figma draws the list 280 wide. It is fluid; the frame is the story's job.
  decorators: [
    (Story) => (
      <div className="w-70">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TreeList>

export default meta
// `typeof TreeList`, not `typeof meta`: the props are a union (the tree has
// to be named one of three ways), and `StoryObj<typeof meta>` cannot narrow
// it per story. Nav's trap.
type Story = StoryObj<typeof TreeList>

const rowOf = (canvas: ReturnType<typeof within>, name: string) =>
  canvas.getByRole('treeitem', { name }).querySelector(':scope > [data-tree-row]') as HTMLElement

/**
 * Uncontrolled, with controls — use the Theme switch in the toolbar for dark
 * mode. Click a chevron, or a folder row, to fold it; the keyboard walks it
 * with the arrow keys once a row has focus.
 */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tree', { name: 'Project files' })).toBeInTheDocument()
    // Two open parents, so two groups.
    await expect(canvas.getAllByRole('group')).toHaveLength(2)
    // Every visible row is a treeitem with its place in the hierarchy.
    const card = canvas.getByRole('treeitem', { name: 'Card.tsx' })
    await expect(card).toHaveAttribute('aria-level', '3')
    await expect(card).toHaveAttribute('aria-posinset', '2')
    await expect(card).toHaveAttribute('aria-setsize', '2')
    await expect(canvas.getByRole('treeitem', { name: 'src' })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('treeitem', { name: 'lib' })).toHaveAttribute('aria-expanded', 'false')
    // A leaf has no aria-expanded at all — it is not a closed parent.
    await expect(canvas.getByRole('treeitem', { name: 'App.tsx' })).not.toHaveAttribute('aria-expanded')
  },
}

/**
 * Figma's `Guides` axis — the connector lines on or off. The rails stay: a
 * guide line is drawn on the right edge of a 16px box that is there either
 * way, so switching it off never moves a chevron.
 */
export const Guides: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex gap-10">
      <TreeList {...args} aria-label="With guides" guides />
      <TreeList {...args} aria-label="Without guides" guides={false} />
    </div>
  ),
  // Two trees side by side want more than one frame's width.
  decorators: [(Story) => <div className="w-150"><Story /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [withGuides, without] = canvas.getAllByRole('tree')

    const railIn = (tree: HTMLElement) =>
      within(tree)
        .getByRole('treeitem', { name: 'Card.tsx' })
        .querySelector('[data-tree-row] > span > span') as HTMLElement
    await expect(getComputedStyle(railIn(withGuides)).borderRightWidth).toBe('1px')
    await expect(getComputedStyle(railIn(without)).borderRightWidth).toBe('0px')

    // The indent is identical: 16 per level from each tree's own left edge.
    const chevronX = (tree: HTMLElement, name: string) =>
      within(tree).getByRole('treeitem', { name }).querySelector('button')!.getBoundingClientRect()
        .left - tree.getBoundingClientRect().left
    await expect(chevronX(withGuides, 'src')).toBe(8)
    await expect(chevronX(withGuides, 'components')).toBe(24)
    await expect(chevronX(without, 'components')).toBe(24)
    // And the guide line sits under the parent's chevron: rail 1's right edge
    // at x=16 is the centre of the 8–24 chevron box.
    const line = railIn(withGuides).getBoundingClientRect()
    await expect(line.right - withGuides.getBoundingClientRect().left).toBe(16)
  },
}

/**
 * The folder-and-file look Figma draws as the slot placeholder. Nothing is
 * drawn by default — `startContent` is the caller's, and an `Icon` is the usual
 * thing to put in it.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  args: {
    items: [
      {
        id: 'src',
        label: 'src',
        startContent: <Icon icon={FolderOpen} />,
        children: [
          { id: 'app', label: 'App.tsx', startContent: <Icon icon={FileCode} /> },
          { id: 'index', label: 'index.tsx', startContent: <Icon icon={FileCode} /> },
        ],
      },
      { id: 'public', label: 'public', startContent: <Icon icon={Folder} />, children: [{ id: 'favicon', label: 'favicon.ico' }] },
      { id: 'pkg', label: 'package.json', startContent: <Icon icon={File} /> },
    ],
    defaultExpandedIds: ['src'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = rowOf(canvas, 'App.tsx')
    const icon = row.querySelector('svg')!
    const label = row.querySelector('[data-tree-label]')!
    // The icon sits between the chevron column and the label, and is 16px.
    await expect(icon.getBoundingClientRect().width).toBe(16)
    await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(label.getBoundingClientRect().left)
    // Decorative: the row is still named by its label alone.
    await expect(canvas.getByRole('treeitem', { name: 'App.tsx' })).toBeInTheDocument()
  },
}

/**
 * A second, quieter line. The row grows from 32 to 52 — `py-1` round a 24px
 * label plus a 20px description — and the rails stretch with it, so the guide
 * line stays unbroken.
 */
export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  args: {
    items: [
      {
        id: 'settings',
        label: 'Settings',
        description: 'Everything about this workspace',
        children: [
          { id: 'general', label: 'General', description: 'Name, icon and time zone' },
          { id: 'members', label: 'Members', description: '12 people' },
          { id: 'billing', label: 'Billing' },
        ],
      },
    ],
    defaultExpandedIds: ['settings'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(rowOf(canvas, 'General').getBoundingClientRect().height).toBe(52)
    await expect(rowOf(canvas, 'Billing').getBoundingClientRect().height).toBe(32)
    // The description is wired as the row's description, not folded into its name.
    const general = canvas.getByRole('treeitem', { name: 'General' })
    await expect(general).toHaveAccessibleDescription('Name, icon and time zone')
    // The rail runs the full 52.
    const rail = rowOf(canvas, 'General').querySelector<HTMLElement>('span > span')!
    await expect(rail.getBoundingClientRect().height).toBe(52)
  },
}

/**
 * Astryx's mailbox: a count after the label. The slot takes anything, and a
 * `Badge` is what the file draws in it.
 */
export const WithEndContent: Story = {
  parameters: { controls: { disable: true } },
  args: {
    'aria-label': 'Mailboxes',
    items: [
      {
        id: 'inbox',
        label: 'Inbox',
        startContent: <Icon icon={Inbox} />,
        endContent: <Badge>3</Badge>,
        children: [
          { id: 'unread', label: 'Unread', endContent: <Badge>3</Badge> },
          { id: 'starred', label: 'Starred' },
        ],
      },
      { id: 'sent', label: 'Sent' },
      { id: 'drafts', label: 'Drafts', endContent: <Badge>1</Badge> },
    ],
    defaultExpandedIds: ['inbox'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The badge is in the row but not in its name: "Inbox", not "Inbox 3"
    // and not "Toggle children Inbox 3".
    await expect(canvas.getByRole('treeitem', { name: 'Inbox' })).toBeInTheDocument()
    await expect(canvas.queryByRole('treeitem', { name: /Inbox 3/ })).not.toBeInTheDocument()
    // The badge is pushed to the row's right edge, 8px in.
    const row = rowOf(canvas, 'Drafts')
    const badge = within(row).getByText('1')
    await expect(row.getBoundingClientRect().right - badge.getBoundingClientRect().right).toBe(8)
  },
}

/**
 * A selected row carries `aria-selected` and the wash. The wash is the
 * translucent `surface-overlay-subtle` rather than Figma's
 * `Surface/Background Subtle`, because that token *is* the canvas in both
 * themes — a tree on the page would show no selection at all. The label stays
 * `content-primary`; the file's Content/Subtle binding on the Selected variants
 * was a slip.
 */
export const Selected: Story = {
  parameters: { controls: { disable: true } },
  args: {
    'aria-label': 'Pages',
    items: [
      {
        id: 'nav',
        label: 'Navigation',
        children: [
          { id: 'home', label: 'Home' },
          { id: 'about', label: 'About', selected: true },
          { id: 'contact', label: 'Contact' },
        ],
      },
    ],
    defaultExpandedIds: ['nav'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const about = canvas.getByRole('treeitem', { name: 'About' })
    await expect(about).toHaveAttribute('aria-selected', 'true')
    // Only on the selected row — never `aria-selected="false"` on the others.
    await expect(canvasElement.querySelectorAll('[aria-selected]')).toHaveLength(1)
    // The selected row is the tab stop, so Tab lands where the page is.
    await expect(about).toHaveAttribute('tabindex', '0')

    /*
      How much the fill actually departs, by painting it over the story's own
      surface and reading the pixel back — the fill is translucent, so its
      string cannot be compared with an opaque one. Table's helper.
    */
    const lightness = (color: string) => {
      const pixel = document.createElement('canvas')
      pixel.width = pixel.height = 1
      const context = pixel.getContext('2d')!
      context.fillStyle = getComputedStyle(document.body).backgroundColor
      context.fillRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data
      return r + g + b
    }
    const fill = (name: string) => getComputedStyle(rowOf(canvas, name)).backgroundColor
    await expect(Math.abs(lightness(fill('About')) - lightness(fill('Home')))).toBeGreaterThan(0)

    // Same ink on both labels: selection is the fill's job, not the text's.
    const labelColor = (name: string) =>
      getComputedStyle(rowOf(canvas, name).querySelector('[data-tree-label]')!).color
    await expect(labelColor('About')).toBe(labelColor('Home'))
  },
}

/**
 * A disabled row is faded to 40%, takes no pointer, and ignores Enter — but it
 * stays in the arrow-key order, so a screen reader still finds it. Its
 * children cannot be opened.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  args: {
    items: [
      { id: 'src', label: 'src', children: [{ id: 'app', label: 'App.tsx' }] },
      { id: 'archive', label: 'archive', disabled: true, children: [{ id: 'old', label: 'old.zip' }] },
      { id: 'readme', label: 'README.md', disabled: true, onClick: fn() },
      { id: 'license', label: 'LICENSE' },
    ],
    defaultExpandedIds: ['src'],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const readme = canvas.getByRole('treeitem', { name: 'README.md' })
    await expect(readme).toHaveAttribute('aria-disabled', 'true')
    const row = rowOf(canvas, 'README.md')
    await expect(getComputedStyle(row).opacity).toBe('0.4')
    await expect(getComputedStyle(row).pointerEvents).toBe('none')

    // Enter reaches the handler path but the row refuses it.
    const onClick = (args.items as TreeListItem[]).find((i) => i.id === 'readme')!.onClick!
    readme.focus()
    await userEvent.keyboard('{Enter}')
    await expect(onClick).not.toHaveBeenCalled()

    // A disabled parent will not open from the keyboard either.
    const archive = canvas.getByRole('treeitem', { name: 'archive' })
    archive.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(archive).toHaveAttribute('aria-expanded', 'false')
  },
}

/**
 * A row with an `href` is a real link, so middle-click, cmd-click and "copy
 * link" all work. It is out of the tab order — the treeitem is the stop, and
 * Enter on it follows the link. A disabled link is plain text.
 */
export const Links: Story = {
  parameters: { controls: { disable: true } },
  args: {
    'aria-label': 'Documentation',
    items: [
      {
        id: 'guides',
        label: 'Guides',
        children: [
          { id: 'start', label: 'Getting started', href: '#start' },
          { id: 'theming', label: 'Theming', href: '#theming' },
        ],
      },
      { id: 'api', label: 'API reference', href: '#api', endContent: <Icon icon={ExternalLink} className="text-content-subtle" /> },
      { id: 'legacy', label: 'Legacy docs', href: '#legacy', disabled: true },
    ],
    defaultExpandedIds: ['guides'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = canvas.getAllByRole('link')
    await expect(links).toHaveLength(3)
    for (const link of links) await expect(link).toHaveAttribute('tabindex', '-1')
    await expect(canvas.getByRole('link', { name: 'Theming' })).toHaveAttribute('href', '#theming')
    // The link is the row itself, inside its treeitem.
    await expect(canvas.getByRole('link', { name: 'Theming' }).closest('[role="treeitem"]')).toBe(
      canvas.getByRole('treeitem', { name: 'Theming' }),
    )
    // Disabled: no <a> at all.
    await expect(canvas.getByRole('treeitem', { name: 'Legacy docs' }).querySelector('a')).toBeNull()
  },
}

/**
 * The WAI-ARIA tree keys. Down and Up walk the visible rows, Right opens a
 * parent or steps into it, Left closes one or steps out, Home and End go to
 * the ends, `*` opens every sibling, a letter jumps ahead, and Enter selects.
 * Focus is on the treeitem; the ring is on its row.
 */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  args: { defaultExpandedIds: [], onSelectedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const item = (name: string) => canvas.getByRole('treeitem', { name })
    const focused = (name: string) => waitFor(() => expect(item(name)).toHaveFocus())

    // Exactly one tab stop, and Tab reaches it.
    await expect(
      canvas.getAllByRole('treeitem').filter((el) => el.getAttribute('tabindex') === '0'),
    ).toHaveLength(1)
    await userEvent.tab()
    await focused('src')
    // The ring is on the row, and only there — a real key press, not a
    // scripted focus, is what makes :focus-visible match.
    await waitFor(() => expect(getComputedStyle(rowOf(canvas, 'src')).boxShadow).not.toBe('none'))
    await expect(getComputedStyle(item('src')).boxShadow).toBe('none')

    // Right on a closed parent opens it and stays put.
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(item('src')).toHaveAttribute('aria-expanded', 'true'))
    await focused('src')
    // Right again steps into the first child.
    await userEvent.keyboard('{ArrowRight}')
    await focused('components')
    // Down walks the visible rows — `components` is closed, so past it.
    await userEvent.keyboard('{ArrowDown}')
    await focused('lib')
    // Left on a closed row steps out to the parent.
    await userEvent.keyboard('{ArrowLeft}')
    await focused('src')
    // End is the deepest last visible row; Home the first.
    await userEvent.keyboard('{End}')
    await focused('README.md')
    await userEvent.keyboard('{Home}')
    await focused('src')
    // `*` opens every sibling at this level: `public` too.
    await userEvent.keyboard('*')
    await waitFor(() => expect(item('public')).toHaveAttribute('aria-expanded', 'true'))
    // A letter jumps to the next row starting with it.
    await userEvent.keyboard('r')
    await focused('README.md')
    // Enter selects.
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(item('README.md')).toHaveAttribute('aria-selected', 'true'))
    await expect(args.onSelectedChange).toHaveBeenCalledWith('readme')
    // Left on an open parent closes it, and closing over the focused row
    // pulls focus up rather than dropping it on <body>.
    await userEvent.keyboard('{Home}{ArrowRight}')
    await focused('components')
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    await focused('Button.tsx')
    await userEvent.click(within(item('src')).getAllByRole('button', { name: 'Toggle children' })[0])
    await waitFor(() => expect(item('src')).toHaveAttribute('aria-expanded', 'false'))
    await focused('src')
    // And the closed subtree leaves the DOM once its exit transition ends —
    // out of the accessibility tree, not merely out of sight.
    await waitFor(() => expect(canvas.queryByRole('treeitem', { name: 'Button.tsx' })).toBeNull())
    await expect(canvas.getAllByRole('group')).toHaveLength(1)
  },
}

/**
 * Both axes controlled from outside. The tree reports every change and paints
 * whatever it is handed back — including a selection it did not make.
 */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  args: { onExpandedChange: fn(), onSelectedChange: fn() },
  render: function ControlledStory(args) {
    const [expanded, setExpanded] = useState<string[]>(['src'])
    const [selected, setSelected] = useState<string | null>('app')
    return (
      <div className="flex flex-col gap-4">
        <TreeList
          {...args}
          aria-label="Project files"
          expandedIds={expanded}
          onExpandedChange={(ids) => {
            setExpanded(ids)
            args.onExpandedChange?.(ids)
          }}
          selectedId={selected}
          onSelectedChange={(id) => {
            setSelected(id)
            args.onSelectedChange?.(id)
          }}
        />
        <p className="text-sm text-content-subtle">
          Open: {expanded.join(', ') || 'none'} · Selected: {selected ?? 'none'}
        </p>
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('treeitem', { name: 'App.tsx' })).toHaveAttribute('aria-selected', 'true')

    const toggle = within(canvas.getByRole('treeitem', { name: 'lib' })).getByRole('button', {
      name: 'Toggle children',
    })
    await userEvent.click(toggle)
    await expect(args.onExpandedChange).toHaveBeenCalledWith(['src', 'lib'])
    await waitFor(() => expect(canvas.getByRole('treeitem', { name: 'cn.ts' })).toBeInTheDocument())

    await userEvent.click(rowOf(canvas, 'cn.ts'))
    await expect(args.onSelectedChange).toHaveBeenCalledWith('cn')
    await waitFor(() =>
      expect(canvas.getByRole('treeitem', { name: 'cn.ts' })).toHaveAttribute('aria-selected', 'true'),
    )
    // Clicking a row does not also toggle it unless it is a parent — and a
    // parent row click does, without selecting through the chevron.
    await userEvent.click(rowOf(canvas, 'lib'))
    await expect(args.onExpandedChange).toHaveBeenLastCalledWith(['src'])
  },
}

/**
 * A file explorer beside the thing it opens — the composition a tree list is
 * usually part of. Everything at its default size.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <div className="w-200"><Story /></div>],
  render: function ExplorerStory() {
    const [selected, setSelected] = useState<string | null>('app')
    const names: Record<string, string> = {
      app: 'App.tsx',
      index: 'index.tsx',
      button: 'Button.tsx',
      card: 'Card.tsx',
      cn: 'cn.ts',
      readme: 'README.md',
      pkg: 'package.json',
    }
    return (
      <div className="flex gap-4">
        <Card className="w-70 shrink-0">
          <TreeList
            header="Explorer"
            selectedId={selected}
            onSelectedChange={setSelected}
            defaultExpandedIds={['src', 'components']}
            items={[
              {
                id: 'src',
                label: 'src',
                startContent: <Icon icon={FolderOpen} />,
                children: [
                  {
                    id: 'components',
                    label: 'components',
                    startContent: <Icon icon={FolderOpen} />,
                    children: [
                      { id: 'button', label: 'Button.tsx', startContent: <Icon icon={FileCode} /> },
                      { id: 'card', label: 'Card.tsx', startContent: <Icon icon={FileCode} /> },
                    ],
                  },
                  {
                    id: 'lib',
                    label: 'lib',
                    startContent: <Icon icon={Folder} />,
                    children: [{ id: 'cn', label: 'cn.ts', startContent: <Icon icon={FileCode} /> }],
                  },
                  { id: 'app', label: 'App.tsx', startContent: <Icon icon={FileCode} /> },
                  { id: 'index', label: 'index.tsx', startContent: <Icon icon={FileCode} /> },
                ],
              },
              { id: 'readme', label: 'README.md', startContent: <Icon icon={File} /> },
              { id: 'pkg', label: 'package.json', startContent: <Icon icon={Settings} />, endContent: <Badge color="amber">M</Badge> },
            ]}
          />
        </Card>
        <Card className="min-w-0 flex-1">
          <span className="text-base font-semibold text-content-primary">
            {selected ? names[selected] : 'No file open'}
          </span>
          <pre className="text-sm text-content-subtle">
            {selected ? `// ${names[selected]}\nexport default function () {}` : ''}
          </pre>
        </Card>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tree', { name: 'Explorer' })).toBeInTheDocument()
    await userEvent.click(rowOf(canvas, 'Card.tsx'))
    await waitFor(() => expect(canvas.getByText('// Card.tsx', { exact: false })).toBeInTheDocument())
  },
}
