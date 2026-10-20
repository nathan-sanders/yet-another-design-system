import { visualTrends } from './discover'
import { seeded } from './performance'
import { feed, stories } from './reports'
import type { Mention, MentionReply, MentionSentiment, Network } from './types'

// The posts behind Measure's numbers. Every count on Discover and every report
// widget can open the mentions that make it up (Nathan, 2026-10-19), and there
// are far too many to write out, so they are generated: seeded from the
// question asked, so the same click always shows the same posts, and steered
// by it, so a "Packaging waste" theme reads like complaints about packaging.
// Code-first: no Figma frame draws this list.

/**
 * What a mention list is about. Where the numbers come from, what to call it,
 * and how to write its posts. The caller computes `total` from the same
 * function its widget draws with, so the panel's count is the widget's.
 */
export interface MentionQuery {
  /** Identity: the same key is the same list, and a second click closes it. */
  key: string
  /** The panel's title: the thing clicked, "Packaging waste". */
  title: string
  /** Where it came from, under the title: "Brand sentiment · Last 7 days". */
  context: string
  /** How many there are, the number the widget shows. */
  total: number
  /** What a row counts as. Trends count posts; everything else counts mentions. */
  noun: 'mentions' | 'posts'
  /** How far back they go, from the window's end. */
  withinHours: number
  /**
   * How long ago the window ends, in hours; now when absent. A point on a
   * trend is a window in the past: one day's mentions end where that day does.
   */
  endsHoursAgo?: number
  /** The brands or topics they are about, weighted. One topic when absent: Veggie Vault. */
  topics?: { name: string; weight: number }[]
  /** Fixed when the thing clicked was a sentiment. */
  sentiment?: MentionSentiment
  /** How to write them. */
  angle?: MentionAngle
  /** A creator on Plan › Creators, when the list is theirs: the panel links to their profile. */
  creatorId?: string
}

export type MentionAngle =
  | { kind: 'theme'; name: string }
  | { kind: 'trend'; id: string }
  | { kind: 'trends' }
  | { kind: 'visual'; id: string }
  | { kind: 'visuals' }
  | { kind: 'authors'; ids: string[] }
  | { kind: 'stories' }
  /** One story or feed item: people sharing and reacting to it. */
  | { kind: 'story'; id: string }
  | { kind: 'spikes' }
  /** One spike alert, by its position in the list. */
  | { kind: 'spike'; index: number }

/** The most a list generates. A widget can count 40K; nobody scrolls that far. */
export const MENTION_SAMPLE = 120

const BRANDS = new Set(['Veggie Vault', 'GreenCrate', 'Sprout & Co', 'Harvest Box', 'Leaf & Ladle'])

/** Who writes them, when the angle does not say: the inbox's customers, faces first. */
const AUTHORS = [
  'kaiya',
  'dulce',
  'talan',
  'lydia',
  'maria',
  'zain',
  'skylar',
  'cooper',
  'kaylynn',
  'nolan',
  'lindsey',
  'mango',
  'alena',
  'davis',
  'carter',
  'ann',
  'maya',
  'jonah',
  'priya',
  'jen',
  'plantdad',
  'ollie',
  'sam',
  'zoe',
  'reese',
]

/** Brand Pulse's Top voices, as the customers who write their posts. */
export const VOICE_AUTHORS: Record<string, string> = {
  v1: 'paige',
  v2: 'foodandwine',
  v3: 'marcus',
  v4: 'danacooks',
  v5: 'mealprepsunday',
}

/** Where the posts are, weighted roughly as the inbox's are. */
const NETWORKS: Network[] = [
  'instagram',
  'instagram',
  'instagram',
  'tiktok',
  'tiktok',
  'tiktok',
  'threads',
  'threads',
  'x',
  'x',
  'reddit',
  'facebook',
  'bluesky',
]

/** Each author posts on one network, so a face always wears the same glyph. */
const HOME_NETWORK: Record<string, Network> = {
  alena: 'tiktok',
  davis: 'instagram',
  carter: 'threads',
  ann: 'tiktok',
  kaylynn: 'instagram',
  paige: 'tiktok',
  foodandwine: 'facebook',
  marcus: 'instagram',
  danacooks: 'threads',
  mealprepsunday: 'reddit',
  zoe: 'reddit',
}

