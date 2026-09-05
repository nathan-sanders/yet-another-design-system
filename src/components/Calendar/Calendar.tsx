import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentPropsWithRef, KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Select } from '../Select'
import { CalendarContext, useCalendar } from './context'
import {
  addMonths,
  addDays,
  addYears,
  buildMonth,
  clampDate,
  compareDays,
  dayKey,
  formatDayLabel,
  formatMonthYear,
  isDateDisabled,
  isSameDay,
  isSameMonth,
  monthLabels,
  rangePosition,
  shiftMonths,
  startOfDay,
  startOfMonth,
  weekdayLabels,
} from './month'
import type { DateLimits, DateRange, DaySelection, WeekDay } from './month'
import {
  dayButton,
  dayHeader,
  gridRow,
  monthBlock,
  monthCaption,
  monthGrid,
  monthHeaderRow,
  todayMarker,
} from './styles'

/**
 * Calendar — pick a date, or a range, from a month grid.
 *
 * Mirrors the Figma component `Calendar Month` (node 40004972:35021) and the
 * component set `_Day Button` (node 40004972:34892) behind it. Its sibling
 * `DatePicker` is the panel that wraps this with a presets rail and a footer.
 *
 *     <Calendar defaultValue={new Date()} onValueChange={setDate} />
 *     <Calendar defaultValue={[null, null]} numberOfMonths={2} />
 *
 * **The first component in the library with no headless primitive underneath
 * it.** Base UI 1.7.0 ships no calendar — its `internals/temporal` folder holds
 * an unused adapter interface and types naming components that do not exist —
 * so the grid, the roving focus and the whole keyboard map are written here.
 * The arithmetic is split into `month.ts`, which buys a node test for the part
 * that is wrong one month a year.
 *
 * **Range mode is derived from the value, not declared.** Pass an array to
 * `value` or `defaultValue` and this is a range picker; pass a `Date` and it is
 * a single one. Slider does the same thing for the same reason — a `mode` prop
 * could contradict the value it describes, and then one of them has to win
 * silently. An uncontrolled range picker with nothing chosen yet seeds itself
 * with `defaultValue={[null, null]}`.
 *
 * **Nothing is painted here.** The file's `Calendar Month` has no fill and no
 * stroke: it is 16px of padding around a 280px grid, and the card around it
 * belongs to `DatePicker`. So a `Calendar` on its own sits directly on whatever
 * surface it is dropped onto, which is what makes it usable inside somebody
 * else's panel.
 *
 * **Astryx's Calendar is the API reference** and supplies `min`, `max`,
 * `dateConstraints`, `numberOfMonths`, `weekStartsOn` and `hasOutsideDays` by
 * name. Left out on purpose: `hasWeekNumbers`, `hasVariableRowCount`,
 * `handleRef`, and `minRangeSpan` / `maxRangeSpan`. The file draws none of
 * them, and the bar for building is that the file draws it *and* something has
 * been reinvented without it.
 */

/** What `value` may be. An array puts the calendar in range mode. */
export type CalendarValue = Date | null | DateRange

export interface CalendarProps
  extends DateLimits,
    Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children' | 'className'> {
  /** Controlled selection. An array — even `[null, null]` — means range mode. */
  value?: CalendarValue
  /** Uncontrolled starting selection. Seeds range mode the same way. */
  defaultValue?: CalendarValue
  /** Fires on every click, including the half-picked `[start, null]` state. */
  onValueChange?: (value: CalendarValue) => void
  /** Controlled visible month. Any day in it will do; the first is used. */
  focusMonth?: Date
  /** Uncontrolled starting month. Defaults to the selection, else today. */
  defaultFocusMonth?: Date
  onFocusMonthChange?: (month: Date) => void
  /** One month, or two side by side for a range that crosses a boundary. */
  numberOfMonths?: 1 | 2
  /** Sunday is 0. The file draws a Sunday-first grid. */
  weekStartsOn?: WeekDay
  /** Draw days from neighbouring months, or leave those cells blank. */
  hasOutsideDays?: boolean
  /**
   * Figma's `Type` property on `_Month Header`. `default` is the caption
   * between two arrows; `picker` swaps the caption for month and year Selects,
   * which is how the file's `Type=Single` date picker is drawn.
   */
  monthHeader?: 'default' | 'picker'
  /** The years `monthHeader="picker"` offers. Defaults to today ±10, narrowed by `min`/`max`. */
  yearRange?: [number, number]
  /** BCP 47 tag for the month, weekday and date-label formatting. Defaults to the browser's. */
  locale?: string
  /** Names the calendar for screen readers. */
  'aria-label'?: string
  className?: string
}

