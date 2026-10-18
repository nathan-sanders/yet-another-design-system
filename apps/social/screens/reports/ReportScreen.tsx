import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowLeft, Construction, Ellipsis, Calendars, ListFilter, Plus, Share } from 'lucide-react'

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
  type ColumnSpan,
} from '../../../../src/components/DragAndDrop'
import { Icon } from '../../../../src/components/Icon'
import { Link } from '../../../../src/components/Link'
import { cn } from '../../../../src/lib/cn'
import { ResizeHandle } from '../../../../src/components/Resize'
import { Heading, Text } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { me } from '../../data/people'
import { rangeFor, reportFor, type ReportRange } from '../../data/reports'
import type { Report } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { reportsPath, withSpareRow } from './model'
import { RangeControl } from './RangeControl'
import { useReports } from './reportsState'
import { WidgetBlock } from './WidgetBlock'

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
  const report = reportFor(reportId)
  if (!report) return <Missing />
  if (report.kind === 'builtin') return <BuiltIn report={report} />
  return <Board report={report} />
}

function Board({ report }: { report: Report }) {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const { boardFor, setBoard, widgetFor } = useReports()
  const range = rangeFor(params.get('range'))
  const current = boardFor(report.id)!
  const board = current.board
  const snapshot = useRef(board)
  const lastRow = board.order[board.order.length - 1]
  const spareRow =
    lastRow !== undefined && board.containers[lastRow]!.length === 0 ? lastRow : undefined

  const rowHeights = useRowHeights(board.order)
  // While a widget is carried the spare row opens into a real drop area: a
  // 400px trend aimed at a 64px strip lands in the row above it instead, because
  // collisions are read off the carried block's corners, not the pointer.
  const [carrying, setCarrying] = useState(false)

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
              <Button
                appearance="primary"
                startIcon={Plus}
                onClick={() => shell.notBuilt('Adding a widget')}
              >
                Add widget
              </Button>
            </div>
            <Button
              appearance="primary"
              startIcon={Plus}
              aria-label="Add widget"
              className="md:hidden"
              onClick={() => shell.notBuilt('Adding a widget')}
            />
          </>
        }
      />
      <AppShell.Content className="gap-3">
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

        <DragAndDrop
          onDragStart={() => {
            snapshot.current = board
            setCarrying(true)
          }}
          onDragOver={({ active, over }) => {
            // The spare row takes a widget on release, not while it is carried.
            // Joining it mid-drag reflows the whole board under the pointer —
            // the row above shrinks as the widget leaves it, the spare grows as
            // it arrives — and the collision then flips between the spare and
            // the row above on every frame, remounting the chart each time
            // until React gives up (FINDINGS 41). Every other row joins live.
            if (over && over.id !== spareRow) {
              setBoard(report.id, (b) => dragOver(b, active.id, over.id))
            }
          }}
          onDragEnd={({ active, over }) => {
            setBoard(report.id, (b) => withSpareRow(dragEnd(b, active.id, over ? over.id : null)))
            setCarrying(false)
            swallowNextClick()
          }}
          onDragCancel={() => {
            setBoard(report.id, () => snapshot.current)
            setCarrying(false)
          }}
        >
          {/* On a desktop the strip under each row is the gap between rows. */}
          <div ref={rowHeights.container} className="flex flex-col max-md:gap-3">
            {board.order.map((row, index) => {
              const items = board.containers[row]!
              const spans = rowSpans(board, row) as ColumnSpan[]
              const spare = index === board.order.length - 1 && items.length === 0
              const name = spare ? 'New row' : `Row ${index + 1}`
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
                    role={spare ? 'group' : 'list'}
                    aria-label={name}
                    // A floor, so a row emptied mid-drag keeps a rect its widget can come back to.
                    className="grid min-h-16 min-w-0 grid-cols-12 gap-3 rounded-lg max-md:grid-cols-1"
                  >
                    {spare ? (
                      // The file's dashed Add widget zone, and the drop target
                      // that gives a carried widget a row of its own. The whole
                      // zone is the button.
                      <Button
                        appearance="ghost"
                        startIcon={Plus}
                        onClick={() => shell.notBuilt('Adding a widget')}
                        className={cn(
                          'col-span-full h-12 w-full rounded-lg border-dashed border-surface-border-emphasized hover:border-surface-border-emphasized',
                          carrying && 'h-60',
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
                            onResize={(block, span) =>
                              setBoard(report.id, (b) => resizeBlock(b, block, span))
                            }
                          />
                        )
                      })
                    )}
                  </Sortable>
                  {spare ? null : (
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
