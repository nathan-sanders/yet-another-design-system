import { useId } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  ChartArea,
  ChartLine,
  ChartNoAxesColumn,
  ChartPie,
  Gauge,
  Plus,
  SlidersHorizontal,
  Table2,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '../../../../src/components/Button'
import { ClickableCard } from '../../../../src/components/Card'
import { Field } from '../../../../src/components/Field'
import { Icon } from '../../../../src/components/Icon'
import { Input } from '../../../../src/components/Input'
import { Panel } from '../../../../src/components/Panel'
import { Radio } from '../../../../src/components/Radio'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Select } from '../../../../src/components/Select'
import { Switch } from '../../../../src/components/Switch'
import { Text } from '../../../../src/components/Text'
import { Token } from '../../../../src/components/Token'
import { MEASURE_LABEL, SOURCES_LABEL, groupByAllowed, rangeFor } from '../../data/reports'
import type { GroupBy, Widget, WidgetMeasure, WidgetSources, WidgetViz } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { GROUP_BY_LABEL, boardPath, isTimeViz } from './model'
import { useReports } from './reportsState'

const VIZ: { value: WidgetViz; label: string; icon: LucideIcon }[] = [
  { value: 'line', label: 'Line', icon: ChartLine },
  { value: 'area', label: 'Area', icon: ChartArea },
  { value: 'bar', label: 'Bar', icon: ChartNoAxesColumn },
  { value: 'donut', label: 'Donut', icon: ChartPie },
  { value: 'metric', label: 'Metric', icon: Gauge },
  { value: 'table', label: 'Table', icon: Table2 },
]

const MEASURES = (Object.keys(MEASURE_LABEL) as WidgetMeasure[]).map((value) => ({
  value,
  label: MEASURE_LABEL[value],
}))
const SOURCES = (Object.keys(SOURCES_LABEL) as WidgetSources[]).map((value) => ({
  value,
  label: SOURCES_LABEL[value],
}))

/**
 * The widget's Edit panel (`40005911:35514`): a docked `Panel` beside the
 * widget detail, opened by its Edit button and by `?edit=1`.
 *
 * Every change previews on the page behind it as you make it — the panel
 * writes a draft the page draws (`ReportsState.draft`), which the detail page
 * starts when it opens the panel. **Apply** keeps it;
 * **Cancel** and the close button drop it; **Remove** takes the widget off its
 * board and goes back there.
 *
 * A chart widget can be drawn six ways and its measure, series and sources
 * changed. The Overview and the three lists have a shape of their own, so for
 * them the other visualizations are there and disabled, and the fields that
 * would change their numbers are left out.
 */