function isRangeValue(value: CalendarValue | undefined): value is DateRange {
  return Array.isArray(value)
}

/** The first day a value names, used to decide which month to open on. */
function firstSelected(value: CalendarValue | undefined): Date | null {
  if (isRangeValue(value)) return value[0] ?? value[1] ?? null
  return value ?? null
}

/* -------------------------------------------------------------------------- */

/**
 * One day.
 *
 * `aria-disabled` rather than the `disabled` attribute: an unavailable day
 * stays focusable so the keyboard can move across it, which is what APG asks
 * for and what makes a long disabled stretch traversable rather than a wall.
 * The click handler has to guard for it, since the element is still clickable.
 */
function DayCell({ date, outside }: { date: Date; outside: boolean }) {
  const { getSelection, focusedDate, today, locale, hasOutsideDays, onDayClick, onDayHover, isDisabled } =
    useCalendar()

  if (outside && !hasOutsideDays) {
    // A blank cell, not a missing one — the columns have to keep lining up.
    return <div role="gridcell" className="h-8 w-10 shrink-0" />
  }

  const selection: DaySelection = getSelection(date)
  const selected = selection !== 'none'
  const disabled = isDisabled(date)
  const isToday = isSameDay(date, today)

  return (
    <div role="gridcell" aria-selected={selected}>
      <button
        type="button"
        // The roving tabindex: exactly one day in the calendar is tabbable, so
        // Tab moves past the grid rather than through 35 buttons.
        tabIndex={isSameDay(date, focusedDate) ? 0 : -1}
        // Queried by the focus effect after a keyboard move. `dayKey` is local
        // rather than ISO, which would name the previous day west of Greenwich.
        data-day={dayKey(date)}
        aria-disabled={disabled || undefined}
        aria-label={formatDayLabel(date, locale)}
        className={dayButton({ outside, selection, today: isToday })}
        onClick={() => {
          if (!disabled) onDayClick(date)
        }}
        onPointerEnter={() => onDayHover(date)}
      >
        {/* The file's `Highlight`. It loses to a selection, which paints over it. */}
        {isToday && !selected && <span className={todayMarker} />}
        {date.getDate()}
      </button>
    </div>
  )
}

DayCell.displayName = 'Calendar.DayCell'

/* -------------------------------------------------------------------------- */

interface MonthHeaderProps {
  month: Date
  layout: 'default' | 'picker'
  locale?: string
  showPrevious: boolean
  showNext: boolean
  previousDisabled: boolean
  nextDisabled: boolean
  years: number[]
  onPrevious: () => void
  onNext: () => void
  onMonthSelect: (monthIndex: number) => void
  onYearSelect: (year: number) => void
}

/**
 * `_Month Header`, node 40004972:35010.
 *
 * The two nav buttons are ghost icon-only Buttons at the default size, which is
 * what the file's instances say (`Appearance=Ghost, Size=Default, Label=false`)
 * and where their 42 x 32 comes from. The glyphs are `ArrowLeft`/`ArrowRight`,
 * not chevrons — the exported assets are named arrow.
 *
 * With two months, only the outer arrows are drawn: the file gives January a
 * left arrow and February a right one, and nothing in between. The slots are
 * still occupied by a spacer so both captions stay centred over their own grid.
 */
