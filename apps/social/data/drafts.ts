import saladBowls from '../assets/photos/salad-bowls.jpg'
import celerySalad from '../assets/photos/celery-salad.jpg'
import grainBowl from '../assets/photos/grain-bowl.jpg'
import greenSmoothies from '../assets/photos/green-smoothies.jpg'
import mealPrepBowls from '../assets/photos/meal-prep-bowls.jpg'
import wraps from '../assets/photos/wraps.jpg'
import type { CalendarDay, PostFormat } from './types'

/**
 * A post saved as a draft: written, not scheduled, so it has no day or time and
 * stays off the calendar until someone schedules it, by dragging it onto the
 * calendar or with its Schedule… action. Then it leaves the list and becomes a
 * post (`ScheduleProvider`). Code-first — Figma draws the Drafts button but no
 * panel behind it.
 */
export interface Draft {
  id: string
  profileId: string
  body: string
  photo?: string
  photoAlt?: string
  /** Who last saved it. */
  authorId: string
  /** When it was last saved, as the list prints it. */
  edited: string
  /** The idea it was made from, when it was. */
  ideaId?: string
  campaignId?: string
  /**
   * Pencilled in on its campaign's plan (`40006158:66912`): the day it's meant
   * for. Still a draft, still off the calendar, until someone schedules it.
   */
  day?: CalendarDay
  tagNames?: string[]
  assigneeId?: string
  needsApproval?: boolean
  format?: PostFormat
  firstComment?: string
}

/** Most recently saved first, the order the panel lists them in. */
export const drafts: Draft[] = [
  {
    id: 'd-7',
    profileId: 'vv-tiktok',
    body: 'Mango bowl build-along',
    photo: saladBowls,
    photoAlt: 'Three salad bowls on a table',
    authorId: 'katie',
    edited: '3 hours ago',
    campaignId: 'summer-menu',
    // Tomorrow, the day before TikTok's gap (`40006158:66912`'s Wednesday).
    day: { week: 0, day: 2 },
    tagNames: ['Recipe', 'Menu'],
    format: 'reel',
  },
  {
    id: 'd-6',
    profileId: 'vv-instagram',
    body: 'Harvest Glow in 60 seconds: bare plate to finished bowl, top-down, recipe card at the end.',
    photo: grainBowl,
    photoAlt: 'A grain bowl with roasted vegetables',
    authorId: 'nathan',
    edited: '1 hour ago',
    ideaId: 'harvest-glow',
    campaignId: 'seasonal-items',
    tagNames: ['Recipe'],
    format: 'reel',
  },
  {
    id: 'd-1',
    profileId: 'vv-instagram',
    body: 'Meal prep Sunday, done for you. Five bowls, one pickup, zero dishes.',
    photo: mealPrepBowls,
    photoAlt: 'Meal prep bowls lined up on a counter',
    authorId: 'nathan',
    edited: '20 minutes ago',
  },
  {
    id: 'd-2',
    profileId: 'vv-x',
    body: 'Hot take: celery is the most underrated thing on our menu. Fight us.',
    photo: celerySalad,
    photoAlt: 'A celery salad in a white bowl',
    authorId: 'katie',
    edited: '2 hours ago',
  },
  {
    id: 'd-3',
    profileId: 'fg-threads',
    body: 'What should our next smoothie be called? Best name gets one free for a month.',
    photo: greenSmoothies,
    photoAlt: 'Two green smoothies with straws',
    authorId: 'nathan',
    edited: 'Yesterday',
  },
  {
    id: 'd-4',
    profileId: 'vv-facebook',
    body: 'Catering is open for summer parties. Wraps, bowls and big salads for ten or a hundred.',
    photo: wraps,
    photoAlt: 'Wraps cut in half on a board',
    authorId: 'dana',
    edited: '3 days ago',
  },
  {
    id: 'd-5',
    profileId: 'vv-threads',
    body: 'Thinking about a late-night menu on Fridays. Would you come?',
    authorId: 'katie',
    edited: 'Last week',
  },
]
