/**
 * Docs and files. A project's Docs tab (`Docs - Project Docs tab`,
 * `40006309:36927`) lists its own, files too; the rail's Docs (`Docs - All
 * docs`, `40006283:18038`) lists every doc across projects, files left out.
 *
 * `taskIds` are the tasks each is linked to, chosen from the real tasks to
 * make the file's counts (12, 3, 5, 1, 2); the two tasks whose panel names a
 * doc are both in the opening plan's. A project with no tasks in the mock
 * writes its count as `linkedCount` instead (FINDINGS 97). `updated` is
 * written as drawn — "Mon" and "Wed" hold because today is always a Thursday
 * — with a dated one as `{2026-10-21}` so it moves with the schedule.
 *
 * Only the opening plan has text, as `Docs - Austin opening plan`
 * (`40006283:20532`) draws it, with the four versions `Docs - Version
 * history` (`40006310:40709`) lists.
 */
export interface ProjectDoc {
  id: string
  projectId: string
  name: string
  kind: 'doc' | 'file'
  ownerId: string
  updated: string
  taskIds: string[]
  /** The file's count, for a doc whose project has no tasks in the mock. */
  linkedCount?: number
  /** The doc the tab pins over the list, with the line under its name. */
  pinned?: { kind: string }
  /** Everyone who has edited it besides its owner; All docs' Mine is yours and these. */
  editorIds?: string[]
  /** Shared with you by name rather than through a project you are on: All docs' Shared. */
  sharedWith?: string[]
  /** Its text, a block at a time. A doc without any says so when opened. */
  blocks?: DocBlock[]
  /** Its saved versions, newest first; the first is what `blocks` starts as. */
  versions?: DocVersion[]
  /** Changed here since the mock opened, which puts a "Just now" at the top of its history. */
  edited?: boolean
}

/**
 * One block of a doc. Text is prose with its dates written `{2026-11-18}` for
 * `datedText`, until someone edits it here and it is saved as they read it.
 * `taskId` puts a task's Token at the end of the line, as the checklist does.
 */
export type DocBlock =
  | { id: string; kind: 'heading'; text: string }
  | { id: string; kind: 'paragraph'; text: string; taskId?: string }
  | { id: string; kind: 'item'; text: string; taskId?: string }
  /** The slash menu's Task list: the project's open tasks due in the next two weeks, kept live. */
  | { id: string; kind: 'tasks' }
  /** The slash menu's Project status: the project's latest health and update, kept live. */
  | { id: string; kind: 'status' }

export interface DocVersion {
  id: string
  /** As the list writes it: "Today, 11:02 am", "Yesterday, 4:30 pm", `{2026-10-30}`. */
  label: string
  /** As the compare bar writes it: "Comparing with yesterday". */
  name: string
  authorId: string
  /** "created" on the first. */
  note?: string
  blocks: DocBlock[]
}

/** A comment thread on part of a doc, as `Docs - Comments and Yak suggestion` (`40006309:40642`) draws one. */
export interface DocThread {
  id: string
  docId: string
  blockId: string
  /** The words it is about, quoted at the top. */
  quote: string
  comments: { id: string; authorId: string; age: string; body: string }[]
  resolved?: boolean
}

const why = 'Why Austin, why now'
const whyBody =
  'South Congress gives us a lunch crowd and weekend foot traffic, and it’s a three-hour drive from the Dallas team. We want to open before the January health resolutions run out.'

const oct26: DocBlock[] = [
  { id: 'why', kind: 'heading', text: why },
  { id: 'why-body', kind: 'paragraph', text: whyBody },
]

const oct30: DocBlock[] = [
  ...oct26,
  { id: 'checklist', kind: 'heading', text: 'Opening checklist' },
  { id: 'permits', kind: 'item', text: 'Permits clear by {2026-11-18}', taskId: 'aus-24' },
  { id: 'crew', kind: 'item', text: 'Twelve crew signed by {2026-11-20}', taskId: 'aus-16' },
  { id: 'kitchen', kind: 'item', text: 'Kitchen ready before training', taskId: 'aus-26' },
]

const partner =
  'We want a local partner for opening weekend, ideally a run club or a food bank drive, booked by {2026-12-10}.'

const yesterday: DocBlock[] = [
  ...oct30,
  { id: 'grand', kind: 'heading', text: 'Grand opening' },
  { id: 'partner', kind: 'paragraph', text: partner },
]

// Today's: Dana made it fourteen crew and added the soft open. Comparing with
// yesterday is those two changes, as the file counts them.
const current: DocBlock[] = [
  ...yesterday.map((block) =>
    block.id === 'crew' ? { ...block, text: 'Fourteen crew signed by {2026-11-20}' } : block,
  ),
  {
    id: 'soft-open',
    kind: 'paragraph',
    text: 'Soft open runs {2027-01-08} to {2027-01-10:d} for friends and family, with Katie handling invites.',
  },
]