/** The network an author posts on: theirs where the file says, else one seeded from their id. */
function networkOf(authorId: string): Network {
  return HOME_NETWORK[authorId] ?? pick(seeded(`${authorId}|network`), NETWORKS)
}

// ---------------------------------------------------------------------------
// What they say
// ---------------------------------------------------------------------------

type Bank = Record<MentionSentiment, string[]>

/** About a brand: `{t}` is its name. */
const ABOUT_BRAND: Bank = {
  positive: [
    'Okay, {t} has no business being this good on a Tuesday.',
    'Third week in a row ordering from {t}. No regrets.',
    "If you haven't tried {t} yet, this is your sign.",
    '{t} delivered early AND it was still warm. Rare.',
    'Meal prep sorted for the whole week thanks to {t} 🙌',
    'The portions at {t} are honestly generous for the price.',
    'Just converted my roommate to {t}. Two for two.',
  ],
  neutral: [
    'Anyone compared {t} with the other meal kits lately?',
    'Seeing a lot of {t} on my feed this week. Worth it?',
    '{t} just dropped a new menu. Thoughts?',
    'Trying {t} for the first time tonight, will report back.',
    'Is {t} available outside the city yet?',
    'Does {t} do a student discount or am I dreaming?',
  ],
  negative: [
    'Not sure what happened at {t}, but my order was missing a side again.',
    '{t} raised prices and the bowls got smaller. Hmm.',
    'Waited 50 minutes for {t}. Food was cold.',
    'Love the idea of {t}, but the packaging waste is a lot.',
    'Customer support at {t} took four days to answer me.',
  ],
}

/** About a subject that is not a brand: `{t}` is "#PlantBased", "Meal prep". */
const ABOUT_TOPIC: Bank = {
  positive: [
    '{t} is the best thing I added to my routine this year.',
    'Big fan of all the {t} posts lately, so many good ideas.',
    'Sunday {t} done in under an hour. Feeling unstoppable.',
    'Saved about $60 this month leaning into {t}.',
  ],
  neutral: [
    "What's everyone's go-to for {t} right now?",
    'Saving this {t} thread for later.',
    'Is {t} actually cheaper than eating out? Running the numbers.',
    'Collecting {t} ideas, drop yours below.',
  ],
  negative: [
    '{t} content is getting so repetitive.',
    'Tried the {t} thing and spent way too much on groceries.',
    'Not convinced {t} is more than a trend.',
  ],
}

/** Discover's Brand sentiment themes, by name. They are all about Veggie Vault. */
const THEMES: Record<string, string[]> = {
  Taste: [
    "The Harvest Bowl from @veggie_vault tastes like someone's grandma made it.",
    "Didn't expect a meal kit to taste this good. Veggie Vault wins.",
    "That lemon tahini from Veggie Vault... I'd drink it.",
    'Flavor on the new Veggie Vault menu is unreal.',
  ],
  'Protein Plates': [
    'Protein Plates from Veggie Vault are carrying my gym week.',
    '34g of protein and it actually tastes good? Protein Plates are the move.',
    "Swapped my chicken prep for Veggie Vault's Protein Plates and I don't miss it.",
    'My Sunday prep with the Protein Plates: 4 lunches done in 40 minutes.',
  ],
  'Portion size': [
    'Veggie Vault portions are huge, I got two lunches out of one bowl.',
    'Finally a meal kit that actually fills me up. Veggie Vault gets it.',
    'Whoever packs the Veggie Vault bowls is very generous and I love them.',
  ],
  'Fast delivery': [
    'Ordered Veggie Vault at 12:05, eating at 12:30. Unreal.',
    'Veggie Vault delivery is consistently early. How?',
    'Rain, rush hour, and Veggie Vault still showed up on time.',
  ],
  'Packaging waste': [
    'Love Veggie Vault but why is every side in its own plastic tub?',
    'Is Veggie Vault packaging actually compostable or is that greenwashing?',
    'My recycling bin after one week of Veggie Vault is embarrassing.',
    'Veggie Vault says compostable. My city says no. Who is right?',
  ],
  Price: [
    'Veggie Vault is great but $16 for a bowl is hard to justify.',
    'Price went up again at Veggie Vault. Still good, but ouch.',
    'Veggie Vault or groceries this week? My wallet picked groceries.',
  ],
  'Summer menu sell-outs': [
    'Third day trying to get the Mango Chili Bowl. Sold out. Again.',
    'Veggie Vault please make more of the summer menu, it is gone by noon.',
    'Set an alarm for the Veggie Vault summer drop and still missed it.',
  ],
}

