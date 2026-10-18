import cafeInterior from '../assets/photos/cafe-interior.jpg'
import celerySalad from '../assets/photos/celery-salad.jpg'
import chardLeaves from '../assets/photos/chard-leaves.jpg'
import chefChopping from '../assets/photos/chef-chopping.jpg'
import freshVegetables from '../assets/photos/fresh-vegetables.jpg'
import grainBowl from '../assets/photos/grain-bowl.jpg'
import greenSmoothies from '../assets/photos/green-smoothies.jpg'
import harvestBowl from '../assets/photos/harvest-bowl.jpg'
import mangoShavedIce from '../assets/photos/mango-shaved-ice.jpg'
import pineappleSmoothies from '../assets/photos/pineapple-smoothies.jpg'
import saladBowl from '../assets/photos/salad-bowl.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'
import takeoutBox from '../assets/photos/takeout-box.jpg'
import wraps from '../assets/photos/wraps.jpg'
import { customerFor } from './inbox'
import type { Network } from './types'

// Measure › Discover (`40005911:35187`): what the brand's audience is talking
// about, written out from the file. The numbers are the file's for the last
// 7 days; the other two ranges scale the counts and keep the percentages,
// which is what a wider window does to a share.

export type DiscoverRange = '24h' | '7d' | '30d'

export const DISCOVER_RANGES: { value: DiscoverRange; label: string; scale: number }[] = [
  { value: '24h', label: 'Last 24 hours', scale: 1 / 7 },
  { value: '7d', label: 'Last 7 days', scale: 1 },
  { value: '30d', label: 'Last 30 days', scale: 30 / 7 },
]

export function discoverRangeFor(value: string | null): DiscoverRange {
  return DISCOVER_RANGES.some((r) => r.value === value) ? (value as DiscoverRange) : '7d'
}

export function rangeScale(range: DiscoverRange): number {
  return DISCOVER_RANGES.find((r) => r.value === range)!.scale
}

// ---------------------------------------------------------------------------
// Trending near your brand
// ---------------------------------------------------------------------------

export interface Trend {
  id: string
  title: string
  icon: 'flame' | 'up' | 'hash' | 'radar' | 'zap'
  /** Posts in the last 7 days. */
  posts: number
  /** Percent of the people posting who also follow the brand; absent when the meta says something else. */
  overlap?: number
  /** What follows the counts: "GreenCrate is in it". */
  note?: string
  change: string
  tone: 'green' | 'yellow' | 'red'
}

export const trends: Trend[] = [
  {
    id: 't1',
    title: 'High-protein meal prep',
    icon: 'flame',
    posts: 18_200,
    overlap: 64,
    note: 'with your audience',
    change: '+56%',
    tone: 'green',
  },
  {
    id: 't2',
    title: 'Gut-health smoothies',
    icon: 'up',
    posts: 9_600,
    overlap: 48,
    note: 'GreenCrate is in it',
    change: '+43%',
    tone: 'green',
  },
  {
    id: 't3',
    title: '#DeskLunch',
    icon: 'hash',
    posts: 6_100,
    overlap: 51,
    note: "you haven't posted",
    change: '+38%',
    tone: 'green',
  },
  {
    id: 't4',
    title: 'Grocery price fatigue',
    icon: 'radar',
    posts: 22_400,
    overlap: 39,
    note: 'mostly negative',
    change: '+21%',
    tone: 'yellow',
  },
  {
    id: 't5',
    title: 'Zero-waste packaging',
    icon: 'zap',
    posts: 4_800,
    note: 'your brand mentioned 412×',
    change: '+340%',
    tone: 'red',
  },
]

// ---------------------------------------------------------------------------
// Creators your audience follows
// ---------------------------------------------------------------------------

export interface Creator {
  id: string
  name: string
  handle: string
  network: Network
  avatar?: string
  /** Percent of their followers who also follow the brand. */
  overlap: number
  followers: number
}

