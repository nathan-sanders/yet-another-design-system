import { AreaSeries } from '../../../../src/components/AreaSeries'
import { Donut } from '../../../../src/components/Donut'
import { Metric } from '../../../../src/components/Metric'
import { LineSeries } from '../../../../src/components/LineSeries'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { VerticalBar } from '../../../../src/components/VerticalBar'
import { personFor } from '../../data/people'
import type { Task } from '../../data/types'
import { builderData, FIELD_LABEL, seriesColor, type BuilderConfig } from './model'

const firstName = (id: string) => personFor(id).name.split(' ')[0]

/**
 * A chart from the builder, drawn with whichever of the library's charts the
 * Visualization picks: Line, Area, Bar (stacked by the split), Donut (the
 * groups, the split set aside), a Metric of the total, or a Table of the
 * numbers. The data is the live tasks, so it "updates live", as the
 * preview's line says.
 */
export function ChartView({
  config,
  tasks,
  title,
  height = 280,
}: {
  config: BuilderConfig
  tasks: Task[]
  title: string
  height?: number
}) {
  const { rows, splits, total } = builderData(tasks, config, firstName)
  const series = splits.map((key) => ({ key, label: key, color: seriesColor(config.splitBy, key) }))
  const label = `${title}${config.splitBy === 'none' ? '' : `, split by ${FIELD_LABEL[config.splitBy].toLowerCase()}`}`

  switch (config.viz) {
    case 'line':
      return (
        <LineSeries
          label={label}
          data={rows}
          xKey="group"
          xPreset="categories"
          series={series}
          interpolation="linear"
          height={height}
        />
      )
    case 'area':
      return (
        <AreaSeries
          label={label}
          data={rows}
          xKey="group"
          xPreset="categories"
          series={series}
          height={height}
        />
      )
    case 'bar':
      return (
        <VerticalBar
          label={label}
          data={rows}
          xKey="group"
          xPreset="categories"
          series={series}
          stacked
          height={height}
        />
      )
    case 'donut': {
      const slices = rows.map((row) => ({
        name: String(row.group),
        value: splits.reduce((sum, key) => sum + Number(row[key] ?? 0), 0),
      }))
      return <Donut label={label} data={slices} nameKey="name" valueKey="value" height={height} />
    }
    case 'metric':
      return (
        <Metric
          label={config.measure === 'count' ? 'Tasks' : 'Estimated hours'}
          value={config.measure === 'count' ? total : `${total}h`}
        />
      )
    case 'table': {
      const columns: TableColumn<Record<string, string | number>>[] = [
        {
          key: 'group',
          header: FIELD_LABEL[config.groupBy],
          layout: 'fill',
          renderCell: (row) => row.group,
        },
        ...splits.map((key) => ({
          key,
          header: key,
          width: pixel(96),
          align: 'right' as const,
          renderCell: (row: Record<string, string | number>) => row[key] ?? 0,
        })),
      ]
      return (
        <div className="shrink-0">
          <Table label={label} columns={columns} data={rows} idKey="group" />
        </div>
      )
    }
  }
}
