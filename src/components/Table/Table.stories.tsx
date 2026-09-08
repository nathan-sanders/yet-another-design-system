import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Badge } from '../Badge'
import { Table } from './Table'
import { MIN_COLUMN_WIDTH, pixel, proportional } from './widths'

interface Row extends Record<string, unknown> {
  id: string
  name: string
  role: string
  region: string
  seats: number
  spend: string
  uptime: number
}

const rows: Row[] = [
  { id: '1', name: 'Alice Johnson', role: 'Engineer', region: 'Platform', seats: 30, spend: '$1.2M', uptime: 99.982 },
  { id: '2', name: 'Bob Smith', role: 'Designer', region: 'Product', seats: 25, spend: '$840K', uptime: 99.7 },
  { id: '3', name: 'Charlie Brown', role: 'Manager', region: 'Platform', seats: 5, spend: '$1.04M', uptime: 100 },
  { id: '4', name: 'Diana Prince', role: 'Engineer', region: 'Infrastructure', seats: 128, spend: '$96K', uptime: 98.4 },
]

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
  { key: 'seats', header: 'Seats' },
] as const

const meta = {
  title: 'Components/Table',
  component: Table<Row>,
  argTypes: {
    density: { control: 'inline-radio', options: ['compact', 'balanced', 'spacious'] },
    dividers: { control: 'inline-radio', options: ['rows', 'columns', 'grid', 'none'] },
    textOverflow: { control: 'inline-radio', options: ['wrap', 'truncate'] },
    verticalAlign: { control: 'inline-radio', options: ['top', 'middle', 'bottom'] },
    hasHover: { control: 'boolean' },
    isStriped: { control: 'boolean' },
  },
  args: {
    label: 'Team',
    idKey: 'id',
    columns: [...columns],
    data: rows,
  },
} satisfies Meta<typeof Table<Row>>

export default meta
type Story = StoryObj<typeof meta>

/** A table with controls — use the Theme switch in the toolbar for dark mode. */
export const Playground: Story = {}

/**
 * Figma's `Density` axis. Every height falls out of the padding plus the 24px
 * body line-height, with no explicit height anywhere: 32, 40 and 56.
 *
 * The play function measures them, because that is the claim this story makes
 * and a screenshot cannot tell 32 from 33. A real `border-b` on the cell would
 * add exactly that pixel, which is why the rules are drawn as pseudo-elements.
 */
export const Density: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Table {...args} label="Compact" density="compact" />
      <Table {...args} label="Balanced" density="balanced" />
      <Table {...args} label="Spacious" density="spacious" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const expected = { Compact: 32, Balanced: 40, Spacious: 56 }

    for (const [label, height] of Object.entries(expected)) {
      const table = canvas.getByRole('table', { name: label })
      const firstCell = within(table).getAllByRole('cell')[0]
      await expect(Math.round(firstCell.getBoundingClientRect().height)).toBe(height)
    }
  },
}

/**
 * Figma's `Align` axis — two values, because that is what the file draws.
 *
 * A right-aligned value lines up with its column's label. Where the column
 * sorts, the cell reserves the sort button's own 30 × 24 box so the value keeps
 * lining up with the *label* rather than sliding under the button — see
 * `Sorting`, which measures that case. Here there is no button and so no
 * spacer, and the play function asserts the two right edges agree.
 */
export const Alignment: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Alignment',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'seats', header: 'Seats', align: 'right' },
    ] as const,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const header = canvas.getByRole('columnheader', { name: 'Seats' })
    const value = canvas.getAllByRole('cell')[1]

    const headerLabel = header.querySelector('span > span > span')!
    const cellText = value.querySelector('span > span')!

    const drift = Math.abs(
      headerLabel.getBoundingClientRect().right - cellText.getBoundingClientRect().right,
    )
    await expect(drift).toBeLessThanOrEqual(1)
  },
}

/**
 * The four divider modes. Figma draws every rule as a 1px overlay rather than a
 * border, so `rows` is a cell's `::after` at its top edge and `columns` is a
 * `::before` at its right.
 *
 * The header draws no rule of its own: the line under it is the *first body
 * row's* top rule, which is why `Table Head` has no `rowBorder` in the file.
 */
