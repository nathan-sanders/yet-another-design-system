import { useId, useRef, useState } from 'react'

import { DatePicker, type CalendarValue } from '../../../src/components/Calendar'
import { Input } from '../../../src/components/Input'
import { Popover } from '../../../src/components/Popover'
import { formatDateInput, isDateDisabled, parseDateInput } from '../../../src/components/Calendar/month'
import { overlayLayer } from '../../../src/lib/layers'

interface DateInputProps {
  /** The committed date, or null while empty. */
  value: Date | null
  onValueChange: (date: Date | null) => void
  /** Earliest day that can be picked or typed — the end field's start. */
  min?: Date
  placeholder?: string
  invalid?: boolean
}

/**
 * A date field: type `10/19/2026`, or click into it and pick from a month.
 *
 * The library leaves the trigger out on purpose (`Calendar/CLAUDE.md`, "Left out
 * on purpose") — putting the panel in a popover is a caller's line — so this is
 * that line, in the app, logged as FINDINGS 100. A second date field anywhere
 * would be the signal to promote it.
 *
 * The panel is `DatePicker` with a single `Date`, which is Figma's
 * `Date Picker Type=Single` exactly: the 312 × 344 card, arrows, outside days.
 *
 * **Why not `Popover.Trigger` on the input.** The trigger writes
 * `aria-expanded`, which is not allowed on a textbox, and toggles on every
 * click — a second click into the field to place the caret would close it. So
 * the panel is positioned against the input with `anchor`, opens on focus and
 * click, and leaves focus in the field so typing keeps working. ArrowDown moves
 * into the grid; Escape and a click outside close it.
 *
 * Typed text commits on blur and Enter through the same `parseDateInput` the
 * DatePicker's own footer uses, and anything it cannot read — or that falls
 * before `min` — reverts rather than clearing.
 */
export function DateInput({ value, onValueChange, min, placeholder = 'Select date', invalid }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const [open, setOpen] = useState(false)
  // Set while focus is handed back to the field after a pick or an Escape in
  // the grid, so that focus does not reopen the panel it just closed.
  const returning = useRef(false)
  const closeToField = () => {
    setOpen(false)
    if (document.activeElement === inputRef.current) return
    returning.current = true
    inputRef.current?.focus()
  }

  const formatted = value ? formatDateInput(value) : ''
  const [text, setText] = useState(formatted)
  // Re-seed when the date changes underneath — a day picked in the grid.
  const [lastFormatted, setLastFormatted] = useState(formatted)
  if (formatted !== lastFormatted) {
    setLastFormatted(formatted)
    setText(formatted)
  }

  const commit = () => {
    if (text.trim() === '') {
      onValueChange(null)
      return
    }
    const parsed = parseDateInput(text)
    if (!parsed || isDateDisabled(parsed, { min })) {
      setText(formatted)
      return
    }
    onValueChange(parsed)
  }

  return (
    <Popover
      open={open}
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
        ref={inputRef}
        value={text}
        placeholder={placeholder}
        invalid={invalid}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onFocus={() => {
          if (returning.current) returning.current = false
          else setOpen(true)
        }}
        onClick={() => setOpen(true)}
        onChange={(event) => setText(event.target.value)}
        onBlur={(event) => {
          // Moving into the panel is not leaving the field; anywhere else is,
          // so Tab to the next field closes the panel as well as committing.
          if (popupRef.current?.contains(event.relatedTarget as Node | null)) return
          commit()
          setOpen(false)
        }}
        onKeyDown={(event) => {
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
          anchor={inputRef}
          className={overlayLayer}
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <Popover.RawPopup
            ref={popupRef}
            id={panelId}
            aria-label="Choose date"
            initialFocus={false}
            finalFocus={false}
            className="outline-none transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          >
            <DatePicker
              value={value}
              min={min}
              defaultFocusMonth={value ?? min}
              presets={false}
              onValueChange={(next: CalendarValue) => {
                if (next instanceof Date) {
                  onValueChange(next)
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
