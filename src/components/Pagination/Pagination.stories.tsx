import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Pagination } from './Pagination'
import { Table } from '../Table'

/**
 * Pagination — Figma node `40004379:65925`.
 *
 * One row: the range, the page size, and — pushed to the far end — the page
 * jump and the two arrows. Use the Theme switch in the toolbar for dark mode.
 *
 * The bar takes counts, not rows, so every story here is driving it with a
 * `totalItems` and nothing else. `WithTable` is the one that wires it to real
 * data, and it is also the composition `Table`'s record points at.
 */
const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  argTypes: {
    totalItems: { control: 'number' },
    defaultPage: { control: 'number' },
    defaultPageSize: { control: 'number' },
    hasRange: { control: 'boolean' },
    hasPageSize: { control: 'boolean' },
    hasNavigation: { control: 'boolean' },
    hasPageJump: { control: 'boolean' },
    pageSizeOptions: { control: false },
  },
  args: {
    totalItems: 100,
    defaultPage: 1,
    defaultPageSize: 10,
  },
  decorators: [
    // Both Selects open *over* their trigger, so the story needs vertical room
    // or Base UI falls back to a conventional dropdown. Select's decorator, for
    // the same reason.
    (Story) => (
      <div className="min-h-96 p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

/** The bar with controls. */
export const Playground: Story = {}

/**
 * Figma's four boolean properties, which are the whole of its variance — there
 * is no size axis and no appearance axis, because a pagination bar is one
 * object drawn one way.
 *
 * **`hasNavigation` takes the arrows with it.** In Figma the previous/next
 * frame lives *inside* the frame that `Page Navigation` hides, so turning it off
 * leaves the range and the page size and no way to move. That nesting is the
 * file's, kept rather than flattened, because the two halves of the right-hand
 * group are one thing: the place you are and the way you leave it.
 *
 * Each bar names itself, which is not decoration — two landmarks with the same
 * name are indistinguishable in a landmark list, and axe says so.
 */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {[
        { name: 'Everything', props: {} },
        { name: 'No range', props: { hasRange: false } },
        { name: 'No page size', props: { hasPageSize: false } },
        { name: 'No page jump', props: { hasPageJump: false } },
        { name: 'No navigation', props: { hasNavigation: false } },
      ].map(({ name, props }) => (
        <div key={name} className="flex flex-col gap-2">
          <span className="text-sm text-content-subtle">{name}</span>
          <Pagination {...args} {...props} aria-label={name} />
        </div>
      ))}
    </div>
  ),
}

/**
 * The four ends of the range, all of which render perfectly while being wrong
 * if the arithmetic is off.
 *
 * **The last page is short.** 95 items at 10 per page ends at 95, not at 100 —
 * the one off-by-one nobody notices until they count.
 *
 * **An empty set still has a page 1.** "Page 0 of 0 pages" reads as a component
 * that failed rather than as a table with nothing in it, so `pageCount` floors
 * at one and both arrows are simply disabled.
 */
