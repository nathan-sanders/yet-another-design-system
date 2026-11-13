/**
 * A project's automation rules (`Project - Rules`, `40006284:21772`). The
 * file draws the first rule's panel; the others' steps and runs are written
 * in the same shape so every row opens to something. A step's `kind` is its
 * eyebrow and its glyph. Dates in runs are `{2026-10-29}`, moved with the
 * schedule; each run's face is the task's assignee, as drawn.
 */
export type RuleStepKind = 'when' | 'if' | 'then' | 'and'

export interface Rule {
  id: string
  projectId: string
  /** The sentence the list reads. */
  name: string
  /** The panel's title. */
  title: string
  /** The panel's sentence under it. */
  summary: string
  steps: { kind: RuleStepKind; text: string }[]
  runsThisWeek: number
  enabled: boolean
  runs: { actorId: string; text: string; age: string }[]
}

/** What Yak would add, and why it thinks so; Add makes it a rule. */
export interface RuleSuggestion {
  rule: Rule
  reason: string
}

export const rules: Rule[] = [
  {
    id: 'blocked',
    projectId: 'austin',
    name: 'When a task is blocked, tell the project owner',
    title: 'When a task is blocked',
    summary:
      'When a task in Permits & build-out is set to Blocked, tell Dana Okafor and flag the project at risk.',
    steps: [
      { kind: 'when', text: 'Status changes to Blocked' },
      { kind: 'if', text: 'Phase is Permits & build-out' },
      { kind: 'then', text: 'Message Dana Okafor' },
      { kind: 'and', text: 'Set project health to At risk' },
    ],
    runsThisWeek: 3,
    enabled: true,
    runs: [
      { actorId: 'dana', text: 'Health permit approval was blocked, Dana was told', age: '1d' },
      {
        actorId: 'marcus',
        text: 'Install hood and ventilation was blocked, Dana was told',
        age: '{2026-10-29}',
      },
    ],
  },
  {
    id: 'overdue',
    projectId: 'austin',
    name: 'When a task is overdue, nudge the assignee',
    title: 'When a task is overdue',
    summary: 'The morning after a task’s due date passes, message whoever it’s assigned to.',
    steps: [
      { kind: 'when', text: 'A due date passes' },
      { kind: 'if', text: 'Status is not Done' },
      { kind: 'then', text: 'Message the assignee' },
    ],
    runsThisWeek: 7,
    enabled: true,
    runs: [
      {
        actorId: 'priya',
        text: 'Finalize Austin supplier list was overdue, Priya was nudged',
        age: '2d',
      },
      {
        actorId: 'marcus',
        text: 'Final electrical inspection was overdue, Marcus was nudged',
        age: '3d',
      },
    ],
  },
  {
    id: 'unblock',
    projectId: 'austin',
    name: 'When status changes to Done, unblock the next task',
    title: 'When a task is done',
    summary:
      'When a task is set to Done, move every task waiting only on it from Blocked to To do.',
    steps: [
      { kind: 'when', text: 'Status changes to Done' },
      { kind: 'then', text: 'Set waiting tasks to To do' },
      { kind: 'and', text: 'Message their assignees' },
    ],
    runsThisWeek: 12,
    enabled: true,
    runs: [
      {
        actorId: 'sofia',
        text: 'Hire general manager was done, Crew training week was unblocked',
        age: '{2026-10-30}',
      },
    ],
  },
  {
    id: 'requests',
    projectId: 'austin',
    name: 'When a new request lands, ask Yak to sort it',
    title: 'When a request lands',
    summary:
      'When someone submits a request for this project, Yak files it under a phase and suggests an owner.',
    steps: [
      { kind: 'when', text: 'A request is submitted' },
      { kind: 'then', text: 'Yak sorts it into a phase' },
      { kind: 'and', text: 'Yak suggests an owner' },
    ],
    runsThisWeek: 5,
    enabled: true,
    runs: [
      {
        actorId: 'dana',
        text: 'Permit check for Austin was sorted into Permits & build-out',
        age: '4d',
      },
    ],
  },
]

export const suggestions: RuleSuggestion[] = [
  {
    reason: 'You’ve done this by hand twice',
    rule: {
      id: 'permit-equipment',
      projectId: 'austin',
      name: 'When the permit clears, start Equipment delivery',
      title: 'When the permit clears',
      summary:
        'When Health permit approval is set to Done, set Equipment delivery to In progress and tell Marcus Bell.',
      steps: [
        { kind: 'when', text: 'Health permit approval is Done' },
        { kind: 'then', text: 'Set Equipment delivery to In progress' },
        { kind: 'and', text: 'Message Marcus Bell' },
      ],
      runsThisWeek: 0,
      enabled: true,
      runs: [],
    },
  },
  {
    reason: 'Updates slipped twice this month',
    rule: {
      id: 'monday-update',
      projectId: 'austin',
      name: 'Every Monday, remind Dana to post an update',
      title: 'Every Monday',
      summary: 'Every Monday at 9 AM, remind Dana Okafor to post the project’s weekly update.',
      steps: [
        { kind: 'when', text: 'Monday at 9 AM' },
        { kind: 'then', text: 'Remind Dana Okafor to post an update' },
      ],
      runsThisWeek: 0,
      enabled: true,
      runs: [],
    },
  },
]
