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
import { NETWORK_NAMES, type Network } from './types'

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

/**
 * How much of two creators' audiences follow both, 0–100. Seeded from the pair,
 * so it is the same whichever side asks, and a shared category counts for a lot:
 * a wellness audience follows other wellness accounts.
 */
export function audienceOverlap(a: BrandCreator, b: BrandCreator): number {
  const pair = [a.id, b.id].sort().join('+')
  const base = 12 + seeded(pair)() * 30
  return Math.round(a.category === b.category ? base + 30 : base)
}

/** The creators nearest this one, most overlapping audience first. */
export function similarCreators(creator: Creator, count = 6): Creator[] {
  return brandCreators
    .filter((c) => c.id !== creator.id)
    .sort((a, b) => audienceOverlap(creator, b) - audienceOverlap(creator, a))
    .slice(0, count)
}

/** One labelled share in an Audience or Content card, percent. */
export interface Share {
  label: string
  share: number
}

export interface CreatorAudience {
  /** Audience growth over the last 30 days, percent. */
  growth: number
  /** Followers Yet believes are real people, percent. */
  authentic: number
  /** Share of followers per age band; sums to 100. */
  ages: Share[]
  /** Women, men and another gender; sums to 100. */
  genders: Share[]
  /** Top five countries, percent of followers. */
  locations: Share[]
  /** What their followers are into, beyond food. */
  interests: string[]
}

const AGE_BANDS = ['18–24', '25–34', '35–44', '45–54', '55+']
const COUNTRIES = ['Canada', 'United Kingdom', 'Australia', 'Germany', 'Mexico', 'Brazil']

const INTERESTS: Record<CreatorCategory, string[]> = {
  Wellness: ['Healthy eating', 'Fitness', 'Yoga', 'Wellness', 'Plant-based', 'Sustainability'],
  'Food & drink': ['Restaurants', 'Home cooking', 'Travel', 'Coffee', 'Baking', 'Street food'],
  Lifestyle: ['Home decor', 'Travel', 'Fashion', 'Entertaining', 'Coffee', 'Parenting'],
  'Meal prep': [
    'Meal prep',
    'Budget living',
    'Fitness',
    'Home cooking',
    'Parenting',
    'Batch cooking',
  ],
  Fitness: ['Fitness', 'Running', 'Nutrition', 'Strength training', 'Wellness', 'Outdoors'],
}

/** Rounded shares can miss 100 by a point or two; the biggest one absorbs it. */
function toHundred(weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0)
  const shares = weights.map((w) => Math.round((w / total) * 100))
  const biggest = shares.indexOf(Math.max(...shares))
  shares[biggest] += 100 - shares.reduce((a, b) => a + b, 0)
  return shares
}

/**
 * Alena's are the file's own (`Full View`, `40005952:23519`); everyone else's
 * are written to her shape, seeded from their id so a creator's audience is the
 * same every visit.
 */
const ALENA_AUDIENCE: CreatorAudience = {
  growth: 3.4,
  authentic: 94,
  ages: [
    { label: '18–24', share: 22 },
    { label: '25–34', share: 41 },
    { label: '35–44', share: 21 },
    { label: '45–54', share: 10 },
    { label: '55+', share: 6 },
  ],
  genders: [
    { label: 'Women', share: 68 },
    { label: 'Men', share: 29 },
    { label: 'Another gender', share: 3 },
  ],
  locations: [
    { label: 'United States', share: 58 },
    { label: 'Canada', share: 9 },
    { label: 'United Kingdom', share: 8 },
    { label: 'Australia', share: 6 },
    { label: 'Germany', share: 4 },
  ],
  interests: [
    'Healthy eating',
    'Fitness',
    'Home cooking',
    'Meal prep',
    'Travel',
    'Wellness',
    'Plant-based',
    'Sustainability',
  ],
}

