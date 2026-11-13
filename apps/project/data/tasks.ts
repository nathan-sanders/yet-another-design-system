import { day } from './dates'
import { inboxComments } from './inbox'
import type { Subtask, Task } from './types'

/**
 * Hire 14 crew members' checklist: one line a hire, nine made. The role
 * counts are the description's.
 */
function crew(): Subtask[] {
  const roles: [string, number, number][] = [
    ['shift lead', 2, 2],
    ['line cook', 5, 5],
    ['prep cook', 3, 2],
    ['cashier', 4, 0],
  ]
  return roles.flatMap(([role, count, done]) =>
    Array.from({ length: count }, (_, i) => ({
      id: `aus-16-${role.replace(' ', '-')}-${i + 1}`,
      title: `Hire ${role} (${i + 1} of ${count})`,
      done: i < done,
    })),
  )
}

/**
 * Austin store opening's tasks, as `Project - List` (`40006268:6554`) draws
 * them, in its four phases and its order. The numbers are the placeholders
 * the file assigned (AUS-24 Health permit approval, AUS-19 Crew training
 * week); the dates hold the page's schedule math: the permit on Nov 18, the
 * 5-day lag, equipment by Dec 1, six buffer days before crew training.
 *
 * Only Austin has a whole plan. The other projects have only Nathan's own
 * tasks, the ones My work lists (`myTasks`, below).
 */
