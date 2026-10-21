import type { SetURLSearchParams } from 'react-router'

import type { ReportType } from '../../data/types'

/**
 * Opens New report over whatever page this is, by its URL: `?new=report`,
 * and `&type=` to start on one type. The New menu's Topic item opens it on
 * Topic / social listening. `step: 'setup'` (`&step=setup`) skips the type
 * picker, which is how the Reports list's type shortcuts open it.
 */
export function openNewReport(
  params: URLSearchParams,
  setParams: SetURLSearchParams,
  type?: ReportType,
  { step }: { step?: 'setup' } = {},
) {
  const next = new URLSearchParams(params)
  next.set('new', 'report')
  if (type) next.set('type', type)
  else next.delete('type')
  if (step) next.set('step', step)
  else next.delete('step')
  setParams(next)
}
