import { day, sameDay, shortDate, today, weekdayLong, weekdayShort } from '../../data/dates'
import { personFor } from '../../data/people'
import {
  QUESTION_TYPES,
  type FormQuestion,
  type IntakeRequest,
  type MyRequestStatus,
  type QuestionType,
  type RequestAnswer,
  type RequestState,
} from '../../data/requests'
import type { Task } from '../../data/types'

/** The queue's segments, in the deep dive's order (`40006300:28384`). */
export const QUEUE_TABS = [
  { id: 'new', label: 'New' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
] as const satisfies readonly { id: RequestState; label: string }[]

export type QueueView = (typeof QUEUE_TABS)[number]['id']

const DAY_MS = 24 * 60 * 60 * 1000

function daysBefore(date: Date, now: Date): number {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((start(now) - start(date)) / DAY_MS)
}

/** Hours in a drawn age ("2h"), so two from today sort newest first. */
function ageHours(request: IntakeRequest): number {
  return Number.parseInt(request.age ?? '', 10) || 0
}

/** The requests a segment lists, newest first: the day they came in, then their age. */
export function requestsIn(requests: IntakeRequest[], view: QueueView): IntakeRequest[] {
  return requests
    .map((request, index) => ({ request, index }))
    .filter(({ request }) => request.state === view)
    .sort(
      (a, b) =>
        day(b.request.date).getTime() - day(a.request.date).getTime() ||
        ageHours(a.request) - ageHours(b.request) ||
        a.index - b.index,
    )
    .map(({ request }) => request)
}

/**
 * A segment's count, as its label carries it ("New · 3"). Only the two that
 * wait on someone count; Accepted and Declined are drawn bare.
 */
export function countFor(requests: IntakeRequest[], view: QueueView): number {
  return view === 'new' || view === 'waiting' ? requestsIn(requests, view).length : 0
}

/** Everything still open, new or waiting: My requests' "Queue · 5". */
export function openCount(requests: IntakeRequest[]): number {
  return countFor(requests, 'new') + countFor(requests, 'waiting')
}

/** The row's time: the drawn age today, Yesterday, the weekday this week, the date before that. */
export function timeLabel(request: IntakeRequest, now: Date = today): string {
  const date = day(request.date)
  if (sameDay(date, now)) return request.age ?? 'Today'
  const days = daysBefore(date, now)
  if (days === 1) return 'Yesterday'
  return days < 7 ? weekdayShort.format(date) : shortDate.format(date)
}

/** The same, as it reads mid-sentence in the detail's first line: "2h ago", "yesterday", "Monday". */
function whenInLine(request: IntakeRequest, now: Date): string {
  const date = day(request.date)
  if (sameDay(date, now)) return request.age ? `${request.age} ago` : 'today'
  const days = daysBefore(date, now)
  if (days === 1) return 'yesterday'
  return days < 7 ? weekdayLong.format(date) : shortDate.format(date)
}

/** The detail's first line: "Priya Raman · 2h ago · Creative request form". */
export function headLine(request: IntakeRequest, now: Date = today): string {
  return `${personFor(request.fromId).name} · ${whenInLine(request, now)} · ${request.form}`
}

/** Whole days a waiting request has waited: Menu boards' 1, the contractor quote's 3. */
export function waitingDays(request: IntakeRequest, now: Date = today): number {
  return request.waiting ? daysBefore(day(request.waiting.since), now) : 0
}

/**
 * The row's subtitle: who, and what kind of request, or how long it has
 * waited on them ("Maya Okafor · waiting 1 day").
 */
export function subtitle(request: IntakeRequest, now: Date = today): string {
  const name = personFor(request.fromId).name
  if (request.state !== 'waiting') return `${name} · ${request.kind}`
  const days = waitingDays(request, now)
  return `${name} · waiting ${days === 0 ? 'since today' : `${days} ${days === 1 ? 'day' : 'days'}`}`
}

export function firstName(personId: string): string {
  return personFor(personId).name.split(' ')[0]
}

/** The number a new task in a project takes: one past its highest. */
export function nextTaskNumber(tasks: Task[], projectId: string): number {
  const numbers = tasks.filter((t) => t.projectId === projectId).map((t) => t.number)
  return numbers.length ? Math.max(...numbers) + 1 : 1
}

/**
 * The answers as a task's description, a line each, which is what the Accept
 * dialog's "7 answers as the description" token promises.
 */
export function descriptionFrom(answers: RequestAnswer[]): string {
  return answers.map((a) => `${a.question} ${a.answer}`).join('\n')
}

/** "7 answers as the description". */
export function answersLine(answers: RequestAnswer[]): string {
  return `${answers.length} ${answers.length === 1 ? 'answer' : 'answers'} as the description`
}

/**
 * The project Yak spots in what someone is asking for, as the submit page's
 * Yak card says it (`40006301:29578`). Only Winter menu R&D is listening in
 * this mock: its bowls and its menu.
 */
export function relatedProject(text: string): string | undefined {
  return /\b(winter|bowls?|menu)\b/i.test(text) ? 'Winter menu R&D' : undefined
}

export function typeLabel(type: QuestionType): string {
  return QUESTION_TYPES.find((t) => t.value === type)?.label ?? type
}

/** The questions asked whatever the answers are, in order, each with the ones that hang off it. */
export function questionTree(
  questions: FormQuestion[],
): { question: FormQuestion; branch: FormQuestion[] }[] {
  return questions
    .filter((q) => !q.showIf)
    .map((question) => ({
      question,
      branch: questions.filter((q) => q.showIf?.questionId === question.id),
    }))
}

/**
 * A question's Logic rows (`Question Panel`, `40006301:32493`): one per
 * answer that shows more questions, then one per answer that sends the
 * request to another team's queue.
 */
export function logicRows(
  question: FormQuestion,
  questions: FormQuestion[],
  team: string,
): { kind: 'show' | 'route'; title: string; body: string }[] {
  const shown = new Map<string, number>()
  for (const q of questions) {
    if (q.showIf?.questionId === question.id) {
      shown.set(q.showIf.answer, (shown.get(q.showIf.answer) ?? 0) + 1)
    }
  }
  return [
    ...[...shown].map(([answer, n]) => ({
      kind: 'show' as const,
      title: `If ${answer}`,
      body: `Show ${n} more ${n === 1 ? 'question' : 'questions'}`,
    })),
    ...(question.routes ?? []).map((route) => ({
      kind: 'route' as const,
      title: `If ${route.answer}`,
      body: `Send to the ${route.to} queue, not ${team}`,
    })),
  ]
}

/** Whether a question is asked, given the answers so far. */
export function isAsked(question: FormQuestion, answers: Record<string, unknown>): boolean {
  return !question.showIf || answers[question.showIf.questionId] === question.showIf.answer
}

/** My requests' Status badge: its words and its Decorative hue, as the frame colors them. */
export const MY_STATUS: Record<
  MyRequestStatus,
  { label: string; color: 'amber' | 'green' | 'blue' | 'neutral' | 'sky' }
> = {
  'waiting-on-you': { label: 'Waiting on you', color: 'amber' },
  submitted: { label: 'Submitted', color: 'sky' },
  accepted: { label: 'Accepted', color: 'green' },
  done: { label: 'Done', color: 'blue' },
  declined: { label: 'Declined', color: 'neutral' },
}
