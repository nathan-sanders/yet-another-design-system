import { addDays, formatTime } from '../data/dates'
import type { Idea, Network, Post } from '../data/types'
import { postsOn, today } from '../screens/calendar/model'
import { allInsights } from './insights'

// What Yak says back, scripted per page and prompt. A turn resolves its reply
// the moment it is asked (`chat.ts`), so the log never changes its mind, and
// `Conversation` only draws what it is handed.

/** One paragraph of a reply: prose, or a caption Yak proposes, drawn as a card. */
export type ReplyBubble =
  | { kind: 'text'; text: string }
  | {
      kind: 'caption'
      network: Network
      text: string
      /** A tighter cut, for "Shorten more". */
      shorter?: string
    }

export interface ScriptedReply {
  /** The thought row's label once Yak is done. */
  summary: string
  /** The two steps every turn shows. */
  steps: [done: string, last: string]
  /** More tool calls after them: what this reply in particular did. */
  tools?: { label: string; detail?: string }[]
  bubbles: ReplyBubble[]
  /** "Next, I can…": chips that ask the next thing. */
  followUps?: string[]
}

/** What Yak can read when it answers: the schedule, and what is open beside it. */
export interface ReplyContext {
  posts: Post[]
  /** The composer's shared caption, when the composer is open. */
  caption?: string
  /** The idea whose page is open, when one is. */
  idea?: Idea
}

const THREADS_LIMIT = 500

const norm = (prompt: string) => prompt.trim().toLowerCase().replace(/[.!?…]+$/, '')

/**
 * The Threads version of a caption: hashtags off, the run of emoji trimmed,
 * and cut at a sentence so it reads whole. Falls back to the house line when
 * the composer is still empty.
 */
export function threadsVersion(caption: string | undefined): { text: string; shorter: string } {
  const clean = (caption ?? '')
    .replace(/#[\w]+/g, '')
    .replace(/(\p{Extended_Pictographic}\s*){2,}/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) {
    return {
      text: 'Back in stalk 🌽 The grilled corn trio is back on the menu through August. Come get it before it’s gone.',
      shorter: 'Back in stalk 🌽 The grilled corn trio is back through August.',
    }
  }
  const sentences = clean.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()) ?? [clean]
  let text = ''
  for (const sentence of sentences) {
    if ((text + ' ' + sentence).trim().length > 200) break
    text = (text + ' ' + sentence).trim()
  }
  if (!text) text = clean.slice(0, 197).trimEnd() + '…'
  const shorter = sentences[0] && sentences[0].length < text.length ? sentences[0] : text.slice(0, Math.ceil(text.length / 2)).replace(/\s+\S*$/, '') + '…'
  return { text, shorter }
}

const nextSaturday = (): Date => {
  const day = today.getDay()
  return addDays(today, day === 6 ? 7 : 6 - day)
}

const fullWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' })

type Script = {
  page: string
  match: string[]
  reply: (ctx: ReplyContext) => ScriptedReply
}

const COMPOSE_FOLLOW_UPS = [
  'Add alt text to both photos',
  'Suggest hashtags for reach',
  'Write the first comment',
  'Check Saturday for conflicts',
  'Preview on Threads',
]

const composeSteps: [string, string] = ['Read the caption and media', 'Checked the channels it goes to']

