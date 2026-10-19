import { ChefHat, Dumbbell, Heart, Leaf, Utensils, type LucideIcon } from 'lucide-react'

import jonah from '../assets/people/jonah.jpg'
import maya from '../assets/people/maya.jpg'
import priya from '../assets/people/priya.jpg'
import cafeInterior from '../assets/photos/cafe-interior.jpg'
import celerySalad from '../assets/photos/celery-salad.jpg'
import chardLeaves from '../assets/photos/chard-leaves.jpg'
import chefChopping from '../assets/photos/chef-chopping.jpg'
import freshVegetables from '../assets/photos/fresh-vegetables.jpg'
import grainBowl from '../assets/photos/grain-bowl.jpg'
import greenSmoothies from '../assets/photos/green-smoothies.jpg'
import harvestBowl from '../assets/photos/harvest-bowl.jpg'
import mangoShavedIce from '../assets/photos/mango-shaved-ice.jpg'
import mealPrepBowls from '../assets/photos/meal-prep-bowls.jpg'
import pineappleSmoothies from '../assets/photos/pineapple-smoothies.jpg'
import saladBowl from '../assets/photos/salad-bowl.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'
import takeoutBox from '../assets/photos/takeout-box.jpg'
import wraps from '../assets/photos/wraps.jpg'
import { customerFor } from './inbox'
import { seeded } from './performance'
import type { Network } from './types'

// Plan › Creators (`40005911:35697`): the creators worth working with, written
// out from the file's eight cards. Five are Discover's creators — same people,
// same portraits — and Maya, Jonah and Priya are new. Brand fit is its own
// score, not Discover's audience overlap.

export type CreatorCategory = 'Wellness' | 'Food & drink' | 'Lifestyle' | 'Meal prep' | 'Fitness'

export const CATEGORY_ICON: Record<CreatorCategory, LucideIcon> = {
  Wellness: Leaf,
  'Food & drink': Utensils,
  Lifestyle: Heart,
  'Meal prep': ChefHat,
  Fitness: Dumbbell,
}

export interface BrandCreator {
  id: string
  name: string
  handle: string
  avatar?: string
  followers: number
  /** Brand fit, 0–100. Green 80+, orange 40–79, red under 40. */
  fit: number
  category: CreatorCategory
  /** Two recent posts: the wide one first. */
  photos: [string, string]
  /** What they post about, for search. */
  topics: string[]
}

/** One account of theirs, a row in the details panel's Channels card. */
export interface CreatorChannel {
  network: Network
  handle: string
  followers: number
}

/**
 * What the List view's extra columns and the Creator details panel
 * (`40005911:35788`) show. Alena's are the file's own; the other seven are
 * written to match her shape, and the list's Top topic and Engagement columns
 * are copied from `40005911:35964`.
 */
export interface CreatorDetails {
  /** The network the handle is on: the glyph before it in the list. */
  network: Network
  location: string
  /** List › Top topic. */
  topTopic: string
  /** Engagement rate, percent. */
  engagement: number
  /** The same rate across creators like them, as Yet benchmarks it. */
  peerEngagement: number
  /** Posts Yet flagged as sensitive for a brand to sit beside. */
  flaggedPosts: number
  /** Brands they have worked with: a count and the first few names. */
  collaborations: { count: number; brands: string[] }
  /** The panel's "Topics they talk about". */
  talkingPoints: string[]
  channels: CreatorChannel[]
}

export type Creator = BrandCreator & CreatorDetails

