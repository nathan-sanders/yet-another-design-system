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
import proteinPlates from '../assets/photos/protein-plates.jpg'
import saladBowl from '../assets/photos/salad-bowl.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'
import takeoutBox from '../assets/photos/takeout-box.jpg'
import wraps from '../assets/photos/wraps.jpg'
import greenSmoothiesClip from '../assets/videos/green-smoothies.webm'
import harvestBowlClip from '../assets/videos/harvest-bowl.webm'
import marketVegClip from '../assets/videos/market-veg.webm'
import wrapsClip from '../assets/videos/wraps.webm'
import veggieVault from '../assets/veggie-vault.png'
import { addDays, startOfDay } from './dates'

/**
 * Plan › Asset library's data: a folder tree and the files in it. Figma
 * `Plan - Asset Library` (`40006104:39766`) and its details frame
 * (`40006105:40365`).
 */

/** A folder; `parentId` is absent at the top level. */
export interface AssetFolder {
  id: string
  name: string
  parentId?: string
  /** The campaign it holds files for (`data/ideas.ts`); subfolders inherit it. */
  campaignId?: string
}

/** What the file is, as the card's meta line says it: `Image · …`. */
export type AssetKind = 'image' | 'video' | 'graphic'

/** Where the file came from, when it was not uploaded here. */
export type AssetSource = 'upload' | 'canva' | 'drive' | 'dropbox'

export const SOURCE_NAMES: Record<AssetSource, string> = {
  upload: 'Uploaded',
  canva: 'Canva',
  drive: 'Google Drive',
  dropbox: 'Dropbox',
}

/** A creator's license on their own content. */
export interface AssetRights {
  /** A creator id in `data/creators.ts`. */
  creatorId: string
  endsAt: Date
  terms: string
}

export interface Asset {
  id: string
  name: string
  kind: AssetKind
  /** The file, or for a seeded video its poster frame (`videoSrc` is the video). */
  src: string
  /**
   * A seeded video's playable file, for the lightbox. The clips are short pans
   * over the poster photo, made for the mock; an uploaded video is `src`.
   */
  videoSrc?: string
  /** How `src` draws: an uploaded video is a `<video>`, everything else an image. */
  preview: 'image' | 'video'
  alt: string
  /** `null` is the library's root: in no folder, and still in All assets. */
  folderId: string | null
  source: AssetSource
  /** A person id (`data/people.ts`), or a creator id when `rights` is set. */
  addedBy: string
  addedAt: Date
  sizeBytes: number
  width?: number
  height?: number
  durationSec?: number
  tags: string[]
  favorite: boolean
  rights?: AssetRights
  /** Set while an upload is in flight; `progress` runs 0–1. */
  upload?: { progress: number }
}

export const folders: AssetFolder[] = [
  { id: 'summer-menu', name: 'Summer Menu 2026', campaignId: 'summer-menu' },
  { id: 'hero-shots', name: 'Hero shots', parentId: 'summer-menu' },
  { id: 'menu-boards', name: 'Menu boards', parentId: 'summer-menu' },
  { id: 'reels', name: 'Reels', parentId: 'summer-menu' },
  { id: 'raw-footage', name: 'Raw footage', parentId: 'reels' },
  { id: 'final-cuts', name: 'Final cuts', parentId: 'reels' },
  { id: 'smoothie-week', name: 'Smoothie Week' },
  { id: 'brand-kit', name: 'Brand kit' },
  { id: 'logos', name: 'Logos', parentId: 'brand-kit' },
  { id: 'colors-type', name: 'Colors & type', parentId: 'brand-kit' },
  { id: 'creator-content', name: 'Creator content' },
  { id: 'stores-team', name: 'Stores & team' },
]

const today = startOfDay(new Date())
const daysAgo = (n: number) => addDays(today, -n)

type Seed = Omit<Asset, 'favorite' | 'tags' | 'preview'> & {
  favorite?: boolean
  tags?: string[]
}

