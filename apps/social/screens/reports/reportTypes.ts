import {
  Activity,
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  Newspaper,
  Radar,
  Siren,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import type { BadgeProps } from '../../../../src/components/Badge'
import type { ReportKind, ReportType, WidgetSources } from '../../data/types'

/** One option on New report's first step. */
export interface ReportTypeOption {
  value: ReportType
  label: string
  icon: LucideIcon
  /**
   * The badge it wears in the picker and the Reports table, one hue per type.
   * Pink, blue and green are left to the reports that have no type (topic,
   * custom and built-in), so a typed report never reads as one of those.
   */
  color: NonNullable<BadgeProps['color']>
  /** One sentence: what the report answers. */
  description: string
  /** The widgets it opens with, by title, for the card's "Includes" line. */
  includes: string[]
  /** The name the setup step starts from. */
  name: string
  /** What it tracks until somebody changes it, first the subject. */
  topics: string[]
  sources: WidgetSources
  /** The list's badge: a topic monitor or a custom report. */
  kind: Exclude<ReportKind, 'builtin'>
  /** What the setup step's Topics field asks for. */
  topicsHint: string
}

/**
 * New report's types, in the picker's order. Media monitoring comes first
 * because it is the one this flow was built for (NewsWhip Spike's real-time
 * monitoring); Blank comes last because it is the way out of the others.
 */
export const REPORT_TYPES: ReportTypeOption[] = [
  {
    value: 'media',
    label: 'Media monitoring',
    icon: Newspaper,
    color: 'sky',
    description: 'New articles and posts as they are found, and which ones are about to matter.',
    includes: ['Live feed', 'Media vs public interest', 'Spike alerts', 'Top outlets'],
    name: 'Veggie Vault in the news',
    topics: ['Veggie Vault'],
    sources: 'all',
    kind: 'topic',
    topicsHint: 'The brands, products or people to watch the coverage of.',
  },
  {
    value: 'listening',
    label: 'Topic / social listening',
    icon: Radar,
    color: 'purple',
    description: 'What people are saying about a theme, how they feel, and who is saying it.',
    includes: ['Mentions over time', 'Sentiment', 'Top voices', 'Top stories'],
    name: 'Plant-based conversation',
    topics: ['#PlantBased', 'Meal prep', 'Protein bowls'],
    sources: 'social',
    kind: 'topic',
    topicsHint: 'Keywords, hashtags or themes. Each one is a line on the trend.',
  },
  {
    value: 'competitive',
    label: 'Competitive / share of voice',
    icon: BarChart3,
    color: 'orange',
    description:
      'How much of the conversation you own against your rivals, and where they are winning.',
    includes: ['Share of voice', 'Engagement by brand', 'Mentions by brand', 'Top stories'],
    name: 'Share of voice',
    topics: ['Veggie Vault', 'GreenCrate', 'Sprout & Co', 'Harvest Box'],
    sources: 'all',
    kind: 'custom',
    topicsHint: 'Your brand first, then the competitors to measure it against.',
  },
  {
    value: 'crisis',
    label: 'Crisis / issue tracker',
    icon: Siren,
    color: 'red',
    description:
      'One story or issue: how fast it is spreading, who is amplifying it, and how it is landing.',
    includes: ['How the story is spreading', 'Spike alerts', 'Sentiment', 'Latest coverage'],
    name: 'Compostable packaging questions',
    topics: ['Compostable'],
    sources: 'all',
    kind: 'topic',
    topicsHint: 'The issue to follow. One keyword usually says it.',
  },
  {
    value: 'campaign',
    label: 'Campaign / event',
    icon: CalendarRange,
    color: 'amber',
    description:
      'The coverage and conversation a launch or event earned, against the weeks before it.',
    includes: ['Mentions over time', 'Reach by topic', 'Top voices', 'Earned coverage'],
    name: 'Summer Menu launch',
    topics: ['Summer menu', 'Mango Chili Bowl', 'Smoothie Week'],
    sources: 'all',
    kind: 'custom',
    topicsHint: 'The campaign’s name, hashtags and products.',
  },
  {
    value: 'trend',
    label: 'Trend',
    icon: TrendingUp,
    color: 'lime',
    description: 'Topics climbing near your brand, and the stories pushing them up.',
    includes: [
      'Trending near your brand',
      'Topic growth',
      'Share of conversation',
      'Stories driving it',
    ],
    name: 'Emerging food trends',
    topics: ['Gut health', 'Vegan snacks', 'Zero waste'],
    sources: 'all',
    kind: 'topic',
    topicsHint: 'The trends to size against each other.',
  },
  {
    value: 'performance',
    label: 'Social performance',
    icon: Activity,
    color: 'indigo',
    description: 'How your own profiles and posts are doing, network by network.',
    includes: ['Overview', 'Engagement by network', 'Network breakdown', 'Your top posts'],
    name: 'Veggie Vault social performance',
    topics: ['Veggie Vault'],
    sources: 'social',
    kind: 'custom',
    topicsHint: 'The brand whose profiles to report on.',
  },
  {
    value: 'blank',
    label: 'Blank',
    icon: LayoutDashboard,
    color: 'neutral',
    description: 'Start from an empty board and add the widgets you want.',
    includes: [],
    name: 'Untitled report',
    topics: ['Veggie Vault'],
    sources: 'all',
    kind: 'custom',
    topicsHint: 'What the widgets you add will chart, to start with.',
  },
]

export function reportTypeFor(value: string | null | undefined): ReportTypeOption | undefined {
  return REPORT_TYPES.find((t) => t.value === value)
}