export const Dividers: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Table {...args} label="Rows" dividers="rows" />
      <Table {...args} label="Columns" dividers="columns" />
      <Table {...args} label="Grid" dividers="grid" />
      <Table {...args} label="None" dividers="none" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const rule = (label: string, pseudo: '::after' | '::before') => {
      const table = canvas.getByRole('table', { name: label })
      const firstCell = within(table).getAllByRole('cell')[0]
      return getComputedStyle(firstCell, pseudo).content !== 'none'
    }

    await expect(rule('Rows', '::after')).toBe(true)
    await expect(rule('Rows', '::before')).toBe(false)
    await expect(rule('Columns', '::after')).toBe(false)
    await expect(rule('Columns', '::before')).toBe(true)
    await expect(rule('Grid', '::after')).toBe(true)
    await expect(rule('Grid', '::before')).toBe(true)
    await expect(rule('None', '::after')).toBe(false)
    await expect(rule('None', '::before')).toBe(false)

    // The header owns no rule. The line under it belongs to the row below.
    const grid = canvas.getByRole('table', { name: 'Grid' })
    const columnHeader = within(grid).getAllByRole('columnheader')[0]
    await expect(getComputedStyle(columnHeader, '::after').content).toBe('none')
  },
}

/**
 * The mono rule.
 *
 * `Seats` holds real numbers, so its cells go `font-mono tabular-nums` with
 * nothing declared — the value already said it was a number. `Spend` holds
 * formatted strings, which are strings, so the *column* says `numeric`. `Name`
 * is text and stays sans, and a cell holding a `Badge` stays sans too: the
 * element brought its own typography, and a rule that reached inside it would
 * one day restyle somebody's avatar.
 */
export const Numbers: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Numbers',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role', renderCell: (item) => <Badge color="blue">{item.role}</Badge> },
      { key: 'seats', header: 'Seats' },
      { key: 'spend', header: 'Spend', numeric: true },
      { key: 'uptime', header: 'Uptime %' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cells = canvas.getAllByRole('cell')
    const font = (index: number) => getComputedStyle(cells[index].querySelector('span > span')!).fontFamily

    await expect(font(0)).not.toMatch(/Geist Mono/) // "Alice Johnson" — text
    await expect(font(1)).not.toMatch(/Geist Mono/) // a Badge — its own type wins
    await expect(font(2)).toMatch(/Geist Mono/) // 30 — a real number, derived
    await expect(font(3)).toMatch(/Geist Mono/) // "$1.2M" — the column said so
    await expect(font(4)).toMatch(/Geist Mono/) // 99.982

    // And the pair is always a pair: mono without tabular figures would still
    // let the decimal points wander down the column.
    await expect(getComputedStyle(cells[4].querySelector('span > span')!).fontVariantNumeric).toMatch(
      /tabular-nums/,
    )

    // A numeric column right-aligns by default; a text column does not.
    await expect(getComputedStyle(cells[3]).textAlign).toBe('right')
    await expect(getComputedStyle(cells[0]).textAlign).toBe('left')
  },
}

/**
 * `truncate` clips a long value to one line; `wrap` lets the row grow. A header
 * label truncates either way — a wrapping header would change the height of the
 * one row whose height has to stay put as columns resize.
 */
export const Truncation: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Truncation',
    textOverflow: 'truncate',
    columns: [
      { key: 'name', header: 'Name', width: pixel(90) },
      { key: 'region', header: 'A deliberately long column heading', width: pixel(90) },
      { key: 'seats', header: 'Seats', width: proportional(1) },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const cellText = canvas.getAllByRole('cell')[0].querySelector('span > span')!
    await expect(cellText.scrollWidth).toBeGreaterThan(cellText.clientWidth)

    const headerLabel = canvas
      .getByRole('columnheader', { name: 'A deliberately long column heading' })
      .querySelector('span > span > span')!
    await expect(headerLabel.scrollWidth).toBeGreaterThan(headerLabel.clientWidth)
  },
}

/**
 * Sorting. The control is Figma's `_Table Column Sort` — a small ghost button
 * carrying one of three arrows, sitting after the label rather than wrapped
 * around it.
 *
 * A third click returns the table to its own order rather than sticking on
 * descending: a given order is often meaningful, and losing it with no way back
 * is losing information.
 *
 * This is also where the right-align spacer earns itself. `Seats` sorts, so its
 * cells hold the button's 30px open and the numbers stay under the *label*.
 */
