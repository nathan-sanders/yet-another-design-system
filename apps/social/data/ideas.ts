import grainBowl from '../assets/photos/grain-bowl.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'
import type { Containers } from '../../../src/components/DragAndDrop'
import type { Campaign, Idea, IdeaGroup } from './types'

/**
 * Plan › Ideas (`40005911:32981`). The cards, columns and order are the
 * frame's; two bodies Figma truncates mid-word are finished here.
 */

/** An idea card's DOM id, so a screen can move focus onto a card it just added. */
export function ideaCardId(id: string): string {
  return `idea-card-${id}`
}

export const campaigns: Campaign[] = [
  { id: 'summer-menu', name: 'Summer Menu' },
  { id: 'seasonal-items', name: 'Seasonal Items' },
]

export function campaignFor(id: string | undefined): Campaign | undefined {
  return campaigns.find((c) => c.id === id)
}

export const initialIdeas: Record<string, Idea> = {
  'protein-plates-teaser': {
    id: 'protein-plates-teaser',
    title: 'IG Story: Protein Plates teaser 🥗',
    body: 'Close-up of the trio with steam rising, one ingredient revealed per frame.',
  },
  'place-to-plan': {
    id: 'place-to-plan',
    title: 'This is a place to plan ✍️ your content',
    body: 'Save ideas before turning them into posts. Brainstorm, plan ahead, and keep the team in sync on what is coming next.',
  },
  'save-inspiration': {
    id: 'save-inspiration',
    title: 'Save inspiration from anywhere 🤩',
    body: 'Use the browser extension to save ideas from the web. Highlight text or right-click an image to send it straight here.',
    image: saladBowls,
  },
  'back-in-stalk': {
    id: 'back-in-stalk',
    title: 'Threads: Back in stalk 🌽',
    body: 'Stop scrolling… our cult fave is back for summer. Announce it with a carousel of the grill.',
    image: streetCorn,
    campaignId: 'summer-menu',
  },
  'harvest-glow': {
    id: 'harvest-glow',
    title: 'Reel: Harvest Glow in 60 seconds',
    body: 'Build the bowl from bare plate to finished, top-down, with the recipe card at the end.',
    image: grainBowl,
    campaignId: 'seasonal-items',
  },
}

export const initialGroups: IdeaGroup[] = [
  { id: 'unassigned', name: 'Unassigned' },
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
]

/** Idea ids by group id, in board order. */
export const initialBoard: Containers<string> = {
  unassigned: ['protein-plates-teaser', 'place-to-plan', 'save-inspiration'],
  todo: ['back-in-stalk'],
  'in-progress': ['harvest-glow'],
  done: [],
}
