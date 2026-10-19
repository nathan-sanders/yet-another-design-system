import { useCallback, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Ellipsis, Calendars, Share, SlidersHorizontal } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Breadcrumbs } from '../../../../src/components/Breadcrumbs'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { groupByAllowed, rangeFor, type ReportRange } from '../../data/reports'
import type { GroupBy } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { GROUP_BY_LABEL, boardPath, isTimeViz, peakDay, peakHour } from './model'
import { RangeControl } from './RangeControl'
import { Placeholder, ReportTopBar, Viewing } from './ReportScreen'
import { useReports } from './reportsState'
import { ViewMessagesButton } from '../../components/ViewMessagesButton'
import { widgetMentionQuery } from './mentions'
import { BreakdownTable } from './widgets/ChartWidget'
import { WidgetBody } from './widgets/WidgetBody'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'

const GROUPS: GroupBy[] = ['hour', 'day', 'week']

/**
 * One widget, full width (`40005911:35384`) — Mixpanel's chart detail: the
 * chart big enough to read, Hour / Day / Week beside the range, and the
 * numbers under it as a Breakdown table with the chart's own legend marks.
 *
 * The range, the grouping and whether the Edit panel is open are all in the
 * URL (`?range=7d&by=hour&edit=1`), so each has a link. With the panel open
 * the toolbar's Hour / Day / Week goes, because the panel has it
 * (`40005911:35514`), and the page draws the panel's unapplied draft.
 */
export function WidgetDetailScreen() {
  const { reportId = '', widgetId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const { widgetFor, setDraft, reportFor } = useReports()
  const report = reportFor(reportId)
  const widget = report ? widgetFor(report.id, widgetId) : undefined

  const range = rangeFor(params.get('range'))
  const editing = params.get('edit') === '1'
  const urlBy = params.get('by') as GroupBy | null
  // While editing, the draft's grouping is the one on screen; otherwise the URL's, then the widget's own.
  const by: GroupBy =
    editing && widget
      ? widget.groupBy
      : urlBy && GROUPS.includes(urlBy)
        ? urlBy
        : (widget?.groupBy ?? 'day')

  const update = useCallback(
    (changes: Record<string, string | null>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // `?edit=1` opens the Edit panel, and taking it away closes it. When the
  // panel closes by itself — its close button, Cancel, Apply, or Yak taking
  // its place — the URL follows, so a reload does not reopen it. One effect,
  // because the two directions have to know which side moved.
  const { panel, setPanel } = shell
  const previous = useRef(panel)
  useEffect(() => {
    const was = previous.current
    previous.current = panel
    const open = panel?.type === 'widget'
    if (editing && !open) {
      if (was?.type === 'widget') {
        setDraft(null)
        update({ edit: null })
      } else if (widget) {
        // The draft starts on what the page is showing, Hour/Day/Week included.
        setDraft({ reportId, widget: { ...widget, groupBy: by } })
        setPanel({ type: 'widget', reportId, widgetId })
      }
    } else if (!editing && open) {
      setPanel(null)
    }
  }, [editing, panel, widget, by, reportId, widgetId, setPanel, setDraft, update])

  // Leaving the page drops an unapplied draft with it.
  useEffect(() => () => setDraft(null), [setDraft])

  if (!report || !widget) {
    return (
      <>
        <ReportTopBar
          start={
            <Heading level={1} size="base" weight="semibold">
              Widget not found
            </Heading>
          }
          backTo={report ? boardPath(report.id) : undefined}
          backLabel={report ? `Back to ${report.name}` : undefined}
        />
        <AppShell.Content>
          <Placeholder
            title="Widget not found"
            body="This widget is not on the board any more — it may have been removed."
          />
        </AppShell.Content>
      </>
    )
  }

  const timeChart = widget.kind === 'chart' && isTimeViz(widget.viz)
  const boardHref = `${boardPath(report.id)}${params.get('range') ? `?range=${range}` : ''}`

  // The detail's range, so the list behind it is the one this page is showing.
  const messages = widgetMentionQuery(report, widget, range)

  return (
    <>
      <ReportTopBar
        backTo={boardHref}
        backLabel={`Back to ${report.name}`}
        start={
          // The trail's last item is the page; the h1 says so to a screen
          // reader, since a heading cannot sit inside the trail's span.
          <>
            <Heading level={1} className="sr-only">
              {widget.title}
            </Heading>
            <Breadcrumbs>
              <Breadcrumbs.Item href={`#${boardHref}`}>{report.name}</Breadcrumbs.Item>
              <Breadcrumbs.Item>{widget.title}</Breadcrumbs.Item>
            </Breadcrumbs>
          </>
        }
        end={
          <div className="flex items-center gap-2 max-md:hidden">
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
          </div>
        }
      />
      <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
            <RangeControl
              value={range}
              onChange={(next: ReportRange) =>
                update({ range: next, by: urlBy && !groupByAllowed(next, urlBy) ? null : urlBy })
              }
            />
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
          <div className="ml-auto flex items-center gap-2">
            {timeChart && !editing ? (
              <SegmentedControl
                aria-label="Group by"
                value={groupByAllowed(range, by) ? by : 'day'}
                onValueChange={(next) => update({ by: next as string })}
              >
                {GROUPS.map((group) => (
                  <SegmentedControl.Item
                    key={group}
                    value={group}
                    disabled={!groupByAllowed(range, group)}
                  >
                    {GROUP_BY_LABEL[group]}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl>
            ) : null}
            <Button
              appearance="secondary"
              startIcon={SlidersHorizontal}
              aria-pressed={editing}
              onClick={() => update({ edit: editing ? null : '1' })}
            >
              Edit
            </Button>
          </div>
        </div>

        <ContentBlock headingLevel={2} className="h-auto">
          <ContentBlock.Header
            actions={
              <>
                {messages ? <ViewMessagesButton title={widget.title} query={messages} /> : null}
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label={`${widget.title} actions`}
                  onClick={() => shell.notBuilt('Widget actions')}
                />
              </>
            }
          >
            {widget.title}
          </ContentBlock.Header>
          <ContentBlock.Content>
            <WidgetBody
              report={report}
              widget={widget}
              range={range}
              groupBy={by}
              height={260}
              wide
            />
          </ContentBlock.Content>
        </ContentBlock>

        {widget.kind === 'chart' && widget.viz !== 'table' ? (
          <ContentBlock headingLevel={2} className="h-auto">
            <ContentBlock.Header
              actions={
                <Button
                  appearance="ghost"
                  startIcon={Ellipsis}
                  aria-label="Breakdown actions"
                  onClick={() => shell.notBuilt('Breakdown actions')}
                />
              }
            >
              Breakdown
            </ContentBlock.Header>
            <ContentBlock.Content>
              <BreakdownTable
                widget={widget}
                range={range}
                peakFormat={range === 'today' || range === 'yesterday' ? peakHour : peakDay}
              />
            </ContentBlock.Content>
          </ContentBlock>
        ) : null}
      </AppShell.Content>
    </>
  )
}
