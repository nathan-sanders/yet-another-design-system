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

export function campaignFor(id: string | undefined): Campaign | undefined {
  return campaigns.find((c) => c.id === id)
}
