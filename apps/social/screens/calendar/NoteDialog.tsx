import { useId, useState, type FormEvent } from 'react'

import { Button } from '../../../../src/components/Button'
import { DatePicker, type CalendarValue } from '../../../../src/components/Calendar'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Input } from '../../../../src/components/Input'
import { Radio } from '../../../../src/components/Radio'
import { Text } from '../../../../src/components/Text'
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
 * Making and editing a calendar note. Figma draws the note but not how one is
 * made, so this is the library's `Dialog` holding a title, a description, the
 * days it runs (`DatePicker` in range mode, which brings its own start and end
 * inputs), and the ten colors of `Calendar Note`.
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
  const [range, setRange] = useState<CalendarValue>(
    editing
      ? [dayDate(editing.start), dayDate(editing.end)]
      : [request.mode === 'new' ? request.date : null, null],
  )
  const [submitted, setSubmitted] = useState(false)
  const datesLabel = useId()

  const [start, end] = Array.isArray(range) ? range : [null, null]
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
      // A range with no end is a one-day note.
      end: toCalendarDay(end ?? start),
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
        <Dialog.Description>
          Call out an event, or mark how long a campaign runs. Everyone on the calendar sees it.
        </Dialog.Description>

        {/* `flex-initial`: the Body is `flex-1` so it can scroll, which on its
            own stretches a short dialog to the viewport's height. This one
            shrinks to scroll on a short screen and never grows past its form. */}
        <Dialog.Body className="flex flex-initial flex-col gap-4 sm:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
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

            <Field label="Color">
              <Radio.Group
                value={color}
                onValueChange={(value) => setColor(value as NoteColor)}
                className="grid grid-cols-2"
              >
                {NOTE_COLORS.map((option) => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    label={
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={cn(
                            'size-4 shrink-0 rounded-sm inset-ring',
                            noteSwatch(option.value),
                          )}
                        />
                        {option.label}
                      </span>
                    }
                  />
                ))}
              </Radio.Group>
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <Text id={datesLabel} size="sm" weight="semibold">
              Dates
            </Text>
            <DatePicker
              aria-labelledby={datesLabel}
              value={range}
              onValueChange={setRange}
              presets={false}
              className="self-start"
            />
            {submitted && startMissing ? (
              <Text size="sm" color="danger">
                Pick the day the note starts.
              </Text>
            ) : null}
          </div>
        </Dialog.Body>

        <div className="flex items-center gap-2">
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