/** Which way each theme leans, from the column it sits in on Discover. */
const THEME_SENTIMENT: Record<string, MentionSentiment> = {
  Taste: 'positive',
  'Protein Plates': 'positive',
  'Portion size': 'positive',
  'Fast delivery': 'positive',
  'Packaging waste': 'negative',
  Price: 'negative',
  'Summer menu sell-outs': 'negative',
}

/** Discover's trends, by id: posts in the trend, most not about the brand at all. */
const TRENDS: Record<string, { bank: string[]; lean: MentionSentiment[] }> = {
  t1: {
    bank: [
      "High-protein meal prep that doesn't taste like cardboard? Here's my 5-bowl Sunday.",
      '40g protein lunches all week. The tofu marinade is the whole secret.',
      'Meal prep tip: double your lentils, thank me Thursday.',
      'Five high-protein lunches for under $30, recipe in comments.',
      'Week 6 of high-protein prep and I finally stopped buying lunch.',
      'Anyone found a meal kit that keeps protein high without tasting like the gym?',
    ],
    lean: ['positive', 'positive', 'neutral'],
  },
  t2: {
    bank: [
      'Kefir, spinach and frozen mango. Gut-health smoothie of the week.',
      "GreenCrate's gut-health smoothie kit is... fine? Mine's better.",
      'Two weeks of gut-health smoothies and I feel like a new person.',
      'Ginger, kiwi and oats. My gut thanks me.',
      'Unpopular opinion: most gut-health smoothies are just sugar.',
    ],
    lean: ['positive', 'neutral', 'positive'],
  },
  t3: {
    bank: [
      "#DeskLunch today: leftover grain bowl and pretending I'm on vacation.",
      "Rating my coworkers' #DeskLunch. This one's a 9.",
      '#DeskLunch but make it 4 minutes to assemble.',
      'My #DeskLunch is better than my actual dinner and I am not okay.',
      'Sad #DeskLunch support group, roll call.',
    ],
    lean: ['positive', 'neutral'],
  },
  t4: {
    bank: [
      'Groceries were $40 more this week for the same list. Something has to give.',
      'Meal kits vs groceries in this economy: honestly a toss-up now.',
      'Cutting back on takeout because groceries alone are wild right now.',
      'Eggs, coffee, olive oil. Every receipt is a jump scare.',
      'How is a bag of salad $6 now?',
      'Budget meal prep thread: what actually keeps costs down for you?',
    ],
    lean: ['negative', 'negative', 'neutral'],
  },
  t5: {
    bank: [
      'Which meal kits actually use compostable packaging? Asking for my trash can.',
      'Zero-waste week, day 3: the hardest part is takeout containers.',
      "Brands saying 'compostable' should say where it can be composted.",
      'Brought my own containers to the deli. They looked at me like I was an alien.',
      'Veggie Vault packaging: compostable, or greenwashing?',
    ],
    lean: ['negative', 'neutral'],
  },
}

/** Discover's visual trends, by id: short captions, since the photo is the post. */
const VISUALS: Record<string, string[]> = {
  v1: [
    'Eating the rainbow, literally 🌈',
    'Summer plate, no notes.',
    'Mango, corn, chili lime. This is the plate.',
  ],
  v2: [
    'Process shot: 6 bowls, 1 hour, zero stress.',
    'Chop, roast, portion, repeat.',
    'The most satisfying part of Sunday prep.',
  ],
  v3: [
    'Matcha, but café-pretty at home.',
    'This green smoothie tastes like a vacation.',
    'Café drinks at home, week 4.',
  ],
  v4: [
    'Big bowl, big lunch, big nap.',
    'Lunch bowl stacked to the ceiling today.',
    'This bowl had no business being this big.',
  ],
}

/** A comment on sharing one of Brand Pulse's top stories, by the story's sentiment. */
const ON_A_STORY: Bank = {
  positive: ['Not surprised, they are that good.', 'Called it.', 'Deserved!'],
  neutral: ['Interesting read.', 'Worth a look.', 'Saving this.'],
  negative: ['Wonder how long this lasts.', 'Hmm, not great.', 'Was waiting for someone to ask.'],
}