const seeds: Seed[] = [
  {
    id: 'a-street-corn',
    name: 'priya-lal-street-corn.jpg',
    kind: 'image',
    src: streetCorn,
    alt: 'Grilled street corn with lime on a plate',
    folderId: 'summer-menu',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(3),
    sizeBytes: 3_200_000,
    width: 1600,
    height: 2400,
    tags: ['street corn', 'grill', 'summer menu', 'close-up'],
    favorite: true,
    rights: {
      creatorId: 'priya',
      endsAt: addDays(today, 9),
      terms: 'Licensed for organic posts. Paid use needs her approval.',
    },
  },
  {
    id: 'a-salad-bowls',
    name: 'bowls-overhead-flatlay.jpg',
    kind: 'image',
    src: saladBowls,
    alt: 'Four salad bowls on a table, from above',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(1),
    sizeBytes: 4_100_000,
    width: 1600,
    height: 2400,
    tags: ['bowls', 'overhead', 'summer menu'],
    favorite: true,
  },
  {
    id: 'a-harvest-bowl',
    name: 'harvest-bowl-pour.mp4',
    kind: 'video',
    src: harvestBowl,
    videoSrc: harvestBowlClip,
    alt: 'A harvest bowl with squash and greens',
    folderId: 'final-cuts',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(2),
    sizeBytes: 48_000_000,
    width: 1080,
    height: 1620,
    durationSec: 8,
    tags: ['bowls', 'reel'],
  },
  {
    id: 'a-chef-chopping',
    name: 'kitchen-prep-mushrooms.jpg',
    kind: 'image',
    src: chefChopping,
    alt: 'A chef chopping herbs beside sliced mushrooms',
    folderId: 'stores-team',
    source: 'upload',
    addedBy: 'dana',
    addedAt: daysAgo(4),
    sizeBytes: 2_800_000,
    width: 1600,
    height: 2400,
    tags: ['kitchen', 'behind the scenes'],
  },
  {
    id: 'a-pineapple',
    name: 'smoothie-week-hero.png',
    kind: 'graphic',
    src: pineappleSmoothies,
    alt: 'Two pineapple smoothies with straws',
    folderId: 'smoothie-week',
    source: 'canva',
    addedBy: 'katie',
    addedAt: daysAgo(5),
    sizeBytes: 1_400_000,
    width: 1600,
    height: 2400,
    tags: ['smoothies', 'smoothie week'],
  },
  {
    id: 'a-chard',
    name: 'priya-lal-chard.jpg',
    kind: 'image',
    src: chardLeaves,
    alt: 'Rainbow chard leaves with water drops',
    folderId: 'creator-content',
    source: 'upload',
    addedBy: 'priya',
    addedAt: daysAgo(12),
    sizeBytes: 2_200_000,
    width: 1600,
    height: 2400,
    tags: ['greens', 'creator'],
    rights: {
      creatorId: 'priya',
      endsAt: addDays(today, 9),
      terms: 'Licensed for organic posts. Paid use needs her approval.',
    },
  },
  {
    id: 'a-celery',
    name: 'green-goddess-salad.jpg',
    kind: 'image',
    src: celerySalad,
    alt: 'A celery and herb salad in a bowl',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(6),
    sizeBytes: 3_600_000,
    width: 1600,
    height: 2400,
    tags: ['salad', 'summer menu'],
  },
  {
    id: 'a-vegetables',
    name: 'market-veg-timelapse.mov',
    kind: 'video',
    src: freshVegetables,
    videoSrc: marketVegClip,
    alt: 'Fresh vegetables on a counter',
    folderId: 'raw-footage',
    source: 'upload',
    addedBy: 'dana',
    addedAt: daysAgo(8),
    sizeBytes: 160_000_000,
    width: 1080,
    height: 1620,
    durationSec: 10,
    tags: ['market', 'b-roll'],
  },
  {
    id: 'a-grain-bowl',
    name: 'rice-bowl-hero.png',
    kind: 'image',
    src: grainBowl,
    alt: 'A grain bowl with roasted vegetables',
    folderId: 'menu-boards',
    source: 'drive',
    addedBy: 'katie',
    addedAt: daysAgo(9),
    sizeBytes: 5_000_000,
    width: 2400,
    height: 1600,
    tags: ['bowls', 'menu board'],
  },
  {
    id: 'a-cafe',
    name: 'storefront-interior.jpg',
    kind: 'image',
    src: cafeInterior,
    alt: 'The café, empty, in morning light',
    folderId: 'stores-team',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(15),
    sizeBytes: 3_900_000,
    width: 1600,
    height: 2400,
    tags: ['store', 'Brooklyn'],
  },
  {
    id: 'a-wraps',
    name: 'maya-okafor-wrap.mp4',
    kind: 'video',
    src: wraps,
    videoSrc: wrapsClip,
    alt: 'Two wraps cut in half on a board',
    folderId: 'creator-content',
    source: 'upload',
    addedBy: 'maya',
    addedAt: daysAgo(40),
    sizeBytes: 36_000_000,
    width: 1080,
    height: 1620,
    durationSec: 8,
    tags: ['wraps', 'creator'],
    rights: {
      creatorId: 'maya',
      endsAt: addDays(today, -3),
      terms: 'Licensed for organic posts until the end of the Wellness campaign.',
    },
  },
  {
    id: 'a-salad-bowl',
    name: 'rainbow-salad-03.jpg',
    kind: 'image',
    src: saladBowl,
    alt: 'A rainbow salad with radishes',
    folderId: 'summer-menu',
    source: 'dropbox',
    addedBy: 'dana',
    addedAt: daysAgo(10),
    sizeBytes: 2_600_000,
    width: 1600,
    height: 2400,
    tags: ['salad'],
  },
  {
    id: 'a-green-smoothies',
    name: 'green-smoothie-pour.mp4',
    kind: 'video',
    src: greenSmoothies,
    videoSrc: greenSmoothiesClip,
    alt: 'Green smoothies in tall glasses',
    folderId: 'smoothie-week',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(7),
    sizeBytes: 22_000_000,
    width: 1080,
    height: 1620,
    durationSec: 6,
    tags: ['smoothies', 'reel'],
  },
  {
    id: 'a-mango',
    name: 'mango-shaved-ice.jpg',
    kind: 'image',
    src: mangoShavedIce,
    alt: 'Mango shaved ice with syrup',
    folderId: 'smoothie-week',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(11),
    sizeBytes: 2_900_000,
    width: 2400,
    height: 1600,
    tags: ['dessert', 'smoothie week'],
  },
  {
    id: 'a-meal-prep',
    name: 'meal-prep-bowls.jpg',
    kind: 'image',
    src: mealPrepBowls,
    alt: 'Meal prep bowls with rice, tofu and greens',
    folderId: null,
    source: 'upload',
    addedBy: 'dana',
    addedAt: daysAgo(0),
    sizeBytes: 3_100_000,
    width: 2000,
    height: 2000,
    tags: ['bowls'],
  },
  {
    id: 'a-protein-plates',
    name: 'protein-plates-trio.jpg',
    kind: 'image',
    src: proteinPlates,
    alt: 'Three protein plates side by side',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(13),
    sizeBytes: 3_400_000,
    width: 2000,
    height: 2000,
    tags: ['plates', 'summer menu'],
  },
  {
    id: 'a-takeout',
    name: 'takeout-box.jpg',
    kind: 'image',
    src: takeoutBox,
    alt: 'An open takeout box of grain salad',
    folderId: null,
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(20),
    sizeBytes: 2_400_000,
    width: 1600,
    height: 2400,
    tags: ['takeout'],
  },
  {
    id: 'a-logo',
    name: 'veggie-vault-logo.png',
    kind: 'graphic',
    src: veggieVault,
    alt: 'The Veggie Vault logo',
    folderId: 'logos',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(60),
    sizeBytes: 180_000,
    width: 1024,
    height: 1024,
    tags: ['logo', 'brand'],
    favorite: true,
  },
  // Summer Menu's other six, so the folder holds the campaign page's 14
  // (`40006187:43721`). Names are the file's; pictures and clips are reused.
  {
    id: 'a-mango-chili',
    name: 'mango-chili-grain-bowl.jpg',
    kind: 'image',
    src: saladBowl,
    alt: 'A colorful grain bowl from above',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(12),
    sizeBytes: 3_600_000,
    width: 1600,
    height: 2400,
    tags: ['bowls', 'summer menu', 'mango'],
  },
  {
    id: 'a-mango-build',
    name: 'mango-bowl-build-along.mp4',
    kind: 'video',
    src: saladBowls,
    videoSrc: marketVegClip,
    alt: 'Bowls being built on a counter',
    folderId: 'raw-footage',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(2),
    sizeBytes: 48_000_000,
    width: 1080,
    height: 1920,
    durationSec: 42,
    tags: ['reel', 'summer menu', 'build-along'],
  },
  {
    id: 'a-citrus-crunch',
    name: 'citrus-crunch-salad.jpg',
    kind: 'image',
    src: streetCorn,
    alt: 'Grilled street corn with lime on a plate',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(11),
    sizeBytes: 2_900_000,
    width: 1600,
    height: 2400,
    tags: ['citrus crunch', 'summer menu'],
  },
  {
    id: 'a-pineapple',
    name: 'pineapple-sunrise-smoothie.jpg',
    kind: 'image',
    src: mangoShavedIce,
    alt: 'Mango shaved ice with a spoon',
    folderId: 'hero-shots',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(11),
    sizeBytes: 2_400_000,
    width: 1600,
    height: 2400,
    tags: ['smoothie', 'summer menu'],
  },
  {
    id: 'a-alena-tiktok',
    name: 'alena-kenter-bowl-tiktok.mp4',
    kind: 'video',
    src: freshVegetables,
    videoSrc: marketVegClip,
    alt: 'Fresh vegetables on a counter',
    folderId: 'final-cuts',
    source: 'upload',
    addedBy: 'katie',
    addedAt: daysAgo(4),
    sizeBytes: 31_000_000,
    width: 1080,
    height: 1920,
    durationSec: 38,
    tags: ['creator', 'tiktok', 'summer menu'],
    rights: {
      creatorId: 'alena',
      endsAt: addDays(today, 60),
      terms: 'Licensed for the Summer Menu campaign, organic and paid.',
    },
  },
  {
    id: 'a-ten-minute',
    name: 'ten-minute-bowl-challenge.mp4',
    kind: 'video',
    src: takeoutBox,
    videoSrc: wrapsClip,
    alt: 'A bowl in a takeout box',
    folderId: 'final-cuts',
    source: 'upload',
    addedBy: 'nathan',
    addedAt: daysAgo(6),
    sizeBytes: 52_000_000,
    width: 1080,
    height: 1920,
    durationSec: 58,
    tags: ['reel', 'challenge', 'summer menu'],
  },
]

export const seedAssets: Asset[] = seeds.map((seed) => ({
  ...seed,
  preview: 'image',
  favorite: seed.favorite ?? false,
  tags: seed.tags ?? [],
}))
