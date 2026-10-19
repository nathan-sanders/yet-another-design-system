import type { SetURLSearchParams } from 'react-router'

import type { ReportType } from '../../data/types'

/**
 * Opens New report over whatever page this is, by its URL: `?new=report`,
 * and `&type=` to start on one type. The New menu's Topic item opens it on
 * Topic / social listening.
 */
export function openNewReport(
  params: URLSearchParams,
  setParams: SetURLSearchParams,
  type?: ReportType,
) {
  const next = new URLSearchParams(params)
  next.set('new', 'report')
  if (type) next.set('type', type)
  else next.delete('type')
  setParams(next)
}
