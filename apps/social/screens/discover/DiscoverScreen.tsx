import { useSearchParams } from 'react-router'
import { CalendarDays, Ellipsis } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Menu } from '../../../../src/components/Menu'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { addDays, startOfDay } from '../../data/dates'
import { DISCOVER_RANGES, discoverRangeFor, type DiscoverRange } from '../../data/discover'
import { statsFor } from '../../data/performance'
import { posts } from '../../data/posts'
import { useShell } from '../../shell/ShellContext'
import { isPublished, postDate } from '../calendar/model'
import {
  CreatorsWidget,
  OpportunitiesWidget,
  SentimentWidget,
  TopPostsWidget,
  TrendingWidget,
  VisualTrendsWidget,
} from './widgets'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'

const DAYS: Record<DiscoverRange, number> = { '24h': 1, '7d': 7, '30d': 30 }

/** The brand's published posts in the range, best first by impressions. */
function topPosts(range: DiscoverRange) {
  const from = addDays(startOfDay(new Date()), -(DAYS[range] - 1))
  return posts
    .filter((post) => isPublished(post) && postDate(post) >= from)
    .sort((a, b) => statsFor(b).impressions - statsFor(a).impressions)
    .slice(0, 4)
}

/**
 * Measure › Discover (`40005911:35187`): what the brand's audience is talking
 * about. Ask Yak anything from the top; then what is trending near the brand,
 * the creators its audience follows, the looks doing well in its space, posts
 * worth answering, how people feel about it, and its own best posts.
 *
 * The range is in the URL (`?range=30d`). It scales the counts and keeps the
 * shares, and it decides which of the calendar's posts are the top ones.
 */
export function DiscoverScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const range = discoverRangeFor(params.get('range'))
  const label = DISCOVER_RANGES.find((r) => r.value === range)!.label

  const setRange = (next: DiscoverRange) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('range', next)
    setParams(nextParams, { replace: true })
  }

  return (
    <>
      <TopBar
        start={
          <Heading level={1} size="base" weight="semibold">
            Discover
          </Heading>
        }
        end={
          <div className="flex items-center gap-2">
            <Menu>
              <Menu.Trigger
                render={
                  <Button
                    appearance="ghost"
                    startIcon={CalendarDays}
                    aria-label={`Date range: ${label}`}
                  >
                    {label}
                  </Button>
                }
              />
              <Menu.Popup aria-label="Date range">
                <Menu.Group>
                  <Menu.RadioGroup
                    value={range}
                    onValueChange={(next) => setRange(next as DiscoverRange)}
                  >
                    {DISCOVER_RANGES.map((option) => (
                      // A picker of one value closes as you pick (FINDINGS 25).
                      <Menu.RadioItem key={option.value} value={option.value} closeOnClick>
                        {option.label}
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Group>
              </Menu.Popup>
            </Menu>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
        <div className="grid shrink-0 grid-cols-1 gap-3 @min-[900px]/page:grid-cols-2">
          <TrendingWidget range={range} />
          <CreatorsWidget range={range} />
        </div>
        <VisualTrendsWidget range={range} />
        <div className="grid shrink-0 grid-cols-1 gap-3 @min-[900px]/page:grid-cols-2">
          <OpportunitiesWidget range={range} />
          <SentimentWidget range={range} />
        </div>
        <TopPostsWidget posts={topPosts(range)} />
      </AppShell.Content>
    </>
  )
}