function MonthHeader({
  month,
  layout,
  locale,
  showPrevious,
  showNext,
  previousDisabled,
  nextDisabled,
  years,
  onPrevious,
  onNext,
  onMonthSelect,
  onYearSelect,
}: MonthHeaderProps) {
  const months = useMemo(() => monthLabels(locale), [locale])

  return (
    <div className={monthHeaderRow}>
      {showPrevious ? (
        <Button
          appearance="ghost"
          startIcon={ArrowLeft}
          aria-label="Previous month"
          disabled={previousDisabled}
          onClick={onPrevious}
        />
      ) : (
        <span aria-hidden="true" className="h-8 w-[42px] shrink-0" />
      )}

      {layout === 'picker' ? (
        <span className="flex min-w-px flex-1 items-center justify-center gap-1">
          <Select
            size="small"
            hug
            aria-label="Month"
            value={String(month.getMonth())}
            onValueChange={(next) => onMonthSelect(Number(next))}
          >
            {months.map((label, index) => (
              <Select.Item key={label} value={String(index)}>
                {label}
              </Select.Item>
            ))}
          </Select>
          <Select
            size="small"
            hug
            aria-label="Year"
            value={String(month.getFullYear())}
            onValueChange={(next) => onYearSelect(Number(next))}
          >
            {years.map((year) => (
              <Select.Item key={year} value={String(year)}>
                {String(year)}
              </Select.Item>
            ))}
          </Select>
        </span>
      ) : (
        <span className={monthCaption}>{formatMonthYear(month, locale)}</span>
      )}

      {showNext ? (
        <Button
          appearance="ghost"
          startIcon={ArrowRight}
          aria-label="Next month"
          disabled={nextDisabled}
          onClick={onNext}
        />
      ) : (
        <span aria-hidden="true" className="h-8 w-[42px] shrink-0" />
      )}
    </div>
  )
}

MonthHeader.displayName = 'Calendar.MonthHeader'

/* -------------------------------------------------------------------------- */

