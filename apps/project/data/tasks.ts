import type { Task } from './types'

/**
 * Austin store opening's tasks, as `Project - List` (`40006268:6554`) draws
 * them, in its four phases and its order. The numbers are the placeholders
 * the file assigned (AUS-24 Health permit approval, AUS-19 Crew training
 * week); the dates hold the page's schedule math: the permit on Nov 18, the
 * 5-day lag, equipment by Dec 1, six buffer days before crew training.
 *
 * Only Austin has tasks in this slice; the other projects' lists come later.
 */
export const tasks: Task[] = [
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
    subtasks: { done: 2, total: 3 },
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
    subtasks: { done: 9, total: 14 },
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
    subtasks: { done: 1, total: 3 },
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
  },
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
