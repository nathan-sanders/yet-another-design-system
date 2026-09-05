import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { Field } from '../Field'
import { Icon } from '../Icon'
import { Input } from '../Input'
import { Calendar } from './Calendar'
import type { CalendarProps, CalendarValue } from './Calendar'
import {
  compareDays,
  formatDateInput,
  isDateDisabled,
  parseDateInput,
  startOfMonth,
} from './month'
import type { DateLimits, DateRange } from './month'
import { DATE_RANGE_PRESETS } from './presets'
import type { DatePreset } from './presets'
import { footer as footerStyle, panel, presetsRail } from './styles'

/**
 * DatePicker — the panel around a `Calendar`: a presets rail down the left, the
 * month grid, and a footer holding the range as text with Cancel and Apply.
 *
 * Mirrors the Figma component set `Date Picker` (node 40004972:34964), whose
 * `Type` property is Single | Range - 1 Column | Range - 2 Columns.
 *
 *     <DatePicker defaultValue={[null, null]} numberOfMonths={2} onApply={run} />
 *
 * **Two of Figma's three variants are one prop.** `Range - 1 Column` and
 * `Range - 2 Columns` differ only in `numberOfMonths`; everything else about
 * them — including the footer's two shapes, 136 tall at 312 wide and 88 at 624
 * — falls out of `flex-wrap` on one footer rather than being drawn twice.
 *
 * **The third is the value's shape.** `Type=Single` has its presets rail and
 * its footer switched off in the file, so both belong to range mode and neither
 * needs a prop: pass a `Date` and you get the bare card, pass a pair and you
 * get the rail and the footer. Range mode is derived the same way it is in
 * `Calendar`, which is where the reasoning lives.
 *
 * **It draws no trigger, because the file does not.** Nothing on the canvas
 * opens this panel. Dropping it in a `Popover.Popup` is a line of a caller's
 * code, and inventing a `DatePickerField` here would be a component the file
 * has never seen.
 *
 * **`Type=Single` is drawn with the month-picker header** — an instance
 * override on one of three variants rather than a rule, so `monthHeader`
 * defaults to `default` here as it does on `Calendar`. Pass
 * `monthHeader="picker"` to reproduce the file's Single exactly.
 */

export interface DatePickerProps
  extends Omit<CalendarProps, 'focusMonth' | 'defaultFocusMonth' | 'onFocusMonthChange'> {
  /**
   * The shortcuts down the left. Range mode falls back to
   * `DATE_RANGE_PRESETS` — the eight the file draws — and `false` removes the
   * rail. Ignored in single mode, which the file draws without one.
   */
  presets?: DatePreset[] | false
  /** Controlled visible month. */
  focusMonth?: Date
  onFocusMonthChange?: (month: Date) => void
  /** Fires with the current value when Apply is pressed. Omit to hide the actions. */
  onApply?: (value: CalendarValue) => void
  /** Fires when Cancel is pressed. Omit to hide the actions. */
  onCancel?: () => void
  cancelLabel?: ReactNode
  applyLabel?: ReactNode
  /** Labels on the two footer inputs. */
  startLabel?: ReactNode
  endLabel?: ReactNode
}

/** Keeps a range pointing forwards however its two ends were entered. */
function order(range: DateRange): DateRange {
  const [start, end] = range
  if (start && end && compareDays(start, end) > 0) return [end, start]
  return range
}

/* -------------------------------------------------------------------------- */

interface RangeFieldProps {
  label: ReactNode
  date: Date | null
  locale?: string
  limits: DateLimits
  onCommit: (date: Date | null) => void
}

/**
 * One of the footer's two date inputs.
 *
 * The text is local state seeded from the date, because a half-typed
 * "1/1" is not a date and committing per keystroke would move the calendar to
 * January of the year 1. It commits on blur and on Enter, and anything
 * `parseDateInput` cannot read — or that `min`/`max`/`dateConstraints` refuse —
 * reverts to what was there, rather than clearing the field or leaving an
 * invalid string in it.
 *
 * `Field` keeps its default `nativeLabel`: the control is a real `<input>`, so
 * clicking the label should focus it.
 */
function RangeField({ label, date, locale, limits, onCommit }: RangeFieldProps) {
  const formatted = date ? formatDateInput(date, locale) : ''
  const [text, setText] = useState(formatted)
  // Re-seed when the date changes underneath — a day clicked in the grid, or a
  // preset applied. Comparing against the formatted value rather than tracking
  // focus keeps this to one piece of state.
  const [lastFormatted, setLastFormatted] = useState(formatted)
  if (formatted !== lastFormatted) {
    setLastFormatted(formatted)
    setText(formatted)
  }

  const commit = () => {
    if (text.trim() === '') {
      onCommit(null)
      return
    }
    const parsed = parseDateInput(text, locale)
    if (!parsed || isDateDisabled(parsed, limits)) {
      setText(formatted)
      return
    }
    onCommit(parsed)
  }

  return (
    <Field label={label} className="min-w-px flex-1">
      <Input
        value={text}
        placeholder="Select date…"
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
        }}
      />
    </Field>
  )
}