const planned: Task[] = [
  {
    id: 'aus-21',
    projectId: 'austin',
    number: 21,
    title: 'Final electrical inspection',
    phase: 'Permits & build-out',
    assigneeId: 'marcus',
    status: 'in-progress',
    priority: 'high',
    due: '2026-11-10',
    start: '2026-11-02',
    baseline: { start: '2026-11-02', due: '2026-11-04' },
    description:
      'The city’s final sign-off on the build-out’s electrical. It slipped from {2026-11-04} to {2026-11-10}, and the health permit can’t be scheduled until it passes.',
    estimate: '4h',
    subtasks: [
      { id: 'aus-38', title: 'Send the panel schedule to the city', done: true },
      { id: 'aus-39', title: 'Walk the site with the electrician', done: true },
      { id: 'aus-40', title: 'Meet the inspector on site', done: false },
    ],
    linked: { doc: 'Austin opening plan' },
    comments: [
      {
        id: 'c-21-1',
        authorId: 'dana',
        age: '3h',
        body: 'Do we have a window for the {2026-11-10:th}? I want the health inspector lined up behind it.',
      },
    ],
    activity: [
      {
        id: 'e-21-2',
        actor: 'marcus',
        text: 'Marcus moved the due date',
        at: day('2026-11-05'),
        change: { from: '{2026-11-04}', to: '{2026-11-10}' },
      },
      { id: 'e-21-1', actor: 'marcus', text: 'Marcus created this task', at: day('2026-10-20') },
    ],
  },
  {
    id: 'aus-24',
    projectId: 'austin',
    number: 24,
    title: 'Health permit approval',
    phase: 'Permits & build-out',
    assigneeId: 'dana',
    status: 'blocked',
    priority: 'high',
    due: '2026-11-18',
    start: '2026-11-11',
    baseline: { start: '2026-11-05', due: '2026-11-13' },
    description:
      'City health department sign-off for the Austin kitchen. They won’t schedule until electrical passes, and the review takes five business days.',
    estimate: '6h',
    subtasks: [
      { id: 'aus-24-1', title: 'Submit floor plan', done: true },
      { id: 'aus-24-2', title: 'Book inspector', done: false },
      { id: 'aus-24-3', title: 'Post permit on site', done: false },
    ],
    dependsOn: [{ taskId: 'aus-21' }],
    linked: { doc: 'Austin opening plan', request: 'Permit check for Austin' },
    comments: [
      {
        id: 'c-24-1',
        authorId: 'marcus',
        age: '2h',
        body: 'City confirmed the {2026-11-10:th}. If it passes I’ll send the certificate over the same day.',
        likes: 2,
        replies: [
          {
            id: 'c-24-2',
            authorId: 'dana',
            age: '1h',
            body: 'Thanks. I’ll book the inspector as soon as it lands.',
          },
        ],
      },
    ],
    activity: [
      {
        id: 'e-24-6',
        actor: 'dana',
        text: 'Dana changed the status',
        at: day('2026-11-04'),
        change: { from: 'In progress', to: 'Blocked' },
      },
      {
        id: 'e-24-5',
        actor: 'rule',
        text: 'Rule: told Dana this task is blocked',
        at: day('2026-11-04'),
      },
      {
        id: 'e-24-4',
        actor: 'marcus',
        text: 'Marcus added a dependency on Final electrical inspection',
        at: day('2026-11-04'),
      },
      {
        id: 'e-24-3',
        actor: 'dana',
        text: 'Dana moved the due date',
        at: day('2026-11-03'),
        change: { from: '{2026-11-16}', to: '{2026-11-18}' },
      },
      {
        id: 'e-24-2',
        actor: 'yak',
        text: 'Yak flagged that this task has no slack',
        at: day('2026-11-02'),
      },
      { id: 'e-24-1', actor: 'dana', text: 'Dana created this task', at: day('2026-10-26') },
    ],
  },
  {
    id: 'aus-22',
    projectId: 'austin',
    number: 22,
    title: 'Install hood and ventilation',
    phase: 'Permits & build-out',
    assigneeId: 'marcus',
    status: 'in-progress',
    priority: 'medium',
    due: '2026-11-20',
    start: '2026-11-09',
    description:
      'The hood over the cook line, ducted to the roof. The fire marshal signs it off before the health inspector comes.',
    estimate: '16h',
    activity: [
      {
        id: 'e-22-2',
        actor: 'marcus',
        text: 'Marcus changed the status',
        at: day('2026-11-02'),
        change: { from: 'To do', to: 'In progress' },
      },
      { id: 'e-22-1', actor: 'marcus', text: 'Marcus created this task', at: day('2026-10-20') },
    ],
  },
  {
    // Drawn on the Timeline (`40006272:7631`) and on no other frame: the
    // sign the proof is for, up the week before the soft-open push.
    id: 'aus-32',
    projectId: 'austin',
    number: 32,
    title: 'Signage install',
    phase: 'Permits & build-out',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'medium',
    due: '2026-12-04',
    start: '2026-12-01',
    description: 'The storefront sign and window vinyl, up and lit, once the proof is signed off.',
    estimate: '6h',
    activity: [
      { id: 'e-32-1', actor: 'marcus', text: 'Marcus created this task', at: day('2026-10-26') },
    ],
  },
  {
    id: 'aus-20',
    projectId: 'austin',
    number: 20,
    title: 'Submit health plan',
    phase: 'Permits & build-out',
    assigneeId: 'dana',
    status: 'done',
    priority: 'medium',
    due: '2026-10-28',
    description: 'Kitchen layout, equipment list and food safety plan, for the city’s plan review.',
    estimate: '3h',
    activity: [
      {
        id: 'e-20-2',
        actor: 'dana',
        text: 'Dana changed the status',
        at: day('2026-10-28'),
        change: { from: 'In review', to: 'Done' },
      },
      { id: 'e-20-1', actor: 'dana', text: 'Dana created this task', at: day('2026-10-14') },
    ],
  },
  {
    // Drawn on the Board (`40006268:8728`), in Done, and not in the List
    // frame; AUS-11 is a placeholder number like the rest.
    id: 'aus-11',
    projectId: 'austin',
    number: 11,
    title: 'Sign the lease',
    phase: 'Permits & build-out',
    assigneeId: 'dana',
    status: 'done',
    priority: 'high',
    due: '2026-10-12',
    description: 'Ten-year lease on the Austin unit, with the build-out allowance in writing.',
    estimate: '4h',
    activity: [
      {
        id: 'e-11-2',
        actor: 'dana',
        text: 'Dana changed the status',
        at: day('2026-10-12'),
        change: { from: 'In review', to: 'Done' },
      },
      { id: 'e-11-1', actor: 'dana', text: 'Dana created this task', at: day('2026-09-28') },
    ],
  },
  {
    id: 'aus-16',
    projectId: 'austin',
    number: 16,
    title: 'Hire 14 crew members',
    phase: 'Hiring & training',
    assigneeId: 'sofia',
    status: 'in-progress',
    priority: 'high',
    due: '2026-11-20',
    start: '2026-11-02',
    description:
      'Fourteen hourly crew for the opening rota: two shift leads, five line cooks, three prep cooks and four cashiers.',
    estimate: '30h',
    subtasks: crew(),
    linked: { request: 'Austin crew hiring' },
    activity: [
      {
        id: 'e-16-2',
        actor: 'sofia',
        text: 'Sofia checked off Hire prep cook (2 of 3)',
        at: day('2026-11-04'),
      },
      { id: 'e-16-1', actor: 'sofia', text: 'Sofia created this task', at: day('2026-10-19') },
    ],
  },
  {
    id: 'aus-17',
    projectId: 'austin',
    number: 17,
    title: 'Hire general manager',
    phase: 'Hiring & training',
    assigneeId: 'sofia',
    status: 'done',
    priority: 'high',
    due: '2026-10-30',
    description: 'A general manager in place before crew hiring and training start.',
    estimate: '12h',
    activity: [
      {
        id: 'e-17-2',
        actor: 'sofia',
        text: 'Sofia changed the status',
        at: day('2026-10-30'),
        change: { from: 'In progress', to: 'Done' },
      },
      { id: 'e-17-1', actor: 'sofia', text: 'Sofia created this task', at: day('2026-10-05') },
    ],
  },
  {
    id: 'aus-19',
    projectId: 'austin',
    number: 19,
    title: 'Crew training week',
    phase: 'Hiring & training',
    assigneeId: 'sofia',
    status: 'todo',
    priority: 'medium',
    due: '2026-12-14',
    start: '2026-12-07',
    description:
      'A week of paid training in the finished kitchen, starting {2026-12-07}. It needs the equipment in and working first.',
    estimate: '40h',
    dependsOn: [{ taskId: 'aus-16' }, { taskId: 'aus-26' }],
    activity: [
      { id: 'e-19-1', actor: 'sofia', text: 'Sofia created this task', at: day('2026-10-19') },
    ],
  },
  {
    id: 'aus-27',
    projectId: 'austin',
    number: 27,
    title: 'Finalize Austin supplier list',
    phase: 'Supply & equipment',
    assigneeId: 'priya',
    status: 'in-review',
    priority: 'medium',
    due: '2026-11-09',
    start: '2026-11-03',
    description: 'Produce, dry goods and packaging suppliers for Austin, priced against Dallas.',
    estimate: '5h',
    subtasks: [
      { id: 'aus-27-1', title: 'Shortlist produce growers', done: true },
      { id: 'aus-27-2', title: 'Price the dry goods', done: false },
      { id: 'aus-27-3', title: 'Confirm delivery windows', done: false },
    ],
    activity: [
      {
        id: 'e-27-2',
        actor: 'priya',
        text: 'Priya changed the status',
        at: day('2026-11-03'),
        change: { from: 'In progress', to: 'In review' },
      },
      { id: 'e-27-1', actor: 'priya', text: 'Priya created this task', at: day('2026-10-21') },
    ],
  },
  {
    id: 'aus-26',
    projectId: 'austin',
    number: 26,
    title: 'Equipment delivery',
    phase: 'Supply & equipment',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'high',
    due: '2026-12-01',
    start: '2026-11-23',
    description:
      'Ovens, fridges and the line, delivered and installed. Nothing ships until the health permit is in hand.',
    estimate: '12h',
    dependsOn: [{ taskId: 'aus-24', lagDays: 5 }],
    activity: [
      { id: 'e-26-1', actor: 'marcus', text: 'Marcus created this task', at: day('2026-10-20') },
    ],
  },
  {
    id: 'aus-28',
    projectId: 'austin',
    number: 28,
    title: 'First produce delivery',
    phase: 'Supply & equipment',
    assigneeId: 'priya',
    status: 'todo',
    priority: 'medium',
    due: '2027-01-06',
    start: '2027-01-04',
    description: 'The first standing order from the new growers, the week before opening.',
    estimate: '2h',
    dependsOn: [{ taskId: 'aus-27' }],
    activity: [
      { id: 'e-28-1', actor: 'priya', text: 'Priya created this task', at: day('2026-10-21') },
    ],
  },
  {
    // Drawn on the Board (`40006268:8728`) in In review, due the file's
    // Thursday, and not in the List frame. Home's "Approve the Austin signage
    // proof" is Nathan's side of the same review.
    id: 'aus-31',
    projectId: 'austin',
    number: 31,
    title: 'Signage proof',
    short: 'Signage proof',
    phase: 'Marketing & launch',
    assigneeId: 'katie',
    status: 'in-review',
    priority: 'high',
    due: '2026-11-05',
    start: '2026-11-02',
    description:
      'The storefront sign and window vinyl, from the printer’s proof, for Nathan’s sign-off.',
    estimate: '2h',
    review: { personId: 'nathan', action: 'Approve the signage proof' },
    activity: [
      {
        id: 'e-31-2',
        actor: 'katie',
        text: 'Katie changed the status',
        at: day('2026-11-04'),
        change: { from: 'In progress', to: 'In review' },
      },
      { id: 'e-31-1', actor: 'katie', text: 'Katie created this task', at: day('2026-10-26') },
    ],
  },
  {
    id: 'aus-33',
    projectId: 'austin',
    number: 33,
    title: 'Local PR and press list',
    phase: 'Marketing & launch',
    assigneeId: 'katie',
    status: 'in-progress',
    priority: 'medium',
    due: '2026-12-18',
    start: '2026-11-16',
    description:
      'Austin food press, neighborhood newsletters and a few local creators for the opening week.',
    estimate: '8h',
    activity: [
      {
        id: 'e-33-2',
        actor: 'katie',
        text: 'Katie changed the status',
        at: day('2026-11-02'),
        change: { from: 'To do', to: 'In progress' },
      },
      { id: 'e-33-1', actor: 'katie', text: 'Katie created this task', at: day('2026-10-22') },
    ],
  },
  {
    id: 'aus-35',
    projectId: 'austin',
    number: 35,
    title: 'Grand opening campaign',
    phase: 'Marketing & launch',
    assigneeId: 'maya',
    status: 'todo',
    priority: 'high',
    due: '2027-01-12',
    start: '2026-12-14',
    description: 'Signage, social and the opening-day offer, in the Protein Plates look.',
    estimate: '20h',
    activity: [
      { id: 'e-35-1', actor: 'maya', text: 'Maya created this task', at: day('2026-10-22') },
    ],
  },
  ...myTasks(),
]