export function audienceFor(creator: Creator): CreatorAudience {
  if (creator.id === 'alena') return ALENA_AUDIENCE
  const random = seeded(creator.id)
  const ages = toHundred(AGE_BANDS.map((_, i) => [2, 3, 2, 1, 0.6][i] + random()))
  const women = Math.round(52 + random() * 26)
  const another = 1 + Math.round(random() * 3)
  const home = Math.round(48 + random() * 20)
  const abroad = COUNTRIES.slice(0, 4).map((label, i) => ({
    label,
    share: Math.max(2, Math.round((10 - i * 2) * (0.7 + random() * 0.6))),
  }))
  return {
    growth: Math.round((random() * 6 - 0.8) * 10) / 10,
    authentic: Math.round(86 + random() * 11),
    ages: AGE_BANDS.map((label, i) => ({ label, share: ages[i] })),
    genders: [
      { label: 'Women', share: women },
      { label: 'Men', share: 100 - women - another },
      { label: 'Another gender', share: another },
    ],
    locations: [{ label: 'United States', share: home }, ...abroad],
    interests: [...creator.topics.slice(0, 2).map(capitalize), ...INTERESTS[creator.category]]
      .filter((topic, i, all) => all.indexOf(topic) === i)
      .slice(0, 8),
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export type PostFormat = 'Reel' | 'Video' | 'Carousel' | 'Photo'

/** One of the Content tab's top posts. */
export interface CreatorPost {
  photo: string
  caption: string
  format: PostFormat
  network: Network
  /** Days before today it went out. */
  daysAgo: number
  likes: number
  comments: number
  views: number
}

export interface CreatorContent {
  /** Posts in the last 30 days. */
  posts: number
  likes: number
  comments: number
  views: number
  /** Their three best posts of the last 30 days, best first. */
  top: CreatorPost[]
  formats: Share[]
  channels: Share[]
}

const CAPTIONS: Record<CreatorCategory, string[]> = {
  Wellness: [
    'A gut-friendly lunch I make every Monday',
    'Three smoothies that keep me full till noon',
    'What I eat in a day, the honest version',
  ],
  'Food & drink': [
    'Rating every taco on this street',
    'The bakery line was worth it',
    'Recreating a $28 sandwich at home',
  ],
  Lifestyle: [
    'Hosting eight on a Tuesday, no stress',
    'My kitchen reset routine',
    'A slow Sunday brunch spread',
  ],
  'Meal prep': [
    'Five lunches for under $20',
    'One sheet pan, four dinners',
    'Prep with me: freezer breakfast burritos',
  ],
  Fitness: [
    'High-protein bowls after leg day',
    'What I eat before a long run',
    'Five-minute post-workout snacks',
  ],
}

const ALENA_TOP: Omit<CreatorPost, 'photo'>[] = [
  {
    caption: '5 Mediterranean bowls for busy weeknights',
    format: 'Reel',
    network: 'instagram',
    daysAgo: 7,
    likes: 48_200,
    comments: 1_300,
    views: 412_000,
  },
  {
    caption: 'My go-to green smoothie (no banana, promise)',
    format: 'Video',
    network: 'tiktok',
    daysAgo: 11,
    likes: 31_500,
    comments: 884,
    views: 268_000,
  },
  {
    caption: 'Sunday meal prep in 45 minutes, start to finish',
    format: 'Carousel',
    network: 'instagram',
    daysAgo: 14,
    likes: 22_900,
    comments: 517,
    views: 190_000,
  },
]

/**
 * The Content tab (`Full View / Content`, `40005955:24767`). Alena's numbers
 * and posts are the file's; the rest are seeded from reach — followers times
 * engagement — so a bigger, livelier creator gets bigger posts.
 */
export function contentFor(creator: Creator): CreatorContent {
  if (creator.id === 'alena') {
    return {
      posts: 18,
      likes: 24_100,
      comments: 612,
      views: 96_000,
      top: ALENA_TOP.map((post, i) => ({ ...post, photo: creator.posts[i] })),
      formats: [
        { label: 'Reels', share: 52 },
        { label: 'Carousels', share: 31 },
        { label: 'Photos', share: 17 },
      ],
      channels: [
        { label: 'Instagram', share: 61 },
        { label: 'TikTok', share: 28 },
        { label: 'Facebook', share: 11 },
      ],
    }
  }
  const random = seeded(`${creator.id}-content`)
  const reach = creator.followers * (creator.engagement / 100)
  const formats: PostFormat[] = ['Reel', 'Carousel', 'Video']
  const top = CAPTIONS[creator.category].map((caption, i) => {
    const likes = Math.round(reach * (1.6 - i * 0.3) * (0.8 + random() * 0.4))
    return {
      photo: creator.posts[i],
      caption,
      format: formats[i],
      network: creator.channels[i % creator.channels.length].network,
      daysAgo: 3 + i * 4 + Math.round(random() * 3),
      likes,
      comments: Math.round(likes * (0.02 + random() * 0.02)),
      views: Math.round(likes * (7 + random() * 3)),
    }
  })
  const formatShares = toHundred([3 + random(), 2 + random(), 1 + random()])
  const channelShares = toHundred(creator.channels.map((c) => c.followers))
  return {
    posts: 8 + Math.round(random() * 16),
    likes: Math.round(reach * 0.5),
    comments: Math.round(reach * 0.5 * 0.025),
    views: Math.round(reach * 2),
    top,
    formats: ['Reels', 'Carousels', 'Photos'].map((label, i) => ({
      label,
      share: formatShares[i],
    })),
    channels: creator.channels.map((c, i) => ({
      label: NETWORK_NAMES[c.network],
      share: channelShares[i],
    })),
  }
}

export function fitColor(fit: number): 'green' | 'orange' | 'red' {
  return fit >= 80 ? 'green' : fit >= 40 ? 'orange' : 'red'
}
