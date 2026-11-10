import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { FolderOpen, Plus, TriangleAlert } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import {
  DragAndDrop,
  DragHandle,
  findContainer,
  moveItem,
  Sortable,
  type Containers,
} from '../../../../src/components/DragAndDrop'
import { Icon } from '../../../../src/components/Icon'
import { Text } from '../../../../src/components/Text'
import { Toast } from '../../../../src/components/Toast'
import { cn } from '../../../../src/lib/cn'
import { TaskCard } from '../../components/TaskCard'
import {
  BOARD_COLUMNS,
  blockerOf,
  columnOf,
  statusFor,
  type BoardColumn,
} from '../../components/taskMeta'
import { personFor } from '../../data/people'
import type { Project, Task } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { NotBuiltMessage } from '../NotBuiltMessage'
import { taskPath } from './paths'
import { useTasks } from './tasksState'
import { ViewToolbar } from './ViewToolbar'

/** Each column's task ids, top to bottom, in the Board's order. */
function columnsFor(order: string[], tasks: Task[]): Containers<string> {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const columns: Containers<string> = Object.fromEntries(
    BOARD_COLUMNS.map((column) => [column.value, [] as string[]]),
  )
  for (const id of order) {
    const task = byId.get(id)
    if (task) columns[columnOf(task.status)].push(id)
  }
  return columns
}

/** "Final electrical inspection isn’t done. Drop here to move it anyway, and Marcus gets a heads-up." */
function noticeText(blocker: Task): string {
  const first = personFor(blocker.assigneeId).name.split(' ')[0]
  return `${blocker.title} isn’t done. Drop here to move it anyway, and ${first} gets a heads-up.`
}

/**
 * A project's Board tab (`Project - Board`, `40006268:8728`): the toolbar,
 * then a column a status — To do, In progress, In review, Done — each a
 * Subtle `ContentBlock` with a `Sortable` inside, the shape of Yet Social's
 * Ideas board. A card opens its task's panel; dragged to another column it
 * takes that column's status, and its place in the column is kept.
 *
 * The carried card is a tilted copy on `DragAndDrop.Overlay`, and the card
 * itself stays in the board as the slot it will land in, which is how
 * `Project - Board / Dragging a blocked task` (`40006292:21137`) can draw
 * both at once. A blocked card carried out of In progress turns its slot
 * into the frame's "Still blocked" notice; dropped there it moves anyway,
 * and the person who owns what it waits on gets a heads-up.
 */
