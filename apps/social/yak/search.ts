import { brandCreators, type BrandCreator } from '../data/creators'
import { trends, type Trend } from '../data/discover'
import type { PageWork } from './insights'

/**
 * What Plan › Creators' and Measure › Discover's search bars hand to Yak:
 * the words, matched against the mock's creators (and, from Discover, its
 * trends), with Yak's one-paragraph answer on top. Real ranking would live in a
 * service; this is enough to make every suggestion and most typed words land
 * on something true about the data.
 */
export interface SearchResults {
  answer: string
  creators: BrandCreator[]
  trends: Trend[]
  work: PageWork
}

/** Words that say *what kind* of thing is wanted rather than which one. */
const FILLER = new Set(
  (
    'a an and are best brand creator creators find for from in is me most of on our ' +
    'show the their to us we what which who with your share audience top good great'
  ).split(' '),
)

function words(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9#&\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !FILLER.has(w))
}

/** Whether `word` appears in any of the haystacks, allowing a plural on either side. */
function hits(word: string, haystacks: string[]): boolean {
  const stem = word.replace(/s$/, '')
  return haystacks.some((h) => h.toLowerCase().includes(stem))
}

function creatorScore(creator: BrandCreator, terms: string[]): number {
  const hay = [creator.name, creator.handle, creator.category, ...creator.topics]
  return terms.filter((term) => hits(term, hay)).length
}

const byFit = (a: BrandCreator, b: BrandCreator) => b.fit - a.fit

function list(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function search(query: string, from: string): SearchResults {
  const terms = words(query)
  const fromDiscover = from.startsWith('/measure/discover')

  // No words left once the filler is gone — "Find the best creators for your
  // brand" — means "everyone, best first".
  let creators: BrandCreator[]
  let closest = false
  if (terms.length === 0) {
    creators = [...brandCreators].sort(byFit)
  } else {
    const scored = brandCreators
      .map((c) => ({ c, score: creatorScore(c, terms) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || byFit(a.c, b.c))
    creators = scored.map((x) => x.c)
    if (creators.length === 0 && !fromDiscover) {
      creators = [...brandCreators].sort(byFit).slice(0, 4)
      closest = true
    }
  }

  const matchedTrends = fromDiscover
    ? trends.filter((t) => terms.some((term) => hits(term, [t.title, t.note ?? ''])))
    : []

  const top = creators.slice(0, 2).map((c) => `${c.name} (${c.fit}% fit)`)
  const quoted = `“${query.trim()}”`
  let answer: string
  if (closest) {
    answer = `No creators match ${quoted} exactly. Here are the four with the best brand fit instead — ${list(top)} lead.`
  } else if (creators.length === 0 && matchedTrends.length === 0) {
    answer = `Nothing in your space matches ${quoted} yet. Try a topic, a creator’s name or a brand you compete with.`
  } else {
    const parts: string[] = []
    if (creators.length > 0) {
      parts.push(
        `${creators.length} ${creators.length === 1 ? 'creator' : 'creators'}, best brand fit first — ${list(top)} ${top.length === 1 ? 'is' : 'are'} the strongest`,
      )
    }
    if (matchedTrends.length > 0) {
      parts.push(
        `${matchedTrends.length === 1 ? 'a trend' : `${matchedTrends.length} trends`} picking up: ${list(matchedTrends.map((t) => `${t.title} (${t.change})`))}`,
      )
    }
    answer = `For ${quoted} I found ${parts.join(', and ')}.`
  }

  const work: PageWork = fromDiscover
    ? {
        phrases: ['Searching topics, brands and creators', 'Checking what is trending', 'Ranking'],
        steps: [
          `Searched ${brandCreators.length} creators and ${trends.length} trends`,
          'Ranked by brand fit',
        ],
        summary: `Searched your space for ${quoted}`,
      }
    : {
        phrases: ['Searching creators', 'Scoring brand fit', 'Ranking'],
        steps: [`Searched ${brandCreators.length} creators`, 'Ranked by brand fit'],
        summary: `Searched creators for ${quoted}`,
      }

  return { answer, creators, trends: matchedTrends, work }
}