/**
 * Every task, with the comments the inbox quotes (`data/inbox.ts`) put at
 * the start of each thread: they were written before the ones already here.
 */
export const tasks: Task[] = planned.map((task) =>
  inboxComments[task.id]
    ? { ...task, comments: [...inboxComments[task.id], ...(task.comments ?? [])] }
    : task,
)

/**
 * The order cards sit in on the Board, top to bottom in each column, as
 * `Project - Board` (`40006268:8728`) draws them. The List keeps its own
 * order; this one is the Board's to change by dragging. Install hood and
 * ventilation is not on that frame, and goes under the permit, where
 * `Project - Board / Swimlanes and limits` (`40006292:23183`) puts it.
 */
export const boardOrder: string[] = [
  'aus-26',
  'aus-19',
  'aus-35',
  'aus-28',
  'aus-21',
  'aus-24',
  'aus-22',
  'aus-16',
  'aus-33',
  'aus-27',
  'aus-31',
  'aus-17',
  'aus-20',
  'aus-11',
]

/**
 * Home's "This week" (`40006266:3768`): Nathan's own work from yesterday to
 * next Tuesday, across projects. `label` is the chip's short name, as drawn;
 * `title` is the whole task, for its accessible name.
 */
export interface WeekItem {
  id: string
  label: string
  title: string
  projectId: string
  status: Task['status']
  date: string
}

