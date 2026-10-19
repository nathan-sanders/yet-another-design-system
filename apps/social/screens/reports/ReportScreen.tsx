import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Calendars,
  Construction,
  Ellipsis,
  LayoutDashboard,
  ListFilter,
  Plus,
  Share,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Avatar } from '../../../../src/components/Avatar'
import { Button } from '../../../../src/components/Button'
import {
  DragAndDrop,
  MAX_BLOCKS_PER_ROW,
  Sortable,
  dragEnd,
  dragOver,
  maxSpan,
  resizeBlock,
  resizeRow,
  rowSpans,
  spareRow,
  spareRowCollision,
  type ColumnSpan,
} from '../../../../src/components/DragAndDrop'
import { Icon } from '../../../../src/components/Icon'
import { Link } from '../../../../src/components/Link'
import { ResizeHandle } from '../../../../src/components/Resize'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { me } from '../../data/people'
import { rangeFor, starterWidget, type ReportRange } from '../../data/reports'
import type { Report } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { reportsPath, widgetPath } from './model'
import { RangeControl } from './RangeControl'
import { useReports } from './reportsState'
import { WidgetBlock } from './WidgetBlock'
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
  const { boardFor, setBoard, widgetFor, addWidget } = useReports()
  const navigate = useNavigate()
  const range = rangeFor(params.get('range'))
  const current = boardFor(report.id)!
  const board = current.board
  const snapshot = useRef(board)
  // The file's dashed Add widget zone is the board's spare row (`withSpareRow`, FINDINGS 41).
  const spare = spareRow(board)
  const rowHeights = useRowHeights(board.order)

  const empty = board.order.every((row) => row === spare)

  // Add widget puts a trend of the report's topics in a row of its own and
  // opens its Edit panel, where it becomes whatever was wanted.
  const addStarter = () => {
    let n = Object.keys(current.widgets).length + 1
    while (current.widgets[`widget-${n}`]) n += 1
    const id = `widget-${n}`
    addWidget(report.id, starterWidget(report, id))
    navigate(`${widgetPath(report.id, id)}?edit=1${params.has('range') ? `&range=${range}` : ''}`)
  }

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
          <>
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
                startIcon={Share}
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
              <Button appearance="primary" startIcon={Plus} onClick={addStarter}>
                Add widget
              </Button>
            </div>
            <Button
              appearance="primary"
              startIcon={Plus}
              aria-label="Add widget"
              className="md:hidden"
              onClick={addStarter}
            />
          </>
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
          collisionDetection={spareRowCollision(spare)}
          onDragStart={() => {
            snapshot.current = board
          }}
          onDragOver={({ active, over }) => {
            // `dragOver` refuses the spare row, which takes a widget only on
            // release; `DragAndDrop/CLAUDE.md` says why (FINDINGS 41).
            if (over) setBoard(report.id, (b) => dragOver(b, active.id, over.id))
          }}
          onDragEnd={({ active, over }) => {
            setBoard(report.id, (b) => dragEnd(b, active.id, over ? over.id : null))
            swallowNextClick()
          }}
          onDragCancel={() => setBoard(report.id, () => snapshot.current)}
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
              return (
                <div
                  key={row}
                  className="flex flex-col"
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
                    className="grid min-h-16 min-w-0 grid-cols-12 gap-3 rounded-lg max-md:grid-cols-1"
                  >
                    {isSpare ? (
                      // The file's dashed Add widget zone, and the drop target
                      // that gives a carried widget a row of its own. The whole
                      // zone is the button.
                      <Button
                        appearance="ghost"
                        startIcon={Plus}
                        onClick={addStarter}
                        className="col-span-full h-12 w-full rounded-lg border-dashed border-surface-border-emphasized hover:border-surface-border-emphasized"
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
                            onResize={(block, span) =>
                              setBoard(report.id, (b) => resizeBlock(b, block, span))
                            }
                          />
                        )
                      })
                    )}
                  </Sortable>
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
        </DragAndDrop>
      </AppShell.Content>
    </>
  )
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