const drawn: BrandCreator[] = [
  {
    id: 'maya',
    name: 'Maya Okafor',
    handle: 'mayaeatsgreen',
    avatar: maya,
    followers: 2_400_000,
    fit: 88,
    category: 'Wellness',
    photos: [saladBowls, chardLeaves],
    topics: ['plant-based', 'salads', 'vegan', 'health', 'greens'],
  },
  {
    id: 'jonah',
    name: 'Jonah Reyes',
    handle: 'jonahbakes',
    avatar: jonah,
    followers: 1_800_000,
    fit: 34,
    category: 'Food & drink',
    photos: [wraps, takeoutBox],
    topics: ['baking', 'takeout', 'restaurant reviews', 'street food'],
  },
  {
    id: 'alena',
    name: 'Alena Kenter',
    handle: 'alenakenter',
    followers: 1_200_000,
    fit: 92,
    category: 'Wellness',
    photos: [saladBowl, greenSmoothies],
    topics: ['smoothies', 'gut health', 'plant-based', 'health', 'wellness'],
  },
  {
    id: 'kaylynn',
    name: 'Kaylynn Dorwart',
    handle: 'kaylynncooks',
    followers: 890_000,
    fit: 47,
    category: 'Lifestyle',
    photos: [pineappleSmoothies, cafeInterior],
    topics: ['cafés', 'smoothies', 'trending on social', 'podcasts'],
  },
  {
    id: 'davis',
    name: 'Davis Levin',
    handle: 'davislevin.eats',
    followers: 640_000,
    fit: 81,
    category: 'Food & drink',
    photos: [grainBowl, harvestBowl],
    topics: ['bowls', 'restaurant reviews', 'lunch', 'protein'],
  },
  {
    id: 'ann',
    name: 'Ann Emery',
    handle: 'annpreps',
    followers: 480_000,
    fit: 74,
    category: 'Meal prep',
    photos: [mealPrepBowls, celerySalad],
    topics: ['meal prep', 'high-protein', 'protein', 'health and wellness'],
  },
  {
    id: 'priya',
    name: 'Priya Lal',
    handle: 'priyaplates',
    avatar: priya,
    followers: 320_000,
    fit: 18,
    category: 'Lifestyle',
    photos: [streetCorn, mangoShavedIce],
    topics: ['street food', 'desserts', 'trending on social'],
  },
  {
    id: 'carter',
    name: 'Carter Dokidis',
    handle: 'carterdokidis',
    followers: 210_000,
    fit: 56,
    category: 'Fitness',
    photos: [freshVegetables, chefChopping],
    topics: ['fitness', 'protein', 'high-protein', 'health and wellness', 'podcasts'],
  },
]

const details: Record<string, CreatorDetails> = {
  maya: {
    network: 'instagram',
    location: 'Brooklyn, NY',
    topTopic: 'Plant-based bowls',
    engagement: 3.9,
    peerEngagement: 2.6,
    flaggedPosts: 0,
    collaborations: { count: 22, brands: ['Oatly', 'Sweetgreen'] },
    talkingPoints: ['Plant-based bowls', 'Big-batch salads', 'Vegan protein', 'Greens on a budget'],
    channels: [
      { network: 'instagram', handle: '@mayaeatsgreen', followers: 1_600_000 },
      { network: 'tiktok', handle: '@mayaeatsgreen', followers: 640_000 },
      { network: 'facebook', handle: 'Maya Okafor', followers: 160_000 },
    ],
  },
  jonah: {
    network: 'tiktok',
    location: 'Chicago, IL',
    topTopic: 'Sourdough & pastry',
    engagement: 2.4,
    peerEngagement: 2.9,
    flaggedPosts: 3,
    collaborations: { count: 9, brands: ['King Arthur', 'DoorDash'] },
    talkingPoints: ['Sourdough & pastry', 'Takeout taste tests', 'Street food'],
    channels: [
      { network: 'tiktok', handle: '@jonahbakes', followers: 1_300_000 },
      { network: 'instagram', handle: '@jonahbakes', followers: 500_000 },
    ],
  },
  alena: {
    network: 'instagram',
    location: 'Austin, TX',
    topTopic: 'Easy Mediterranean meals',
    engagement: 4.8,
    peerEngagement: 2.1,
    flaggedPosts: 1,
    collaborations: { count: 14, brands: ['Green Fork', 'Bright Farms'] },
    talkingPoints: [
      'Easy Mediterranean meals',
      'Healthy recipe ideas',
      'Quick breakfasts',
      'Fresh & flavorful dishes',
    ],
    channels: [
      { network: 'instagram', handle: '@alenakenter', followers: 820_000 },
      { network: 'tiktok', handle: '@alenakenter', followers: 310_000 },
      { network: 'facebook', handle: 'Alena Kenter', followers: 74_000 },
    ],
  },
  kaylynn: {
    network: 'instagram',
    location: 'Portland, OR',
    topTopic: 'Café culture',
    engagement: 3.1,
    peerEngagement: 2.8,
    flaggedPosts: 0,
    collaborations: { count: 6, brands: ['Blue Bottle', 'Califia'] },
    talkingPoints: ['Café culture', 'Smoothie bowls', 'Weekend brunch'],
    channels: [
      { network: 'instagram', handle: '@kaylynncooks', followers: 700_000 },
      { network: 'tiktok', handle: '@kaylynncooks', followers: 190_000 },
    ],
  },
  davis: {
    network: 'instagram',
    location: 'Denver, CO',
    topTopic: 'Weeknight dinners',
    engagement: 5.2,
    peerEngagement: 3.4,
    flaggedPosts: 0,
    collaborations: { count: 11, brands: ['Hello Fresh', 'Chipotle'] },
    talkingPoints: ['Weeknight dinners', 'Grain bowls', 'Restaurant reviews'],
    channels: [
      { network: 'instagram', handle: '@davislevin.eats', followers: 450_000 },
      { network: 'tiktok', handle: '@davislevin.eats', followers: 150_000 },
      { network: 'facebook', handle: 'Davis Levin', followers: 40_000 },
    ],
  },
  ann: {
    network: 'tiktok',
    location: 'Atlanta, GA',
    topTopic: 'Sunday meal prep',
    engagement: 2.7,
    peerEngagement: 2.5,
    flaggedPosts: 0,
    collaborations: { count: 8, brands: ['Factor', 'Ziploc'] },
    talkingPoints: ['Sunday meal prep', 'High-protein lunches', 'Five-ingredient dinners'],
    channels: [
      { network: 'tiktok', handle: '@annpreps', followers: 360_000 },
      { network: 'instagram', handle: '@annpreps', followers: 120_000 },
    ],
  },
  priya: {
    network: 'instagram',
    location: 'Houston, TX',
    topTopic: 'Street food',
    engagement: 1.9,
    peerEngagement: 2.4,
    flaggedPosts: 2,
    collaborations: { count: 4, brands: ['Takis', 'Uber Eats'] },
    talkingPoints: ['Street food', 'Night markets', 'Desserts'],
    channels: [
      { network: 'instagram', handle: '@priyaplates', followers: 240_000 },
      { network: 'tiktok', handle: '@priyaplates', followers: 80_000 },
    ],
  },
  carter: {
    network: 'tiktok',
    location: 'San Diego, CA',
    topTopic: 'High-protein meals',
    engagement: 6.1,
    peerEngagement: 3.8,
    flaggedPosts: 0,
    collaborations: { count: 5, brands: ['Huel', 'Fairlife'] },
    talkingPoints: ['High-protein meals', 'Gym-day breakfasts', 'Macro-friendly snacks'],
    channels: [
      { network: 'tiktok', handle: '@carterdokidis', followers: 160_000 },
      { network: 'instagram', handle: '@carterdokidis', followers: 50_000 },
    ],
  },
}