export function WidgetEditPanel({
  target,
  open,
  onClose,
}: {
  /** The widget to edit — kept after closing so the panel slides out with it. */
  target?: { reportId: string; widgetId: string }
  open: boolean
  onClose: () => void
}) {
  const shell = useShell()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { widgetFor, draft, setDraft, saveWidget, removeWidget } = useReports()
  const vizLabel = useId()
  const range = rangeFor(params.get('range'))

  const saved = target && widgetFor(target.reportId, target.widgetId)
  const ours =
    draft && target && draft.reportId === target.reportId && draft.widget.id === target.widgetId
  const widget = ours ? draft.widget : saved
  if (!target || !widget) return null

  const change = (changes: Partial<Widget>) =>
    setDraft({ reportId: target.reportId, widget: { ...widget, ...changes } })

  const chart = widget.kind === 'chart'
  const close = () => {
    setDraft(null)
    onClose()
  }
  const apply = () => {
    saveWidget(target.reportId, widget)
    close()
  }
  const remove = () => {
    removeWidget(target.reportId, widget.id)
    setDraft(null)
    // Leaving the page closes the panel (the shell closes a screen's panel on navigation).
    navigate(boardPath(target.reportId))
  }

  return (
    <Panel
      aria-label="Edit widget"
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      resizable
    >
      <Panel.Header icon={SlidersHorizontal} closeButton>
        Edit
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-6">
        <Field label="Title">
          <Input value={widget.title} onValueChange={(title) => change({ title })} />
        </Field>

        <div className="flex flex-col gap-2">
          <Text id={vizLabel} render={<span />} weight="semibold">
            Visualization
          </Text>
          <Radio.Group
            aria-labelledby={vizLabel}
            value={widget.viz}
            onValueChange={(viz) => change({ viz: viz as WidgetViz })}
            className="grid grid-cols-3 gap-2"
          >
            {VIZ.map((option) => {
              const unavailable = !chart && option.value !== widget.viz
              return (
                // The file's `_Pulse Viz Option`: a tile, the glyph over the
                // word, selected on the Clickable Card's selected surface. The
                // radio primitive goes on the card, so the six are one radio
                // group — one tab stop, arrows move — rather than six buttons.
                // The library has no selectable card yet (FINDINGS 40).
                <Radio.Root
                  key={option.value}
                  value={option.value}
                  disabled={unavailable}
                  nativeButton
                  render={
                    <ClickableCard
                      selected={widget.viz === option.value}
                      disabled={unavailable}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <Icon icon={option.icon} />
                      <Text render={<span />} size="sm">
                        {option.label}
                      </Text>
                    </ClickableCard>
                  }
                />
              )
            })}
          </Radio.Group>
        </div>

        {chart ? (
          <>
            <Field label="Measure" nativeLabel={false}>
              <Select
                value={widget.measure}
                onValueChange={(measure) => change({ measure: measure as WidgetMeasure })}
                items={MEASURES}
              >
                {MEASURES.map((m) => (
                  <Select.Item key={m.value} value={m.value}>
                    {m.label}
                  </Select.Item>
                ))}
              </Select>
            </Field>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <Text render={<span />} weight="semibold">
                  Topics & brands
                </Text>
                <Text render={<span />} size="sm" color="subtle">
                  {isTimeViz(widget.viz)
                    ? 'Each one is drawn as its own line'
                    : 'Each one is drawn as its own part of the whole'}
                </Text>
              </div>
              <ul aria-label="Topics and brands" className="flex flex-wrap gap-1">
                {widget.series.map((series) => (
                  <li key={series}>
                    <Token
                      // The last one stays: a chart of nothing is not a chart.
                      onRemove={
                        widget.series.length > 1
                          ? () => change({ series: widget.series.filter((s) => s !== series) })
                          : undefined
                      }
                    >
                      {series}
                    </Token>
                  </li>
                ))}
              </ul>
              <Button
                appearance="ghost"
                startIcon={Plus}
                className="self-start"
                onClick={() => shell.notBuilt('Adding a topic')}
              >
                Add
              </Button>
            </div>

            <Field label="Sources" nativeLabel={false}>
              <Select
                value={widget.sources}
                onValueChange={(sources) => change({ sources: sources as WidgetSources })}
                items={SOURCES}
              >
                {SOURCES.map((s) => (
                  <Select.Item key={s.value} value={s.value}>
                    {s.label}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </>
        ) : null}

        {chart && isTimeViz(widget.viz) ? (
          <div className="flex flex-col gap-2">
            <Text render={<span />} weight="semibold">
              Group by
            </Text>
            <SegmentedControl
              aria-label="Group by"
              value={groupByAllowed(range, widget.groupBy) ? widget.groupBy : 'day'}
              onValueChange={(groupBy) => change({ groupBy: groupBy as GroupBy })}
              className="self-start"
            >
              {(['hour', 'day', 'week'] as const).map((by) => (
                <SegmentedControl.Item key={by} value={by} disabled={!groupByAllowed(range, by)}>
                  {GROUP_BY_LABEL[by]}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Switch
            label="Compare to previous period"
            checked={widget.compare}
            onCheckedChange={(compare) => change({ compare })}
          />
          {chart && isTimeViz(widget.viz) ? (
            <Switch
              label="Mark spikes on the chart"
              // LineSeries has no annotation layer to mark a point with yet (FINDINGS 39).
              description="Not built yet"
              disabled
              checked={widget.spikes}
            />
          ) : null}
          {chart && widget.viz !== 'metric' && widget.viz !== 'table' ? (
            <Switch
              label="Show legend"
              checked={widget.legend}
              onCheckedChange={(legend) => change({ legend })}
            />
          ) : null}
        </div>
      </Panel.Body>
      <Panel.Footer className="flex items-center gap-2">
        <Button appearance="ghost" startIcon={Trash2} onClick={remove}>
          Remove
        </Button>
        <span className="flex-1" />
        <Button appearance="secondary" onClick={close}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={apply}>
          Apply
        </Button>
      </Panel.Footer>
    </Panel>
  )
}
