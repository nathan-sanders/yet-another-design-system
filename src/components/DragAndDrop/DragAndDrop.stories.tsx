import { useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ChevronsUp,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  MessageCircle,
  Plus,
  X,
} from 'lucide-react'

import { DragAndDrop } from './DragAndDrop'
import { DragHandle } from './DragHandle'
import { ResizeHandle } from './ResizeHandle'
import { Sortable } from './Sortable'
import { findContainer, moveItem, reorder, type Containers } from './move'
import {
  COL_SPAN,
  GRID_COLUMNS,
  MAX_BLOCKS_PER_ROW,
  MIN_SPAN,
  canAddBlock,
  maxSpan,
  reflow,
  resize,
  type ColumnSpan,
} from './spans'
import { Avatar, AvatarGroup } from '../Avatar'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card, ClickableCard } from '../Card'
import { ContentBlock } from '../ContentBlock'
import { Divider } from '../Divider'
import { Token } from '../Token'
import { cn } from '../../lib/cn'

/**
 * The drag foundation: a root, sortable containers and items, the grip you
 * carry an item by, and the handle you resize one with. Mirrors the
 * `↪ Drag and Drop` page (`40005289:447`): `Drag Handle`, `Sortable Item`
 * and `Resize Handle` sets, drawn from this code the day after it landed.
 *
 * Every story here is a test of the **keyboard** path: Tab to a grip, Space
 * to lift, arrows to move, Space to drop. That is not a shortcut. A pointer
 * drag is the one interaction with no keyboard equivalent unless somebody
 * writes one, so the keyboard path is the one that can regress unnoticed —
 * and a synthetic pointer drag in a browser runner is flaky in a way that
 * teaches you nothing. `Table.ResizeHandle`'s ruling, kept.
 */
const meta = {
  title: 'Components/DragAndDrop',
  component: DragAndDrop,
  parameters: { controls: { disable: true } },
  // Every story renders its own tree; the root has nothing to say on its own.
  args: { children: null },
} satisfies Meta<typeof DragAndDrop>

export default meta
type Story = StoryObj<typeof meta>

/*
  The live region dnd-kit renders is `role="status"`, inside the root, so a
  play function can read what a screen reader would have heard. `waitFor`
  everywhere after a key: the handlers run in dnd-kit's effects, one frame
  after the keydown, and a bare `expect` races them.

  "Picked up" is never asserted: dnd-kit follows it with an `onDragOver` for
  the item's own slot in the same tick, so by the time anything can look the
  region already says "is over". The lift is read off the grip's
  `aria-pressed` instead, which is the state and not the narration of it.
*/
function status(canvasElement: HTMLElement) {
  return within(canvasElement).getByRole('status')
}

async function lift(handle: HTMLElement) {
  handle.focus()
  await userEvent.keyboard(' ')
  await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'))
}

// ---------------------------------------------------------------------------
// A plain list
// ---------------------------------------------------------------------------

const PEOPLE = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve']

function PersonRow({ name }: { name: string }) {
  return (
    <Card padding={2} className="flex-row items-center gap-2">
      <DragHandle />
      <span>{name}</span>
    </Card>
  )
}

/**
 * Multi-container state, the way every board in this file keeps it: item ids
 * by container id, and a snapshot from the moment a drag started so Escape
 * can put everything back. `onDragOver` moves an item *between* containers
 * while it is still being carried — which is what makes a card visibly join
 * the column it is over — and `onDragEnd` settles its place *within* one.
 */
function useBoard(initial: Containers<string>) {
  const [containers, setContainers] = useState(initial)
  const snapshot = useRef(initial)

  const handlers = {
    onDragStart() {
      snapshot.current = containers
    },
    onDragOver({ active, over }: DragOverEvent) {
      if (!over) return
      setContainers((current) => {
        const from = findContainer(current, active.id)
        const to = findContainer(current, over.id)
        if (!from || !to || from === to) return current
        return moveItem(current, active.id, over.id)
      })
    },
    onDragEnd({ active, over }: DragEndEvent) {
      if (!over) return
      setContainers((current) => moveItem(current, active.id, over.id))
    },
    onDragCancel() {
      setContainers(snapshot.current)
    },
  }

  return [containers, setContainers, handlers] as const
}

