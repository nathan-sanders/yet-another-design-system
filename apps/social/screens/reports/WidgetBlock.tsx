import { useRef, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { Ellipsis } from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import {
  COL_SPAN,
  DragHandle,
  GRID_COLUMNS,
  MIN_SPAN,
  Sortable,
  type ColumnSpan,
} from '../../../../src/components/DragAndDrop'
import { ResizeHandle } from '../../../../src/components/Resize'
import { cn } from '../../../../src/lib/cn'
import { focusRing } from '../../../../src/lib/focus'
import type { ReportRange } from '../../data/reports'
import type { Report, Widget } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { isTimeViz, widgetPath } from './model'
import { WidgetBody } from './widgets/WidgetBody'

/** The board's gutter, `gap-3`, which the column arithmetic has to know about. */
export const GRID_GAP = 12

/** A plot's height on the board: the full-width trend is a little taller than a half-width chart. */
function plotHeight(widget: Widget, span: number): number {
  if (widget.viz === 'donut') return 240
  return isTimeViz(widget.viz) && span === GRID_COLUMNS ? 260 : 220
}

/**
 * One widget on a report board: a `ContentBlock` carried by the grip before
 * its title, with the strip to its right resizing it by the column.
 *
 * **Everywhere but the grip, the title and the `⋯` opens the widget's detail**
 * (Nathan's inline-editing board, `40005911:34608`). A press that travels is a
 * drag and the drag foundation swallows the click after it; a press that
 * does not is a click, and it navigates. The title is the same destination as
 * a real link, so the keyboard and a screen reader have it too. The links in
 * the body — a sortable column header, a legend — keep their own clicks.
 *
 * **The grip goes before the title**, as the file draws it, which
 * `ContentBlock.Header` has no slot for: its icon slot takes a glyph, not a
 * control. The handle sits over the header's start and the header's padding
 * makes room (FINDINGS 37).
 */
export function WidgetBlock({
  report,
  widget,
  span,
  max,
  range,
  onResize,
}: {
  report: Report
  widget: Widget
  span: ColumnSpan
  /** The widest this block may go; `undefined` for the last block in a row, which has no handle. */
  max?: number
  range: ReportRange
  onResize: (id: string, next: number) => void
}) {
  const item = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const shell = useShell()
  const href = widgetPath(report.id, widget.id)

  const open = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input, [role="separator"], [role="menu"]')) return
    navigate(href)
  }

  return (
    <Sortable.Item
      ref={item}
      id={widget.id}
      label={widget.title}
      role="listitem"
      // One column on a phone, where every widget takes the row.
      className={cn(COL_SPAN[span], 'relative min-w-0 rounded-lg max-md:col-span-full')}
    >
      {/* A click target for the pointer only; the title link is the real one. */}
      <ContentBlock headingLevel={2} className="h-full cursor-pointer" onClick={open}>
        <ContentBlock.Header
          className="pl-10"
          actions={
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label={`${widget.title} actions`}
              data-drag-ignore
              onClick={() => shell.notBuilt('Widget actions')}
            />
          }
        >
          <a
            href={`#${href}`}
            // An anchor is natively draggable, which would take the pointer
            // away from the drag foundation (DragAndDrop's "link cards" trap).
            draggable={false}
            className={cn('rounded-xs hover:underline', focusRing)}
          >
            {widget.title}
          </a>
        </ContentBlock.Header>
        <ContentBlock.Content>
          <WidgetBody
            report={report}
            widget={widget}
            range={range}
            groupBy={widget.groupBy}
            height={plotHeight(widget, span)}
            wide={span >= 9}
          />
        </ContentBlock.Content>
      </ContentBlock>
      <DragHandle size="small" className="absolute top-3 left-2" />
      {max !== undefined && (
        <ResizeHandle
          label={`Resize ${widget.title}`}
          orientation="vertical"
          value={span}
          min={MIN_SPAN}
          max={max}
          unit={() => {
            const grid = item.current?.parentElement
            return grid ? (grid.getBoundingClientRect().width + GRID_GAP) / GRID_COLUMNS : 1
          }}
          valueText={(value) => `${value} of ${GRID_COLUMNS} columns`}
          onResize={(next) => onResize(widget.id, next)}
          className="absolute inset-y-0 right-0 translate-x-full max-md:hidden"
        />
      )}
    </Sortable.Item>
  )
}