export const brandCreators: Creator[] = drawn.map((c) => ({
  ...c,
  ...details[c.id],
  avatar: c.avatar ?? customerFor(c.id).avatar,
}))

export function creatorById(id: string): Creator | undefined {
  return brandCreators.find((c) => c.id === id)
}

/** The fit Badge's words beside it in the details panel, on the same three tiers. */
export function fitLabel(fit: number): string {
  return fit >= 80 ? 'Great match' : fit >= 40 ? 'Good match' : 'Weak match'
}

/** The three creators nearest this one: same category first, then brand fit. */
export function similarCreators(creator: Creator): Creator[] {
  return brandCreators
    .filter((c) => c.id !== creator.id)
    .sort(
      (a, b) =>
        Number(b.category === creator.category) - Number(a.category === creator.category) ||
        b.fit - a.fit,
    )
    .slice(0, 3)
}

export interface CreatorAudience {
  /** Share of followers per age band, percent; sums to 100. */
  ages: { band: string; share: number }[]
  /** Top cities, percent of followers. */
  cities: { city: string; share: number }[]
  women: number
  men: number
}

const AGE_BANDS = ['18–24', '25–34', '35–44', '45–54', '55+']
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Austin', 'Seattle', 'Atlanta']

/**
 * Code-first: Figma draws no Audience tab. Seeded from the creator id, as post
 * stats are, so a creator's audience is the same every visit.
 */
export function audienceFor(creator: Creator): CreatorAudience {
  const random = seeded(creator.id)
  const weights = AGE_BANDS.map((_, i) => (i === 1 ? 3 : i === 0 || i === 2 ? 2 : 1) + random())
  const total = weights.reduce((a, b) => a + b, 0)
  const ages = AGE_BANDS.map((band, i) => ({ band, share: Math.round((weights[i] / total) * 100) }))
  // Rounding can miss 100 by one; the biggest band absorbs it.
  ages[1].share += 100 - ages.reduce((a, b) => a + b.share, 0)
  const home = creator.location.split(',')[0]
  const cities = [home, ...CITIES.filter((c) => c !== home)]
    .slice(0, 4)
    .map((city, i) => ({ city, share: Math.round((18 - i * 4) * (0.8 + random() * 0.4)) }))
  const women = Math.round(55 + random() * 25)
  return { ages, cities, women, men: 100 - women }
}

export function fitColor(fit: number): 'green' | 'orange' | 'red' {
  return fit >= 80 ? 'green' : fit >= 40 ? 'orange' : 'red'
}