/**
 * One list, reordered. `Sortable` is a `<ul>` and each item a `<li>` — the
 * `render` prop is Base UI's, so a sortable list is still a list to a screen
 * reader. Each row is a plain `Card` with a `DragHandle` in it; a pointer
 * can grab the row anywhere, a keyboard grabs the grip.
 *
 * The play function lifts Alice, moves her down twice, drops her, and reads
 * the announcement that says where she landed; then lifts her again and
 * presses Escape, which is the path that has to leave the list exactly as it
 * was.
 */
export const SortableList: Story = {
  render: function SortableListStory() {
    const [items, setItems] = useState(PEOPLE)

    return (
      <DragAndDrop
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return
          setItems((current) =>
            reorder(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))),
          )
        }}
      >
        <Sortable
          id="people"
          label="People"
          items={items}
          render={<ul aria-label="People" />}
          className="flex w-72 flex-col gap-2"
        >
          {items.map((name) => (
            <Sortable.Item key={name} id={name} label={name} render={<li />}>
              <PersonRow name={name} />
            </Sortable.Item>
          ))}
        </Sortable>
      </DragAndDrop>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'People' })
    const order = () => within(list).getAllByRole('listitem').map((li) => li.textContent)

    await step('the grip is a named button that describes its keys', async () => {
      const handle = canvas.getByRole('button', { name: 'Move Alice' })
      await expect(handle).toHaveAttribute('aria-roledescription', 'sortable')
      const described = document.getElementById(handle.getAttribute('aria-describedby') ?? '')
      await expect(described?.textContent).toContain('Press Space to pick this up')
    })

    await step('Space lifts, arrows move, Space drops', async () => {
      await lift(canvas.getByRole('button', { name: 'Move Alice' }))

      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() =>
        expect(status(canvasElement)).toHaveTextContent('Alice is over People, position 2 of 5.'),
      )
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard(' ')

      await waitFor(() => expect(order()).toEqual(['Bob', 'Carol', 'Alice', 'Dan', 'Eve']))
      await expect(status(canvasElement)).toHaveTextContent('Alice dropped in People, position 3 of 5.')
    })

    await step('focus comes back to the grip that was dropped', async () => {
      await waitFor(() =>
        expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Move Alice' })),
      )
    })

    await step('Escape puts it back', async () => {
      await lift(canvas.getByRole('button', { name: 'Move Alice' }))
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{Escape}')
      await waitFor(() =>
        expect(status(canvasElement)).toHaveTextContent('Move cancelled. Alice is back where it was.'),
      )
      await expect(order()).toEqual(['Bob', 'Carol', 'Alice', 'Dan', 'Eve'])
    })
  },
}

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------

const TASKS: Record<string, { key: string; title: string }> = {
  'task-1': { key: 'ABC-120', title: 'Audit the color tokens' },
  'task-2': { key: 'ABC-121', title: 'Draw the drag handle' },
  'task-3': { key: 'ABC-122', title: 'Write the table record' },
  'task-4': { key: 'ABC-123', title: 'Measure the focus ring' },
  'task-5': { key: 'ABC-124', title: 'Port the calendar' },
  'task-6': { key: 'ABC-125', title: 'Name the neutral ramps' },
  'task-7': { key: 'ABC-126', title: 'Ship the app shell' },
  'task-8': { key: 'ABC-127', title: 'Retire the old badge' },
}

const COLUMNS = [
  { id: 'todo', name: 'Todo', icon: CircleDashed },
  { id: 'doing', name: 'In Progress', icon: CircleDot },
  { id: 'done', name: 'Done', icon: CircleCheck },
  { id: 'blocked', name: 'Blocked', icon: CircleSlash },
]

const BOARD: Containers<string> = {
  todo: ['task-1', 'task-2', 'task-3'],
  doing: ['task-4', 'task-5'],
  done: ['task-6', 'task-7', 'task-8'],
  blocked: [],
}

/**
 * The card is a `ClickableCard` with its own `onClick`, and the grip sits
 * *beside* it in the `Sortable.Item`, absolutely positioned over the corner.
 * Not inside it: a button in a button is invalid HTML and an axe failure.
 * The card is `onClick` rather than `href` because an `<a>` is natively
 * draggable, and the browser's own drag would take the pointer stream before
 * dnd-kit saw it.
 */
