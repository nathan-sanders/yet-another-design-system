/** Reports' three views, in the segment's order. */
export const REPORT_VIEWS = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'workload', label: 'Workload' },
  { id: 'budget', label: 'Budget' },
] as const

export type ReportView = (typeof REPORT_VIEWS)[number]['id']

/** A report, on a range other than 30 days when there is one: `#/reports/delivery?range=7`. */
export function reportPath(view: ReportView, range?: number): string {
  return range && range !== 30 ? `/reports/${view}?range=${range}` : `/reports/${view}`
}

/** The chart builder (`Reports - Chart builder`, `40006312:39249`). */
export const BUILDER_PATH = '/reports/new'
