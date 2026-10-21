import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  pointerWithin,
  type CollisionDetection,
  type DragMoveEvent,
  type DroppableContainer,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Calendars,
  Construction,
  Ellipsis,
  LayoutDashboard,
  ListFilter,
  Plus,
  Link as LinkIcon,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import {
  DragAndDrop,
  MAX_BLOCKS_PER_ROW,
  Sortable,
  dragEnd,
  dragOver,
  findContainer,
  maxSpan,
  resizeBlock,
  resizeRow,
  rowSpans,
  spareRow,
  spareRowCollision,
  type Board as BoardLayout,
  type ColumnSpan,
} from '../../../../src/components/DragAndDrop'
import { Icon } from '../../../../src/components/Icon'
import { Link } from '../../../../src/components/Link'
import { ResizeHandle } from '../../../../src/components/Resize'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { me } from '../../data/people'
import { rangeFor, type ReportRange } from '../../data/reports'
import type { Report } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { AddWidgetPanel, CatalogTileFace } from './AddWidgetPanel'
import { reportsPath } from './model'
import { RangeControl } from './RangeControl'
import { useReports, type WidgetPlace } from './reportsState'
import { WidgetBlock } from './WidgetBlock'
import { isCatalogDrag, type CatalogEntry } from './widgetCatalog'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'

/**
 * A report board (`40005911:34608`): the date range, then the report's
 * widgets in rows you rearrange. The range lives in the URL (`?range=7d`).
 *
 * The rows are `DragAndDrop`'s dashboard — the library's `Board`, with its
 * twelve columns, four-to-a-row and the strip between two widgets resizing by
 * the column. Carry the Overview into the trend's row and the two share it,
 * which is the file's other layout of the same board (`40005912:29853`).
 */
export function ReportScreen() {
  const { reportId } = useParams()
  const { reportFor } = useReports()
  const report = reportFor(reportId)
  if (!report) return <Missing />
  if (report.kind === 'builtin') return <BuiltIn report={report} />
  return <Board report={report} />
}