/** The file's five, wearing the inbox's portraits of the same people. */
export const creators: Creator[] = [
  {
    id: 'alena',
    name: 'Alena Kenter',
    handle: '@alenakenter',
    network: 'tiktok',
    overlap: 71,
    followers: 1_200_000,
  },
  {
    id: 'davis',
    name: 'Davis Levin',
    handle: '@davislevin.eats',
    network: 'instagram',
    overlap: 64,
    followers: 640_000,
  },
  {
    id: 'carter',
    name: 'Carter Dokidis',
    handle: '@carterdokidis',
    network: 'threads',
    overlap: 58,
    followers: 210_000,
  },
  {
    id: 'ann',
    name: 'Ann Emery',
    handle: '@annpreps',
    network: 'tiktok',
    overlap: 52,
    followers: 480_000,
  },
  {
    id: 'kaylynn',
    name: 'Kaylynn Dorwart',
    handle: '@kaylynncooks',
    network: 'instagram',
    overlap: 47,
    followers: 890_000,
  },
].map((c) => ({ ...c, network: c.network as Network, avatar: customerFor(c.id).avatar }))

// ---------------------------------------------------------------------------
// Visual trends in your space
// ---------------------------------------------------------------------------

export interface VisualTrend {
  id: string
  title: string
  photos: [string, string, string, string]
  /** Percent of the space's posts that look like this. */
  share: number
  engagements: number
  positive: number
  /** Whether the brand already posts in this style. */
  yours: boolean
}

export const visualTrends: VisualTrend[] = [
  {
    id: 'v1',
    title: 'Rainbow summer plates',
    photos: [saladBowls, streetCorn, mangoShavedIce, takeoutBox],
    share: 28,
    engagements: 2_410,
    positive: 86,
    yours: true,
  },
  {
    id: 'v2',
    title: 'Meal-prep process shots',
    photos: [saladBowl, chefChopping, chardLeaves, freshVegetables],
    share: 22,
    engagements: 3_180,
    positive: 81,
    yours: false,
  },
  {
    id: 'v3',
    title: 'Café-style green drinks',
    photos: [cafeInterior, greenSmoothies, grainBowl, pineappleSmoothies],
    share: 17,
    engagements: 1_920,
    positive: 88,
    yours: false,
  },
  {
    id: 'v4',
    title: 'Big-bowl lunches',
    photos: [celerySalad, harvestBowl, wraps, saladBowls],
    share: 14,
    engagements: 1_460,
    positive: 79,
    yours: true,
  },
]

// ---------------------------------------------------------------------------
// Opportunities to engage
// ---------------------------------------------------------------------------

export interface Opportunity {
  id: string
  creatorId: string
  handle: string
  network: Network
  ago: string
  body: string
  why: string
  /** Reply to it, or share it — a fan's own post. */
  action: 'reply' | 'share'
}

export const opportunities: Opportunity[] = [
  {
    id: 'o1',
    creatorId: 'alena',
    handle: '@alenakenter',
    network: 'tiktok',
    ago: '2h ago',
    body: 'Anyone found a meal kit that actually keeps protein high without tasting like the gym?',
    why: 'Asking for recommendations · 1.2K likes',
    action: 'reply',
  },
  {
    id: 'o2',
    creatorId: 'davis',
    handle: '@davislevin.eats',
    network: 'instagram',
    ago: '5h ago',
    body: 'Tried the GreenCrate summer box and honestly the bowls were smaller than the photos.',
    why: 'Competitor mention · 340 replies',
    action: 'reply',
  },
  {
    id: 'o3',
    creatorId: 'carter',
    handle: '@carterdokidis',
    network: 'reddit',
    ago: '8h ago',
    body: 'Is Veggie Vault packaging actually compostable or is that greenwashing?',
    why: 'Question about you · trending on Reddit',
    action: 'reply',
  },
  {
    id: 'o4',
    creatorId: 'ann',
    handle: '@annpreps',
    network: 'tiktok',
    ago: '1d ago',
    body: 'My Sunday prep with the Protein Plates — 4 lunches done in 40 minutes.',
    why: 'Fan content · 18K views',
    action: 'share',
  },
]

// ---------------------------------------------------------------------------
// Brand sentiment
// ---------------------------------------------------------------------------

export const sentimentSplit = { positive: 83, neutral: 12, negative: 5, change: -3 }

export interface Theme {
  name: string
  /** Mentions in the last 7 days. */
  mentions: number
}

export const praisedFor: Theme[] = [
  { name: 'Taste', mentions: 1_200 },
  { name: 'Protein Plates', mentions: 864 },
  { name: 'Portion size', mentions: 512 },
  { name: 'Fast delivery', mentions: 341 },
]

export const criticizedFor: Theme[] = [
  { name: 'Packaging waste', mentions: 412 },
  { name: 'Price', mentions: 287 },
  { name: 'Summer menu sell-outs', mentions: 164 },
]
