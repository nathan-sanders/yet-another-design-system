import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Inbox,
  Lightbulb,
  Megaphone,
  Presentation,
  SquarePen,
  type LucideIcon,
} from 'lucide-react'

/** `_Yak Action Content` (`40005851:17813`): the start screen's four cards. */
export const startActions: {
  title: string
  description: string
  icon: LucideIcon
  prompt: string
}[] = [
  {
    title: 'Create a campaign',
    description: 'Brief, posts and schedule',
    icon: Megaphone,
    prompt: 'Help me plan a campaign for Protein Plates.',
  },
  {
    title: 'Draft a post',
    description: 'Write for any network',
    icon: SquarePen,
    prompt: 'Draft a post for Saturday.',
  },
  {
    title: 'Clear the inbox',
    description: 'Reply to what needs you',
    icon: Inbox,
    prompt: 'What in the inbox needs me?',
  },
  {
    title: 'Build a report',
    description: 'Pull metrics into a summary',
    icon: Presentation,
    prompt: 'Summarize last week’s performance.',
  },
]

/** `_Yak History Row` (`40005858:18634`), grouped as the history panel draws them. */
export const history: {
  group: string
  rows: { title: string; area: string; icon: LucideIcon; when: string; status?: string }[]
}[] = [
  {
    group: 'Today',
    rows: [
      {
        title: 'Fill Saturday with evergreen posts',
        area: 'Calendar',
        icon: CalendarDays,
        when: '9:42 am',
      },
      {
        title: 'Protein Plates launch campaign',
        area: 'Campaigns',
        icon: Megaphone,
        when: '8:15 am',
        status: 'Drafting',
      },
    ],
  },
  {
    group: 'Yesterday',
    rows: [
      {
        title: 'Summarize June performance',
        area: 'Measure',
        icon: ChartNoAxesColumnIncreasing,
        when: '4:30 pm',
      },
      { title: 'Reply tone for negative reviews', area: 'Inbox', icon: Inbox, when: '11:02 am' },
    ],
  },
  {
    group: 'Previous 7 days',
    rows: [
      { title: 'Summer menu caption ideas', area: 'Ideas', icon: Lightbulb, when: 'Jul 3' },
      {
        title: 'Best time to post on Threads',
        area: 'Measure',
        icon: ChartNoAxesColumnIncreasing,
        when: 'Jul 2',
      },
      {
        title: 'Recap of Green Bowl Co. posts',
        area: 'Measure',
        icon: ChartNoAxesColumnIncreasing,
        when: 'Jul 1',
      },
      { title: 'Plan the week of Jun 29', area: 'Calendar', icon: CalendarDays, when: 'Jun 30' },
    ],
  },
]