export function Calendar({
  value: valueProp,
  defaultValue,
  onValueChange,
  focusMonth: focusMonthProp,
  defaultFocusMonth,
  onFocusMonthChange,
  min,
  max,
  dateConstraints,
  numberOfMonths = 1,
  weekStartsOn = 0,
  hasOutsideDays = true,
  monthHeader = 'default',
  yearRange,
  locale,
  className,
  'aria-label': ariaLabel,
  ...props
}: CalendarProps) {
  // Today is read once per mount rather than per render: it is used for the
  // marker and as the fallback focus, and both should be stable while open.
  const [today] = useState(() => startOfDay(new Date()))

  const limits: DateLimits = useMemo(
    () => ({ min, max, dateConstraints }),
    [min, max, dateConstraints],
  )

  const [uncontrolledValue, setUncontrolledValue] = useState<CalendarValue>(defaultValue ?? null)
  const value = valueProp !== undefined ? valueProp : uncontrolledValue
  const isRange = isRangeValue(value)

  const [uncontrolledMonth, setUncontrolledMonth] = useState(() =>
    startOfMonth(defaultFocusMonth ?? firstSelected(defaultValue ?? valueProp) ?? clampDate(today, limits)),
  )
  const visibleMonth = focusMonthProp ? startOfMonth(focusMonthProp) : uncontrolledMonth

  const [focusedDate, setFocusedDate] = useState(() =>
    clampDate(firstSelected(defaultValue ?? valueProp) ?? today, limits),
  )
  const [previewDate, setPreviewDate] = useState<Date | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  // Set only by a keyboard move, so mounting the calendar never steals focus
  // and the nav buttons keep it.
  const shouldFocusRef = useRef(false)

  useEffect(() => {
    if (!shouldFocusRef.current) return
    shouldFocusRef.current = false
    rootRef.current?.querySelector<HTMLElement>(`[data-day="${dayKey(focusedDate)}"]`)?.focus()
  }, [focusedDate])

  const months = useMemo(
    () => Array.from({ length: numberOfMonths }, (_, i) => addMonths(visibleMonth, i)),
    [visibleMonth, numberOfMonths],
  )

  const setVisibleMonth = useCallback(
    (next: Date) => {
      const month = startOfMonth(next)
      if (isSameMonth(month, visibleMonth)) return
      if (!focusMonthProp) setUncontrolledMonth(month)
      onFocusMonthChange?.(month)
    },
    [focusMonthProp, onFocusMonthChange, visibleMonth],
  )

  const isDisabled = useCallback((date: Date) => isDateDisabled(date, limits), [limits])

  const commit = useCallback(
    (next: CalendarValue) => {
      if (valueProp === undefined) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [onValueChange, valueProp],
  )

  /**
   * Range selection in three clicks' worth of rules: the first opens
   * `[start, null]`, the second closes it — ordering the two so a backwards
   * pick still produces a forwards range — and a click on a closed range
   * starts a new one.
   */
  const onDayClick = useCallback(
    (date: Date) => {
      const day = startOfDay(date)
      setFocusedDate(day)
      setPreviewDate(null)

      if (!isRange) {
        commit(day)
        return
      }

      const [start, end] = value as DateRange
      if (!start || end) {
        commit([day, null])
        return
      }
      commit(compareDays(day, start) < 0 ? [day, start] : [start, day])
    },
    [commit, isRange, value],
  )

  const onDayHover = useCallback(
    (date: Date | null) => {
      // Only meaningful while a range is half-picked; skipping the state
      // update otherwise keeps a single-date calendar from re-rendering the
      // whole grid on every pointer move.
      if (!isRange) return
      const [start, end] = value as DateRange
      if (!start || end) return
      setPreviewDate(date)
    },
    [isRange, value],
  )

  /**
   * The range as drawn, which is not always the range as stored: with a start
   * picked and the pointer over a later day, the days between are shown filled
   * so the selection you are about to make is visible before you make it. The
   * file cannot draw that — it is behavior, like `Dialog.Body`'s scroll — but a
   * range picker without it feels broken.
   */
  const getSelection = useCallback(
    (date: Date): DaySelection => {
      if (!isRange) return isSameDay(date, value as Date | null) ? 'single' : 'none'

      const [start, end] = value as DateRange
      if (start && !end && previewDate) {
        return rangePosition(
          date,
          compareDays(previewDate, start) < 0 ? [previewDate, start] : [start, previewDate],
        )
      }
      return rangePosition(date, [start, end])
    },
    [isRange, previewDate, value],
  )

  /** Move the roving focus, pulling the visible months along if it leaves them. */
  const moveFocus = useCallback(
    (next: Date) => {
      const day = clampDate(next, limits)
      setFocusedDate(day)
      shouldFocusRef.current = true

      if (compareDays(day, visibleMonth) < 0) {
        setVisibleMonth(day)
      } else if (compareDays(day, addMonths(visibleMonth, numberOfMonths)) >= 0) {
        // Scroll by the minimum: the day lands in the *last* visible month.
        setVisibleMonth(addMonths(startOfMonth(day), -(numberOfMonths - 1)))
      }
    },
    [limits, numberOfMonths, setVisibleMonth, visibleMonth],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Only keys pressed on a day. The month header's Selects are inside this
      // element too, and swallowing their arrow keys would stop their popups
      // from working.
      if (!(event.target instanceof HTMLElement) || !event.target.dataset.day) return

      const moves: Record<string, () => Date> = {
        ArrowLeft: () => addDays(focusedDate, -1),
        ArrowRight: () => addDays(focusedDate, 1),
        ArrowUp: () => addDays(focusedDate, -7),
        ArrowDown: () => addDays(focusedDate, 7),
        // The week the focused day is in, not the calendar row it happens to
        // sit on — the two differ only for an outside day, where the row
        // belongs to a neighbouring month.
        Home: () => addDays(focusedDate, -((focusedDate.getDay() - weekStartsOn + 7) % 7)),
        End: () => addDays(focusedDate, 6 - ((focusedDate.getDay() - weekStartsOn + 7) % 7)),
        PageUp: () => (event.shiftKey ? addYears(focusedDate, -1) : shiftMonths(focusedDate, -1)),
        PageDown: () => (event.shiftKey ? addYears(focusedDate, 1) : shiftMonths(focusedDate, 1)),
      }

      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      moveFocus(move())
    },
    [focusedDate, moveFocus, weekStartsOn],
  )

  const columns = useMemo(() => weekdayLabels(weekStartsOn, locale), [weekStartsOn, locale])

  const years = useMemo(() => {
    const [from, to] = yearRange ?? [today.getFullYear() - 10, today.getFullYear() + 10]
    const low = Math.max(from, min?.getFullYear() ?? from)
    const high = Math.min(to, max?.getFullYear() ?? to)
    return Array.from({ length: Math.max(1, high - low + 1) }, (_, i) => low + i)
  }, [yearRange, today, min, max])

  const previousDisabled = min != null && compareDays(visibleMonth, startOfMonth(min)) <= 0
  const lastVisible = months[months.length - 1]
  const nextDisabled = max != null && compareDays(lastVisible, startOfMonth(max)) >= 0

  const context = useMemo(
    () => ({ getSelection, focusedDate, today, hasOutsideDays, locale, onDayClick, onDayHover, isDisabled }),
    [getSelection, focusedDate, today, hasOutsideDays, locale, onDayClick, onDayHover, isDisabled],
  )

  return (
    <CalendarContext.Provider value={context}>
      <div
        ref={rootRef}
        role="group"
        aria-label={ariaLabel}
        className={cn('flex font-sans', className)}
        onKeyDown={onKeyDown}
        // The preview is cleared here rather than on each cell's pointer-leave.
        // Per-cell, moving between two adjacent days produced a frame where no
        // day was hovered, so the tentative range collapsed and re-expanded on
        // every step across the grid.
        onPointerLeave={() => onDayHover(null)}
        {...props}
      >
        {months.map((month, index) => (
          <div key={dayKey(month)} className={monthBlock}>
            <MonthHeader
              month={month}
              layout={monthHeader}
              locale={locale}
              showPrevious={index === 0}
              showNext={index === months.length - 1}
              previousDisabled={previousDisabled}
              nextDisabled={nextDisabled}
              years={years}
              onPrevious={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              onNext={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              onMonthSelect={(m) => setVisibleMonth(new Date(visibleMonth.getFullYear(), m, 1))}
              onYearSelect={(y) => setVisibleMonth(new Date(y, visibleMonth.getMonth(), 1))}
            />

            <div role="grid" aria-label={formatMonthYear(month, locale)} className={monthGrid}>
              <div role="row" className={gridRow}>
                {columns.map((day) => (
                  // The visible label is two letters; `aria-label` carries the
                  // full name, so a screen reader says "Sunday" rather than
                  // spelling out "Su". (`abbr` would be the markup for this,
                  // but it is only valid on a `<th>`.)
                  <span key={day.long} role="columnheader" aria-label={day.long} className={dayHeader}>
                    {day.short}
                  </span>
                ))}
              </div>

              {buildMonth(month, weekStartsOn).map((week) => (
                <div key={dayKey(week[0].date)} role="row" className={gridRow}>
                  {week.map((day) => (
                    <DayCell key={dayKey(day.date)} date={day.date} outside={day.outside} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/*
          Navigating months moves nothing a screen reader would otherwise read —
          the caption is not focused and the grid is not re-entered — so the
          visible month is announced here instead.
        */}
        <span aria-live="polite" className="sr-only">
          {months.map((month) => formatMonthYear(month, locale)).join(' – ')}
        </span>
      </div>
    </CalendarContext.Provider>
  )
}

Calendar.displayName = 'Calendar'
