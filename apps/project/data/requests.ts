import type { TaskComment, TaskPriority } from './types'

/*
 * Requests: what other teams ask Veggie Vault's leads for, through a form,
 * and what Nathan asked of them. Drawn on ↪ Yet Project in Intake &
 * automation (`40006284:19160`) and its deep dive (`40006300:27547`), on the
 * file's Thursday. Dates are written in the file's calendar and moved onto
 * this week by `day()`, like everything else; a date inside prose is written
 * `{2026-12-01}` so `datedText` moves it too.
 */

/**
 * Where a request is in the queue. New ones wait on you; Waiting ones on the
 * person who asked, after you asked them something.
 */
export type RequestState = 'new' | 'waiting' | 'accepted' | 'declined'

export interface RequestAnswer {
  question: string
  answer: string
}

/** What the Accept dialog opens with: Yak's routing, which the Accept into column shows. */
export interface RequestRouting {
  taskName: string
  projectId: string
  assigneeId: string
  /** The file's calendar. */
  due: string
  priority: TaskPriority
  /** Yak's reply to the person who asked, as the dialog drafts it. */
  reply: string
}

export interface IntakeRequest {
  id: string
  title: string
  fromId: string
  /** The list's subtitle after the name: "Marketing request". */
  kind: string
  /** The form it came through, as the detail's first line names it. */
  form: string
  /** The day it came in, in the file's calendar, and its age when that was today ("2h"). */
  date: string
  age?: string
  /** Every answer, in the form's order. The first is always "What do you need?". */
  answers: RequestAnswer[]
  /** Yak's line over the answers. */
  yak?: string
  routing: RequestRouting
  state: RequestState
  /** Waiting: since when, the day Yak nudges them, and whether you already did today. */
  waiting?: { since: string; nudge: string; nudged?: boolean }
  /** Your questions and their answers, in order. */
  conversation: TaskComment[]
  /** A task already open that this repeats, by id: Possible duplicate. */
  duplicateOf?: string
  /** Accepted: the task it became (or was merged into), and when. */
  accepted?: { taskId: string; on: string; merged?: boolean }
  /** Declined: when, and why, as the decliner put it. */
  declined?: { on: string; note: string }
}

/**
 * The queue on the file's Thursday, as `Requests - Waiting on requester`
 * (`40006300:28384`) draws it: three new, two waiting on the person who
 * asked. `Requests - Queue` (`40006284:19161`) and `Possible duplicate`
 * (`40006300:29523`) list all five as New, because they were drawn before
 * the Waiting segment was (FINDINGS 88).
 *
 * The photo shoot, the menu boards' and the contractor quote's words are the
 * frames'. Laptops is drawn only as a row, so its answers are written here;
 * so are the two Accepted requests, which are the ones Austin's tasks already
 * name in their Linked section, and the Declined one.
 */
