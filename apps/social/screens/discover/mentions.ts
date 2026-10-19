import {
  DISCOVER_RANGES,
  creators,
  opportunities,
  rangeScale,
  sentimentSplit,
  trends,
  visualTrends,
  type Creator,
  type DiscoverRange,
  type Theme,
  type Trend,
  type VisualTrend,
} from '../../data/discover'
import type { MentionQuery } from '../../data/mentions'
import { seeded } from '../../data/performance'
import type { MentionSentiment } from '../../data/types'

// The mentions behind each number on Measure › Discover. Every count here is
// the one the widget prints, at the page's range, so the panel's total and
// the number clicked always agree.

/** Veggie Vault's mentions in 7 days: Brand Pulse's 1.4K a day. The gauge splits these. */
const BRAND_WEEK_MENTIONS = 9_800

/** Posts in the brand's space in 7 days; a visual trend is its share of them. */
const SPACE_WEEK_POSTS = 36_000

const HOURS: Record<DiscoverRange, number> = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }

const SENTIMENT_LABEL: Record<MentionSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

function base(range: DiscoverRange, key: string, widget: string) {
  const label = DISCOVER_RANGES.find((r) => r.value === range)!.label
  return {
    key: `discover|${key}|${range}`,
    context: `${widget} · ${label}`,
    withinHours: HOURS[range],
  }
}

const scaled = (count: number, range: DiscoverRange) =>
  Math.max(1, Math.round(count * rangeScale(range)))

// Trending near your brand

export const trendQuery = (trend: Trend, range: DiscoverRange): MentionQuery => ({
  ...base(range, `trend|${trend.id}`, 'Trending near your brand'),
  title: trend.title,
  total: scaled(trend.posts, range),
  noun: 'posts',
  angle: { kind: 'trend', id: trend.id },
})

export const trendsQuery = (range: DiscoverRange): MentionQuery => ({
  ...base(range, 'trends', 'Trending near your brand'),
  title: 'Trending near your brand',
  total: trends.reduce((sum, t) => sum + scaled(t.posts, range), 0),
  noun: 'posts',
  angle: { kind: 'trends' },
})

// Creators your audience follows, and Opportunities to engage

/** How often a creator mentions the brand in a week: a seeded handful each. */
const creatorWeekMentions = (creator: Creator) =>
  3 + Math.round(seeded(`${creator.id}|mentions`)() * 18)

export const creatorQuery = (
  creator: Creator,
  range: DiscoverRange,
  widget: string,
): MentionQuery => ({
  ...base(range, `creator|${creator.id}`, widget),
  title: creator.name,
  total: scaled(creatorWeekMentions(creator), range),
  noun: 'mentions',
  angle: { kind: 'authors', ids: [creator.id] },
  creatorId: creator.id,
})

export const creatorsQuery = (range: DiscoverRange): MentionQuery => ({
  ...base(range, 'creators', 'Creators your audience follows'),
  title: 'Creators your audience follows',
  total: creators.reduce((sum, c) => sum + scaled(creatorWeekMentions(c), range), 0),
  noun: 'mentions',
  angle: { kind: 'authors', ids: creators.map((c) => c.id) },
})

export const opportunitiesQuery = (range: DiscoverRange): MentionQuery => {
  const authors = creators.filter((c) => opportunities.some((o) => o.creatorId === c.id))
  return {
    ...base(range, 'opportunities', 'Opportunities to engage'),
    title: 'Opportunities to engage',
    total: authors.reduce((sum, c) => sum + scaled(creatorWeekMentions(c), range), 0),
    noun: 'mentions',
    angle: { kind: 'authors', ids: authors.map((c) => c.id) },
  }
}

// Visual trends in your space

const visualPosts = (visual: VisualTrend, range: DiscoverRange) =>
  scaled((visual.share / 100) * SPACE_WEEK_POSTS, range)

export const visualQuery = (visual: VisualTrend, range: DiscoverRange): MentionQuery => ({
  ...base(range, `visual|${visual.id}`, 'Visual trends in your space'),
  title: visual.title,
  total: visualPosts(visual, range),
  noun: 'posts',
  angle: { kind: 'visual', id: visual.id },
})

export const visualsQuery = (range: DiscoverRange): MentionQuery => ({
  ...base(range, 'visuals', 'Visual trends in your space'),
  title: 'Visual trends in your space',
  total: visualTrends.reduce((sum, v) => sum + visualPosts(v, range), 0),
  noun: 'posts',
  angle: { kind: 'visuals' },
})

// Brand sentiment

/** A sentiment's mentions: its share of the gauge, of the brand's mentions in the range. */
export const sentimentCount = (sentiment: MentionSentiment, range: DiscoverRange) =>
  scaled((BRAND_WEEK_MENTIONS * sentimentSplit[sentiment]) / 100, range)

export const sentimentQuery = (
  sentiment: MentionSentiment,
  range: DiscoverRange,
): MentionQuery => ({
  ...base(range, `sentiment|${sentiment}`, 'Brand sentiment'),
  title: `${SENTIMENT_LABEL[sentiment]} mentions`,
  total: sentimentCount(sentiment, range),
  noun: 'mentions',
  sentiment,
})

export const brandSentimentQuery = (range: DiscoverRange): MentionQuery => ({
  ...base(range, 'sentiment', 'Brand sentiment'),
  title: 'Brand sentiment',
  total: scaled(BRAND_WEEK_MENTIONS, range),
  noun: 'mentions',
})

export const themeQuery = (
  theme: Theme,
  tone: 'positive' | 'negative',
  range: DiscoverRange,
): MentionQuery => ({
  ...base(range, `theme|${theme.name}`, tone === 'positive' ? 'Praised for' : 'Criticized for'),
  title: theme.name,
  total: scaled(theme.mentions, range),
  noun: 'mentions',
  sentiment: tone,
  angle: { kind: 'theme', name: theme.name },
})
