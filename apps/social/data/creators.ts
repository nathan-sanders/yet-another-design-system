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

export const brandCreators: BrandCreator[] = drawn.map((c) => ({
  ...c,
  avatar: c.avatar ?? customerFor(c.id).avatar,
}))

export function fitColor(fit: number): 'green' | 'orange' | 'red' {
  return fit >= 80 ? 'green' : fit >= 40 ? 'orange' : 'red'
}
