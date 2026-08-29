import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'

import { cn } from '../../lib/cn'
import { CHART_BREAKPOINT } from './axes'
import { ChartContext, resolveSeries, type ChartSeries } from './context'
import type { ChartSwatchShape } from './Swatch'

/**
 * ChartContainer — what every chart in the library sits in.
 *
 * It owns the four things no individual chart should have to solve twice: the
 * size the plot gets, whether that size counts as wide, the resolved series list
 * its legend and tooltip need, and the accessible alternative to a picture made
 * of paths.
 *
 * ## Why there is no `ChartStyle`
 *
 * shadcn/ui's container of the same name injects a `<style>` element per chart,
 * mapping names like `--color-desktop` onto hex values, one block per theme.
 * That exists because its charts are handed raw colours with nowhere
 * theme-aware to put them. This library has somewhere: `--data-viz-*` are
 * semantic tokens, already defined at `:root` and already redefined in `.dark`.
 * A mark painted with one follows the theme with no injected CSS, no second
 * palette and no JavaScript. Porting `ChartStyle` here would add a worse copy of
 * a tier that already exists — see `palette.ts`.
 *
 * ## The accessible alternative is a table, not just a label
 *
 * `role="img"` plus an `aria-label` gets a chart past an automated check and
 * leaves a screen reader user with a sentence where everyone else has thirty-one
 * days of data. So the container renders both: the plot, labelled, and a
 * visually hidden `<table>` carrying every value.
 *
 * The order matters and is easy to get backwards. `role="img"` makes an
 * element's whole subtree opaque to assistive technology, so a table *inside*
 * it would be announced to no one. The table is therefore a **sibling** of the
 * labelled plot, not a child of it.
 *
 * ## Sizing, and the trap under it
 *
 * Recharts' `ResponsiveContainer` measures its parent. Given a parent of zero
 * width it renders **nothing at all** — not a small chart, an empty one — which
 * looks exactly like a broken component and has cost this project time before.
 * So `height` is a required number rather than a percentage, and the wrapper
 * carries an explicit `min-w-0` so a flex or grid parent cannot collapse it.
 */

export interface ChartContainerProps {
  /** The series, in a fixed order. Colour and marker are assigned from position here. */
  series: readonly ChartSeries[]
  /**
   * The rows the chart plots. Also what the hidden table is built from, so it
   * has to be the same array the chart is given.
   */
  data: readonly Record<string, unknown>[]
  /** The property in each row holding the x value. */
  xKey: string
  /**
   * What this chart shows, as a sentence. Becomes the plot's accessible name and
   * the hidden table's caption — required, because a chart without one is a
   * picture with no alt text.
   */
  label: string
  /** Plot height in px. A number, never a percentage — see the sizing note above. */
  height?: number
  /** How an x value reads in the table. Defaults to `String`. */
  formatX?: (value: unknown) => string
  /** How a y value reads in the table. Defaults to `String`. */
  formatY?: (value: unknown) => string
  /** The Recharts chart element. */
  children: ReactElement
  /** Rendered above the plot — this is where a legend goes. */
  header?: ReactNode
  /**
   * The legend key for series that do not name a marker.
   *
   * Pass `'colorSwatch'` from any chart whose marks are areas rather than points
   * on a line — an area fill, a bar segment, a slice. Leaving it unset keeps the
   * line chart's behaviour, where each series gets a rule with its own point
   * shape on it.
   */
  swatch?: ChartSwatchShape
  /**
   * Let the reader switch series off by clicking the legend.
   *
   * Figma models this as `Chart Legend Buttons` and puts it on Donut, Gauge and
   * Radar — the charts where series overlap and hiding one is how you read the
   * others. It works on any chart here, and is off by default because a legend
   * that looks clickable and is not is worse than a plain one.
   *
   * Uncontrolled: the container holds the hidden set. Nothing needs it lifted
   * yet, and a controlled pair can be added the day something does.
   */
  interactiveLegend?: boolean
  /**
   * Replace the generated data table.
   *
   * The default builds one row per `data` row with a column per series, which is
   * right for anything with an x axis. A pie is shaped the other way round — one
   * row *is* one slice — so `Donut` and `Gauge` pass their own.
   */
  table?: ReactNode
  /**
   * Content laid over the plot — a donut's total, a gauge's figure.
   *
   * It is rendered as a **sibling** of the `role="img"` element, not inside it,
   * for the same reason the data table is: `role="img"` makes its subtree opaque
   * to assistive technology, so a total placed inside would be a number nobody
   * could hear. Being a sibling, it is ordinary content and can be anything the
   * library already has.
   */
  overlay?: ReactNode
  className?: string
}

export function ChartContainer({
  series,
  data,
  xKey,
  label,
  height = 280,
  formatX = (v) => String(v ?? ''),
  formatY = (v) => String(v ?? ''),
  children,
  header,
  swatch,
  interactiveLegend = false,
  table,
  overlay,
  className,
}: ChartContainerProps) {
  const resolved = useMemo(() => resolveSeries(series, swatch), [series, swatch])

  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())

  const toggleSeries = useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const visibleSeries = useMemo(
    () => (hidden.size === 0 ? resolved : resolved.filter((s) => !hidden.has(s.key))),
    [resolved, hidden],
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  // Wide until measured. An unmeasured chart still renders once, and starting
  // narrow makes a wide chart visibly shed most of its x labels and put them
  // back a frame later.
  const [wide, setWide] = useState(true)
  const [plotWidth, setPlotWidth] = useState(0)

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0
      // A zero width means "not laid out yet", not "narrow" — a hidden tab, a
      // pane that has not been sized. Treating it as narrow would flip every
      // label off and back on when the element appears.
      if (width > 0) {
        setWide(width >= CHART_BREAKPOINT)
        setPlotWidth(width)
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const value = useMemo(
    () => ({
      series: resolved,
      visibleSeries,
      hidden,
      wide,
      plotWidth,
      toggleSeries: interactiveLegend ? toggleSeries : undefined,
    }),
    [resolved, visibleSeries, hidden, wide, plotWidth, interactiveLegend, toggleSeries],
  )

  return (
    <ChartContext.Provider value={value}>
      <div ref={wrapperRef} className={cn('flex w-full min-w-0 flex-col gap-4', className)}>
        {header}

        <div style={{ height }} className="relative w-full min-w-0">
          <div role="img" aria-label={label} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
          {overlay}
        </div>

        {/*
          The same numbers, reachable. Outside the `role="img"` element on
          purpose: inside it, nothing here would ever be announced.
        */}
        {table ?? (
        <table className="sr-only">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{xKey}</th>
              {resolved.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <th scope="row">{formatX(row[xKey])}</th>
                {resolved.map((s) => (
                  <td key={s.key}>{formatY(row[s.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </ChartContext.Provider>
  )
}

ChartContainer.displayName = 'Chart.Container'