/** Brand Pulse's spike alerts, by what each one is about. */
const SPIKES: { bank: string[]; sentiment: MentionSentiment; weight: number }[] = [
  { bank: THEMES['Packaging waste']!, sentiment: 'negative', weight: 412 },
  {
    bank: [
      'Protein Plates sold out AGAIN 😭',
      'Sold out in 48 hours?? Veggie Vault, make more Protein Plates.',
    ],
    sentiment: 'positive',
    weight: 300,
  },
  {
    bank: [
      "Saw @plantpowerpaige's Veggie Vault review and ordered immediately.",
      'That Veggie Vault review on my FYP is everywhere.',
    ],
    sentiment: 'positive',
    weight: 220,
  },
  {
    bank: [
      "GreenCrate's summer promo is actually a good deal.",
      'Switching to GreenCrate for the summer promo, sorry Veggie Vault.',
    ],
    sentiment: 'neutral',
    weight: 140,
  },
  {
    bank: [
      '#SmoothieWeek was fun while it lasted.',
      'Already done with #SmoothieWeek, back to coffee.',
    ],
    sentiment: 'neutral',
    weight: 60,
  },
]

/** Every spike alert's mentions together: the View messages count on Spike alerts. */
export const SPIKE_MENTIONS = SPIKES.reduce((sum, s) => sum + s.weight, 0)

/** One spike alert's mentions, in the list's order. */
export const spikeMentions = (index: number) => SPIKES[index]?.weight ?? 0

/** What other people say under a post. */
const REPLIES = [
  'Same here!',
  'Wait, where do you order this?',
  'Agree 100%.',
  'Hard disagree, mine was great.',
  'Need to try this.',
  'Happened to me last week too.',
  'Saving this for later.',
  'Which location?',
]

// ---------------------------------------------------------------------------
// Making them
// ---------------------------------------------------------------------------

type Random = () => number

const pick = <T>(random: Random, list: readonly T[]): T => list[Math.floor(random() * list.length)]!

function weighted<T>(random: Random, list: { item: T; weight: number }[]): T {
  const sum = list.reduce((a, b) => a + b.weight, 0)
  let at = random() * sum
  for (const entry of list) {
    at -= entry.weight
    if (at <= 0) return entry.item
  }
  return list[list.length - 1]!.item
}

/** Brand mood when nothing fixes it: Discover's gauge for Veggie Vault, a cooler mix for the rest. */
function moodFor(random: Random, topic: string): MentionSentiment {
  const r = random()
  if (topic === 'Veggie Vault') return r < 0.83 ? 'positive' : r < 0.95 ? 'neutral' : 'negative'
  return r < 0.6 ? 'positive' : r < 0.85 ? 'neutral' : 'negative'
}

/** A tail some posts get, so a bank of a few lines does not read as a few posts. */
const TAILS: Record<MentionSentiment, string[]> = {
  positive: [' 🙌', ' 10/10.', ' 💚', ' Highly recommend.', ' No notes.', ' Obsessed.'],
  neutral: [' Thoughts?', ' Anyone else?', ' Curious what you all think.', ' 🤔', ' Just me?'],
  negative: [' 😩', ' Not great.', ' Anyone else?', ' Disappointed tbh.', ' Do better.'],
}

function withTail(random: Random, body: string, sentiment: MentionSentiment): string {
  return random() < 0.45 ? body + pick(random, TAILS[sentiment]) : body
}

function aboutTopic(random: Random, topic: string, sentiment: MentionSentiment): string {
  const bank = BRANDS.has(topic) ? ABOUT_BRAND : ABOUT_TOPIC
  return pick(random, bank[sentiment]).replace('{t}', topic)
}