export const Sorting: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Sorting',
    sortable: true,
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role', sortable: false },
      { key: 'seats', header: 'Seats', align: 'right' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const firstCell = () => canvas.getAllByRole('cell')[0]

    await step('a column that opted out has no control and no aria-sort', async () => {
      const role = canvas.getByRole('columnheader', { name: 'Role' })
      await expect(role).not.toHaveAttribute('aria-sort')
      await expect(within(role).queryByRole('button')).toBeNull()
    })

    await step('the button names its column', async () => {
      await expect(canvas.getByRole('button', { name: 'Sort by Seats' })).toBeVisible()
    })

    await step('but the header is still named just "Seats"', async () => {
      // A <th>'s name is computed from its contents, and its contents include a
      // button that needs a name of its own. Left alone this column would
      // announce as "Seats Sort by Seats" — on every cell in it, because the
      // column header is what gets repeated as you move down a column.
      await expect(canvas.getByRole('columnheader', { name: 'Seats' })).toHaveAccessibleName('Seats')
    })

    await step('ascending puts the smallest first', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Sort by Seats' }))
      await expect(canvas.getByRole('columnheader', { name: 'Seats' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      )
      // 5, not "10" beating "9" — the comparator sorts numbers as numbers.
      await expect(firstCell()).toHaveTextContent('Charlie Brown')
      await expect(canvas.getByRole('button', { name: 'Sorted by Seats, ascending' })).toBeVisible()
    })

    await step('descending flips it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Sorted by Seats, ascending' }))
      await expect(canvas.getByRole('columnheader', { name: 'Seats' })).toHaveAttribute(
        'aria-sort',
        'descending',
      )
      await expect(firstCell()).toHaveTextContent('Diana Prince')
    })

    await step('a third click gives the data back its own order', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Sorted by Seats, descending' }))
      await expect(canvas.getByRole('columnheader', { name: 'Seats' })).toHaveAttribute('aria-sort', 'none')
      await expect(firstCell()).toHaveTextContent('Alice Johnson')
    })

    await step('only ever one column is sorted', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Sort by Name' }))
      await userEvent.click(canvas.getByRole('button', { name: 'Sort by Seats' }))
      const sortedHeaders = canvas
        .getAllByRole('columnheader')
        .filter((header) => (header.getAttribute('aria-sort') ?? 'none') !== 'none')
      await expect(sortedHeaders).toHaveLength(1)
    })

    await step('a sortable right-aligned value still lines up with its label', async () => {
      const header = canvas.getByRole('columnheader', { name: 'Seats' })
      const headerLabel = header.querySelector('span > span > span')!
      const cellText = canvas.getAllByRole('cell')[2].querySelector('span > span')!
      const drift = Math.abs(
        headerLabel.getBoundingClientRect().right - cellText.getBoundingClientRect().right,
      )
      await expect(drift).toBeLessThanOrEqual(1)
    })
  },
}

/**
 * Row selection. The checkbox goes in the row's *first cell*, which is what the
 * file's `checkbox` boolean on `Table Cell` means — and it means there is no
 * extra empty column header for a screen reader to walk through.
 *
 * A selected row takes the hover fill plus the emphasized rule on its cells,
 * which is `Card`'s split: the fill says "something is true of this row", the
 * stroke says which thing, and the two stay apart when both are true at once.
 *
 * `rowLabel` is the prop that matters here. Six boxes all called "Select row"
 * is a list a screen reader cannot navigate.
 */
export const Selection: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Selection',
    selectable: true,
    hasHover: true,
    rowLabel: (item) => item.name,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const selectAll = canvas.getByRole('checkbox', { name: 'Select all rows' })

    await step('a row checkbox is named after its row', async () => {
      // The assertion that catches the empty-name bug: `Checkbox` wraps itself
      // in a <label>, so an `aria-label` here would compute to nothing at all.
      await expect(canvas.getByRole('checkbox', { name: 'Select Alice Johnson' })).toBeVisible()
    })

    await step('one row makes the header indeterminate', async () => {
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Alice Johnson' }))
      await expect(selectAll).toHaveAttribute('aria-checked', 'mixed')
    })

    await step('select-all fills from indeterminate rather than clearing', async () => {
      await userEvent.click(selectAll)
      await expect(selectAll).toBeChecked()
      for (const item of rows) {
        await expect(canvas.getByRole('checkbox', { name: `Select ${item.name}` })).toBeChecked()
      }
    })

    await step('and clears when everything is selected', async () => {
      await userEvent.click(selectAll)
      await expect(selectAll).not.toBeChecked()
      await expect(selectAll).toHaveAttribute('aria-checked', 'false')
    })

    await step('a selected row is not announced with aria-selected', async () => {
      // `aria-selected` is only valid on a row inside a `grid`; on a `table` row
      // axe fires `aria-allowed-attr`. The checkbox's own state is the state.
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Bob Smith' }))
      const row = canvas.getByRole('checkbox', { name: 'Select Bob Smith' }).closest('tr')!
      await expect(row).not.toHaveAttribute('aria-selected')
    })
  },
}

