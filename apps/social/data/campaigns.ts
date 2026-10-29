import saladBowl from '../assets/photos/salad-bowl.jpg'
import type { Campaign } from './types'

/**
 * Plan › Campaigns (`40006170:39473`, `40006178:41785`): the seven campaigns,
 * in the file's order. Days are counted from the Wednesday the timeline's
 * today line sits on (Oct 28 in the file), so "Oct 5 – Oct 26" is −23 to −2.
 * The counts and totals are the file's; the trend series are written to end on
 * each total's shape, since Figma draws one curve for all three.
 */
export const campaigns: Campaign[] = [
  {
    id: 'creator-kitchen',
    name: 'Creator Kitchen',
    color: 'blue',
    status: 'live',
    start: -57,
    end: null,
    channels: ['tiktok', 'instagram'],
    ownerId: 'dana',
    scheduled: 4,
    planned: 6,
    engagements: { total: 8_900, series: [120, 260, 410, 900, 1_600, 2_100, 2_250, 2_300] },
    // Code-first, like every campaign but Summer Menu: enough to show a page
    // that has some of its blocks and says which it doesn't.
    targets: { engagements: 12_000 },
    creators: [
      {
        creatorId: 'alena',
        network: 'tiktok',
        role: 'Host',
        work: [{ id: 'w-ck-1', title: 'Episode 5: the lentil stack', day: 5, status: 'due' }],
        deliverables: 4,
        fee: 4_000,
        status: 'live',
      },
      {
        creatorId: 'davis',
        network: 'instagram',
        role: 'Guest cook',
        deliverables: 1,
        fee: 1_500,
        status: 'confirmed',
      },
    ],
  },
  {
    id: 'fall-harvest-bowls',
    name: 'Fall Harvest Bowls',
    color: 'yellow',
    status: 'wrapping-up',
    start: -23,
    end: -2,
    channels: ['instagram', 'facebook'],
    ownerId: 'katie',
    scheduled: 14,
    planned: 14,
    engagements: { total: 21_300, series: [400, 1_100, 2_300, 4_800, 6_900, 7_400, 7_600, 7_700] },
  },
  {
    id: 'summer-menu',
    name: 'Summer Menu',
    color: 'green',
    status: 'live',
    start: -9,
    end: 4,
    channels: ['instagram', 'tiktok', 'facebook'],
    ownerId: 'nathan',
    scheduled: 9,
    planned: 18,
    engagements: { total: 12_600, series: [300, 700, 1_500, 2_900, 3_800, 4_100, 4_300, 4_400] },
    // The campaign page (`40006129:38303`), word for word.
    brief: {
      goal: 'Launch the summer menu and get regulars to try the three new bowls in the first two weeks.',
      audience:
        'Lunch regulars aged 25–40 in our delivery zones — plant-curious, not strictly vegan.',
      keyMessage: 'Summer in a bowl: bright, filling and ready in ten minutes.',
      hashtags: ['#SummerMenu', '#VeggieVault', '#BowlSeason'],
      tags: ['Mango Chili Grain Bowl', 'Citrus Crunch Salad', 'Pineapple Sunrise Smoothie'],
      do: [
        'Show the bowl being made, start to finish',
        'Tag @veggievault and use #SummerMenu',
        'Mention the ten-minute ready time',
      ],
      dont: [
        'Call any bowl “healthy” or make nutrition claims',
        'Show competitor packaging',
        'Use trending audio without clearing it',
      ],
    },
    targets: {
      reach: { actual: 168_000, target: 250_000 },
      engagements: 12_000,
      linkClicks: { actual: 1_100, target: 1_800 },
    },
    budget: 10_000,
    // The Creators tab (`40006187:42949`). Due days sit inside the run, which ends on day 4.
    creators: [
      {
        creatorId: 'alena',
        network: 'tiktok',
        role: 'Lead creator',
        deliverables: 2,
        fee: 2_500,
        status: 'live',
        work: [
          {
            id: 'w-alena-1',
            title: 'Trying every Summer Menu bowl',
            day: -4,
            status: 'posted',
            time: '16:00',
            photo: saladBowl,
            photoAlt: 'A salad bowl from above',
          },
          { id: 'w-alena-2', title: 'Second TikTok: bowl ranking', day: 1, status: 'due' },
        ],
      },
      {
        creatorId: 'jonah',
        network: 'instagram',
        role: 'Recipe creator',
        deliverables: 2,
        fee: 2_500,
        status: 'confirmed',
        work: [{ id: 'w-jonah-1', title: 'Wrap-and-go Reel', day: 3, status: 'due' }],
      },
      {
        creatorId: 'davis',
        network: 'instagram',
        role: 'Taste tester',
        deliverables: 1,
        fee: 2_500,
        status: 'invited',
        // Not on the plan until he says yes; the date is the offer's.
        work: [{ id: 'w-davis-1', title: 'Blind taste test', day: 4, status: 'due' }],
      },
    ],
    insight:
      'Instagram Reels are doing the work — the Mango Chili Grain Bowl reel drove 41% of engagements so far.',
  },
  {
    id: 'protein-plates-launch',
    name: 'Protein Plates launch',
    color: 'purple',
    status: 'planning',
    start: 7,
    end: 20,
    channels: ['instagram', 'tiktok', 'threads'],
    ownerId: 'nathan',
    scheduled: 4,
    planned: 12,
    brief: {
      goal: 'Put the three protein plates in front of the gym crowd before January.',
      audience: 'Weekday lunch customers who train — the 6 am and noon classes near both stores.',
      keyMessage: '30 grams of protein, no shake required.',
      hashtags: ['#ProteinPlates', '#VeggieVault'],
      tags: ['Tofu Power Plate', 'Lentil Stack', 'Tempeh Crunch'],
      do: ['Show the plate next to a workout, not instead of one', 'Say the protein number'],
      dont: ['Compare to meat by name', 'Use before-and-after bodies'],
    },
  },
  {
    id: 'seasonal-items',
    name: 'Seasonal Items',
    color: 'orange',
    status: 'planning',
    start: 21,
    end: 48,
    channels: ['instagram', 'facebook', 'x'],
    ownerId: 'katie',
    scheduled: 1,
    planned: 20,
  },
  {
    id: 'holiday-gift-cards',
    name: 'Holiday Gift Cards',
    color: 'red',
    status: 'planning',
    start: 34,
    end: 64,
    channels: ['instagram', 'facebook', 'threads'],
    ownerId: 'dana',
    scheduled: 0,
    planned: 10,
  },
  {
    id: 'austin-store-opening',
    name: 'Austin store opening',
    color: 'pink',
    status: 'planning',
    start: 76,
    end: 89,
    channels: ['instagram', 'facebook'],
    ownerId: 'nathan',
    scheduled: 0,
    planned: 8,
  },
]

/**
 * The seed, by id. Screens read the live list from `useCampaigns()`, where a
 * campaign can be cancelled; this is for the places that only need the seed —
 * a name on an idea card, the composer's Campaign field.
 */
export function campaignFor(id: string | undefined): Campaign | undefined {
  return campaigns.find((c) => c.id === id)
}