function TaskCard({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const task = TASKS[id]
  return (
    <Sortable.Item id={id} label={task.title} role="listitem">
      <ClickableCard onClick={() => onOpen(id)} className="pr-12">
        <div className="flex flex-col">
          <span className="text-content-subtle font-mono text-sm">{task.key}</span>
          <span className="font-semibold">{task.title}</span>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-2">
          <AvatarGroup size="small" surface="card-primary">
            <Avatar name="Ada Lovelace" />
            <Avatar name="Grace Hopper" />
          </AvatarGroup>
          <div className="flex items-center gap-2">
            <Token startIcon={ChevronsUp}>3</Token>
            <Token startIcon={MessageCircle}>2</Token>
          </div>
        </div>
      </ClickableCard>
      <DragHandle className="absolute top-2 right-2" />
    </Sortable.Item>
  )
}

/**
 * The kanban composition from `ClickableCard`'s stories (`40004220:13045`),
 * now with cards that move. Each column's body is a `Sortable` inside the
 * `ContentBlock.Content`, and a fourth column starts **empty** on purpose:
 * with nothing in it to collide with, the column's own rect is what a card
 * is dropped on, and that is the path `useDroppable` on the container exists
 * for.
 *
 * `onDragOver` is what moves a card between columns, while it is still being
 * carried — so the column it is over grows to take it, the way the board in
 * the prototype does, and the counts in the headers follow. Click a card and
 * it still opens: the pointer sensor waits for 4px of travel before it calls
 * a press a drag.
 *
 * The play function carries a Todo card right into In Progress, then a Done
 * card into the empty column, by keyboard, and checks the columns' lists,
 * their counts, and where focus ended up.
 */
export const Kanban: Story = {
  render: function KanbanStory() {
    const [containers, , handlers] = useBoard(BOARD)
    const [opened, setOpened] = useState<string | null>(null)

    return (
      <DragAndDrop {...handlers}>
        <div className="grid max-w-320 gap-4 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <ContentBlock key={column.id}>
              <ContentBlock.Header
                icon={column.icon}
                titleSlot={<Badge color="neutral">{containers[column.id].length}</Badge>}
              >
                {column.name}
              </ContentBlock.Header>
              <ContentBlock.Content className="flex-1">
                <Sortable
                  id={column.id}
                  label={column.name}
                  items={containers[column.id]}
                  role="list"
                  aria-label={column.name}
                  // A floor, so an emptied column still has a rect to drop on.
                  className="flex min-h-24 flex-1 flex-col gap-2 rounded-md"
                >
                  {containers[column.id].map((id) => (
                    <TaskCard key={id} id={id} onOpen={setOpened} />
                  ))}
                </Sortable>
              </ContentBlock.Content>
            </ContentBlock>
          ))}
        </div>
        <p className="text-content-subtle mt-4 text-sm" data-testid="opened">
          {opened ? `Opened ${TASKS[opened].key}` : 'Click a card to open it.'}
        </p>
      </DragAndDrop>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const column = (name: string) => canvas.getByRole('list', { name })
    const count = (name: string) =>
      Number(within(canvas.getByRole('heading', { name }).parentElement!).getByText(/^\d+$/).textContent)

    await step('a card is carried from Todo into In Progress', async () => {
      await expect(count('Todo')).toBe(3)
      await expect(count('In Progress')).toBe(2)

      await lift(canvas.getByRole('button', { name: 'Move Audit the color tokens' }))
      await userEvent.keyboard('{ArrowRight}')
      // Moved while still carried — that is `onDragOver`.
      await waitFor(() =>
        expect(
          within(column('In Progress')).getByRole('button', { name: 'Move Audit the color tokens' }),
        ).toBeInTheDocument(),
      )
      await userEvent.keyboard(' ')
      await waitFor(() =>
        expect(status(canvasElement)).toHaveTextContent(/dropped in In Progress/),
      )
      await expect(count('Todo')).toBe(2)
      await expect(count('In Progress')).toBe(3)
      await waitFor(() =>
        expect(document.activeElement).toBe(
          within(column('In Progress')).getByRole('button', { name: 'Move Audit the color tokens' }),
        ),
      )
    })

    await step('and a Done card into the empty column', async () => {
      await expect(within(column('Blocked')).queryAllByRole('listitem')).toHaveLength(0)
      await lift(canvas.getByRole('button', { name: 'Move Name the neutral ramps' }))
      await userEvent.keyboard('{ArrowRight}')
      await waitFor(() =>
        expect(within(column('Blocked')).getAllByRole('listitem')).toHaveLength(1),
      )
      await userEvent.keyboard(' ')
      await waitFor(() => expect(status(canvasElement)).toHaveTextContent(/dropped in Blocked/))
      await expect(count('Done')).toBe(2)
      await expect(count('Blocked')).toBe(1)
    })

    await step('a plain click still opens the card', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^ABC-121/ }))
      await expect(canvas.getByTestId('opened')).toHaveTextContent('Opened ABC-121')
    })
  },
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const BLOCKS: Record<string, string> = {
  'block-1': 'Revenue',
  'block-2': 'Active users',
  'block-3': 'Conversion',
  'block-4': 'Churn',
  'block-5': 'Sessions',
  'block-6': 'Signups',
}