/**
 * Expandable rows. A row expands because `renderExpanded` returned something
 * for it — derived, rather than a second flag that could disagree with the
 * panel's own existence. `Charlie Brown` returns `null` here and so has no
 * chevron at all.
 *
 * The detail row is rendered only while it is open. `hidden` on a `<tr>` fights
 * `display: table-row` and leaves a row that is invisible but still in the
 * accessibility tree.
 */
export const ExpandableRows: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Expandable rows',
    rowLabel: (item) => item.name,
    renderExpanded: (item) =>
      item.name === 'Charlie Brown' ? null : (
        <span className="text-content-subtle">
          {item.name} works in {item.region}.
        </span>
      ),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('a row with no panel has no control', async () => {
      await expect(canvas.queryByRole('button', { name: /Charlie Brown/ })).toBeNull()
    })

    await step('expanding opens the panel and points at it', async () => {
      const trigger = canvas.getByRole('button', { name: 'Expand Alice Johnson' })
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await userEvent.click(trigger)

      const opened = canvas.getByRole('button', { name: 'Collapse Alice Johnson' })
      await expect(opened).toHaveAttribute('aria-expanded', 'true')

      // aria-controls has to resolve to something that is actually there.
      const panel = document.getElementById(opened.getAttribute('aria-controls')!)
      await expect(panel).toBeVisible()
      await expect(panel).toHaveTextContent('Alice Johnson works in Platform.')
    })

    await step('collapsing removes the row rather than hiding it', async () => {
      const opened = canvas.getByRole('button', { name: 'Collapse Alice Johnson' })
      const panelId = opened.getAttribute('aria-controls')!
      await userEvent.click(opened)
      await expect(document.getElementById(panelId)).toBeNull()
    })
  },
}

/**
 * Resizable columns. The grip is a 1px line in a 12px target straddling the
 * column's right edge, and it is a focusable `separator` rather than a button:
 * a button does one thing, and this does a continuous one.
 *
 * The keyboard path is the one the play function drives, and not out of
 * convenience — a drag is the interaction that has no keyboard equivalent
 * unless somebody writes one, so the keyboard path is the one that can actually
 * regress unnoticed. Arrows step 8px, Shift 40, Home returns to the floor.
 */
export const ColumnResizing: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Resizable columns',
    resizable: true,
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'region', header: 'Region' },
      { key: 'seats', header: 'Seats', align: 'right', resizable: false },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('a column that opted out has no grip', async () => {
      await expect(canvas.queryByRole('separator', { name: 'Resize Seats column' })).toBeNull()
    })

    const handle = canvas.getByRole('separator', { name: 'Resize Name column' })
    const nameColumn = () => canvasElement.querySelectorAll('col')[0] as HTMLElement

    await step('it announces the column it actually has, before anything is dragged', async () => {
      // Not the floor. Reading the header refs during render would give 120
      // here, because the ref callbacks have not run on the first paint — a
      // grip confidently wrong about a column, to the one user who cannot see
      // that it is. The measurement is a layout effect for that reason.
      const announced = Number(handle.getAttribute('aria-valuenow'))
      const actual = Math.round(
        canvas.getByRole('columnheader', { name: 'Name' }).getBoundingClientRect().width,
      )
      await expect(announced).toBe(actual)
      await expect(announced).toBeGreaterThan(MIN_COLUMN_WIDTH)
    })

    await step('the arrow keys widen it', async () => {
      const before = Number(handle.getAttribute('aria-valuenow'))
      handle.focus()
      await userEvent.keyboard('{ArrowRight}{ArrowRight}')
      await expect(Number(handle.getAttribute('aria-valuenow'))).toBe(before + 16)
      // And the width actually reached the layout, not just the attribute.
      await expect(nameColumn().style.width).toBe(`${before + 16}px`)
    })

    await step('Shift steps further', async () => {
      const before = Number(handle.getAttribute('aria-valuenow'))
      await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
      await expect(Number(handle.getAttribute('aria-valuenow'))).toBe(before + 40)
    })

    await step('and it will not shrink past its floor', async () => {
      await userEvent.keyboard('{Home}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MIN_COLUMN_WIDTH))
      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MIN_COLUMN_WIDTH))
    })

    await step('resizing one column leaves the others alone', async () => {
      // The whole point of freezing every width on the first resize: without it
      // the untouched columns re-solve and the table breathes as you drag.
      const regionWidth = (canvasElement.querySelectorAll('col')[1] as HTMLElement).style.width
      await userEvent.keyboard('{ArrowRight}')
      await expect((canvasElement.querySelectorAll('col')[1] as HTMLElement).style.width).toBe(regionWidth)
    })
  },
}

