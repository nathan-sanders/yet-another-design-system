import grainBowl from '../assets/photos/grain-bowl.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'
import type { Containers } from '../../../src/components/DragAndDrop'
import type { Idea, IdeaGroup, PostComment } from './types'

/**
 * Plan › Ideas (`40005911:32981`). The cards, columns and order are the
 * frame's; two bodies Figma truncates mid-word are finished here.
 */

/** An idea card's DOM id, so a screen can move focus onto a card it just added. */
export function ideaCardId(id: string): string {
  return `idea-card-${id}`
}

export const initialIdeas: Record<string, Idea> = {
  'protein-plates-teaser': {
    id: 'protein-plates-teaser',
    title: 'IG Story: Protein Plates teaser 🥗',
    body: 'Close-up of the trio with steam rising, one ingredient revealed per frame.',
    createdBy: 'katie',
    created: 'Jun 28',
  },
  'place-to-plan': {
    id: 'place-to-plan',
    title: 'This is a place to plan ✍️ your content',
    body: 'Save ideas before turning them into posts. Brainstorm, plan ahead, and keep the team in sync on what is coming next.',
    createdBy: 'nathan',
    created: 'Jun 12',
  },
  'save-inspiration': {
    id: 'save-inspiration',
    title: 'Save inspiration from anywhere 🤩',
    body: 'Use the browser extension to save ideas from the web. Highlight text or right-click an image to send it straight here.',
    image: saladBowls,
    createdBy: 'nathan',
    created: 'Jun 12',
  },
  'back-in-stalk': {
    id: 'back-in-stalk',
    title: 'Threads: Back in stalk 🌽',
    body: 'Stop scrolling… our cult fave is back for summer. Announce it with a carousel of the grill.',
    image: streetCorn,
    campaignId: 'summer-menu',
    tagNames: ['Launch', 'Menu'],
    assigneeId: 'katie',
    createdBy: 'nathan',
    created: 'Jul 2',
  },
  // Summer Menu's two, pencilled onto its plan (`40006158:66912`).
  'bowl-off': {
    id: 'bowl-off',
    title: 'Bowl-off with a regular',
    body: 'A regular picks two bowls blind and we film the verdict. One take, no script.',
    campaignId: 'summer-menu',
    slot: { network: 'instagram', week: 0, day: 5 },
    createdBy: 'nathan',
    created: 'Oct 20',
  },
  'customer-photos': {
    id: 'customer-photos',
    title: 'Customer photo round-up',
    body: 'Five customer shots of the new bowls, each with a thank-you. Ask in DMs before reposting.',
    campaignId: 'summer-menu',
    slot: { network: 'facebook', week: 0, day: 4 },
    createdBy: 'katie',
    created: 'Oct 22',
  },
  'harvest-glow': {
    id: 'harvest-glow',
    title: 'Reel: Harvest Glow in 60 seconds',
    body: 'Build the bowl from bare plate to finished, top-down, with the recipe card at the end.',
    image: grainBowl,
    campaignId: 'seasonal-items',
    tagNames: ['Recipe'],
    createdBy: 'dana',
    created: 'Jun 30',
  },
  'soup-season': {
    id: 'soup-season',
    title: 'Soup season is back',
    body: 'The roasted carrot and ginger returns. One steaming bowl, one line, the first cold morning.',
    campaignId: 'seasonal-items',
    createdBy: 'katie',
    created: 'Sep 18',
  },
}

export const initialGroups: IdeaGroup[] = [
  { id: 'unassigned', name: 'Unassigned' },
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
]

/**
 * Idea ids by group id, in board order. The ideas that have gone on to a post
 * (`back-in-stalk`, `harvest-glow`, `soup-season`) are not here: a draft or a
 * post in `data/drafts.ts` / `data/posts.ts` carries their `ideaId`, and they
 * live in Drafts and on the calendar from there.
 */
export const initialBoard: Containers<string> = {
  unassigned: ['place-to-plan', 'save-inspiration', 'bowl-off', 'customer-photos'],
  todo: ['protein-plates-teaser'],
  'in-progress': [],
  done: [],
}

/** The team's notes on an idea, as the idea page's Notes tab opens on them. */
export const initialIdeaNotes: Record<string, PostComment[]> = {
  'back-in-stalk': [
    {
      id: 'in-1',
      authorId: 'nathan',
      body: 'Grill shots are in the asset library from last summer. Reuse the char close-up?',
      ago: '16d',
    },
  ],
  'harvest-glow': [
    {
      id: 'in-2',
      authorId: 'dana',
      body: 'I can shoot the build on Thursday if the light holds.',
      ago: '3d',
    },
  ],
}