export const intakeRequests: IntakeRequest[] = [
  {
    id: 'photo-shoot',
    title: 'Photo shoot for the winter menu',
    fromId: 'priya',
    kind: 'Marketing request',
    form: 'Creative request form',
    date: '2026-11-05',
    age: '2h',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Hero and social photos for five winter bowls, plus a short recipe clip.',
      },
      { question: 'What kind of work is this?', answer: 'Photo or video' },
      { question: 'Where will it be used?', answer: 'In stores and on social' },
      { question: 'Do you need a location?', answer: 'Yes, a working kitchen' },
      { question: 'When do you need it?', answer: 'By {2026-12-01}, before the menu goes live.' },
      { question: 'Which team pays?', answer: 'Marketing' },
      {
        question: 'Anything else?',
        answer: 'The Austin kitchen won’t be ready in time, so we’ll need to shoot in Dallas.',
      },
    ],
    yak: 'This fits Winter menu R&D. Maya has room the week of {2026-11-16}, and last year’s shoot took two days.',
    routing: {
      taskName: 'Winter menu photo shoot in Dallas',
      projectId: 'winter-menu',
      assigneeId: 'maya',
      due: '2026-12-01',
      priority: 'medium',
      reply:
        'Accepted. Maya will run the shoot in Dallas the week of {2026-11-16}, so you’ll have photos well before {2026-12-01}.',
    },
    state: 'new',
    conversation: [],
  },
  {
    id: 'laptops',
    title: 'Laptops for the Austin GM team',
    fromId: 'sofia',
    kind: 'IT request',
    form: 'IT request form',
    date: '2026-11-04',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Two laptops for the Austin general manager and assistant manager.',
      },
      { question: 'Who are they for?', answer: 'The Austin GM and AGM, both starting next week' },
      { question: 'When do you need it?', answer: 'By {2026-12-04}, before crew training.' },
      {
        question: 'Anything else?',
        answer: 'They’ll need the scheduling and point-of-sale apps on day one.',
      },
    ],
    yak: 'This fits Austin store opening. Crew training starts {2026-12-07}, so {2026-12-04} leaves a weekend to set them up.',
    routing: {
      taskName: 'Set up laptops for the Austin managers',
      projectId: 'austin',
      assigneeId: 'theo',
      due: '2026-12-04',
      priority: 'medium',
      reply:
        'Accepted. Theo will have both laptops set up with scheduling and point of sale by {2026-12-04}.',
    },
    state: 'new',
    conversation: [],
  },
  {
    id: 'store-hours',
    title: 'Update hours on the store site',
    fromId: 'katie',
    kind: 'Web request',
    form: 'Web request form',
    date: '2026-11-04',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Holiday hours for all stores need to go live by {2026-11-20}.',
      },
      { question: 'Where?', answer: 'Every store page, and the app' },
      { question: 'When do you need it?', answer: 'By {2026-11-20}' },
    ],
    yak: 'This looks like a task Theo already has open. Merging keeps Katie’s details and tells both of them.',
    routing: {
      taskName: 'Update holiday hours on the store site',
      projectId: 'mobile-ordering',
      assigneeId: 'theo',
      due: '2026-11-20',
      priority: 'medium',
      reply: 'Accepted. Theo will have the holiday hours live on every store page by {2026-11-20}.',
    },
    state: 'new',
    duplicateOf: 'mob-08',
    conversation: [],
  },
  {
    id: 'menu-boards',
    title: 'Menu boards for Dallas',
    fromId: 'maya',
    kind: 'Print request',
    form: 'Print request form',
    date: '2026-11-04',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Six menu boards for the Dallas store, using the Protein Plates layout.',
      },
      { question: 'When do you need it?', answer: 'Before the Dallas soft open' },
    ],
    routing: {
      taskName: 'Print the Dallas menu boards',
      projectId: 'dallas',
      assigneeId: 'maya',
      due: '2026-12-18',
      priority: 'low',
      reply: 'Accepted. Maya will send the boards to print once the wall sizes are in.',
    },
    state: 'waiting',
    waiting: { since: '2026-11-04', nudge: 'Monday' },
    conversation: [
      {
        id: 'menu-boards-1',
        authorId: 'nathan',
        age: 'Yesterday',
        body: 'Do you have the final wall sizes? The printer needs them before they’ll quote.',
      },
    ],
  },
  {
    id: 'contractor-quote',
    title: 'Second contractor quote',
    fromId: 'marcus',
    kind: 'Ops request',
    form: 'Ops request form',
    date: '2026-11-02',
    answers: [
      {
        question: 'What do you need?',
        answer: 'A second quote for the Austin hood install, so we can compare before we sign.',
      },
      { question: 'When do you need it?', answer: 'This month' },
    ],
    routing: {
      taskName: 'Get a second quote for the hood install',
      projectId: 'austin',
      assigneeId: 'marcus',
      due: '2026-11-13',
      priority: 'high',
      reply: 'Accepted. Send me the second contractor’s details and I’ll get the drawings to them.',
    },
    state: 'waiting',
    waiting: { since: '2026-11-02', nudge: 'Friday' },
    conversation: [
      {
        id: 'contractor-quote-1',
        authorId: 'nathan',
        age: 'Mon',
        body: 'Which contractor do you want quoted? I can send them the drawings today.',
      },
    ],
  },
  {
    id: 'permit-check',
    title: 'Permit check for Austin',
    fromId: 'marcus',
    kind: 'Ops request',
    form: 'Ops request form',
    date: '2026-10-19',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Someone to own the health permit, start to finish, once the kitchen is in.',
      },
    ],
    routing: {
      taskName: 'Health permit approval',
      projectId: 'austin',
      assigneeId: 'dana',
      due: '2026-11-13',
      priority: 'high',
      reply: 'Accepted. Dana has it.',
    },
    state: 'accepted',
    accepted: { taskId: 'aus-24', on: '2026-10-20' },
    conversation: [],
  },
  {
    id: 'crew-hiring',
    title: 'Austin crew hiring',
    fromId: 'dana',
    kind: 'People request',
    form: 'People request form',
    date: '2026-10-16',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Fourteen hourly crew for the Austin opening rota.',
      },
    ],
    routing: {
      taskName: 'Hire 14 crew members',
      projectId: 'austin',
      assigneeId: 'sofia',
      due: '2026-11-20',
      priority: 'high',
      reply: 'Accepted. Sofia will run hiring.',
    },
    state: 'accepted',
    accepted: { taskId: 'aus-16', on: '2026-10-19' },
    conversation: [],
  },
  {
    id: 'aprons',
    title: 'Branded aprons for the Austin crew',
    fromId: 'sofia',
    kind: 'Print request',
    form: 'Print request form',
    date: '2026-10-28',
    answers: [
      {
        question: 'What do you need?',
        answer: 'Twenty aprons with the new logo, for the Austin crew.',
      },
    ],
    routing: {
      taskName: 'Order aprons for the Austin crew',
      projectId: 'austin',
      assigneeId: 'maya',
      due: '2026-12-01',
      priority: 'low',
      reply: '',
    },
    state: 'declined',
    declined: {
      on: '2026-10-30',
      note: 'Aprons are already in the opening kit, so there’s nothing to order.',
    },
    conversation: [],
  },
]