RangeField.displayName = 'DatePicker.RangeField'

/* -------------------------------------------------------------------------- */

export function DatePicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  focusMonth: focusMonthProp,
  onFocusMonthChange,
  presets,
  onApply,
  onCancel,
  cancelLabel = 'Cancel',
  applyLabel = 'Apply',
  startLabel = 'Start date',
  endLabel = 'End date',
  min,
  max,
  dateConstraints,
  numberOfMonths = 1,
  weekStartsOn,
  hasOutsideDays,
  monthHeader,
  yearRange,
  locale,
  className,
  'aria-label': ariaLabel,
  ...rest
}: DatePickerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<CalendarValue>(defaultValue ?? null)
  const value = valueProp !== undefined ? valueProp : uncontrolledValue
  const isRange = Array.isArray(value)

  const limits: DateLimits = useMemo(
    () => ({ min, max, dateConstraints }),
    [min, max, dateConstraints],
  )

  const setValue = useCallback(
    (next: CalendarValue) => {
      if (valueProp === undefined) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    [onValueChange, valueProp],
  )

  // The visible month is held here as well as in `Calendar`, because a preset
  // and the footer inputs both have to move it and neither goes through the
  // grid.
  const [uncontrolledMonth, setUncontrolledMonth] = useState<Date | null>(null)
  const focusMonth = focusMonthProp ?? uncontrolledMonth ?? undefined

  const showMonth = useCallback(
    (date: Date) => {
      // Anchor on the day given so it lands in the *last* visible month: after
      // "Last 30 days" that is today, which is the end you are most likely to
      // adjust next.
      const month = startOfMonth(date)
      const anchored = new Date(month.getFullYear(), month.getMonth() - (numberOfMonths - 1), 1)
      if (focusMonthProp === undefined) setUncontrolledMonth(anchored)
      onFocusMonthChange?.(anchored)
    },
    [focusMonthProp, numberOfMonths, onFocusMonthChange],
  )

  const applyPreset = useCallback(
    (preset: DatePreset) => {
      const range = preset.range()
      setValue(range)
      const anchor = range[1] ?? range[0]
      if (anchor) showMonth(anchor)
    },
    [setValue, showMonth],
  )

  const [start, end] = isRange ? (value as DateRange) : [null, null]
  const presetList = presets === false ? [] : (presets ?? DATE_RANGE_PRESETS)
  const showRail = isRange && presetList.length > 0
  const showActions = onApply != null || onCancel != null

  return (
    <div className={cn(panel, className)} {...rest}>
      {showRail && (
        <div className={presetsRail}>
          {presetList.map((preset) => (
            <Button
              key={preset.label}
              appearance="secondary"
              className="w-full"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {/*
        The calendar's own width, pinned so the footer cannot widen the panel.
        Without it the panel is `inline-flex` and sizes to its widest child's
        max-content — which for a `flex-wrap` footer is everything on one row,
        so the file's 536 came out 731 and the footer never wrapped. A month
        block is a fixed `w-78` (312), so this is just that, times one or two.
      */}
      <div className={numberOfMonths === 2 ? 'flex w-156 flex-col' : 'flex w-78 flex-col'}>
        <Calendar
          value={value}
          onValueChange={setValue}
          focusMonth={focusMonth}
          onFocusMonthChange={(month) => {
            if (focusMonthProp === undefined) setUncontrolledMonth(month)
            onFocusMonthChange?.(month)
          }}
          min={min}
          max={max}
          dateConstraints={dateConstraints}
          numberOfMonths={numberOfMonths}
          weekStartsOn={weekStartsOn}
          hasOutsideDays={hasOutsideDays}
          monthHeader={monthHeader}
          yearRange={yearRange}
          locale={locale}
          aria-label={ariaLabel}
        />

        {isRange && (
          <div className={footerStyle}>
            <div className="flex max-w-80 min-w-70 flex-1 items-end gap-2">
              <RangeField
                label={startLabel}
                date={start}
                locale={locale}
                limits={limits}
                onCommit={(date) => {
                  setValue(order([date, end]))
                  if (date) showMonth(date)
                }}
              />
              {/* Unlabeled, so `Icon` marks it `aria-hidden` — the two Fields
                  already say which end is which. */}
              <span className="flex items-center py-2">
                <Icon icon={ArrowRight} />
              </span>
              <RangeField
                label={endLabel}
                date={end}
                locale={locale}
                limits={limits}
                onCommit={(date) => {
                  setValue(order([start, date]))
                  if (date) showMonth(date)
                }}
              />
            </div>

            {showActions && (
              <div className="flex items-center justify-end gap-2">
                {onCancel && (
                  <Button appearance="secondary" onClick={onCancel}>
                    {cancelLabel}
                  </Button>
                )}
                {onApply && <Button onClick={() => onApply(value)}>{applyLabel}</Button>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

DatePicker.displayName = 'DatePicker'