const ROWS: Containers<string> = {
  'row-1': ['block-1', 'block-2'],
  'row-2': ['block-3', 'block-4', 'block-5'],
  'row-3': ['block-6'],
}

/** The prototype's row is 436 tall and never shorter; these are the story's own numbers. */
const ROW_HEIGHT = 256
const MIN_ROW_HEIGHT = 160
const MAX_ROW_HEIGHT = 640
/** `gap-4` between the columns, which the span arithmetic has to know about. */
const GRID_GAP = 16

/**
 * The whole dashboard, as one value: which blocks are in which row, the rows
 * in order, every block's current span, which spans were set by hand, and
 * each row's height. Kept as one object so a drag's snapshot is one
 * assignment and Escape puts *all* of it back.
 */
interface Board {
  containers: Containers<string>
  order: string[]
  /** Written by `resize`; re-derived by `reflow` when a row's members change. */
  spans: Record<string, number>
  /** Blocks somebody sized by hand: they keep their span through a reflow. */
  manual: string[]
  heights: Record<string, number>
}

function sameMembers(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i])
}

/**
 * Take a new set of containers and re-share the columns of every row whose
 * *members* changed. A row that only reordered keeps each block's span, and a
 * row that did not change at all keeps the proportional spans `resize` gave
 * it — `moveItem` and the helpers below leave an untouched row's array as the
 * same reference, which is what makes "unchanged" cheap to know. A block left
 * alone in its row forgets its hand size: it takes the whole row anyway.
 */
function settle(board: Board, containers: Containers<string>, order = board.order): Board {
  const spans = { ...board.spans }
  const manual = new Set(board.manual)
  for (const row of order) {
    const items = containers[row]
    const before = board.containers[row]
    if (items === before) continue
    if (items.length === 1) manual.delete(items[0])
    if (before && sameMembers(items, before)) continue
    reflow(items, spans, manual).forEach((span, i) => {
      spans[items[i]] = span
    })
  }
  return { ...board, containers, order, spans, manual: [...manual] }
}

function dropEmptyRows(board: Board): Board {
  return { ...board, order: board.order.filter((row) => board.containers[row].length > 0) }
}