/** One post: its author, words and photo, steered by the query's angle. */
function compose(query: MentionQuery, random: Random) {
  const topics = query.topics?.length ? query.topics : [{ name: 'Veggie Vault', weight: 1 }]
  let topic = weighted(
    random,
    topics.map((t) => ({ item: t.name, weight: t.weight })),
  )
  let sentiment = query.sentiment ?? moodFor(random, topic)
  let authorId = pick(random, AUTHORS)
  let body: string
  let photo: string | undefined
  const angle = query.angle

  switch (angle?.kind) {
    case 'theme': {
      sentiment = query.sentiment ?? THEME_SENTIMENT[angle.name] ?? sentiment
      topic = 'Veggie Vault'
      const bank = THEMES[angle.name]
      body = bank ? pick(random, bank) : aboutTopic(random, topic, sentiment)
      break
    }
    case 'trend':
    case 'trends': {
      const trend = TRENDS[angle.kind === 'trend' ? angle.id : pick(random, Object.keys(TRENDS))]!
      sentiment = query.sentiment ?? pick(random, trend.lean)
      body = pick(random, trend.bank)
      break
    }
    case 'visual':
    case 'visuals': {
      const visual =
        visualTrends.find((v) => angle.kind === 'visual' && v.id === angle.id) ??
        pick(random, visualTrends)
      body = pick(random, VISUALS[visual.id]!)
      photo = pick(random, visual.photos)
      sentiment = query.sentiment ?? (random() * 100 < visual.positive ? 'positive' : 'neutral')
      break
    }
    case 'authors': {
      authorId = pick(random, angle.ids)
      body = aboutTopic(random, topic, sentiment)
      break
    }
    case 'stories':
    case 'story': {
      const story =
        (angle.kind === 'story' && [...stories, ...feed].find((s) => s.id === angle.id)) ||
        pick(random, stories)
      sentiment = query.sentiment ?? (story.sentiment.toLowerCase() as MentionSentiment)
      body = `${pick(random, ON_A_STORY[sentiment])} ${story.outlet}: “${story.title}”`
      break
    }
    case 'spikes':
    case 'spike': {
      const spike =
        (angle.kind === 'spike' && SPIKES[angle.index]) ||
        weighted(
          random,
          SPIKES.map((s) => ({ item: s, weight: s.weight })),
        )
      sentiment = query.sentiment ?? spike.sentiment
      body = pick(random, spike.bank)
      break
    }
    default:
      body = aboutTopic(random, topic, sentiment)
  }

  return { topic, sentiment, authorId, body: withTail(random, body, sentiment), photo }
}

function threadFor(random: Random, id: string, authorId: string, hoursAgo: number): MentionReply[] {
  const count = Math.floor(random() * random() * 5)
  const replies: MentionReply[] = []
  for (let i = 0; i < count; i++) {
    let replier = pick(random, AUTHORS)
    if (replier === authorId) replier = AUTHORS[(AUTHORS.indexOf(replier) + 1) % AUTHORS.length]!
    replies.push({
      id: `${id}-r${i}`,
      authorId: replier,
      body: pick(random, REPLIES),
      hoursAgo: Math.max(0, hoursAgo - (i + 1) * random() * 3),
    })
  }
  return replies
}

const cache = new Map<string, Mention[]>()

/**
 * The mentions behind a query, newest first: the whole count when it is small,
 * the latest `MENTION_SAMPLE` when it is not. The same key always gives the
 * same list.
 */
export function mentionsFor(query: MentionQuery): Mention[] {
  const cached = cache.get(query.key)
  if (cached) return cached
  const count = Math.min(query.total, MENTION_SAMPLE)
  const random = seeded(query.key)
  const list: Mention[] = []
  for (let i = 0; i < count; i++) {
    const { topic, sentiment, authorId, body, photo } = compose(query, random)
    const id = `${query.key}#${i}`
    // Newest first, spread over the window, a little bunched toward now.
    const hoursAgo =
      Math.round(((query.endsHoursAgo ?? 0) + query.withinHours * random() ** 1.6) * 10) / 10
    const viral = random() ** 3
    list.push({
      id,
      authorId,
      network: networkOf(authorId),
      hoursAgo,
      body,
      photo,
      sentiment,
      topic,
      likes: Math.round(4 + viral * 4800),
      shares: Math.round(viral * 600),
      thread: threadFor(random, id, authorId, hoursAgo),
    })
  }
  list.sort((a, b) => a.hoursAgo - b.hoursAgo)
  cache.set(query.key, list)
  return list
}

/** Finds a mention by id across every list opened so far. */
export function mentionById(id: string): Mention | undefined {
  for (const list of cache.values()) {
    const found = list.find((m) => m.id === id)
    if (found) return found
  }
  return undefined
}

/** `now`, `12m`, `3h`, `2d`: the inbox's age, from hours. */
export function mentionAge(hours: number): string {
  if (hours < 1 / 60) return 'now'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.floor(hours / 24)}d`
}

/** Likes plus shares plus replies: what "Most engagement" sorts by. */
export function mentionEngagement(mention: Mention): number {
  return mention.likes + mention.shares + mention.thread.length
}
