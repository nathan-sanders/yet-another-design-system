import { useState, type FormEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router'

import { Button } from '../../../../src/components/Button'
import { Dialog } from '../../../../src/components/Dialog'
import { Field } from '../../../../src/components/Field'
import { Select } from '../../../../src/components/Select'
import { DateInput } from '../../components/DateInput'
import { formatTime, sameDay, toISODate } from '../../data/dates'
import { TIMES, firstOffer, postDate, today } from './model'
import { useCommitSchedule } from './scheduleCommit'
import { momentOf, useSchedule, type ScheduleRequest } from './scheduleState'

/**
 * The keyboard's way to do what a drag does: a date and a time for a post
 * that is moving, or a draft going on the calendar. Code-first — Figma has no
 * scheduling dialog — built as the note dialog is (`NoteDialog.tsx`): a
 * `DateInput` and a time `Select` side by side.
 *
 * Rendered once, by the shell, and opened through `requestSchedule`, so the
 * post detail and the Drafts panel share it. After a move on the calendar the
 * calendar follows the post to its new day.
 */
export function ScheduleDialog() {
  const { scheduling, requestSchedule } = useSchedule()
  const [shown, setShown] = useState(scheduling)
  if (scheduling && scheduling !== shown) setShown(scheduling)
  const close = () => requestSchedule(null)

  return (
    <Dialog
      open={scheduling !== null}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      disablePointerDismissal
    >
      {shown ? (
        <ScheduleForm
          key={
            shown.source === 'post'
              ? shown.post.id
              : shown.source === 'draft'
                ? shown.draft.id
                : 'pick'
          }
          request={shown}
          onDone={close}
        />
      ) : null}
    </Dialog>
  )
}

function ScheduleForm({ request, onDone }: { request: ScheduleRequest; onDone: () => void }) {
  const commit = useCommitSchedule()
  const [params, setParams] = useSearchParams()
  const onCalendar = useLocation().pathname.startsWith('/plan/calendar')
  const from =
    request.source === 'post'
      ? { date: postDate(request.post), time: request.post.time }
      : request.source === 'pick'
        ? request.initial
        : firstOffer()
  const [date, setDate] = useState<Date | null>(from.date)
  const [time, setTime] = useState(from.time)
  const [submitted, setSubmitted] = useState(false)

  const passed = date !== null && momentOf({ date, time }) <= new Date()
  const error =
    date === null
      ? 'Pick a day.'
      : passed
        ? 'That time has already gone. Pick a later one.'
        : undefined
  const times = TIMES.includes(from.time) ? TIMES : [...TIMES, from.time].sort()

  const save = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!date || passed) return
    const at = { date, time }
    if (request.source === 'pick') {
      request.onPick(at)
    } else if (!(sameDay(date, from.date) && time === from.time) || request.source === 'draft') {
      commit(request, at)
      // On the calendar, follow the post to the day it went to.
      if (onCalendar) {
        const next = new URLSearchParams(params)
        next.set('date', toISODate(date))
        setParams(next)
      }
    }
    onDone()
  }

  return (
    <Dialog.Popup>
      <form onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title>
            {request.source === 'post'
              ? 'Reschedule post'
              : request.source === 'pick'
                ? request.title
                : 'Schedule draft'}
          </Dialog.Title>
          <Dialog.Close />
        </div>

        {/* `flex-initial`: the Body is `flex-1` so it can scroll, which on its
            own stretches a short dialog to the viewport's height (finding 95). */}
        <Dialog.Body className="flex flex-initial flex-col gap-4">
          <Dialog.Description>
            {request.source === 'draft'
              ? 'Pick when this draft goes out. It leaves Drafts and goes on the calendar.'
              : 'Pick when this post goes out.'}
          </Dialog.Description>
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Date"
              invalid={submitted && error !== undefined}
              error={submitted ? error : undefined}
            >
              <DateInput
                value={date}
                onValueChange={setDate}
                min={today}
                invalid={submitted && error !== undefined}
              />
            </Field>
            <Field label="Time" nativeLabel={false}>
              <Select value={time} onValueChange={(value) => setTime(value as string)}>
                {times.map((option) => (
                  <Select.Item key={option} value={option}>
                    {formatTime(option)}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </div>
        </Dialog.Body>

        <div className="flex items-center justify-end gap-2 pt-4">
          <Dialog.Close render={<Button appearance="secondary">Cancel</Button>} />
          <Button type="submit">
            {request.source === 'post' ? 'Reschedule' : request.source === 'pick' ? 'Done' : 'Schedule'}
          </Button>
        </div>
      </form>
    </Dialog.Popup>
  )
}
