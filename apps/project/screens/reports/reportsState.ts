import { createContext, useContext } from 'react'

import type { BuilderConfig } from './model'

/** A chart made in the builder and added to the Delivery report. */
export interface CustomChart {
  id: string
  title: string
  config: BuilderConfig
}

export type EmailCadence = 'weekly' | 'biweekly' | 'monthly'

/** `Reports - Email this report` (`40006312:47130`), as scheduled. */
export interface EmailSchedule {
  to: string[]
  cadence: EmailCadence
  /** "monday-8", the Send on option. */
  sendOn: string
  summary: boolean
  onlyChanged: boolean
}

export interface ReportsState {
  charts: CustomChart[]
  addChart: (chart: Omit<CustomChart, 'id'>) => CustomChart
  removeChart: (id: string) => void
  restoreCharts: (charts: CustomChart[]) => void
  schedule: EmailSchedule | null
  setSchedule: (schedule: EmailSchedule | null) => void
}

export const ReportsContext = createContext<ReportsState | null>(null)

export function useReports(): ReportsState {
  const state = useContext(ReportsContext)
  if (!state) throw new Error('useReports needs the ReportsProvider around it')
  return state
}
