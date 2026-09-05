import { createContext, useContext } from 'react'

import type { DaySelection } from './month'

/**
 * What a day cell needs to know, set once by `Calendar` and read by every cell.
 *
 * Passing it down as props would mean threading eight values through two
 * layers of grid, and would let a cell disagree with the calendar it sits in
 * about which day is selected. Same move as `SegmentedControlContext` and
 * `SelectContext`.
 *
 * Deliberately not exported from the package.
 */
export interface CalendarContextValue {
  /**
   * Where a day sits in the selection.
   *
   * A function rather than the value itself, because in range mode it also
   * folds in the hover preview — the tentative range between a picked start and
   * the day under the pointer. A cell should not have to know that exists.
   */
  getSelection: (date: Date) => DaySelection
  /** The day the roving tabindex currently sits on. */
  focusedDate: Date
  today: Date
  /** Whether days from neighbouring months are drawn or left blank. */
  hasOutsideDays: boolean
  locale?: string
  onDayClick: (date: Date) => void
  onDayHover: (date: Date | null) => void
  isDisabled: (date: Date) => boolean
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext)
  if (!value) throw new Error('Calendar parts must be rendered inside a Calendar.')
  return value
}
