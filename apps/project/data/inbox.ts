import type { TaskComment } from './types'

/**
 * What an inbox message is about, which picks its `Type` glyph and the shape
 * of its detail (`Inbox - Approval`, `40006278:12738`, and the deep dive's
 * `Bundled updates`, `Reply in place`, `Later and undo`).
 */
export type InboxKind =
  'approval' | 'mention' | 'question' | 'bundle' | 'assigned' | 'health' | 'update' | 'comment'

/** Primary is what needs you; Other is the rest, which the frames name and do not draw. */
export type InboxTab = 'primary' | 'other'

export interface InboxItem {
  id: string
  kind: InboxKind
  /** Who it is from: a person's id, or Yak. */
  from: string | 'yak'
  /** The `Summary Label`: "Asked for your approval". */
  summary: string
  /** The line under it: what they asked, or their words in quotes. */
  body: string
  /** The day it arrived, in the file's calendar, and the time when it was today. */
  date: string
  time: string
  tab: InboxTab
  /** Shown with the pink dot, and counted in Primary's segment. */
  unread: boolean
  /** What it is about. The context token names the task when there is one, else the project. */
  taskId?: string
  projectId?: string
  /** A Due token beside the context token, as the approval and the assignment have. */
  showDue?: boolean
  /** The comments on its task that make up the conversation, in order. */
  commentIds?: string[]
  /** An approval: what to look at, what was asked, and who signs after you. */
  approval?: {
    file: { name: string; meta: string }
    ask: string
    nextId: string
  }
  /** Yak's bundle of routine changes. Dates in the text are `{2026-11-10}`. */
  bundle?: {
    title: string
    note: string
    moved: { personId: string; text: string; age: string }[]
    completed: { personId: string; text: string; age: string }[]
  }
  /** A change of health, before and after, with what the owner wrote. */
  health?: { from: string; to: string; note: string }
  /** Anything else's detail: the words in full. */
  detail?: string
}

/**
 * The inbox as `Inbox - Approval` draws it on the file's Thursday: four new
 * since this morning — Katie's approval, Marcus's mention, Priya's question,
 * Yak's bundle — then yesterday's assignment and health change. Each points
 * at a real task or project, so the detail reads the task's own status, due
 * date and comments. Other is code-first: the frames name the segment and
 * never open it.
 */
export const inboxItems: InboxItem[] = [
  {
    id: 'signage-approval',
    kind: 'approval',
    from: 'katie',
    summary: 'Asked for your approval',
    body: 'Approve the signage proof',
    date: '2026-11-05',
    time: '9:12 am',
    tab: 'primary',
    unread: true,
    taskId: 'aus-31',
    projectId: 'austin',
    showDue: true,
    commentIds: ['c-31-1', 'c-31-2'],
    approval: {
      file: { name: 'Austin-signage-v3.pdf', meta: '3 pages · uploaded this morning' },
      ask: 'Katie Powell asked you to approve by end of day',
      nextId: 'dana',
    },
  },
  {
    id: 'access-letter',
    kind: 'mention',
    from: 'marcus',
    summary: 'Mentioned you',
    body: '“Nathan, can you sign the access letter?”',
    date: '2026-11-05',
    time: '8:40 am',
    tab: 'primary',
    unread: true,
    taskId: 'aus-21',
    projectId: 'austin',
    commentIds: ['c-21-2', 'c-21-3'],
  },
  {
    id: 'second-vendor',
    kind: 'question',
    from: 'priya',
    summary: 'Asked a question',
    body: '“Do we want a second produce vendor?”',
    date: '2026-11-05',
    time: '8:05 am',
    tab: 'primary',
    unread: true,
    taskId: 'aus-27',
    projectId: 'austin',
    commentIds: ['c-27-1'],
  },
  {
    id: 'austin-bundle',
    kind: 'bundle',
    from: 'yak',
    summary: 'Bundled 5 updates',
    body: 'Dates moved on 3 tasks, 2 were completed',
    date: '2026-11-05',
    time: '7:30 am',
    tab: 'primary',
    unread: true,
    projectId: 'austin',
    bundle: {
      title: 'Austin store opening: 5 updates',
      note: 'None of these need you. The only one to watch is the inspection moving to {2026-11-10}.',
      moved: [
        {
          personId: 'marcus',
          text: 'Marcus moved Final electrical inspection to {2026-11-10}',
          age: '2h',
        },
        {
          personId: 'marcus',
          text: 'Marcus moved Install hood and ventilation to {2026-11-20}',
          age: '2h',
        },
        {
          personId: 'dana',
          text: 'Dana moved Health permit approval to {2026-11-18}',
          age: 'Yesterday',
        },
      ],
      completed: [
        { personId: 'sofia', text: 'Sofia completed Offer letters batch 2', age: '4h' },
        { personId: 'dana', text: 'Dana completed Submit floor plan', age: 'Yesterday' },
      ],
    },
  },
  {
    id: 'hiring-plan',
    kind: 'assigned',
    from: 'sofia',
    summary: 'Assigned you a task',
    body: 'Review Q1 hiring plan',
    date: '2026-11-04',
    time: '4:15 pm',
    tab: 'primary',
    unread: false,
    taskId: 'hir-07',
    projectId: 'spring-hiring',
    showDue: true,
    detail:
      'Can you look over the Q1 plan before Friday? Mostly the shift-lead count for Austin and Dallas.',
  },
  {
    id: 'loyalty-health',
    kind: 'health',
    from: 'theo',
    summary: 'Changed project health',
    body: 'At risk → Off track',
    date: '2026-11-04',
    time: '2:30 pm',
    tab: 'primary',
    unread: false,
    projectId: 'loyalty',
    health: {
      from: 'at-risk',
      to: 'off-track',
      note: 'Pricing sign-off slipped past {2026-11-09}. The free-bowl reward still costs more than the model allows, and the tiers wait on it.',
    },
  },
  {
    id: 'protein-update',
    kind: 'update',
    from: 'katie',
    summary: 'Posted an update',
    body: 'Menu boards go live next Thursday',
    date: '2026-11-05',
    time: '8:20 am',
    tab: 'other',
    unread: false,
    projectId: 'protein-plates',
    detail:
      'On track. Boards print Monday and go up in all stores on {2026-11-12}. The only open item is your sign-off on the final boards.',
  },
  {
    id: 'plan-comment',
    kind: 'comment',
    from: 'maya',
    summary: 'Commented on a doc',
    body: '“Added the Dallas lockup for reference.”',
    date: '2026-11-04',
    time: '11:05 am',
    tab: 'other',
    unread: false,
    projectId: 'austin',
    detail:
      'Added the Dallas lockup for reference, in Austin opening plan under Signage. Same proportions, so the fabricator can reuse the template.',
  },
  {
    id: 'gift-print',
    kind: 'assigned',
    from: 'katie',
    summary: 'Assigned you a task',
    body: 'Approve gift card print run',
    date: '2026-11-03',
    time: '10:00 am',
    tab: 'other',
    unread: false,
    taskId: 'gft-09',
    projectId: 'gift-cards',
    showDue: true,
    detail: 'The printer needs the go-ahead a week out, so this one is not urgent yet.',
  },
]