export const myWeek: WeekItem[] = [
  {
    id: 'w1',
    label: 'Board review',
    title: 'Board review',
    projectId: 'austin',
    status: 'done',
    date: '2026-11-04',
  },
  {
    id: 'w2',
    label: 'Signage proof',
    title: 'Approve the Austin signage proof',
    projectId: 'austin',
    status: 'in-review',
    date: '2026-11-05',
  },
  {
    id: 'w3',
    label: 'Menu boards',
    title: 'Approve the Protein Plates menu boards',
    projectId: 'protein-plates',
    status: 'in-review',
    date: '2026-11-05',
  },
  {
    id: 'w4',
    label: 'Supplier list',
    title: 'Finalize Austin supplier list',
    projectId: 'austin',
    status: 'in-progress',
    date: '2026-11-05',
  },
  {
    id: 'w5',
    label: 'Weekly update',
    title: 'Post the Protein Plates weekly update',
    projectId: 'protein-plates',
    status: 'todo',
    date: '2026-11-06',
  },
  {
    id: 'w6',
    label: 'Hiring plan',
    title: 'Review the spring hiring plan',
    projectId: 'spring-hiring',
    status: 'todo',
    date: '2026-11-06',
  },
  {
    id: 'w7',
    label: 'Loyalty pricing',
    title: 'Loyalty pricing draft',
    projectId: 'loyalty',
    status: 'in-progress',
    date: '2026-11-06',
  },
  {
    id: 'w8',
    label: 'Store walkthrough',
    title: 'Austin store walkthrough',
    projectId: 'austin',
    status: 'todo',
    date: '2026-11-08',
  },
  {
    id: 'w9',
    label: 'Electrical check',
    title: 'Electrical check before the inspection',
    projectId: 'austin',
    status: 'in-progress',
    date: '2026-11-09',
  },
  {
    id: 'w10',
    label: 'Pricing sign-off',
    title: 'Loyalty pricing sign-off',
    projectId: 'loyalty',
    status: 'todo',
    date: '2026-11-09',
  },
]

