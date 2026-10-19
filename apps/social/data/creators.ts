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

// Plan › Creators (`40005911:35697`): the creators worth working with. The
// first eight are the file's cards: five are Discover's creators — same people,
// same portraits — and Maya, Jonah and Priya are new. The other ten fill the
// grid out so it reads like a real roster; their faces are inbox contacts with
// creator-like handles. Brand fit is its own score, not Discover's audience
// overlap.

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
  /**
   * Their latest four posts, newest first. The card scrolls through them and
   * the details panel's Content tab lists them. The file draws two per card,
   * the second cut off by the edge, which is what a scrolling strip looks like.
   */
  posts: string[]
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
    posts: [saladBowls, chardLeaves, harvestBowl, celerySalad],
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
    posts: [wraps, takeoutBox, streetCorn, cafeInterior],
    topics: ['baking', 'takeout', 'restaurant reviews', 'street food'],
  },
  {
    id: 'alena',
    name: 'Alena Kenter',
    handle: 'alenakenter',
    followers: 1_200_000,
    fit: 92,
    category: 'Wellness',
    posts: [saladBowl, greenSmoothies, grainBowl, freshVegetables],
    topics: ['smoothies', 'gut health', 'plant-based', 'health', 'wellness'],
  },
  {
    id: 'kaylynn',
    name: 'Kaylynn Dorwart',
    handle: 'kaylynncooks',
    followers: 890_000,
    fit: 47,
    category: 'Lifestyle',
    posts: [pineappleSmoothies, cafeInterior, mangoShavedIce, greenSmoothies],
    topics: ['cafés', 'smoothies', 'trending on social', 'podcasts'],
  },
  {
    id: 'davis',
    name: 'Davis Levin',
    handle: 'davislevin.eats',
    followers: 640_000,
    fit: 81,
    category: 'Food & drink',
    posts: [grainBowl, harvestBowl, wraps, chefChopping],
    topics: ['bowls', 'restaurant reviews', 'lunch', 'protein'],
  },
  {
    id: 'ann',
    name: 'Ann Emery',
    handle: 'annpreps',
    followers: 480_000,
    fit: 74,
    category: 'Meal prep',
    posts: [mealPrepBowls, celerySalad, grainBowl, saladBowls],
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
    posts: [streetCorn, mangoShavedIce, takeoutBox, wraps],
    topics: ['street food', 'desserts', 'trending on social'],
  },
  {
    id: 'carter',
    name: 'Carter Dokidis',
    handle: 'carterdokidis',
    followers: 210_000,
    fit: 56,
    category: 'Fitness',
    posts: [freshVegetables, chefChopping, mealPrepBowls, saladBowl],
    topics: ['fitness', 'protein', 'high-protein', 'health and wellness', 'podcasts'],
  },
  {
    id: 'kaiya',
    name: 'Kaiya Franci',
    handle: 'kaiya_franci',
    followers: 1_500_000,
    fit: 85,
    category: 'Wellness',
    posts: [greenSmoothies, saladBowl, pineappleSmoothies, chardLeaves],
    topics: ['smoothies', 'wellness', 'gut health', 'breakfast', 'health'],
  },
  {
    id: 'mango',
    name: 'Mia Mangold',
    handle: 'mango.mia',
    followers: 1_100_000,
    fit: 52,
    category: 'Lifestyle',
    posts: [mangoShavedIce, pineappleSmoothies, streetCorn, cafeInterior],
    topics: ['desserts', 'smoothies', 'trending on social', 'summer'],
  },
  {
    id: 'cooper',
    name: 'Cooper Lipshutz',
    handle: 'cooper.eats',
    followers: 960_000,
    fit: 68,
    category: 'Food & drink',
    posts: [harvestBowl, wraps, grainBowl, takeoutBox],
    topics: ['restaurant reviews', 'bowls', 'lunch', 'local'],
  },
  {
    id: 'nolan',
    name: 'Nolan Saris',
    handle: 'nolanbakes',
    followers: 730_000,
    fit: 29,
    category: 'Food & drink',
    posts: [cafeInterior, takeoutBox, mangoShavedIce, wraps],
    topics: ['baking', 'cafés', 'desserts', 'pastry'],
  },
  {
    id: 'talan',
    name: 'Talan Torff',
    handle: 'talan_torff',
    followers: 560_000,
    fit: 77,
    category: 'Meal prep',
    posts: [chefChopping, mealPrepBowls, grainBowl, freshVegetables],
    topics: ['meal prep', 'protein', 'high-protein', 'lunch'],
  },
  {
    id: 'maria',
    name: 'Maria Vaccaro',
    handle: 'mariavaccaro',
    followers: 420_000,
    fit: 61,
    category: 'Food & drink',
    posts: [wraps, harvestBowl, chefChopping, saladBowl],
    topics: ['dinner', 'pasta', 'family meals', 'restaurant reviews'],
  },
  {
    id: 'skylar',
    name: 'Skylar Curtis',
    handle: 'skylarcurtis',
    followers: 260_000,
    fit: 90,
    category: 'Fitness',
    posts: [freshVegetables, mealPrepBowls, saladBowls, greenSmoothies],
    topics: ['fitness', 'protein', 'high-protein', 'health and wellness'],
  },
  {
    id: 'dulce',
    name: 'Dulce Kenter',
    handle: 'dulce_kenter',
    followers: 180_000,
    fit: 44,
    category: 'Lifestyle',
    posts: [cafeInterior, pineappleSmoothies, grainBowl, mangoShavedIce],
    topics: ['cafés', 'brunch', 'trending on social', 'restaurant reviews'],
  },
  {
    id: 'lindsey',
    name: 'Lindsey Botosh',
    handle: 'lindsey.bsky.social',
    followers: 140_000,
    fit: 83,
    category: 'Wellness',
    posts: [chardLeaves, celerySalad, saladBowls, greenSmoothies],
    topics: ['plant-based', 'greens', 'salads', 'health', 'sustainability'],
  },
  {
    id: 'lydia',
    name: 'Lydia Vetrovs',
    handle: 'lydia_vetrovs',
    followers: 95_000,
    fit: 72,
    category: 'Meal prep',
    posts: [celerySalad, mealPrepBowls, harvestBowl, chardLeaves],
    topics: ['meal prep', 'budget', 'health', 'salads'],
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
  kaiya: {
    network: 'instagram',
    location: 'Austin, TX',
    topTopic: 'Green smoothies',
    engagement: 4.1,
    peerEngagement: 2.6,
    flaggedPosts: 0,
    collaborations: { count: 18, brands: ['Vital Proteins', 'Olipop'] },
    talkingPoints: ['Green smoothies', 'Morning routines', 'Gut-friendly snacks'],
    channels: [
      { network: 'instagram', handle: '@kaiya_franci', followers: 1_100_000 },
      { network: 'tiktok', handle: '@kaiya_franci', followers: 400_000 },
    ],
  },
  mango: {
    network: 'tiktok',
    location: 'Miami, FL',
    topTopic: 'Tropical treats',
    engagement: 5.6,
    peerEngagement: 3.1,
    flaggedPosts: 1,
    collaborations: { count: 10, brands: ['Dole', 'Spindrift'] },
    talkingPoints: ['Tropical treats', 'Beach picnics', 'Summer drinks'],
    channels: [
      { network: 'tiktok', handle: '@mango.mia', followers: 850_000 },
      { network: 'instagram', handle: '@mango.mia', followers: 250_000 },
    ],
  },
  cooper: {
    network: 'tiktok',
    location: 'Denver, CO',
    topTopic: 'Denver food spots',
    engagement: 3.4,
    peerEngagement: 2.9,
    flaggedPosts: 1,
    collaborations: { count: 12, brands: ['Sweetgreen', 'Toast'] },
    talkingPoints: ['Denver food spots', 'Lunch bowls', 'Restaurant openings'],
    channels: [
      { network: 'tiktok', handle: '@cooper.eats', followers: 700_000 },
      { network: 'instagram', handle: '@cooper.eats', followers: 260_000 },
    ],
  },
  nolan: {
    network: 'instagram',
    location: 'Seattle, WA',
    topTopic: 'Weekend bakes',
    engagement: 2.2,
    peerEngagement: 2.9,
    flaggedPosts: 2,
    collaborations: { count: 7, brands: ['King Arthur', 'Nespresso'] },
    talkingPoints: ['Weekend bakes', 'Laminated dough', 'Café crawls'],
    channels: [
      { network: 'instagram', handle: '@nolanbakes', followers: 520_000 },
      { network: 'tiktok', handle: '@nolanbakes', followers: 210_000 },
    ],
  },
  talan: {
    network: 'instagram',
    location: 'Chicago, IL',
    topTopic: 'Five-day lunch prep',
    engagement: 3.6,
    peerEngagement: 2.5,
    flaggedPosts: 0,
    collaborations: { count: 9, brands: ['Factor', 'Pyrex'] },
    talkingPoints: ['Five-day lunch prep', 'Macro-friendly bowls', 'Freezer meals'],
    channels: [
      { network: 'instagram', handle: '@talan_torff', followers: 400_000 },
      { network: 'tiktok', handle: '@talan_torff', followers: 160_000 },
    ],
  },
  maria: {
    network: 'instagram',
    location: 'Philadelphia, PA',
    topTopic: 'Italian-American weeknights',
    engagement: 3.0,
    peerEngagement: 2.9,
    flaggedPosts: 0,
    collaborations: { count: 6, brands: ["Rao's", 'Barilla'] },
    talkingPoints: ['Italian-American weeknights', 'Sunday sauce', 'Family dinners'],
    channels: [
      { network: 'instagram', handle: '@mariavaccaro', followers: 330_000 },
      { network: 'facebook', handle: 'Maria Vaccaro', followers: 90_000 },
    ],
  },
  skylar: {
    network: 'tiktok',
    location: 'Nashville, TN',
    topTopic: 'Post-workout bowls',
    engagement: 5.9,
    peerEngagement: 3.8,
    flaggedPosts: 0,
    collaborations: { count: 4, brands: ['Huel', 'Chobani'] },
    talkingPoints: ['Post-workout bowls', 'Protein swaps', 'Training-day meals'],
    channels: [
      { network: 'tiktok', handle: '@skylarcurtis', followers: 200_000 },
      { network: 'instagram', handle: '@skylarcurtis', followers: 60_000 },
    ],
  },
  dulce: {
    network: 'instagram',
    location: 'Chicago, IL',
    topTopic: 'Brunch spots',
    engagement: 3.3,
    peerEngagement: 2.8,
    flaggedPosts: 0,
    collaborations: { count: 5, brands: ['OpenTable', 'Califia'] },
    talkingPoints: ['Brunch spots', 'Café openings', 'Weekend plans'],
    channels: [
      { network: 'instagram', handle: '@dulce_kenter', followers: 140_000 },
      { network: 'tiktok', handle: '@dulce_kenter', followers: 40_000 },
    ],
  },
  lindsey: {
    network: 'bluesky',
    location: 'Boston, MA',
    topTopic: 'Seasonal greens',
    engagement: 4.4,
    peerEngagement: 2.6,
    flaggedPosts: 0,
    collaborations: { count: 3, brands: ['Misfits Market', 'Thrive Market'] },
    talkingPoints: ['Seasonal greens', 'Farmers market hauls', 'Low-waste cooking'],
    channels: [
      { network: 'bluesky', handle: '@lindsey.bsky.social', followers: 90_000 },
      { network: 'instagram', handle: '@lindseybotosh', followers: 50_000 },
    ],
  },
  lydia: {
    network: 'instagram',
    location: 'Minneapolis, MN',
    topTopic: 'Budget meal prep',
    engagement: 4.6,
    peerEngagement: 2.5,
    flaggedPosts: 0,
    collaborations: { count: 2, brands: ['Aldi', 'Ziploc'] },
    talkingPoints: ['Budget meal prep', 'Grocery hauls', 'Batch cooking'],
    channels: [
      { network: 'instagram', handle: '@lydia_vetrovs', followers: 70_000 },
      { network: 'tiktok', handle: '@lydia_vetrovs', followers: 25_000 },
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
