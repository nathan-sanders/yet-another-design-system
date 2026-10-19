import type { CalendarNote } from './types'

/**
 * The notes the calendar opens with. Placed like posts, around the Figma week
 * (`week: 0`, Monday `day: 1` is today), so there is always a run under way, one
 * starting and one crossing into next week, whatever day the mock is opened.
 */
export const seedNotes: CalendarNote[] = [
  {
    id: 'note-summer-menu',
    title: 'Summer Menu',
    description: 'Launch campaign',
    color: 'green',
    start: { week: -1, day: 3 },
    end: { week: 1, day: 2 },
  },
  {
    id: 'note-smoothie-week',
    title: 'Smoothie Week',
    description: 'Daily smoothie spotlights',
    color: 'cyan',
    start: { week: 0, day: 1 },
    end: { week: 0, day: 6 },
  },
  {
    id: 'note-farmers-market',
    title: 'Farmers market',
    description: 'Pop-up stall, 9 am – 1 pm',
    color: 'yellow',
    start: { week: 0, day: 3 },
    end: { week: 0, day: 3 },
  },
  {
    id: 'note-photo-shoot',
    title: 'Photo shoot',
    description: 'Fall menu stills',
    color: 'purple',
    start: { week: 0, day: 4 },
    end: { week: 0, day: 5 },
  },
  {
    id: 'note-seasonal-items',
    title: 'Seasonal Items',
    description: 'Pumpkin range on the counter',
    color: 'orange',
    start: { week: 0, day: 5 },
    end: { week: 1, day: 4 },
  },
  {
    id: 'note-review-freeze',
    title: 'Content freeze',
    description: 'Quarterly brand review',
    color: 'red',
    start: { week: 1, day: 3 },
    end: { week: 1, day: 3 },
  },
]
