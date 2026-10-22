import { useState, type FormEvent } from 'react'

import { Button } from '../../../../src/components/Button'
import { DateInput } from '../../../../src/components/Calendar'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Select } from '../../../../src/components/Select'
import { Toast } from '../../../../src/components/Toast'
import { cn } from '../../../../src/lib/cn'
import { NOTE_COLORS, noteSwatch } from '../../components/calendarNoteColors'
import type { CalendarNote, NoteColor } from '../../data/types'
import { useCalendarNotes } from './calendarNotesState'
import { dayDate, toCalendarDay } from './model'

/** What the dialog is open for: a new note from a day, or an existing one. */
export type NoteDialogRequest = { mode: 'new'; date: Date } | { mode: 'edit'; note: CalendarNote }

interface NoteDialogProps {
  request: NoteDialogRequest | null
  onClose: () => void
}

/**
 * Making and editing a calendar note — Figma's `New note` dialog
 * (`40005957:64172`): Title, Description, Color, then Start date and End date
 * side by side. Color is a `Select` whose rows and trigger carry the note's own
 * swatch; each date is a `DateInput` that opens the single-month picker.
 *
 * The form is keyed by the request so each opening starts from that note — or
 * from a blank one-day note on the day that was clicked.
 */
export function NoteDialog({ request, onClose }: NoteDialogProps) {
  // Held on close so the form keeps its content while the popup fades out.
  const [shown, setShown] = useState(request)
  if (request && request !== shown) setShown(request)

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      disablePointerDismissal
    >
      {shown ? (
        <NoteForm
          key={shown.mode === 'edit' ? shown.note.id : shown.date.toISOString()}
          request={shown}
          onDone={onClose}
        />
      ) : null}
    </Dialog>
  )
}

function NoteForm({ request, onDone }: { request: NoteDialogRequest; onDone: () => void }) {
  const { addNote, updateNote, removeNote } = useCalendarNotes()
  const toast = Toast.useToast()
  const editing = request.mode === 'edit' ? request.note : null

  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [color, setColor] = useState<NoteColor>(editing?.color ?? 'neutral')
  const [start, setStart] = useState<Date | null>(
    editing ? dayDate(editing.start) : request.mode === 'new' ? request.date : null,
  )
  // A new note has no end until one is picked; it saves as a one-day note.
  const [end, setEnd] = useState<Date | null>(editing ? dayDate(editing.end) : null)
  const [submitted, setSubmitted] = useState(false)

  const titleMissing = title.trim() === ''
  const startMissing = start === null

  const save = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleMissing || !start) return
    const note = {
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      color,
      start: toCalendarDay(start),
      // An end before the start (the start moved later) or no end is one day.
      end: toCalendarDay(end && end >= start ? end : start),
    }
    if (editing) {
      updateNote(editing.id, note)
      toast.add({ title: 'Note updated' })
    } else {
      addNote(note)
      toast.add({ title: 'Note added' })
    }
    onDone()
  }

  const remove = () => {
    if (!editing) return
    removeNote(editing.id)
    toast.add({ title: `Deleted “${editing.title}”` })
    onDone()
  }

  return (
    <Dialog.Popup>
      <form onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>{editing ? 'Edit note' : 'New note'}</Dialog.Title>
          <Dialog.Close />
        </div>
        <Dialog.Body className="flex flex-col gap-4">
          <Field
            label="Title"
            invalid={submitted && titleMissing}
            error={submitted && titleMissing ? 'Give the note a title.' : undefined}
          >
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer Menu"
              autoFocus
            />
          </Field>
          <Field label="Description">
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Launch campaign"
            />
          </Field>
          <Field label="Color" nativeLabel={false}>
            <Select value={color} onValueChange={(value) => setColor(value as NoteColor)}>
              {NOTE_COLORS.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  startIcon={
                    <span className={cn('size-3.5 rounded-full inset-ring', noteSwatch(option.value))} />
                  }
                >
                  {option.label}
                </Select.Item>
              ))}
            </Select>
          </Field>
          {/* The frame's two 280 fields with 8px between them. */}
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Start date"
              invalid={submitted && startMissing}
              error={submitted && startMissing ? 'Pick the day the note starts.' : undefined}
            >
              <DateInput value={start} onValueChange={setStart} invalid={submitted && startMissing} />
            </Field>
            <Field label="End date">
              <DateInput value={end} onValueChange={setEnd} min={start ?? undefined} />
            </Field>
          </div>
        </Dialog.Body>

        <div className="flex items-center gap-2 pt-4">
          {editing ? (
            <Button appearance="destructive" onClick={remove}>
              Delete
            </Button>
          ) : null}
          <div className="ml-auto flex gap-2">
            <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
            <Button type="submit">{editing ? 'Save' : 'Add note'}</Button>
          </div>
        </div>
      </form>
    </Dialog.Popup>
  )
}
