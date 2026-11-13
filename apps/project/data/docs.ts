/**
 * A project's docs and files, as `Docs - Project Docs tab` (`40006309:36927`)
 * lists them. `taskIds` are the tasks each is linked to, chosen from the real
 * tasks to make the file's counts (12, 3, 5, 1, 2); the two tasks whose panel
 * names a doc are both in the opening plan's. `updated` is written as drawn —
 * "Mon" and "Wed" hold because today is always a Thursday — with a dated one
 * as `{2026-10-21}` so it moves with the schedule.
 */
export interface ProjectDoc {
  id: string
  projectId: string
  name: string
  kind: 'doc' | 'file'
  ownerId: string
  updated: string
  taskIds: string[]
  /** The doc the tab pins over the list, with the line under its name. */
  pinned?: { kind: string }
}

export const docs: ProjectDoc[] = [
  {
    id: 'austin-plan',
    projectId: 'austin',
    name: 'Austin opening plan',
    kind: 'doc',
    ownerId: 'dana',
    updated: '2h ago',
    taskIds: [
      'aus-11',
      'aus-20',
      'aus-21',
      'aus-24',
      'aus-22',
      'aus-32',
      'aus-16',
      'aus-19',
      'aus-26',
      'aus-31',
      'aus-33',
      'aus-35',
    ],
    pinned: { kind: 'Project brief' },
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
]

export function docsFor(projectId: string): ProjectDoc[] {
  return docs.filter((doc) => doc.projectId === projectId)
}