export const Boundaries: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Pagination aria-label="First page" totalItems={100} defaultPage={1} defaultPageSize={10} />
      <Pagination aria-label="Last page" totalItems={95} defaultPage={10} defaultPageSize={10} />
      <Pagination aria-label="One page" totalItems={7} defaultPageSize={10} />
      <Pagination aria-label="Empty" totalItems={0} defaultPageSize={10} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const first = within(canvas.getByRole('navigation', { name: 'First page' }))
    await expect(first.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await expect(first.getByRole('button', { name: 'Next page' })).toBeEnabled()

    const last = within(canvas.getByRole('navigation', { name: 'Last page' }))
    await expect(last.getByRole('button', { name: 'Next page' })).toBeDisabled()
    // 95 items, not 100 — the partial last page.
    await expect(last.getByText('91 – 95 of 95 items')).toBeInTheDocument()

    const one = within(canvas.getByRole('navigation', { name: 'One page' }))
    await expect(one.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await expect(one.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await expect(one.getByText('of 1 page')).toBeInTheDocument()

    const empty = within(canvas.getByRole('navigation', { name: 'Empty' }))
    await expect(empty.getByText('0 items')).toBeInTheDocument()
    await expect(empty.getByRole('button', { name: 'Next page' })).toBeDisabled()
  },
}

/**
 * Stepping with the arrows, and what changing the page size does to the page
 * you are on.
 *
 * **A new page size returns you to page 1.** The clever alternative — keep the
 * first visible item in view — moves the page number to a value nobody chose.
 */
export const Stepping: Story = {
  parameters: { controls: { disable: true } },
  args: { totalItems: 100, defaultPageSize: 10 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('1 – 10 of 100 items')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(canvas.getByText('11 – 20 of 100 items')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }))
    await expect(canvas.getByText('1 – 10 of 100 items')).toBeInTheDocument()

    // The counterpart to `Narrow`: given room, all of it is on one line. Without
    // this the wrap assertion over there could pass on a bar that never wraps.
    const range = canvas.getByText('1 – 10 of 100 items').getBoundingClientRect()
    const next = canvas.getByRole('button', { name: 'Next page' }).getBoundingClientRect()
    await expect(next.top).toBeLessThan(range.bottom)
  },
}

/**
 * The narrow case, which Figma does not draw: the file gives one fixed 600px
 * row, and a side panel or a phone does not have 600px.
 *
 * **It wraps rather than hiding anything.** The range and the page size stay on
 * the first line; the whole right-hand group moves to a second one and stays
 * flush right, because it is held there by an auto margin rather than by
 * `flex-1` — which would let it squash instead of wrap.
 *
 * The play function measures that, because a screenshot of two rows and a
 * screenshot of one squashed row are both "it rendered".
 */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="w-80">
      <Pagination {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const range = canvas.getByText('1 – 10 of 100 items').getBoundingClientRect()
    const next = canvas.getByRole('button', { name: 'Next page' }).getBoundingClientRect()

    // A second line, not a squashed first one.
    await expect(next.top).toBeGreaterThanOrEqual(range.bottom)
  },
}

interface Row extends Record<string, unknown> {
  id: string
  name: string
  region: string
  seats: number
}

const rows: Row[] = Array.from({ length: 42 }, (_, index) => ({
  id: String(index + 1),
  name: `Account ${index + 1}`,
  region: ['Platform', 'Product', 'Infrastructure'][index % 3],
  seats: (index % 7) * 12 + 4,
}))

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'region', header: 'Region' },
  { key: 'seats', header: 'Seats' },
]

function PaginatedTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const start = (page - 1) * pageSize

  return (
    <div className="flex flex-col gap-3">
      <Table
        label="Accounts"
        idKey="id"
        columns={columns}
        data={rows.slice(start, start + pageSize)}
        // The whole of the wiring between the two components: the table says
        // how many rows exist and where this page starts, so a screen reader
        // can say "row 13 of 42" on a page showing 11 to 20.
        rowCount={rows.length}
        rowIndexStart={start + 1}
      />
      <Pagination
        aria-label="Accounts pagination"
        totalItems={rows.length}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

/**
 * The composition this was built for, and the one `Table`'s record has always
 * pointed at.
 *
 * **The bar is a sibling, not a part.** It sits under the table's rounded
 * scroll region rather than inside it, and draws no border or background of its
 * own — which is exactly how Figma draws it. There is no `pagination` prop on
 * `Table`, and the two are joined by nothing but `rowCount` and `rowIndexStart`.
 *
 * The caller slices. Neither component knows what a row is.
 */
export const WithTable: Story = {
  parameters: { controls: { disable: true } },
  render: () => <PaginatedTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // ARIA counts the header, so the first body row of page 1 is row 2.
    await expect(canvas.getByRole('table')).toHaveAttribute('aria-rowcount', '43')
    await expect(canvas.getByText('Account 1').closest('tr')).toHaveAttribute('aria-rowindex', '2')

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))

    await expect(canvas.getByText('11 – 20 of 42 items')).toBeInTheDocument()
    await expect(canvas.getByText('Account 11').closest('tr')).toHaveAttribute('aria-rowindex', '12')
  },
}