const SCRIPTS: Script[] = [
  {
    page: '/plan/compose',
    match: ['write the threads version', 'threads version'],
    reply: (ctx) => {
      const { text, shorter } = threadsVersion(ctx.caption)
      return {
        summary: 'Rewrote the caption for Threads',
        steps: ['Read the Instagram caption', 'Trimmed it to how Threads reads'],
        tools: [{ label: `Checked the Threads limit · ${text.length} / ${THREADS_LIMIT}` }],
        bubbles: [
          {
            kind: 'text',
            text: 'Here’s the Threads version. Threads doesn’t show a carousel the same way, so the swipe cue is gone and the hashtags with it:',
          },
          { kind: 'caption', network: 'threads', text, shorter },
          { kind: 'text', text: 'Instagram keeps the original. Apply it and the Threads tab takes this one.' },
        ],
        followUps: COMPOSE_FOLLOW_UPS,
      }
    },
  },
  {
    page: '/plan/compose',
    match: ['add alt text to both photos', 'add alt text'],
    reply: () => ({
      summary: 'Described the photos',
      steps: composeSteps,
      tools: [{ label: 'Looked at 2 photos' }],
      bubbles: [
        {
          kind: 'text',
          text: 'Alt text added: “Grilled street corn with lime on a plate” and “Four salad bowls on a table, from above.” Edit either from the photo’s Alt text button.',
        },
      ],
      followUps: COMPOSE_FOLLOW_UPS.filter((f) => !f.startsWith('Add alt')),
    }),
  },
  {
    page: '/plan/compose',
    match: ['suggest hashtags for reach', 'suggest hashtags'],
    reply: () => ({
      summary: 'Picked hashtags from what is reaching',
      steps: composeSteps,
      tools: [{ label: 'Checked Discover · corn and grill mentions, last 7 days' }],
      bubbles: [
        {
          kind: 'text',
          text: 'Five that are moving this week and fit the post: #streetcorn #grillseason #summermenu #veggievault #eatlocal. Instagram only — Threads reach doesn’t come from hashtags.',
        },
      ],
      followUps: COMPOSE_FOLLOW_UPS.filter((f) => !f.startsWith('Suggest hashtags')),
    }),
  },
  {
    page: '/plan/compose',
    match: ['write the first comment', 'first comment'],
    reply: () => ({
      summary: 'Drafted the first comment',
      steps: composeSteps,
      bubbles: [
        {
          kind: 'text',
          text: 'First comment: “Which one are you claiming first? 🌽” — a question gets the thread going, and it keeps the caption clean. It’s in the Instagram options.',
        },
      ],
      followUps: COMPOSE_FOLLOW_UPS.filter((f) => !f.startsWith('Write the first')),
    }),
  },
  {
    page: '/plan/compose',
    match: ['check saturday for conflicts', 'check for conflicts'],
    reply: (ctx) => {
      const saturday = nextSaturday()
      const on = postsOn(ctx.posts, saturday)
      const at = on.map((p) => formatTime(p.time).replace(':00', '')).join(', ')
      return {
        summary: `Checked ${fullWeekday.format(saturday)}`,
        steps: [`Read the calendar · ${fullWeekday.format(saturday)}`, 'Checked the slots around 11 am'],
        bubbles: [
          {
            kind: 'text',
            text:
              on.length === 0
                ? 'Saturday is clear — nothing else is scheduled, so 11 am has the morning to itself.'
                : `Saturday has ${on.length} ${on.length === 1 ? 'post' : 'posts'} already (${at}). Nothing at 11 am, so this one has its slot to itself.`,
          },
        ],
        followUps: COMPOSE_FOLLOW_UPS.filter((f) => !f.startsWith('Check Saturday')),
      }
    },
  },
  {
    page: '/plan/compose',
    match: ['preview on threads'],
    reply: () => ({
      summary: 'Switched the preview',
      steps: composeSteps,
      bubbles: [{ kind: 'text', text: 'The preview is on Threads now. Switch it back with the Instagram / Threads control above it.' }],
      followUps: COMPOSE_FOLLOW_UPS.filter((f) => !f.startsWith('Preview')),
    }),
  },
  {
    page: '/plan/compose',
    match: ['suggest a time'],
    reply: () => ({
      summary: 'Checked reach by hour',
      steps: composeSteps,
      bubbles: [
        {
          kind: 'text',
          text: 'Saturday 11 am. Your Instagram reach peaks late morning on weekends, and nothing else is scheduled then. Pick it from the date button.',
        },
      ],
      followUps: COMPOSE_FOLLOW_UPS,
    }),
  },
  {
    page: '/plan/ideas/',
    match: ['draft a caption', 'draft it as a carousel', 'draft it'],
    reply: (ctx) => {
      const idea = ctx.idea
      const title = idea?.title.replace(/^[^:]{1,24}:\s*/, '') ?? 'this idea'
      const text = idea
        ? `${title} — ${idea.body.split(/(?<=[.!?])\s/)[0] ?? ''}`.trim()
        : 'Here’s a first line to work from.'
      return {
        summary: 'Drafted from the idea',
        steps: ['Read the idea', 'Checked the campaign it belongs to'],
        tools: [{ label: `Read the idea · ${idea?.title ?? 'untitled'}` }],
        bubbles: [
          { kind: 'text', text: 'A caption to start from, built from the title and your notes:' },
          { kind: 'caption', network: 'instagram', text, shorter: title },
          { kind: 'text', text: 'Make a post with it and the composer opens prefilled; the idea stays here, linked.' },
        ],
        followUps: ['Suggest 3 angles', 'Find a slot for it', 'Find similar past posts'],
      }
    },
  },
  {
    page: '/plan/ideas/',
    match: ['suggest 3 angles', 'suggest three angles'],
    reply: () => ({
      summary: 'Looked at what is moving in Discover',
      steps: ['Read the idea', 'Checked Discover · last 7 days'],
      bubbles: [
        {
          kind: 'text',
          text: 'Three angles: the comeback (“it’s back, and it’s only here till August”), the how-to (the char, the lime, the squeeze, as a carousel), and the crowd (repost the three best customer corn photos from last July).',
        },
      ],
      followUps: ['Draft a caption', 'Find a slot for it'],
    }),
  },
  {
    page: '/plan/ideas/',
    match: ['find a slot for it', 'find a slot'],
    reply: (ctx) => {
      const saturday = nextSaturday()
      const on = postsOn(ctx.posts, saturday)
      return {
        summary: 'Checked the week ahead',
        steps: ['Read the calendar · next 7 days', 'Checked reach by day'],
        bubbles: [
          {
            kind: 'text',
            text: `Saturday 11 am. ${on.length === 0 ? 'Nothing is scheduled that day' : `${on.length} other ${on.length === 1 ? 'post is' : 'posts are'} on Saturday, none at 11`}, and it’s your best weekend hour for reach. Make a post and the date button has it.`,
          },
        ],
        followUps: ['Draft a caption', 'Suggest 3 angles'],
      }
    },
  },
]

/** The scripted reply for a prompt asked beside `from`, or nothing when there is none. */
export function scriptedReply(prompt: string, from: string, ctx: ReplyContext): ScriptedReply | undefined {
  const asked = norm(prompt)
  const script = SCRIPTS.find(
    (s) => from.startsWith(s.page) && s.match.some((m) => asked === m || asked.includes(m)),
  )
  return script?.reply(ctx)
}

/** Today's fallback, as one text bubble: an insight's canned answer, or the house line. */
export function fallbackReply(prompt: string, posts: Post[]): string {
  return (
    allInsights(posts).find((insight) => insight.action === prompt)?.answer ??
    'Here’s a first pass. In the real product this is where I’d draft it into the right place — the calendar, a campaign or a report — for you to review.'
  )
}
