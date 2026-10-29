import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { useLocation } from 'react-router'

import { Divider } from '../../../../src/components/Divider'
import { Token } from '../../../../src/components/Token'
import { focusRing } from '../../../../src/lib/focus'
import { cn } from '../../../../src/lib/cn'
import { CampaignBar } from '../../components/CampaignBar'
import { monthDay, sameDay } from '../../data/dates'
import type { Campaign } from '../../data/types'
import { pastDayPattern, today } from '../calendar/model'
import { edgeDateLabel, placeBar, startOfMondayWeek, timelineRange, todayPosition } from './model'
import { campaignPath } from './paths'

/**
 * The Timeline view of Plan › Campaigns (`40006178:41785`): twelve Monday
 * weeks, four behind this one and seven ahead, with one row a campaign in the
 * table's order and a bar across the days it runs.
 *
 * The weeks share the width equally, as the file's 96px columns share its
 * 1156. Below 64px a week stops being readable, so under 768 (a panel open
 * beside a narrow page, or a phone) the timeline scrolls sideways inside its
 * own frame instead of squashing. The past is hatched with the calendar's
 * `_Past Day Pattern`, and the today line runs down the middle of today.
 *
 * A campaign wholly outside the range gets a Token at the edge it lies past —
 * the file's "Austin store opening · starts Jan 12 →" — so every campaign has a
 * row and a way in.
 */
export function CampaignsTimeline({
  campaigns,
  anchor = today,
}: {
  campaigns: Campaign[]
  /** The day the weeks are drawn around: today, or a few windows away. */
  anchor?: Date
}) {
  const { pathname, search } = useLocation()
  const from = pathname + search
  const range = timelineRange(anchor)
  const thisWeek = startOfMondayWeek(today)
  const todayAt = todayPosition(range)
  const todayInRange = todayAt > 0 && todayAt < 1
  // Everything before today: the hatch stops where today begins, so a window
  // behind is hatched end to end and one ahead not at all.
  const pastWidth = Math.min(Math.max(todayAt - 0.5 / range.days, 0), 1)

  // When the weeks don't fit, open on today rather than on four weeks ago:
  // today a third of the way in, so what is coming has the room. A window
  // behind opens at its end and one ahead at its start, the edge nearest
  // today.
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    el.scrollLeft = todayInRange
      ? todayAt * el.scrollWidth - el.clientWidth / 3
      : todayAt >= 1
        ? el.scrollWidth
        : 0
  }, [todayAt, todayInRange])

  return (
    <div
      ref={scroller}
      role="region"
      aria-label="Campaign timeline"
      tabIndex={0}
      className={cn(
        'flex min-h-0 flex-1 overflow-x-auto rounded-lg border border-surface-border',
        focusRing,
      )}
      style={
        {
          '--past-width': `${pastWidth * 100}%`,
          '--today-left': `${todayAt * 100}%`,
        } as CSSProperties
      }
    >
      <div className="relative flex min-w-192 flex-1 flex-col">
        {/* The hatch runs through the header as well as the body, as the file draws it. */}
        <div
          aria-hidden="true"
          className={cn('absolute inset-y-0 left-0 w-(--past-width)', pastDayPattern)}
        />

        <div className="relative grid h-10 shrink-0 grid-cols-12">
          {range.weeks.map((week, i) => {
            const current = sameDay(week, thisWeek)
            const past = week < thisWeek
            return (
              <div
                key={week.getTime()}
                className={cn(
                  'relative flex items-center pr-1 pl-3 text-sm',
                  i > 0 && 'border-l border-surface-border',
                  current
                    ? 'font-semibold text-content-emphasized'
                    : past
                      ? 'text-content-subtle'
                      : 'text-content-primary',
                )}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 bg-surface-border-emphasized"
                  />
                )}
                <span className="truncate">
                  {current && <span className="sr-only">This week, </span>}
                  {monthDay.format(week)}
                </span>
              </div>
            )
          })}
        </div>
        <Divider />

        <div className="relative flex-1 pt-2">
          <div aria-hidden="true" className="absolute inset-0 grid grid-cols-12">
            {range.weeks.map((week, i) => (
              <div key={week.getTime()} className="flex justify-start">
                {i > 0 && <Divider orientation="vertical" />}
              </div>
            ))}
          </div>

          {/* Under the bars, as the file layers it; a bar crossing today stays whole. */}
          {todayInRange && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-(--today-left) w-0.5 -translate-x-1/2 bg-content-emphasized"
            >
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-content-emphasized" />
            </div>
          )}

          <ul aria-label="Campaigns" className="relative">
            {campaigns.map((campaign) => {
              const place = placeBar(campaign, range)
              const href = `#${campaignPath(campaign.id, 'overview', from)}`
              return (
                <li key={campaign.id} className="relative h-11">
                  {place.kind === 'bar' ? (
                    <CampaignBar
                      campaign={campaign}
                      href={href}
                      left={place.left}
                      width={place.width}
                      clipStart={place.clipStart}
                      clipEnd={place.clipEnd}
                    />
                  ) : (
                    <Token
                      size="small"
                      href={href}
                      className={cn(
                        'absolute top-3',
                        place.kind === 'after' ? 'right-2' : 'left-2',
                      )}
                    >
                      {place.kind === 'after'
                        ? `${campaign.name} · starts ${edgeDateLabel(place.start, range)} →`
                        : `← ${campaign.name} · ended ${edgeDateLabel(place.end, range)}`}
                    </Token>
                  )}
                  <Divider
                    aria-hidden="true"
                    lineStyle="dashed"
                    className="absolute inset-x-0 bottom-0"
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