/**
 * Nathan's own work, as `My work - List` (`40006266:4756`) and `My work -
 * Board` (`40006315:45894`) draw it, across five projects and the Ops team.
 * The numbers, titles, priorities and due dates are the frames'; the
 * estimates are written so This week's four make the frames' 14h. Austin's
 * four join Austin's plan in their phases. Signage proof, the fifth Austin
 * row, is Katie's task waiting on Nathan's review (`review`).
 */
function myTasks(): Task[] {
  const mine = { assigneeId: 'nathan' } as const
  return [
    {
      ...mine,
      id: 'aus-12',
      projectId: 'austin',
      number: 12,
      title: 'Confirm Austin opening date with landlord',
      short: 'Landlord date',
      phase: 'Permits & build-out',
      status: 'todo',
      priority: 'high',
      due: '2026-11-03',
      description:
        'The lease gives the landlord a say in the opening date. Confirm {2027-01-12} with them before the press list goes out.',
      estimate: '1h',
      activity: [
        { id: 'e-12-1', actor: 'dana', text: 'Dana created this task', at: day('2026-10-26') },
      ],
    },
    {
      ...mine,
      id: 'pro-18',
      projectId: 'protein-plates',
      number: 18,
      title: 'Sign off Protein Plates menu boards',
      short: 'Menu boards',
      phase: 'In-store',
      status: 'in-review',
      priority: 'medium',
      due: '2026-11-05',
      estimate: '1h',
    },
    {
      ...mine,
      id: 'aus-29',
      projectId: 'austin',
      number: 29,
      title: 'Answer Priya on the supplier list',
      short: 'Supplier list',
      phase: 'Supply & equipment',
      status: 'in-progress',
      priority: 'medium',
      due: '2026-11-05',
      description:
        'Priya asked which growers to keep on Finalize Austin supplier list before she prices the dry goods.',
      estimate: '1h',
      subtasks: [
        { id: 'aus-29-1', title: 'Read Priya’s shortlist', done: true },
        { id: 'aus-29-2', title: 'Check the growers’ delivery days', done: false },
        { id: 'aus-29-3', title: 'Reply in the thread', done: false },
      ],
      activity: [
        { id: 'e-29-1', actor: 'priya', text: 'Priya created this task', at: day('2026-11-04') },
      ],
    },
    {
      ...mine,
      id: 'pro-21',
      projectId: 'protein-plates',
      number: 21,
      title: 'Post weekly update',
      short: 'Weekly update',
      phase: 'Launch',
      status: 'todo',
      priority: 'medium',
      due: '2026-11-06',
      estimate: '2h',
    },
    {
      ...mine,
      id: 'hir-07',
      projectId: 'spring-hiring',
      number: 7,
      title: 'Review Q1 hiring plan',
      short: 'Hiring plan',
      phase: 'Role plan',
      status: 'todo',
      priority: 'low',
      due: '2026-11-06',
      estimate: '4h',
    },
    {
      ...mine,
      id: 'loy-14',
      projectId: 'loyalty',
      number: 14,
      title: 'Review loyalty pricing model',
      short: 'Loyalty pricing',
      phase: 'Pricing',
      status: 'in-progress',
      priority: 'high',
      due: '2026-11-06',
      estimate: '6h',
      subtasks: [
        { id: 'loy-14-1', title: 'Read Theo’s model', done: true },
        { id: 'loy-14-2', title: 'Check the tiers against last year', done: true },
        { id: 'loy-14-3', title: 'Price the free-bowl reward', done: false },
        { id: 'loy-14-4', title: 'Send notes to Theo', done: false },
      ],
    },
    {
      ...mine,
      id: 'aus-34',
      projectId: 'austin',
      number: 34,
      title: 'Book Austin press walkthrough',
      short: 'Press walkthrough',
      phase: 'Marketing & launch',
      status: 'todo',
      priority: 'low',
      due: '2026-11-08',
      estimate: '2h',
    },
    {
      ...mine,
      id: 'gft-09',
      projectId: 'gift-cards',
      number: 9,
      title: 'Approve gift card print run',
      short: 'Gift card print run',
      phase: 'Print',
      status: 'todo',
      priority: 'medium',
      due: '2026-11-13',
      estimate: '1h',
    },
    {
      ...mine,
      id: 'aus-36',
      projectId: 'austin',
      number: 36,
      title: 'Plan grand opening staffing',
      short: 'Opening staffing',
      phase: 'Hiring & training',
      status: 'todo',
      priority: 'medium',
      due: '2026-12-02',
      estimate: '4h',
    },
    {
      ...mine,
      id: 'ops-3',
      team: { name: 'Ops', key: 'OPS' },
      number: 3,
      title: 'Sign the Q4 ops budget',
      short: 'Ops budget',
      phase: 'Q4 planning',
      status: 'done',
      priority: 'low',
      due: '2026-11-04',
      completedAt: day('2026-11-04'),
    },
    {
      ...mine,
      id: 'hir-05',
      projectId: 'spring-hiring',
      number: 5,
      title: 'Review crew pay bands',
      short: 'Crew pay bands',
      phase: 'Role plan',
      status: 'done',
      priority: 'low',
      due: '2026-11-03',
      completedAt: day('2026-11-03'),
    },
  ]
}
