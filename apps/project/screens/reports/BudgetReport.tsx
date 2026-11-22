import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { MetricCard, MetricGrid } from '../../../../src/components/Metric'
import { ProgressBar } from '../../../../src/components/ProgressBar'
import { pixel, Table, type TableColumn } from '../../../../src/components/Table'
import { cn } from '../../../../src/lib/cn'
import { YakLine } from '../../components/YakLine'
import { budgetRead, budgetRows, budgetTotals, dollars, type BudgetRow } from './model'

/**
 * Budget (`Reports - Budget`, `40006312:43935`): Yak's read, four Metric
 * Cards, then each portfolio with the projects the file breaks out under it,
 * at its 526 / 220 / 100 / 100 / 100 / 110. Spent is a bar and its percent,
 * red where the forecast runs over; Difference is the forecast against the
 * budget, a green Badge under and a red one over. A portfolio folds its
 * projects away.
 */
export function BudgetReport() {
  const rows = budgetRows()
  const totals = budgetTotals(rows)
  const [folded, setFolded] = useState<Set<string>>(new Set())
  const shown = rows.filter((r) => !r.parentId || !folded.has(r.parentId))
  const hasChildren = (id: string) => rows.some((r) => r.parentId === id)

  const toggle = (id: string) =>
    setFolded((all) => {
      const next = new Set(all)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const columns: TableColumn<BudgetRow>[] = [
    {
      key: 'name',
      header: 'Portfolio or project',
      layout: 'fill',
      renderCell: (row) =>
        row.parentId ? (
          <span className="truncate pl-6">{row.name}</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2 font-semibold text-content-emphasized">
            {hasChildren(row.id) ? (
              <Button
                appearance="ghost"
                size="small"
                startIcon={ChevronDown}
                aria-label={`${folded.has(row.id) ? 'Show' : 'Hide'} ${row.name}’s projects`}
                aria-expanded={!folded.has(row.id)}
                onClick={() => toggle(row.id)}
                className={cn(
                  '-ml-2 [&_svg]:transition-transform',
                  folded.has(row.id) && '[&_svg]:-rotate-90',
                )}
              />
            ) : (
              <span aria-hidden className="w-4" />
            )}
            <span className="truncate">{row.name}</span>
          </span>
        ),
    },
    {
      key: 'spent',
      header: 'Spent',
      width: pixel(220),
      renderCell: (row) => {
        const percent = Math.round((row.spent / row.total) * 100)
        return (
          <span className="flex items-center gap-2">
            <ProgressBar
              value={percent}
              label={`${row.name} spent`}
              labelHidden
              type={row.forecast > row.total ? 'danger' : 'default'}
              // The file's 164: a cell hugs, so a bar left to grow measures 0.
              className="w-41 shrink-0"
            />
            <span aria-hidden className="w-8 shrink-0 text-sm text-content-subtle">
              {percent}%
            </span>
          </span>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      width: pixel(100),
      align: 'left',
      renderCell: (row) => <span className="text-content-subtle">{dollars(row.spent)}</span>,
    },
    {
      key: 'budget',
      header: 'Budget',
      width: pixel(100),
      align: 'left',
      renderCell: (row) => <span className="text-content-subtle">{dollars(row.total)}</span>,
    },
    {
      key: 'forecast',
      header: 'Forecast',
      width: pixel(100),
      align: 'left',
      renderCell: (row) => dollars(row.forecast),
    },
    {
      key: 'difference',
      header: 'Difference',
      width: pixel(110),
      renderCell: (row) => {
        const diff = row.forecast - row.total
        return (
          <span className="flex">
            <Badge color={diff > 0 ? 'red' : 'green'}>
              {`${diff > 0 ? '+' : '−'}${dollars(diff)}`}
            </Badge>
          </span>
        )
      },
    },
  ]

  return (
    <>
      <YakLine>{budgetRead(rows)}</YakLine>
      <MetricGrid columns={4}>
        <MetricCard label="Spent" value={`${dollars(totals.spent)} of ${dollars(totals.total)}`} />
        <MetricCard label="Forecast" value={dollars(totals.forecast)} />
        <MetricCard
          label="Over budget"
          value={`${totals.over.length} ${totals.over.length === 1 ? 'portfolio' : 'portfolios'}`}
        />
        <MetricCard label="Budget left" value={dollars(totals.left)} />
      </MetricGrid>
      <div className="shrink-0">
        <Table label="Budget by portfolio" columns={columns} data={shown} idKey="id" />
      </div>
    </>
  )
}