/**
 * The comments the inbox's conversations quote, on their tasks. Written here
 * beside the messages that point at them and appended to the tasks in
 * `data/tasks.ts`, so the task panel shows the same thread.
 */
export const inboxComments: Record<string, TaskComment[]> = {
  'aus-31': [
    {
      id: 'c-31-1',
      authorId: 'katie',
      age: '1h',
      body: 'Landlord signed off on the size. This is the last round before it goes to the fabricator.',
    },
    {
      id: 'c-31-2',
      authorId: 'maya',
      age: '40m',
      body: 'Logo lockup matches the Dallas store. Looks good on my side.',
    },
  ],
  'aus-21': [
    {
      id: 'c-21-2',
      authorId: 'dana',
      age: 'Yesterday',
      body: 'Inspector needs access through the back door. Who can authorize that?',
    },
    {
      id: 'c-21-3',
      authorId: 'marcus',
      age: '8:40 am',
      body: 'Nathan, can you sign the access letter? Dana has it ready.',
    },
  ],
  'aus-27': [
    {
      id: 'c-27-1',
      authorId: 'priya',
      age: '8:05 am',
      body: 'Do we want a second produce vendor? It adds 4% but covers us if the first one can’t deliver.',
    },
  ],
}

/**
 * Later's menu (`Inbox - Later and undo`, `40006316:50589`): "Bring this
 * back", then three times. Pick a date is drawn and opens nothing yet.
 */
export const LATER_TIMES = [
  { id: 'today', label: 'Later today', back: 'later today' },
  { id: 'tomorrow', label: 'Tomorrow morning', back: 'tomorrow morning' },
  { id: 'monday', label: 'Monday morning', back: 'on Monday' },
] as const

export type LaterTime = (typeof LATER_TIMES)[number]['id']

/** Inbox settings (`Inbox - Settings`, `40006316:53658`), as drawn. */
export const NOTIFY_RULES = [
  { id: 'assigned', label: 'I’m assigned a task', inbox: true, email: false },
  { id: 'mentioned', label: 'Someone mentions me', inbox: true, email: true },
  { id: 'approval', label: 'I’m asked to approve', inbox: true, email: true },
  { id: 'blocked', label: 'A task of mine is blocked', inbox: true, email: true },
  { id: 'update', label: 'A project I follow posts an update', inbox: true, email: false },
  { id: 'dates', label: 'Dates move on something I own', inbox: true, email: false },
] as const

export const QUIET_RULES = [
  {
    id: 'bundle',
    label: 'Let Yak bundle routine updates',
    detail: 'Dates and completions arrive together at 7:30 am',
    on: true,
  },
  { id: 'quiet', label: 'Quiet hours', detail: 'No email from 7 pm to 8 am', on: true },
] as const
