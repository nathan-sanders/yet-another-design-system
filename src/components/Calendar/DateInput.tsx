import { useId, useRef, useState } from 'react'
import type { Ref } from 'react'

import { overlayLayer } from '../../lib/layers'
import { Input } from '../Input'
import type { InputProps } from '../Input'
import { Popover } from '../Popover'
import type { CalendarProps, CalendarValue } from './Calendar'
import { DatePicker } from './DatePicker'
import { formatDateInput, isDateDisabled, parseDateInput } from './month'
import type { DateLimits } from './month'

export interface DateInputProps
  extends DateLimits,
    Pick<CalendarProps, 'weekStartsOn' | 'monthHeader' | 'yearRange' | 'locale'>,
    Omit<InputProps, 'value' | 'defaultValue' | 'onValueChange' | 'onChange' | 'type' | 'min' | 'max'> {
  /** Controlled date, or `null` while empty. */
  value?: Date | null
  /** Uncontrolled starting date. */
  defaultValue?: Date | null
  /**
   * Fires with a picked day, a typed date once it commits (blur or Enter), and
   * `null` when the text is cleared. Never with something `min`, `max` or
   * `dateConstraints` refuse — those revert instead.
   */
  onValueChange?: (date: Date | null) => void
  /** The panel's accessible name. */
  pickerLabel?: string
}

/**
 * DateInput — a date field: type `10/19/2026`, or click into it and pick a day
 * from a month.
 *
 *     <Field label="Start date">
 *       <DateInput value={start} onValueChange={setStart} min={today} />
 *     </Field>
 *
 * **No Figma component of its own, on purpose.** The file draws a date field
 * as what it is — a plain `Input` holding `10/19/2026`, placeholder "Select
 * date" (the New note dialog, `40005957:64172`) — and the panel it opens is
 * `Date Picker` `Type=Single` exactly: the 312 × 344 card, arrows, outside
 * days. This is the line between the two that the Calendar record left to
 * callers, promoted once Yet Social had written it for three fields
 * (`apps/social/FINDINGS.md` 100, 146).
 *
 * **Why not `Popover.Trigger` on the input.** The trigger writes
 * `aria-expanded`, which is not allowed on a textbox, and toggles on every
 * click — a second click into the field to place the caret would close it. So
 * the panel is positioned against the input with `anchor`, opens on focus and
 * click, and leaves focus in the field so typing keeps working. ArrowDown moves
 * into the grid; Escape and a click outside close it. Inside a Dialog, Escape
 * closes the panel and not the dialog.
 *
 * Typed text commits on blur and Enter through the same `parseDateInput` the
 * DatePicker's own footer uses, and anything it cannot read — or that the
 * limits refuse — reverts rather than clearing.
 */
export function DateInput({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  dateConstraints,
  weekStartsOn,
  monthHeader,
  yearRange,
  locale,
  placeholder = 'Select date',
  pickerLabel = 'Choose date',
  disabled,
  ref,
  onFocus,
  onClick,
  onBlur,
  onKeyDown,
  ...rest
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const [open, setOpen] = useState(false)

  const [uncontrolledValue, setUncontrolledValue] = useState<Date | null>(defaultValue)
  const value = valueProp !== undefined ? valueProp : uncontrolledValue
  const setValue = (next: Date | null) => {
    if (valueProp === undefined) setUncontrolledValue(next)
    onValueChange?.(next)
  }
  const limits = { min, max, dateConstraints }

  // Set while focus is handed back to the field after a pick or an Escape in
  // the grid, so that focus does not reopen the panel it just closed.
  const returning = useRef(false)
  const closeToField = () => {
    setOpen(false)
    if (document.activeElement === inputRef.current) return
    returning.current = true
    inputRef.current?.focus()
  }

  const formatted = value ? formatDateInput(value, locale) : ''
  const [text, setText] = useState(formatted)
  // Re-seed when the date changes underneath — a day picked in the grid, or a
  // new controlled value. DatePicker's footer fields do the same.
  const [lastFormatted, setLastFormatted] = useState(formatted)
  if (formatted !== lastFormatted) {
    setLastFormatted(formatted)
    setText(formatted)
  }

  const commit = () => {
    if (text.trim() === '') {
      if (value !== null) setValue(null)
      return
    }
    const parsed = parseDateInput(text, locale)
    if (!parsed || isDateDisabled(parsed, limits)) {
      setText(formatted)
      return
    }
    setValue(parsed)
  }

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node
  }

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next, details) => {
        // A press on the field itself counts as outside the panel; it is where
        // the panel belongs, so it keeps it open.
        if (!next && details.event?.target instanceof Node && inputRef.current?.contains(details.event.target)) {
          return
        }
        if (next) setOpen(true)
        else if (details.reason === 'escape-key') closeToField()
        else setOpen(false)
      }}
    >
      <Input
        {...rest}
        ref={setRefs as Ref<HTMLInputElement>}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onFocus={(event) => {
          onFocus?.(event)
          if (returning.current) returning.current = false
          else setOpen(true)
        }}
        onClick={(event) => {
          onClick?.(event)
          setOpen(true)
        }}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => {
          onBlur?.(event)
          // Moving into the panel is not leaving the field; anywhere else is,
          // so Tab to the next field closes the panel as well as committing.
          if (popupRef.current?.contains(event.relatedTarget as Node | null)) return
          commit()
          setOpen(false)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
            setOpen(false)
          } else if (event.key === 'ArrowDown' && open) {
            event.preventDefault()
            popupRef.current?.querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus()
          } else if (event.key === 'Escape' && open) {
            // Inside a Dialog: close the panel, not the dialog.
            event.stopPropagation()
            setOpen(false)
          }
        }}
      />
      <Popover.Portal>
        <Popover.Positioner
          // Input's box, not the `<input>` inside it: the control sits inside
          // the 1px border, so anchoring to it put the panel 1px in and 1px
          // high of the field the file lines it up with.
          anchor={() => inputRef.current?.parentElement ?? null}
          className={overlayLayer}
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <Popover.RawPopup
            ref={popupRef}
            id={panelId}
            aria-label={pickerLabel}
            initialFocus={false}
            finalFocus={false}
            // Popover's own motion. The panel is DatePicker's card, so the
            // popup paints nothing of its own.
            className="outline-none transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[instant]:duration-0"
          >
            <DatePicker
              value={value}
              min={min}
              max={max}
              dateConstraints={dateConstraints}
              weekStartsOn={weekStartsOn}
              monthHeader={monthHeader}
              yearRange={yearRange}
              locale={locale}
              defaultFocusMonth={value ?? min}
              presets={false}
              onValueChange={(next: CalendarValue) => {
                if (next instanceof Date) {
                  setValue(next)
                  closeToField()
                }
              }}
            />
          </Popover.RawPopup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover>
  )
}