export const docs: ProjectDoc[] = [
  {
    id: 'austin-plan',
    projectId: 'austin',
    name: 'Austin opening plan',
    kind: 'doc',
    ownerId: 'dana',
    updated: '2h ago',
    taskIds: [
      'aus-24',
      'aus-16',
      'aus-26',
      'aus-11',
      'aus-20',
      'aus-21',
      'aus-22',
      'aus-32',
      'aus-19',
      'aus-31',
      'aus-33',
      'aus-35',
    ],
    pinned: { kind: 'Project brief' },
    editorIds: ['katie'],
    blocks: current,
    versions: [
      { id: 'today', label: 'Today, 11:02 am', name: 'today', authorId: 'dana', blocks: current },
      {
        id: 'yesterday',
        label: 'Yesterday, 4:30 pm',
        name: 'yesterday',
        authorId: 'katie',
        blocks: yesterday,
      },
      {
        id: 'oct-30',
        label: '{2026-10-30}',
        name: '{2026-10-30}',
        authorId: 'dana',
        blocks: oct30,
      },
      {
        id: 'oct-26',
        label: '{2026-10-26}',
        name: '{2026-10-26}',
        authorId: 'dana',
        note: 'created',
        blocks: oct26,
      },
    ],
  },
  {
    id: 'austin-vendors',
    projectId: 'austin',
    name: 'Austin vendor contacts',
    kind: 'doc',
    ownerId: 'priya',
    updated: 'Yesterday',
    taskIds: ['aus-27', 'aus-26', 'aus-28'],
  },
  {
    id: 'crew-training',
    projectId: 'austin',
    name: 'Crew training guide',
    kind: 'doc',
    ownerId: 'sofia',
    updated: 'Mon',
    taskIds: ['aus-16', 'aus-17', 'aus-19', 'aus-22', 'aus-28'],
    editorIds: ['nathan'],
  },
  {
    id: 'signage-pdf',
    projectId: 'austin',
    name: 'Austin-signage-v3.pdf',
    kind: 'file',
    ownerId: 'katie',
    updated: 'Wed',
    taskIds: ['aus-31'],
  },
  {
    id: 'floor-plan',
    projectId: 'austin',
    name: 'Austin-floor-plan.pdf',
    kind: 'file',
    ownerId: 'marcus',
    updated: '{2026-10-21}',
    taskIds: ['aus-20', 'aus-22'],
  },
  {
    id: 'protein-brief',
    projectId: 'protein-plates',
    name: 'Protein Plates launch brief',
    kind: 'doc',
    ownerId: 'katie',
    updated: '{2026-10-30}',
    taskIds: [],
    linkedCount: 8,
    editorIds: ['nathan'],
  },
  {
    id: 'mobile-prd',
    projectId: 'mobile-ordering',
    name: 'Mobile ordering PRD',
    kind: 'doc',
    ownerId: 'theo',
    updated: '{2026-10-28}',
    taskIds: [],
    linkedCount: 21,
    sharedWith: ['nathan'],
  },
  {
    id: 'gift-card-copy',
    projectId: 'gift-cards',
    name: 'Holiday gift card copy deck',
    kind: 'doc',
    ownerId: 'maya',
    updated: '{2026-10-27}',
    taskIds: [],
    linkedCount: 4,
    sharedWith: ['nathan'],
  },
  {
    id: 'winter-tasting',
    projectId: 'winter-menu',
    name: 'Winter tasting notes',
    kind: 'doc',
    ownerId: 'priya',
    updated: '{2026-10-26}',
    taskIds: [],
    linkedCount: 6,
    sharedWith: ['nathan'],
  },
  {
    id: 'loyalty-pricing',
    projectId: 'loyalty',
    name: 'Loyalty pricing model',
    kind: 'doc',
    ownerId: 'theo',
    updated: '{2026-10-22}',
    taskIds: [],
    linkedCount: 2,
    editorIds: ['nathan'],
  },
]

/** The thread on the plan's partner paragraph: Katie asks, Dana agrees. */
export const docThreads: DocThread[] = [
  {
    id: 'partner-pick',
    docId: 'austin-plan',
    blockId: 'partner',
    quote: 'a run club or a food bank drive',
    comments: [
      {
        id: 'partner-pick-1',
        authorId: 'katie',
        age: '3h',
        body: 'A food bank drive photographs better. Can we pick one?',
      },
      { id: 'partner-pick-2', authorId: 'dana', age: '2h', body: 'Agreed, let’s go with that.' },
    ],
  },
]

/**
 * What Yak offers for a paragraph when asked, by doc and block. The one the
 * file draws rewrites the partner line to the choice the thread settled on.
 */
export const yakRewrites: Record<string, Record<string, string>> = {
  'austin-plan': {
    partner:
      'We want one local partner for opening weekend, a neighborhood food bank drive, booked by {2026-12-10}.',
  },
}

/**
 * The to-dos Yak finds in a doc (`Docs - Yak finds to-dos`, `40006310:39655`),
 * each from the block it was read out of. The soft open's two dates sit
 * before Jan 8: invites three weeks out, the list four days out.
 */
export const yakTodos: Record<
  string,
  { title: string; assigneeId: string; due: string; blockId: string }[]
> = {
  'austin-plan': [
    { title: 'Book a local partner', assigneeId: 'katie', due: '2026-12-10', blockId: 'partner' },
    {
      title: 'Send soft open invites',
      assigneeId: 'katie',
      due: '2026-12-18',
      blockId: 'soft-open',
    },
    {
      title: 'Confirm the guest list',
      assigneeId: 'katie',
      due: '2027-01-04',
      blockId: 'soft-open',
    },
  ],
}

export function docsFor(docs: ProjectDoc[], projectId: string): ProjectDoc[] {
  return docs.filter((doc) => doc.projectId === projectId)
}
