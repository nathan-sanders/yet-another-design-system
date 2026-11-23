import { statusFor } from '../../components/taskMeta'
import { today } from '../../data/dates'
import { me } from '../../data/people'
import type { Task, TaskEvent } from '../../data/types'

/*
 * What the review page and Yak's proposed change do to a task, as pure
 * functions the TasksProvider runs: each returns the task changed, its
 * Activity saying so first, dated the mock's today like every other edit.
 */

let nextId = 0
const newId = (prefix: string) => `${prefix}-pull-${++nextId}`

function logged(task: Task, ...events: Omit<TaskEvent, 'id' | 'at'>[]): TaskEvent[] {
  return [
    ...events.map((event) => ({ ...event, id: newId('e'), at: today })),
    ...(task.activity ?? []),
  ]
}

/**
 * Approve or Request changes, in the review's top bar. You join the reviewers
 * if you were not one, so the list says where you stand, and saying the other
 * thing later changes your row rather than adding one.
 */
export function reviewed(task: Task, verdict: 'approved' | 'changes'): Task {
  const pull = task.pullRequest
  if (!pull) return task
  const mine = pull.reviewers.some((r) => r.personId === me.id)
  const reviewers = mine
    ? pull.reviewers.map((r) => (r.personId === me.id ? { ...r, state: verdict } : r))
    : [...pull.reviewers, { personId: me.id, state: verdict }]
  return {
    ...task,
    pullRequest: { ...pull, reviewers },
    activity: logged(task, {
      actor: me.id,
      text:
        verdict === 'approved'
          ? `You approved pull request #${pull.number}`
          : `You requested changes on pull request #${pull.number}`,
    }),
  }
}

/** A comment on the pull request as a whole, under the line comments. */
export function withReviewComment(task: Task, body: string): Task {
  const pull = task.pullRequest
  if (!pull) return task
  return {
    ...task,
    pullRequest: {
      ...pull,
      comments: [...pull.comments, { id: newId('rc'), authorId: me.id, age: 'Just now', body }],
    },
  }
}

/**
 * Open pull request, on Yak's proposed change: the change becomes a pull
 * request from Yak's branch with the assignee asked to review it, and the
 * rule that moved Apple Pay moves this one to In review the same way.
 */
export function openedFromAgent(task: Task, number: number): Task {
  const run = task.agent
  if (!run || run.opened) return task
  const slug = task.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
  return {
    ...task,
    status: 'in-review',
    agent: { ...run, opened: true },
    pullRequest: {
      number,
      title: task.title,
      authorId: 'yak',
      commits: 1,
      base: 'main',
      branch: `yak/${task.id}-${slug}`,
      state: 'open',
      reviewers: [{ personId: task.assigneeId, state: 'requested' }],
      checks: { passed: 3, total: 3 },
      files: run.files,
      comments: [],
    },
    activity: logged(
      task,
      {
        actor: 'rule',
        text: `Rule: moved this task when pull request #${number} opened`,
        change: { from: statusFor(task.status).label, to: statusFor('in-review').label },
      },
      { actor: 'yak', text: `Yak opened pull request #${number}` },
    ),
  }
}

/** Try again: Yak runs the task once more. The mock's second run lands where the first did. */
export function retried(task: Task): Task {
  const run = task.agent
  if (!run || run.opened) return task
  return {
    ...task,
    agent: { ...run, attempt: run.attempt + 1 },
    activity: logged(task, {
      actor: 'yak',
      text: `Yak ran the task again: the same change, and the tests passed`,
    }),
  }
}

/** Who opened a pull request, by name: Yak opens its own. */
export function authorName(authorId: string, name: (id: string) => string): string {
  return authorId === 'yak' ? 'Yak' : name(authorId)
}