function ReportBlock({
  id,
  label,
  span,
  max,
  onRemove,
  onResize,
}: {
  id: string
  label: string
  span: ColumnSpan
  /** The widest this block may go; `undefined` for the last block, which has no handle. */
  max?: number
  onRemove: (id: string) => void
  onResize: (id: string, next: number) => void
}) {
  const item = useRef<HTMLDivElement>(null)
  return (
    <Sortable.Item
      ref={item}
      id={id}
      label={label}
      role="listitem"
      className={cn(COL_SPAN[span], 'h-(--row-height) rounded-lg')}
    >
      <ContentBlock>
        <ContentBlock.Header
          actions={
            <>
              <DragHandle />
              {/*
                `data-drag-ignore`: a press here is a click on the remove
                button, never the start of a drag.
              */}
              <Button
                appearance="ghost"
                startIcon={X}
                aria-label={`Remove ${label}`}
                data-drag-ignore
                onClick={() => onRemove(id)}
              />
            </>
          }
        >
          {label}
        </ContentBlock.Header>
        <ContentBlock.Content className="flex-1">
          <div className="text-content-subtle flex flex-1 items-center justify-center text-sm">
            Report block
          </div>
        </ContentBlock.Content>
      </ContentBlock>
      {/*
        The prototype's `Item Resize Handle`: the 16px gap to the right of
        every block but the last, which has nothing to its right to take
        from. It reports columns, so one pixel unit is one twelfth of the
        row, measured when the drag starts.
      */}
      {max !== undefined && (
        <ResizeHandle
          label={`Resize ${label}`}
          orientation="vertical"
          value={span}
          min={MIN_SPAN}
          max={max}
          unit={() => {
            const grid = item.current?.parentElement
            return grid ? (grid.getBoundingClientRect().width + GRID_GAP) / GRID_COLUMNS : 1
          }}
          valueText={(value) => `${value} of ${GRID_COLUMNS} columns`}
          onResize={(next) => onResize(id, next)}
          className="absolute inset-y-0 right-0 translate-x-full"
        />
      )}
    </Sortable.Item>
  )
}

/**
 * The composable dashboard from Nathan's Figma Make prototype, and the
 * pattern Mixpanel Boards use: rows of blocks on a twelve-column grid, at
 * most four to a row and none narrower than three columns. A row shares its
 * columns out evenly (`distribute` in `spans.ts`), so two blocks are 6/6,
 * three are 4/4/4, and a block left alone takes the whole row.
 *
 * Each row is a `Sortable` on `horizontalListSortingStrategy` — blocks slide
 * sideways as one passes, and a block carried up or down joins the other row
 * while it is still being carried. **A row at `capacity` refuses a fifth**:
 * it and its blocks stop being drop targets for anything from another row,
 * so a carried block skips past it and the arrow keys do too. A row's "add"
 * rail appears on hover and on focus, and closes at four; the button under
 * the grid appends a row; a row whose last block is removed disappears.
 *
 * **Resizing is the prototype's other half.** The strip between two blocks
 * is a `ResizeHandle` that snaps the left block to a column and shares the
 * rest among the blocks to its right in proportion (`resize`); the block is
 * then *hand-sized* and keeps its span when the row's members change, while
 * the others re-share (`reflow`). The strip under a row sets its height. Both
 * are focusable separators: arrows step, Shift steps further, Home and End
 * go to the ends — and the play function drives them that way.
 *
 * The play function checks the spans the grid actually rendered, resizes by
 * column and by row, carries a block from the first row to the second by
 * keyboard, then exercises the add rail, the remove button and the add-row
 * button.
 */
