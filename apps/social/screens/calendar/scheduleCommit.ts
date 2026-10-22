import { useCallback } from 'react'

import { Toast } from '../../../../src/components/Toast'
import { formatTime } from '../../data/dates'
import { useSchedule, type ScheduleAt, type ScheduleRequest } from './scheduleState'

/** The two requests that change the schedule; `pick` only hands a time back. */
type CommitRequest = Exclude<ScheduleRequest, { source: 'pick' }>

const toastDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

/** `Thu, Oct 23 at 2:15 pm`. */
export function scheduleLabel({ date, time }: ScheduleAt): string {
  return `${toastDate.format(date)} at ${formatTime(time)}`
}

/**
 * Moves a post or schedules a draft, and says so in a toast with an Undo. One
 * path for the drag and the dialog, so the two cannot tell different stories.
 */
export function useCommitSchedule() {
  const { movePost, scheduleDraft } = useSchedule()
  const toast = Toast.useToast()
  return useCallback(
    (request: CommitRequest, at: ScheduleAt) => {
      const undo =
        request.source === 'post'
          ? movePost(request.post.id, at)
          : scheduleDraft(request.draft.id, at).undo
      toast.add({
        title: `${request.source === 'post' ? 'Moved to' : 'Scheduled for'} ${scheduleLabel(at)}`,
        action: { label: 'Undo', onClick: undo },
      })
    },
    [movePost, scheduleDraft, toast],
  )
}
