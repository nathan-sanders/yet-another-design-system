import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { Badge } from '../Badge'
import { Table } from './Table'
import { pixel, proportional } from './widths'

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
    ],
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