/**
 * Striping, and the three fills it has to stay clear of.
 *
 * Hover is `surface-background-subtle` — the library's one hover fill — and a
 * selected row is that same fill plus the emphasized rule on its cells. If the
 * stripe used it too, then on a striped table hover would be invisible on half
 * the rows and selection invisible on half the rows: three states, one color.
 *
 * They also have to stay in the right *order*: pointing at a row should add
 * ink, never take it away. So the stripe is the opaque whisper
 * (`surface-background-subtle`) and hover is the translucent wash
 * (`surface-overlay-subtle`), which darkens whatever it is laid over and so is
 * darker than its resting state at either parity.
 *
 * Selected takes hover's fill and is told apart by its *rule* — `Card`'s split,
 * where the fill says something is true of this row and the rule says which
 * thing.
 */
export const Striped: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Striped',
    isStriped: true,
    hasHover: true,
    selectable: true,
    defaultSelectedKeys: ['3'],
    rowLabel: (item) => item.name,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rowFor = (name: string) => canvas.getByText(name).closest('tr')!
    const fill = (element: HTMLElement) => getComputedStyle(element).backgroundColor

    /*
      How light a row actually looks, by painting it over the table's own
      surface and reading the pixel back. Comparing the color *strings* would
      not work: one of these is an opaque `oklch(...)` and another a translucent
      `oklab(... / 0.1)`, and the whole question is what they come to once
      composited.
    */
    function lightness(color: string): number {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')!
      context.fillStyle = getComputedStyle(canvasElement.querySelector('table')!.parentElement!)
        .backgroundColor
      context.fillRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data
      return r + g + b
    }

    /*
      Hover is not measured here, and cannot be: `userEvent.hover` dispatches
      pointer events but does not move a real cursor, so CSS `:hover` never
      matches and the row reads back exactly as it did before. Same limitation
      `ContextMenu`'s story records.

      It does not need to be measured. The hover fill and the selected fill are
      the *same token* by construction — that is `Card`'s split, where the fill
      says something is true of this row and the rule says which thing — so
      proving the selected fill differs from plain and from striped proves the
      hover fill does too. The three colors below are the whole claim.
    */
    const plain = fill(rowFor('Alice Johnson')) // index 0 — no stripe
    const striped = fill(rowFor('Bob Smith')) // index 1 — striped
    const selected = fill(rowFor('Charlie Brown')) // index 2 — selected, and hover's fill

    await expect(new Set([plain, striped, selected]).size).toBe(3)

    /*
      And in that order — the stripe a smaller departure from a plain row than
      hover is. This is the assertion that would have caught the first version
      of this component, where the stripe was the heavier of the two and
      hovering a striped row moved it *back toward* plain: the pointer reading
      as less attention rather than more, on every other row. Distinctness alone
      would have passed that happily.

      Stated as a distance rather than as "lighter", because the direction
      inverts between themes: an overlay wash darkens a light table and lightens
      a dark one. What has to hold in both is that hover departs further.
    */
    const departure = (color: string) => Math.abs(lightness(color) - lightness(plain))
    await expect(departure(selected)).toBeGreaterThan(departure(striped))
    await expect(departure(striped)).toBeGreaterThan(0)

    /*
      The stripe's translucency is not asserted, deliberately. It comes back
      from `getComputedStyle` as an `oklab(... / 0.1)` string whose exact shape
      is the browser's to change, and pattern-matching a color string is how you
      write a test that fails on a Chromium upgrade and passes on a broken
      token. The three distinct colors above are the property that actually
      matters; the translucency is the mechanism, and it is written down rather
      than measured.
    */
    // The selected row's rule steps up to the emphasized stroke. Without this
    // the two rows above would be told apart by fill alone, and a selected row
    // under the pointer would be indistinguishable from an unselected one.
    const ruleOf = (name: string) =>
      getComputedStyle(rowFor(name).querySelector('td')!, '::after').backgroundColor
    await expect(ruleOf('Charlie Brown')).not.toBe(ruleOf('Alice Johnson'))
  },
}