/** How a request you made is going, as My requests' Status badge names it. */
export type MyRequestStatus = 'waiting-on-you' | 'submitted' | 'accepted' | 'done' | 'declined'

export interface MyRequestStep {
  text: string
  /** The file's calendar, or "Now" for the step it is at. */
  date: string | 'now'
  /** A step still to come: drawn with an open circle. */
  current?: boolean
}

export interface MyRequest {
  id: string
  title: string
  status: MyRequestStatus
  ownerId: string
  /** When it last moved: the file's calendar, with an age when that was today ("1h ago"). */
  updated: string
  updatedAge?: string
  steps: MyRequestStep[]
  linkedTask?: { title: string; status: 'todo' | 'in-progress' | 'done' }
  /** The owner's latest words, under "Marcus’s last note". */
  note?: string
  /** A question waiting on your answer: Waiting on you. */
  question?: string
  /** The form it went through, for one you submit here. */
  form?: string
  answers?: RequestAnswer[]
  /** Your replies, newest last. */
  replies?: TaskComment[]
}

/**
 * Nathan's own requests, as `Requests - My requests` (`40006301:30717`) lists
 * them. Security cameras' panel is the frame's; the other three are drawn
 * only as rows, so their steps and notes are written to agree with them.
 */
export const myRequests: MyRequest[] = [
  {
    id: 'pos-quote',
    title: 'New POS quote for Dallas',
    status: 'waiting-on-you',
    ownerId: 'theo',
    updated: '2026-11-05',
    updatedAge: '1h ago',
    steps: [
      { text: 'Submitted', date: '2026-11-03' },
      { text: 'Theo asked you a question', date: '2026-11-05', current: true },
    ],
    question: 'Do you want the quote to cover the kitchen screens too, or just the front counters?',
  },
  {
    id: 'cameras',
    title: 'Security cameras for Austin',
    status: 'accepted',
    ownerId: 'marcus',
    updated: '2026-10-29',
    steps: [
      { text: 'Submitted', date: '2026-10-28' },
      { text: 'Accepted by Marcus Bell', date: '2026-10-29' },
      { text: 'Added to Austin store opening', date: '2026-10-29' },
      { text: 'In progress, due {2026-12-11}', date: 'now', current: true },
    ],
    linkedTask: { title: 'Install security cameras', status: 'in-progress' },
    note: 'Quote approved. Install is booked for the week of {2026-12-07}, once the ceiling is closed.',
  },
  {
    id: 'landlord-letter',
    title: 'Landlord letter template',
    status: 'done',
    ownerId: 'dana',
    updated: '2026-10-22',
    steps: [
      { text: 'Submitted', date: '2026-10-15' },
      { text: 'Accepted by Dana Okafor', date: '2026-10-16' },
      { text: 'Done', date: '2026-10-22' },
    ],
    linkedTask: { title: 'Draft a landlord letter template', status: 'done' },
    note: 'It’s in Docs as Landlord letter. Swap the store name and the dates and it’s ready to send.',
  },
  {
    id: 'staffing-budget',
    title: 'Holiday staffing budget',
    status: 'declined',
    ownerId: 'sofia',
    updated: '2026-10-19',
    steps: [
      { text: 'Submitted', date: '2026-10-14' },
      { text: 'Declined by Sofia Reyes', date: '2026-10-19' },
    ],
    note: 'Holiday staffing comes out of each store’s own budget this year, so there’s nothing to approve centrally.',
  },
]