function Board({ report }: { report: Report }) {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const { boardFor, setBoard, widgetFor, insertWidget } = useReports()
  const range = rangeFor(params.get('range'))
  const current = boardFor(report.id)!
  const board = current.board
  const snapshot = useRef(board)
  // The file's dashed Add widget zone is the board's spare row (`withSpareRow`, FINDINGS 41).
  const spare = spareRow(board)
  const rowHeights = useRowHeights(board.order)

  const empty = board.order.every((row) => row === spare)

  // Add widget opens the catalog beside the board (`AddWidgetPanel`); every
  // way in toggles the same panel.
  const addOpen = shell.panel?.type === 'add-widget' && shell.panel.reportId === report.id
  const toggleAdd = () =>
    shell.setPanel(addOpen ? null : { type: 'add-widget', reportId: report.id })

  // The widget just added: scrolled to and ringed for a moment, and said.
  const [justAdded, setJustAdded] = useState<string>()
  // Once per add, from here rather than from the widget's own mount: a drag
  // remounts widgets. And instantly, not smoothly: a widget grabbed while a
  // smooth scroll is still carrying the board is re-aimed on every frame of
  // it, and the board reflowed until React gave up (max update depth).
  useEffect(() => {
    if (!justAdded) return
    document.querySelector(`[data-widget="${justAdded}"]`)?.scrollIntoView({ block: 'nearest' })
    const timer = setTimeout(() => setJustAdded(undefined), RING_MS)
    return () => clearTimeout(timer)
  }, [justAdded])
  const [announcement, setAnnouncement] = useState('')
  const add = (entry: CatalogEntry, at: WidgetPlace) => {
    const { id, title } = insertWidget(report.id, (id) => entry.make(report, id), entry.id, at)
    setJustAdded(id)
    setAnnouncement(`${title} added to the board`)
  }

  // A catalog tile on its way over: what it is, and where it would land.
  const [carried, setCarried] = useState<CatalogEntry | null>(null)
  const [target, setTarget] = useState<WidgetPlace | null>(null)
  const aim = (next: WidgetPlace | null) =>
    setTarget((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next))

  const setRange = (next: ReportRange) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('range', next)
    setParams(nextParams, { replace: true })
  }

  return (
    <>
      <ReportTopBar
        start={
          <Heading level={1} size="base" weight="semibold" truncate>
            {report.name}
          </Heading>
        }
        end={
          <div className="flex items-center gap-2 max-md:hidden">
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filters')}
            >
              Filters
            </Button>
            <Button
              appearance="ghost"
              startIcon={LinkIcon}
              aria-label="Share"
              onClick={() => shell.notBuilt('Sharing')}
            />
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
            <Viewing />
          </div>
        }
      />
      <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
        {/* `shrink-0`: a row that scrolls sideways has no minimum height, so the
            page column would squash it to nothing on a phone. */}
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto max-md:-mx-4 max-md:px-4">
          <RangeControl value={range} onChange={setRange} />
          <Button
            appearance="secondary"
            startIcon={Calendars}
            className="shrink-0"
            // Adds a second date range to compare against.
            onClick={() => shell.notBuilt('Adding a comparison date range')}
          >
            Compare
          </Button>
          {/* Add widget sits at the end of the range row, not in the top bar:
              the rail's New is the page's one primary action. */}
          <Button
            appearance="secondary"
            startIcon={Plus}
            className="ml-auto shrink-0"
            aria-expanded={addOpen}
            onClick={toggleAdd}
          >
            Add widget
          </Button>
        </div>

        {empty ? (
          // A Blank report, or one with every widget removed.
          <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-background-primary px-4 py-10 text-center">
            <Icon icon={LayoutDashboard} className="mb-2 text-content-subtle" aria-hidden />
            <Heading level={2} size="base" weight="semibold">
              This report has no widgets yet
            </Heading>
            <Text color="subtle">
              Add a widget to chart {report.topics.join(', ') || report.name}, then change it to
              whatever you need.
            </Text>
          </div>
        ) : null}

        <DragAndDrop
          collisionDetection={catalogCollision(spareRowCollision(spare))}
          onDragStart={({ active }) => {
            if (isCatalogDrag(active.data.current)) setCarried(active.data.current.entry)
            else snapshot.current = board
          }}
          onDragMove={(event) => {
            if (isCatalogDrag(event.active.data.current)) aim(placeFor(board, spare, event))
          }}
          onDragOver={({ active, over }) => {
            // A catalog tile changes nothing until it is let go: the board
            // reflowing under the pointer is what made FINDINGS 41 oscillate.
            if (isCatalogDrag(active.data.current)) return
            // `dragOver` refuses the spare row, which takes a widget only on
            // release; `DragAndDrop/CLAUDE.md` says why (FINDINGS 41).
            if (over) setBoard(report.id, (b) => dragOver(b, active.id, over.id))
          }}
          onDragEnd={(event) => {
            const { active, over } = event
            if (isCatalogDrag(active.data.current)) {
              // Worked out again from the release, not read from `target`,
              // which is a render behind the last move.
              const place = placeFor(board, spare, event)
              if (place) add(active.data.current.entry, place)
              setCarried(null)
              setTarget(null)
              return
            }
            setBoard(report.id, (b) => dragEnd(b, active.id, over ? over.id : null))
            swallowNextClick()
          }}
          onDragCancel={({ active }) => {
            if (isCatalogDrag(active.data.current)) {
              setCarried(null)
              setTarget(null)
              return
            }
            setBoard(report.id, () => snapshot.current)
          }}
        >
          {/* On a desktop the strip under each row is the gap between rows. */}
          <div ref={rowHeights.container} className="flex flex-col max-md:gap-3">
            {board.order.map((row, index) => {
              const items = board.containers[row]!
              const spans = rowSpans(board, row) as ColumnSpan[]
              const isSpare = row === spare
              const name = isSpare ? 'New row' : `Row ${index + 1}`
              // A row is as tall as its widgets until somebody sizes it; then
              // it holds that height and the charts in it follow.
              const fixed = board.heights[row]
              // Where a carried catalog tile would land: in this row, or in a
              // new row under it (a full row), or the spare.
              const dropInto =
                target !== null &&
                ((typeof target === 'object' && 'row' in target && target.row === row) ||
                  (target === 'end' && isSpare))
              const dropUnder =
                target !== null &&
                typeof target === 'object' &&
                'afterRow' in target &&
                target.afterRow === row
              return (
                <div
                  key={row}
                  className="relative flex flex-col"
                  style={fixed ? ({ '--row-height': `${fixed}px` } as CSSProperties) : undefined}
                >
                  <Sortable
                    data-row={row}
                    id={row}
                    label={name}
                    items={items}
                    capacity={MAX_BLOCKS_PER_ROW}
                    strategy={horizontalListSortingStrategy}
                    // The spare row holds a button, not widgets, so it is a group
                    // until something is carried into it (axe: a list owns items).
                    role={isSpare ? 'group' : 'list'}
                    aria-label={name}
                    // A floor, so a row emptied mid-drag keeps a rect its widget can come back to.
                    className={cn(
                      'grid min-h-16 min-w-0 grid-cols-12 gap-3 rounded-lg max-md:grid-cols-1',
                      dropInto && !isSpare && dropTarget,
                    )}
                  >
                    {isSpare ? (
                      // The file's dashed Add widget zone, and the drop target
                      // that gives a carried widget a row of its own. The whole
                      // zone is the button.
                      <Button
                        appearance="ghost"
                        startIcon={Plus}
                        aria-expanded={addOpen}
                        onClick={toggleAdd}
                        className={cn(
                          'col-span-full h-12 w-full rounded-lg border-dashed border-surface-border-emphasized hover:border-surface-border-emphasized',
                          dropInto && 'bg-action-ghost-background-hover',
                        )}
                      >
                        Add widget
                      </Button>
                    ) : (
                      items.map((id, position) => {
                        const widget = widgetFor(report.id, id) ?? current.widgets[id]!
                        return (
                          <WidgetBlock
                            key={id}
                            report={report}
                            widget={widget}
                            span={spans[position]!}
                            max={position < items.length - 1 ? maxSpan(spans, position) : undefined}
                            range={range}
                            rowHeight={fixed}
                            highlight={id === justAdded}
                            onResize={(block, span) =>
                              setBoard(report.id, (b) => resizeBlock(b, block, span))
                            }
                          />
                        )
                      })
                    )}
                  </Sortable>
                  {dropUnder ? (
                    // A full row takes no more: the tile would start a row under it.
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 -bottom-2.5 h-1 rounded-full bg-focus-focus-outer-border max-md:-bottom-2"
                    />
                  ) : null}
                  {isSpare ? null : (
                    // The strip under a row sets its height, from the height it
                    // has now — measured, until it has been sized by hand.
                    <ResizeHandle
                      label={`Resize ${name} height`}
                      orientation="horizontal"
                      value={fixed ?? rowHeights.measured[row] ?? DEFAULT_ROW_HEIGHT}
                      min={MIN_ROW_HEIGHT}
                      max={MAX_ROW_HEIGHT}
                      step={8}
                      largeStep={40}
                      valueText={(value) => `${value} pixels`}
                      onResize={(value) => setBoard(report.id, (b) => resizeRow(b, row, value))}
                      className="max-md:hidden"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Rendered here so its tiles are inside this drag context, and
              portalled after the Page, where the shell's panels go. */}
          {shell.screenPanelHost
            ? createPortal(
                <AddWidgetPanel
                  open={addOpen}
                  onClose={() => shell.setPanel(null)}
                  onAdd={(entry) => add(entry, 'end')}
                  announcement={announcement}
                />,
                shell.screenPanelHost,
              )
            : null}
          {/* The panel's body scrolls and would clip a tile carried out of it.
              Mounted only for a catalog drag: an overlay present during a
              widget's own drag is what dnd-kit measures and aims with, even
              empty, and the board's drags are built on the widget itself. */}
          {carried ? (
            <DragAndDrop.Overlay>
              <Card className="w-44 cursor-grabbing shadow-high">
                <CatalogTileFace entry={carried} />
              </Card>
            </DragAndDrop.Overlay>
          ) : null}
        </DragAndDrop>
      </AppShell.Content>
    </>
  )
}

/** How long a just-added widget keeps its ring before it fades. */
const RING_MS = 1600

/** A board row that a carried catalog tile would land in. */
const dropTarget =
  'bg-action-ghost-background-hover outline-1 outline-offset-4 outline-dashed outline-surface-border-emphasized'

/**
 * A catalog tile is aimed by the pointer, not by its rect: it starts in the
 * panel, and `closestCorners` would find the nearest row from there and drop
 * it on a release over the panel itself. With `pointerWithin` a tile still
 * over the panel is over nothing. A keyboard never carries one — it clicks.
 */
function catalogCollision(board: CollisionDetection): CollisionDetection {
  return (args) => (isCatalogDrag(args.active.data.current) ? pointerWithin(args) : board(args))
}

/**
 * Where a catalog tile let go now would land. Over a widget: beside it, on the
 * side of its middle the pointer is on. Over a row's own space: at its end.
 * The spare sends it to a new row at the foot.
 *
 * It reads the collision itself, not `over`: in a move event `over` is still
 * the one the last render saw, so a tile carried onto the spare was aimed at
 * the row above it.
 *
 * **A full row is no drop target at all** — `Sortable`'s `capacity` turns it
 * and its widgets off while something from outside is carried — so `over` is
 * empty there. The row under the pointer is found by its rect instead, and the
 * tile goes into a new row under it.
 */
function placeFor(
  board: BoardLayout,
  spare: string | undefined,
  {
    collisions,
    delta,
    activatorEvent,
  }: Pick<DragMoveEvent, 'collisions' | 'delta' | 'activatorEvent'>,
): WidgetPlace | null {
  // A catalog drag is always a pointer's (`CatalogTile` spreads no keyboard listener).
  const { clientX, clientY } = activatorEvent as PointerEvent
  const x = clientX + delta.x
  const y = clientY + delta.y
  const hit = collisions?.[0]
  if (!hit) {
    const full = Object.keys(board.containers).find((row) => {
      if (board.containers[row]!.length < MAX_BLOCKS_PER_ROW) return false
      const rect = document.querySelector(`[data-row="${row}"]`)?.getBoundingClientRect()
      return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    })
    return full ? { afterRow: full } : null
  }
  const overId = String(hit.id)
  const isRow = overId in board.containers
  const row = isRow ? overId : findContainer(board.containers, overId)
  if (!row) return null
  if (row === spare) return 'end'
  const items = board.containers[row]!
  if (items.length >= MAX_BLOCKS_PER_ROW) return { afterRow: row }
  if (isRow) return { row, index: items.length }
  const rect = (hit.data?.droppableContainer as DroppableContainer | undefined)?.rect.current
  const after = rect !== null && rect !== undefined && x > rect.left + rect.width / 2
  return { row, index: items.indexOf(overId) + (after ? 1 : 0) }
}

/** How short and tall a hand can make a row; the default is only for a row not measured yet. */
const MIN_ROW_HEIGHT = 160
const MAX_ROW_HEIGHT = 900
const DEFAULT_ROW_HEIGHT = 320

/**
 * Every row's rendered height, kept current. The row-height handle starts a
 * drag from its `value`, so a row still sized by its content has to report
 * the height it really has, or the first drag would jump.
 */
function useRowHeights(order: string[]) {
  const container = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<Record<string, number>>({})
  const key = order.join('|')
  useEffect(() => {
    const root = container.current
    if (!root) return
    const observer = new ResizeObserver((entries) => {
      setMeasured((current) => {
        let next = current
        for (const entry of entries) {
          const row = (entry.target as HTMLElement).dataset.row!
          const height = Math.round(entry.borderBoxSize[0]!.blockSize)
          if (current[row] !== height) next = { ...next, [row]: height }
        }
        return next
      })
    })
    root.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => observer.observe(row))
    return () => observer.disconnect()
  }, [key])
  return { container, measured }
}

/**
 * After a pointer drag the drag foundation stops the release's `click` at
 * document capture, which stops a handler but not an anchor's navigation —
 * and a widget's title is an anchor. This window-level capture listener runs
 * first and cancels that one click; if no click comes, it leaves on the next
 * task. (DragAndDrop's "link cards" trap: `draggable={false}` plus this.)
 */
function swallowNextClick() {
  const cancel = (event: Event) => event.preventDefault()
  window.addEventListener('click', cancel, { capture: true, once: true })
  setTimeout(() => window.removeEventListener('click', cancel, { capture: true }), 0)
}

/** Your own face, Figma's `Currently Viewing` (`40005911:33672`), the footprint of an icon-only Button. */
export function Viewing() {
  return (
    <span className="flex h-8 shrink-0 items-center px-3">
      <Avatar name={me.name} src={me.avatar} size="x-small" alt={`${me.name} is viewing`} />
    </span>
  )
}

/**
 * The report's Top Bar: Back to the list, then whatever the page puts at its
 * start. One child in `start`, because TopBar stretches each (FINDINGS 6).
 *
 * Back is a `Button` that navigates — Button has no `href`, on purpose
 * (FINDINGS 7) — because the file draws an icon-only button here and a `Link`
 * cannot be one. It goes to the list, not back in history, so it works on a
 * link opened cold.
 */
export function ReportTopBar({
  start,
  end,
  backTo = reportsPath,
  backLabel = 'Back to reports',
}: {
  start: ReactNode
  end?: ReactNode
  backTo?: string
  backLabel?: string
}) {
  const navigate = useNavigate()
  return (
    <TopBar
      start={
        <div className="flex min-w-0 items-center gap-2">
          <Button
            appearance="ghost"
            startIcon={ArrowLeft}
            aria-label={backLabel}
            className="shrink-0"
            onClick={() => navigate(backTo)}
          />
          <div className="min-w-0">{start}</div>
        </div>
      }
      end={end}
    />
  )
}

/** Yet's built-in reports are listed in the file and have no board drawn. */
function BuiltIn({ report }: { report: Report }) {
  return (
    <>
      <ReportTopBar
        start={
          <Heading level={1} size="base" weight="semibold" truncate>
            {report.name}
          </Heading>
        }
      />
      <AppShell.Content>
        <Placeholder
          title="Not designed yet"
          body={`${report.name} is one of Yet's built-in reports. The file lists it and draws no board for it yet.`}
        />
      </AppShell.Content>
    </>
  )
}

function Missing() {
  return (
    <>
      <ReportTopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            Report not found
          </Heading>
        }
      />
      <AppShell.Content>
        <Placeholder title="Report not found" body="There is no report at this address." />
      </AppShell.Content>
    </>
  )
}

/** The NotBuilt page's message, for an address inside Reports. */
export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
        <Icon icon={Construction} size="x-large" />
      </span>
      <Heading level={2} size="lg" weight="semibold">
        {title}
      </Heading>
      <Text color="subtle" className="max-w-sm">
        {body}
      </Text>
      <Link href={`#${reportsPath}`}>Back to reports</Link>
    </div>
  )
}
