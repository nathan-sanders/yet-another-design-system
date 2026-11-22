import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  ReportsContext,
  type CustomChart,
  type EmailSchedule,
  type ReportsState,
} from './reportsState'

let made = 0

/**
 * Reports' own state, above the router: charts the builder added to
 * Delivery, and the email schedule, so both hold as you move around.
 */
export function ReportsProvider({ children }: { children: ReactNode }) {
  const [charts, setCharts] = useState<CustomChart[]>([])
  const [schedule, setSchedule] = useState<EmailSchedule | null>(null)

  const addChart = useCallback<ReportsState['addChart']>((chart) => {
    const next = { ...chart, id: `chart-${++made}` }
    setCharts((all) => [...all, next])
    return next
  }, [])
  const removeChart = useCallback((id: string) => {
    setCharts((all) => all.filter((c) => c.id !== id))
  }, [])

  const value = useMemo<ReportsState>(
    () => ({ charts, addChart, removeChart, restoreCharts: setCharts, schedule, setSchedule }),
    [charts, addChart, removeChart, schedule],
  )
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
}