/**
 * `pixel` for a column that should not move, `proportional` for one that shares
 * what is left. Every column has a width whether you give it one or not,
 * because `table-fixed` means the browser has stopped sizing them to content.
 *
 * The floor is what makes the frame scroll instead of the columns collapsing:
 * the table refuses to go below the sum of its columns' minimums.
 */
export const ColumnWidths: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Column widths',
    columns: [
      { key: 'name', header: 'Name', width: proportional(2) },
      { key: 'region', header: 'Region', width: proportional(1) },
      { key: 'seats', header: 'Seats', width: pixel(72), align: 'right' },
    ],
  },
  render: (args) => (
    <div className="max-w-md">
      <Table {...args} />
    </div>
  ),
}

/**
 * A windowed view. `rowCount` and `rowIndexStart` are what let a screen reader
 * say "row 43 of 200" while only ten rows are rendered — the row's ordinal is
 * an accessibility concern whether or not anything on screen shows a number.
 *
 * ARIA counts the header row, so the header is row 1 and the first body row is
 * row 2. That off-by-one is the kind nothing catches, because the only way to
 * notice it is to listen.
 */
export const Windowed: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Windowed',
    // Rows 41-44 of a 200-row set.
    rowCount: 200,
    rowIndexStart: 41,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('table')).toHaveAttribute('aria-rowcount', '201')
    await expect(canvas.getByText('Alice Johnson').closest('tr')).toHaveAttribute('aria-rowindex', '42')
    await expect(canvas.getByText('Diana Prince').closest('tr')).toHaveAttribute('aria-rowindex', '45')
    await expect(canvas.getAllByRole('columnheader')[0].closest('tr')).toHaveAttribute('aria-rowindex', '1')
  },
}

/** A table with nothing in it. The message spans every column. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  args: { label: 'Empty', data: [], emptyState: 'No team members yet.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cell = canvas.getByRole('cell')
    await expect(cell).toHaveTextContent('No team members yet.')
    await expect(cell).toHaveAttribute('colspan', '3')
  },
}

/**
 * The escape hatch, for a layout the column definitions cannot describe — here,
 * a footer with a total in it.
 *
 * The columns API renders through these same parts, which is the thing to keep:
 * two renderers would drift, and the drift would show up as a composed table
 * that looks subtly unlike a generated one.
 *
 * Every row goes inside a `Header`, `Body` or `Footer`. A `<tr>` directly
 * inside a `<table>` is invalid: the HTML parser inserts an implied `<tbody>`
 * for server-rendered markup and React does not on the client, so unwrapped
 * rows mismatch on hydration.
 */
export const Composable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    // The frame is the caller's in children mode, and so is the label on it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div
      tabIndex={0}
      role="region"
      aria-label="Composed"
      className="overflow-x-auto rounded-lg border border-surface-border bg-surface-background-primary"
    >
      <table className="w-full table-fixed border-separate border-spacing-0 font-sans">
        <caption className="sr-only">Composed</caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head align="right">Seats</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell align="right">{item.seats}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell align="right">{rows.reduce((sum, item) => sum + item.seats, 0)}</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The mono rule reaches a hand-composed cell too: it is the cell's own
    // derivation, not something the columns API sprinkles on from outside.
    const total = canvas.getByText('188').closest('td')!
    await expect(getComputedStyle(total.querySelector('span > span')!).fontFamily).toMatch(/Geist Mono/)
  },
}

/**
 * A table doing the job it exists for, at the default density and with the
 * default Button size, composing what the library already has.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  args: {
    label: 'Accounts',
    sortable: true,
    hasHover: true,
    selectable: true,
    rowLabel: (item) => item.name,
    columns: [
      { key: 'name', header: 'Account', width: proportional(2) },
      {
        key: 'role',
        header: 'Plan',
        sortable: false,
        renderCell: (item) => <Badge color={item.role === 'Engineer' ? 'blue' : 'neutral'}>{item.role}</Badge>,
      },
      { key: 'region', header: 'Region' },
      { key: 'seats', header: 'Seats', align: 'right' },
      { key: 'spend', header: 'Spend', numeric: true, sortValue: (item) => item.seats },
      { key: 'uptime', header: 'Uptime %', align: 'right' },
    ],
  },
}
