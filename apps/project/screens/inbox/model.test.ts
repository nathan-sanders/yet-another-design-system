import { describe, expect, it } from 'vitest'

import { inboxItems } from '../../data/inbox'
import { tasks } from '../../data/tasks'
import type { Message } from './inboxState'
import { caughtUpLine, countFor, dayGroup, messagesIn, timeLabel } from './model'

const fresh: Message[] = inboxItems.map((item) => ({
  ...item,
  place: { where: 'inbox' },
  replies: [],
}))

describe('the inbox, against Inbox - Approval (40006278:12738)', () => {
  it('lists Primary newest first, as drawn', () => {
    expect(messagesIn(fresh, 'primary').map((m) => m.from)).toEqual([
      'katie',
      'marcus',
      'priya',
      'yak',
      'sofia',
      'theo',
    ])
  })

  it('counts Primary’s four new ones, and nothing in Later or Cleared yet', () => {
    expect(countFor(fresh, 'primary')).toBe(4)
    expect(countFor(fresh, 'later')).toBe(0)
    expect(countFor(fresh, 'cleared')).toBe(0)
  })

  it('heads today’s Today and Wednesday’s Yesterday, with the clock and the weekday', () => {
    const [katie] = messagesIn(fresh, 'primary')
    const sofia = fresh.find((m) => m.from === 'sofia')!
    expect([dayGroup(katie), timeLabel(katie)]).toEqual(['Today', '9:12 am'])
    expect([dayGroup(sofia), timeLabel(sofia)]).toEqual(['Yesterday', 'Wed'])
  })

  it('quotes comments that are really on their tasks', () => {
    for (const item of inboxItems) {
      const task = tasks.find((t) => t.id === item.taskId)
      for (const id of item.commentIds ?? []) {
        expect(task?.comments?.some((c) => c.id === id)).toBe(true)
      }
    }
  })
})

describe('All caught up (40006316:52229)', () => {
  const put = (back: 'today' | 'tomorrow' | 'monday') =>
    ({ ...fresh[0], place: { where: 'later', back } }) as Message

  it('says what comes back from Later, and when', () => {
    expect(caughtUpLine([put('monday'), put('monday')])).toBe(
      'Two items come back on Monday. Nothing else needs you today.',
    )
    expect(caughtUpLine([put('monday'), put('tomorrow')])).toBe(
      'Two items come back, the first tomorrow morning. Nothing else needs you today.',
    )
    expect(caughtUpLine([])).toBe('Nothing else needs you today.')
  })
})
