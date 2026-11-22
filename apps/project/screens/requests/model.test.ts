import { describe, expect, it } from 'vitest'

import { day, fileIso } from '../../data/dates'
import { creativeForm, intakeRequests } from '../../data/requests'
import { tasks } from '../../data/tasks'
import {
  countFor,
  descriptionFrom,
  headLine,
  logicRows,
  nextTaskNumber,
  openCount,
  questionTree,
  relatedProject,
  requestsIn,
  subtitle,
  timeLabel,
  waitingDays,
} from './model'

// The file's Thursday, moved onto this week as the app moves it.
const now = day('2026-11-05')

describe('the queue, against Requests - Waiting on requester (40006300:28384)', () => {
  it('lists New newest first, as the Queue frame orders the three still new', () => {
    expect(requestsIn(intakeRequests, 'new').map((r) => r.id)).toEqual([
      'photo-shoot',
      'laptops',
      'store-hours',
    ])
  })

  it('lists Waiting as drawn: menu boards, then the contractor quote', () => {
    expect(requestsIn(intakeRequests, 'waiting').map((r) => r.id)).toEqual([
      'menu-boards',
      'contractor-quote',
    ])
  })

  it('counts New · 3 and Waiting · 2, and My requests’ Queue · 5', () => {
    expect(countFor(intakeRequests, 'new')).toBe(3)
    expect(countFor(intakeRequests, 'waiting')).toBe(2)
    expect(countFor(intakeRequests, 'accepted')).toBe(0)
    expect(openCount(intakeRequests)).toBe(5)
  })

  it('writes the row times and subtitles the frames do', () => {
    const byId = (id: string) => intakeRequests.find((r) => r.id === id)!
    expect(timeLabel(byId('photo-shoot'), now)).toBe('2h')
    expect(timeLabel(byId('laptops'), now)).toBe('Yesterday')
    expect(timeLabel(byId('contractor-quote'), now)).toBe('Mon')
    expect(subtitle(byId('photo-shoot'), now)).toBe('Priya Raman · Marketing request')
    expect(subtitle(byId('menu-boards'), now)).toBe('Maya Okafor · waiting 1 day')
    expect(subtitle(byId('contractor-quote'), now)).toBe('Marcus Bell · waiting 3 days')
    expect(waitingDays(byId('contractor-quote'), now)).toBe(3)
  })

  it('writes the detail’s first line as drawn', () => {
    const byId = (id: string) => intakeRequests.find((r) => r.id === id)!
    expect(headLine(byId('photo-shoot'), now)).toBe('Priya Raman · 2h ago · Creative request form')
    expect(headLine(byId('menu-boards'), now)).toBe('Maya Okafor · yesterday · Print request form')
  })

  it('points the duplicate at a real open task, due four days after Katie’s date', () => {
    const request = intakeRequests.find((r) => r.id === 'store-hours')!
    const task = tasks.find((t) => t.id === request.duplicateOf)!
    expect(task.title).toBe('Add holiday hours to store pages')
    const days = (day(task.due).getTime() - day(request.routing.due).getTime()) / 86_400_000
    expect(Math.round(days)).toBe(4)
  })

  it('resolves every accepted request to the task whose Linked section names it', () => {
    for (const request of intakeRequests.filter((r) => r.accepted)) {
      const task = tasks.find((t) => t.id === request.accepted!.taskId)!
      expect(task.linked?.request).toBe(request.title)
    }
  })
})

describe('accepting', () => {
  it('numbers a new Austin task one past the highest, and a project’s first task 1', () => {
    const highest = Math.max(...tasks.filter((t) => t.projectId === 'austin').map((t) => t.number))
    expect(nextTaskNumber(tasks, 'austin')).toBe(highest + 1)
    expect(nextTaskNumber(tasks, 'winter-menu')).toBe(1)
  })

  it('carries all seven answers into the description, a line each', () => {
    const photo = intakeRequests.find((r) => r.id === 'photo-shoot')!
    expect(descriptionFrom(photo.answers).split('\n')).toHaveLength(7)
  })
})

describe('the Creative request form (40006284:20412)', () => {
  it('nests Where and Location under What kind, as the builder draws them', () => {
    const tree = questionTree(creativeForm.questions)
    expect(tree.map((t) => t.question.label)).toEqual([
      'What do you need?',
      'What kind of work is this?',
      'When do you need it?',
      'Which team pays?',
      'Anything else?',
    ])
    expect(tree[1].branch.map((q) => q.label)).toEqual([
      'Where will it be used?',
      'Do you need a location?',
    ])
  })

  it('writes the Question editor’s two Logic rows', () => {
    const kind = creativeForm.questions.find((q) => q.id === 'kind')!
    expect(logicRows(kind, creativeForm.questions, 'Creative')).toEqual([
      { kind: 'show', title: 'If Photo or video', body: 'Show 2 more questions' },
      { kind: 'route', title: 'If Print', body: 'Send to the Print queue, not Creative' },
    ])
  })

  it('spots Winter menu R&D in Priya’s words, and nothing in a laptop', () => {
    expect(relatedProject('Hero and social photos for five winter bowls')).toBe('Winter menu R&D')
    expect(relatedProject('Two laptops for the GM')).toBeUndefined()
  })
})

describe('a date picked in a field, saved back to the data', () => {
  it('comes back as the same day through day(), not two weeks late', () => {
    const picked = day('2026-12-01')
    expect(day(fileIso(picked)).getTime()).toBe(picked.getTime())
    expect(fileIso(picked)).toBe('2026-12-01')
  })
})