export const Dashboard: Story = {
  render: function DashboardStory() {
    const [board, setBoard] = useState<Board>(() =>
      settle(
        { containers: {}, order: Object.keys(ROWS), spans: {}, manual: [], heights: {} },
        ROWS,
      ),
    )
    const [labels, setLabels] = useState(BLOCKS)
    const snapshot = useRef(board)
    const next = useRef(1)

    function addBlock(row: string) {
      const id = `block-new-${next.current}`
      const label = `Block ${next.current}`
      next.current += 1
      setLabels((current) => ({ ...current, [id]: label }))
      setBoard((current) =>
        settle(
          current,
          { ...current.containers, [row]: [...(current.containers[row] ?? []), id] },
          current.order.includes(row) ? current.order : [...current.order, row],
        ),
      )
    }

    function addRow() {
      addBlock(`row-new-${next.current}`)
    }

    function removeBlock(id: string) {
      setBoard((current) => {
        const row = findContainer(current.containers, id)
        if (!row) return current
        const containers = {
          ...current.containers,
          [row]: current.containers[row].filter((item) => item !== id),
        }
        return dropEmptyRows(settle(current, containers))
      })
    }

    function resizeBlock(id: string, span: number) {
      setBoard((current) => {
        const row = findContainer(current.containers, id)
        if (!row) return current
        const items = current.containers[row]
        const spans = resize(
          items.map((item) => current.spans[item]),
          items.indexOf(id),
          span,
        )
        const nextSpans = { ...current.spans }
        spans.forEach((value, i) => {
          nextSpans[items[i]] = value
        })
        const manual = current.manual.includes(id) ? current.manual : [...current.manual, id]
        return { ...current, spans: nextSpans, manual }
      })
    }

    function resizeRow(row: string, height: number) {
      setBoard((current) => ({ ...current, heights: { ...current.heights, [row]: height } }))
    }

    return (
      <DragAndDrop
        onDragStart={() => {
          snapshot.current = board
        }}
        onDragOver={({ active, over }) => {
          if (!over) return
          setBoard((current) => {
            const from = findContainer(current.containers, active.id)
            const to = findContainer(current.containers, over.id)
            if (!from || !to || from === to) return current
            return settle(current, moveItem(current.containers, active.id, over.id))
          })
        }}
        onDragEnd={({ active, over }) => {
          setBoard((current) =>
            dropEmptyRows(
              over ? settle(current, moveItem(current.containers, active.id, over.id)) : current,
            ),
          )
        }}
        onDragCancel={() => setBoard(snapshot.current)}
      >
        <div className="flex max-w-320 flex-col">
          {board.order.map((row, index) => {
            const items = board.containers[row]
            const spans = items.map((id) => board.spans[id] as ColumnSpan)
            const height = board.heights[row] ?? ROW_HEIGHT
            const name = `Row ${index + 1}`
            return (
              <div
                key={row}
                className="group flex items-start gap-2"
                style={{ '--row-height': `${height}px` } as CSSProperties}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <Sortable
                    id={row}
                    label={name}
                    items={items}
                    capacity={MAX_BLOCKS_PER_ROW}
                    strategy={horizontalListSortingStrategy}
                    role="list"
                    aria-label={name}
                    // A floor, so a row emptied mid-drag keeps a rect its block can come back to.
                    className="grid min-h-16 min-w-0 grid-cols-12 gap-4 rounded-lg"
                  >
                    {items.map((id, position) => (
                      <ReportBlock
                        key={id}
                        id={id}
                        label={labels[id]}
                        span={spans[position]}
                        max={position < items.length - 1 ? maxSpan(spans, position) : undefined}
                        onRemove={removeBlock}
                        onResize={resizeBlock}
                      />
                    ))}
                  </Sortable>
                  {/*
                    The prototype's `Row Resize Spacer`: the 16px under every
                    row is the handle for its height, and the space between
                    rows at the same time.
                  */}
                  <ResizeHandle
                    label={`Resize ${name} height`}
                    orientation="horizontal"
                    value={height}
                    min={MIN_ROW_HEIGHT}
                    max={MAX_ROW_HEIGHT}
                    step={8}
                    largeStep={40}
                    valueText={(value) => `${value} pixels`}
                    onResize={(value) => resizeRow(row, value)}
                  />
                </div>
                {/*
                  The prototype's rail: a full-height strip on the row's edge
                  that shows on hover. `focus-visible:opacity-100` so it is
                  there for a keyboard too; `disabled` keeps it in the tab
                  order at four blocks, saying no rather than vanishing.
                */}
                <Button
                  appearance="ghost"
                  startIcon={Plus}
                  aria-label={`Add block to ${name}`}
                  disabled={!canAddBlock(items.length)}
                  onClick={() => addBlock(row)}
                  className="h-(--row-height) w-6 shrink-0 px-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                />
              </div>
            )
          })}
          <Button appearance="secondary" startIcon={Plus} onClick={addRow} className="self-start">
            Add report block
          </Button>
        </div>
      </DragAndDrop>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const row = (n: number) => canvas.getByRole('list', { name: `Row ${n}` })
    const spans = (n: number) =>
      within(row(n))
        .getAllByRole('listitem')
        .map((item) => getComputedStyle(item).gridColumnEnd)

    await step('the grid renders the spans the arithmetic says', async () => {
      await expect(spans(1)).toEqual(['span 6', 'span 6'])
      await expect(spans(2)).toEqual(['span 4', 'span 4', 'span 4'])
      await expect(spans(3)).toEqual(['span 12'])
    })

    await step('the handle between two blocks resizes the left one by the column', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Revenue' })
      await expect(handle).toHaveAttribute('aria-valuenow', '6')
      await expect(handle).toHaveAttribute('aria-valuemin', '3')
      // Nine, because the neighbour keeps its three.
      await expect(handle).toHaveAttribute('aria-valuemax', '9')
      await expect(handle).toHaveAttribute('aria-valuetext', '6 of 12 columns')
      handle.focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect(spans(1)).toEqual(['span 7', 'span 5'])
      await userEvent.keyboard('{End}')
      await expect(spans(1)).toEqual(['span 9', 'span 3'])
      // And it will not push the neighbour under three.
      await userEvent.keyboard('{ArrowRight}')
      await expect(spans(1)).toEqual(['span 9', 'span 3'])
      await userEvent.keyboard('{Home}')
      await expect(spans(1)).toEqual(['span 3', 'span 9'])
      // The last block has nothing to its right, so no handle.
      await expect(canvas.queryByRole('separator', { name: 'Resize Active users' })).toBeNull()
    })

    await step('the pill follows the pointer along the handle, and returns to the middle', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Revenue' })
      const pill = handle.firstElementChild as HTMLElement
      const rect = handle.getBoundingClientRect()
      // A real cursor cannot be moved here, but the pointer events can be sent
      // with coordinates, and the position is read off them — not off :hover.
      await userEvent.pointer({ target: handle, coords: { clientX: rect.left + 8, clientY: rect.top + 100 } })
      await expect(handle.style.getPropertyValue('--pill-offset')).toBe('100px')
      // The pill *slides* there, so the computed position needs the transition to end.
      await waitFor(() => expect(getComputedStyle(pill).top).toBe('100px'))
      // Clamped: the pill stays inside the strip rather than hanging off its end.
      await userEvent.pointer({ target: handle, coords: { clientX: rect.left + 8, clientY: rect.top + 2 } })
      await expect(handle.style.getPropertyValue('--pill-offset')).toBe('20px')
      await userEvent.unhover(handle)
      await expect(handle.style.getPropertyValue('--pill-offset')).toBe('')
      await waitFor(() => expect(getComputedStyle(pill).top).toBe(`${Math.round(rect.height / 2)}px`))
    })

    await step('a hand-sized block keeps its span when the row changes', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add block to Row 1' }))
      // Revenue stays at 3; the other two share the nine.
      await expect(spans(1)).toEqual(['span 3', 'span 4', 'span 5'])
      await userEvent.click(canvas.getByRole('button', { name: 'Remove Block 1' }))
      await expect(spans(1)).toEqual(['span 3', 'span 9'])
    })

    await step('the handle under a row resizes its height', async () => {
      const handle = canvas.getByRole('separator', { name: 'Resize Row 1 height' })
      const height = () => within(row(1)).getAllByRole('listitem')[0].getBoundingClientRect().height
      await expect(handle).toHaveAttribute('aria-valuenow', String(ROW_HEIGHT))
      await expect(height()).toBe(ROW_HEIGHT)
      handle.focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(ROW_HEIGHT + 8))
      // And the height actually reached the layout, not just the attribute.
      await expect(height()).toBe(ROW_HEIGHT + 8)
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(ROW_HEIGHT + 8 - 40))
      await userEvent.keyboard('{Home}')
      await expect(handle).toHaveAttribute('aria-valuenow', String(MIN_ROW_HEIGHT))
      await expect(height()).toBe(MIN_ROW_HEIGHT)
    })

    await step('a block is carried from the first row into the second', async () => {
      await lift(canvas.getByRole('button', { name: 'Move Revenue' }))
      await userEvent.keyboard('{ArrowDown}')
      // Joined the row while still carried, and both rows re-shared their
      // columns: Revenue keeps the three it was sized to, the rest share nine.
      await waitFor(() =>
        expect(within(row(2)).getByRole('button', { name: 'Move Revenue' })).toBeInTheDocument(),
      )
      await waitFor(() => expect(spans(1)).toEqual(['span 12']))
      await expect(spans(2)).toEqual(['span 3', 'span 3', 'span 3', 'span 3'])
      await userEvent.keyboard(' ')
      await waitFor(() => expect(status(canvasElement)).toHaveTextContent(/Revenue dropped in Row 2/))
      await waitFor(() =>
        expect(document.activeElement).toBe(
          within(row(2)).getByRole('button', { name: 'Move Revenue' }),
        ),
      )
      // Four is the row's ceiling.
      await expect(canvas.getByRole('button', { name: 'Add block to Row 2' })).toBeDisabled()
    })

    await step('a full row refuses a fifth block, from the keyboard and so from the pointer', async () => {
      // Row 2 is full. Row 1 has one block; carried down, it has to skip row 2
      // entirely — the row and its blocks are no longer drop targets for it.
      await lift(canvas.getByRole('button', { name: 'Move Active users' }))
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() =>
        expect(within(row(3)).getByRole('button', { name: 'Move Active users' })).toBeInTheDocument(),
      )
      await expect(spans(2)).toEqual(['span 3', 'span 3', 'span 3', 'span 3'])
      await userEvent.keyboard('{Escape}')
      await waitFor(() =>
        expect(within(row(1)).getByRole('button', { name: 'Move Active users' })).toBeInTheDocument(),
      )
      await expect(spans(1)).toEqual(['span 12'])
    })

    await step('the rail adds a block to a row', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add block to Row 1' }))
      await expect(spans(1)).toEqual(['span 6', 'span 6'])
      await userEvent.click(canvas.getByRole('button', { name: 'Add block to Row 1' }))
      await expect(spans(1)).toEqual(['span 4', 'span 4', 'span 4'])
    })

    await step('removing the last block removes the row', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Remove Signups' }))
      await expect(canvas.queryByRole('list', { name: 'Row 3' })).toBeNull()
    })

    await step('the button under the grid appends a row with one block', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add report block' }))
      await expect(spans(3)).toEqual(['span 12'])
    })
  },
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * The same list, with `DragAndDrop.Overlay`. The carried row is now a copy
 * drawn on the library's overlay layer, portalled to `<body>`, and the row
 * in the list stays put at half opacity as the placeholder. Reach for this
 * only when an item has to be carried *out of* a scroll container, which
 * would otherwise clip it at the edge; for everything else the item itself
 * moves, and the motion stays a CSS transition on the tokens.
 *
 * The play function lifts a row by keyboard and checks the copy is on the
 * overlay layer and under `<body>`, then cancels and checks it is gone.
 */