/** A question's answer type, as its row's first token names it. */
export type QuestionType =
  'long-text' | 'short-text' | 'dropdown' | 'checkboxes' | 'yes-no' | 'date'

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short-text', label: 'Short text' },
  { value: 'long-text', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'yes-no', label: 'Yes or no' },
  { value: 'date', label: 'Date' },
]

/** The task field an answer fills when the request is accepted: its row's "→" token. */
export const SAVES_TO = ['Task name', 'Description', 'Due date', 'Assignee', 'Tag', 'Team'] as const
export type SavesTo = (typeof SAVES_TO)[number]

export interface FormQuestion {
  id: string
  label: string
  type: QuestionType
  savesTo?: SavesTo
  required: boolean
  /** A Dropdown's or Checkboxes' choices, in order. */
  options?: string[]
  /** Yes or no: what the switch says when it is on. */
  yesLabel?: string
  /** Asked only when another question has this answer: the builder's indented branch. */
  showIf?: { questionId: string; answer: string }
  /** An answer that sends the request to another queue: Logic's second row. */
  routes?: { answer: string; to: string }[]
  /** The answer's placeholder on the form. */
  placeholder?: string
}

export interface RequestForm {
  id: string
  name: string
  /** The submit page's title: "Creative request". */
  short: string
  team: string
  published: boolean
  /** Who reviews it, and how fast, as the submit page and What happens next say. */
  ownerId: string
  questions: FormQuestion[]
  /** When someone submits: `_Rule Step`s, as Form settings lists them. */
  onSubmit: { kind: 'queue' | 'assign' | 'yak' | 'email'; text: string }[]
  access: string
  responses: string
}

/**
 * The Creative request form, as `Requests - Form builder` (`40006284:20412`)
 * and its Question editor (`40006301:32493`) build it. Priya's photo shoot
 * request is this form filled in, and `Requests - Submit form`
 * (`40006301:29578`) is the same questions as the person asking sees them.
 */
export const creativeForm: RequestForm = {
  id: 'creative',
  name: 'Creative request form',
  short: 'Creative request',
  team: 'Creative',
  published: true,
  ownerId: 'katie',
  questions: [
    {
      id: 'need',
      label: 'What do you need?',
      type: 'long-text',
      savesTo: 'Task name',
      required: true,
    },
    {
      id: 'kind',
      label: 'What kind of work is this?',
      type: 'dropdown',
      savesTo: 'Tag',
      required: true,
      options: ['Photo or video', 'Copy', 'Design', 'Print'],
      routes: [{ answer: 'Print', to: 'Print' }],
    },
    {
      id: 'where',
      label: 'Where will it be used?',
      type: 'checkboxes',
      required: false,
      options: ['In stores', 'Social', 'Website', 'Email'],
      showIf: { questionId: 'kind', answer: 'Photo or video' },
    },
    {
      id: 'location',
      label: 'Do you need a location?',
      type: 'yes-no',
      required: false,
      yesLabel: 'Yes, a working kitchen',
      showIf: { questionId: 'kind', answer: 'Photo or video' },
    },
    {
      id: 'when',
      label: 'When do you need it?',
      type: 'date',
      savesTo: 'Due date',
      required: true,
    },
    {
      id: 'team',
      label: 'Which team pays?',
      type: 'dropdown',
      savesTo: 'Team',
      required: false,
      options: ['Marketing', 'Culinary', 'Operations', 'People'],
    },
    {
      id: 'else',
      label: 'Anything else?',
      type: 'long-text',
      savesTo: 'Description',
      required: false,
    },
  ],
  onSubmit: [
    { kind: 'queue', text: 'Add to Creative requests queue' },
    { kind: 'assign', text: 'Assign Katie Powell' },
    { kind: 'yak', text: 'Ask Yak to suggest a project' },
    { kind: 'email', text: 'Send a confirmation email' },
  ],
  access: 'Everyone at Veggie Vault',
  responses: 'Visible to the Creative team',
}