export function BoardView({
  project,
  selectedTaskId,
}: {
  project: Project
  /** The task whose panel is open, drawn as the selected card. */
  selectedTaskId?: string
}) {
  const navigate = useNavigate()
  const shell = useShell()
  const toast = Toast.useToast()
  const { tasks, order, moveTask } = useTasks()
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === project.id),
    [tasks, project.id],
  )
  const settled = useMemo(() => columnsFor(order, projectTasks), [order, projectTasks])

  // While a card is carried the board is local: it joins the column it is
  // over as it crosses (`onDragOver`), and only the drop writes a status.
  // The ref is what the handlers read, so the drop sees the latest crossing
  // rather than the render it was created in.
  const carried = useRef<Containers<string> | null>(null)
  const [dragging, setDragging] = useState<{ id: string; columns: Containers<string> } | null>(null)
  const carry = (id: string, columns: Containers<string> | null) => {
    carried.current = columns
    setDragging(columns ? { id, columns } : null)
  }
  const columns = dragging?.columns ?? settled

  const active = dragging ? projectTasks.find((task) => task.id === dragging.id) : undefined
  const activeColumn = active ? findContainer(columns, active.id) : undefined
  const blocker = active ? blockerOf(active, tasks) : undefined
  const warning =
    active && blocker && activeColumn !== columnOf(active.status) ? blocker : undefined

  const settle = (id: string, final: Containers<string>) => {
    const task = projectTasks.find((t) => t.id === id)
    const to = findContainer(final, id) as BoardColumn | undefined
    if (!task || !to) return
    const moved = to !== columnOf(task.status)
    const ours = new Set(projectTasks.map((t) => t.id))
    const nextOrder = [
      ...order.filter((taskId) => !ours.has(taskId)),
      ...BOARD_COLUMNS.flatMap((column) => final[column.value]),
    ]
    const waitingOn = moved ? blockerOf(task, tasks) : undefined
    moveTask(id, {
      status: moved ? to : undefined,
      order: nextOrder,
      headsUp: waitingOn ? { personId: waitingOn.assigneeId, blocker: waitingOn.title } : undefined,
    })
    if (waitingOn) {
      toast.add({
        title: `Moved to ${statusFor(to).label}`,
        description: `${personFor(waitingOn.assigneeId).name} got a heads-up that ${task.title} moved before ${waitingOn.title} was done.`,
      })
    }
  }

  const handlers = {
    onDragStart({ active }: DragStartEvent) {
      carry(String(active.id), settled)
    },
    onDragOver({ active, over }: DragOverEvent) {
      const current = carried.current
      if (!over || !current) return
      const from = findContainer(current, active.id)
      const to = findContainer(current, over.id)
      if (!from || !to || from === to) return
      carry(String(active.id), moveItem(current, active.id, over.id))
    },
    onDragEnd({ active, over }: DragEndEvent) {
      const current = carried.current
      carry(String(active.id), null)
      if (!current) return
      settle(String(active.id), over ? moveItem(current, active.id, over.id) : current)
    },
    // Escape puts every card back where the drag found it: the settled board
    // was never touched.
    onDragCancel() {
      carry('', null)
    },
  }

  const renderCard = (id: string) => {
    const task = projectTasks.find((t) => t.id === id)!
    const slot = warning && task.id === active?.id
    return (
      <Sortable.Item
        key={id}
        id={id}
        label={task.title}
        role="listitem"
        // The overlay carries the lift, so the slot left behind only fades.
        // As the notice it is the file's `Over` slot instead: no fade, the
        // emphasized ring. The card under the pointer gets no ring: the slot
        // already shows where the drop lands, and the frame rings nothing
        // else (FINDINGS 22).
        className={cn(
          'group/task data-dragging:shadow-none data-over:ring-0',
          slot && 'opacity-100 ring-2 ring-surface-border-emphasized',
        )}
      >
        {slot ? (
          <BlockedNotice task={task}>{noticeText(warning)}</BlockedNotice>
        ) : (
          <TaskCard
            task={task}
            selected={task.id === selectedTaskId}
            onClick={() => navigate(taskPath(task, 'board'))}
          />
        )}
        {/* Figma draws no grip; the keyboard needs one, so it shows on hover
            and on focus, as on Yet Social's Ideas board. */}
        <DragHandle className="absolute top-2 right-2 bg-surface-background-primary opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100" />
      </Sortable.Item>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <ViewToolbar group="Status" />
      {projectTasks.length > 0 ? (
        <DragAndDrop {...handlers}>
          {/* The board is the scroller both ways, as the Ideas board is: the
              track starts at the top and is at least the board's height, so
              every column ends level and grows with the tallest. */}
          <div className="-mx-4 flex min-h-64 flex-1 items-start overflow-auto px-4 pb-1">
            <div className="flex min-h-full w-full shrink-0 gap-3">
              {BOARD_COLUMNS.map((column) => (
                <BoardColumnBlock
                  key={column.value}
                  label={column.label}
                  id={column.value}
                  ids={columns[column.value]}
                  onAdd={() => shell.notBuilt('Adding a task from the Board')}
                  renderCard={renderCard}
                />
              ))}
            </div>
          </div>
          <DragAndDrop.Overlay>
            {active ? (
              // A picture of the card, not a second one: the real card is in
              // the board, and keeps the name and the focus. The file's 2°
              // tilt is one element in: dnd-kit measures the overlay's child,
              // a rotated box is wider and taller, and with the tilt there
              // ArrowRight found the card below "to the right" and stayed
              // in the column (FINDINGS 21).
              <div aria-hidden inert>
                <div className="-rotate-2 rounded-md shadow-medium">
                  <TaskCard task={active} />
                </div>
              </div>
            ) : null}
          </DragAndDrop.Overlay>
        </DragAndDrop>
      ) : (
        <NotBuiltMessage
          icon={FolderOpen}
          title="No tasks in this mock yet"
          body={`Only Austin store opening has tasks so far; ${project.name}’s come in a later slice.`}
          link={{ href: '#/projects/austin/board', label: 'Open Austin store opening' }}
        />
      )}
      {/* The notice is drawn in the slot; this says it to a screen reader,
          after dnd-kit's own "is over In review". */}
      <div role="status" className="sr-only">
        {warning ? `Still blocked. ${noticeText(warning)}` : ''}
      </div>
    </div>
  )
}

/**
 * One status: the file's Content Block on the subtle surface, the status in
 * its header with a Ghost add button, then the cards. The `Sortable` is the
 * whole column body, so an empty column is a full-height target, as the
 * Ideas board found it has to be.
 */
function BoardColumnBlock({
  id,
  label,
  ids,
  onAdd,
  renderCard,
}: {
  id: BoardColumn
  label: string
  ids: string[]
  onAdd: () => void
  renderCard: (id: string) => ReactNode
}) {
  return (
    <ContentBlock
      emphasis="subtle"
      headingLevel={2}
      // Four columns share the row (281 each at 1440, as drawn); past 256 the
      // board scrolls sideways instead, which is what opening a task's panel
      // beside it does.
      className="h-auto min-w-64 flex-1 basis-0"
    >
      <ContentBlock.Header
        actions={
          <Button
            appearance="ghost"
            startIcon={Plus}
            aria-label={`Add a task to ${label}`}
            onClick={onAdd}
          />
        }
      >
        {label}
      </ContentBlock.Header>
      <ContentBlock.Content className="flex-1 gap-2 px-2 pb-4">
        <Sortable
          id={id}
          label={label}
          items={ids}
          className="flex flex-1 flex-col gap-2 rounded-md"
        >
          {ids.length > 0 && (
            <div role="list" aria-label={label} className="flex flex-col gap-2">
              {ids.map(renderCard)}
            </div>
          )}
        </Sortable>
      </ContentBlock.Content>
    </ContentBlock>
  )
}

/**
 * The slot a blocked card would land in outside In progress
 * (`40006292:21137`): a `triangle-alert` and "Still blocked", then what it
 * waits on and who will be told. The card sits under it unseen, so the slot
 * is exactly the card's height and nothing shifts as it swaps.
 */
function BlockedNotice({ task, children }: { task: Task; children: string }) {
  return (
    <span className="grid">
      <span className="invisible [grid-area:1/1]">
        <TaskCard task={task} />
      </span>
      <span className="flex flex-col gap-1 p-3 [grid-area:1/1]">
        <span className="flex items-center gap-1">
          <Icon icon={TriangleAlert} size="small" className="text-content-primary" />
          <Text render={<span />} size="sm" weight="semibold" color="emphasized">
            Still blocked
          </Text>
        </span>
        <Text render={<span />} size="sm" color="subtle">
          {children}
        </Text>
      </span>
    </span>
  )
}