export const WithOverlay: Story = {
  render: function WithOverlayStory() {
    const [items, setItems] = useState(PEOPLE)
    const [active, setActive] = useState<string | null>(null)

    return (
      <DragAndDrop
        onDragStart={({ active }: DragStartEvent) => setActive(String(active.id))}
        onDragCancel={() => setActive(null)}
        onDragEnd={({ active, over }) => {
          setActive(null)
          if (!over || active.id === over.id) return
          setItems((current) =>
            reorder(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))),
          )
        }}
      >
        <Sortable
          id="people"
          label="People"
          items={items}
          render={<ul aria-label="People" />}
          className="flex w-72 flex-col gap-2"
        >
          {items.map((name) => (
            <Sortable.Item key={name} id={name} label={name} render={<li />}>
              <PersonRow name={name} />
            </Sortable.Item>
          ))}
        </Sortable>
        <DragAndDrop.Overlay>{active ? <OverlayRow name={active} /> : null}</DragAndDrop.Overlay>
      </DragAndDrop>
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const overlay = () =>
      Array.from(document.body.children).find(
        (element) => element instanceof HTMLElement && element.style.zIndex === '40',
      )

    await step('a lifted row is drawn on the overlay layer', async () => {
      await lift(canvas.getByRole('button', { name: 'Move Carol' }))
      await waitFor(() => expect(overlay()).toBeDefined())
      await expect(overlay()!).toHaveTextContent('Carol')
    })

    await step('and gone once the drag is over', async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(overlay()).toBeUndefined())
    })
  },
}

/** What the overlay draws: the row, without a live grip. */
function OverlayRow({ name }: { name: string }): ReactNode {
  return (
    <Card padding={2} className="flex-row items-center gap-2 shadow-medium">
      <DragHandle label={name} aria-hidden="true" tabIndex={-1} />
      <span>{name}</span>
    </Card>
  )
}
