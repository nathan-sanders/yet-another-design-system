import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, PanelRight, X } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Tabs } from '../../../../src/components/Tabs'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'
import { creatorById } from '../../data/creators'
import {
  AudienceTab,
  ContentTab,
  CreatorActions,
  CreatorHeading,
  OverviewTab,
  SimilarTab,
} from './CreatorDetail'
import { creatorFrom, creatorPath, FULL_VIEW_TABS, fullViewTab, type FullViewTab } from './paths'

/**
 * Creator details, full view (`40005952:23519`, with `… / Content`
 * `40005955:24767` and `… / Similar` `40005955:75412`): the panel given the
 * page, as Yak's full view is. Overview stays in a 384 column on the left — the
 * panel's width — and the other three tabs fill the rest. Open profile and
 * Add to campaign move from the panel's footer to the top bar (under the name
 * on a narrow page), beside Collapse, which returns to the page it came from with the panel open on the
 * same tab.
 *
 * The tab and the page to go back to are in the URL
 * (`#/plan/creators/alena?tab=content`), so every tab has a link. The shell
 * floats Creators' Yak bar over it, as the file draws, so both columns scroll
 * clear of it.
 */
export function CreatorFullView() {
  const { creatorId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const creator = creatorById(creatorId)
  const tab = fullViewTab(params)
  const from = creatorFrom(params)

  if (!creator) return <Navigate to="/plan/creators" replace />

  const show = (next: FullViewTab, id = creator.id) =>
    navigate(creatorPath(id, next, from), { replace: id === creator.id })

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ArrowLeft}
              aria-label="Back"
              onClick={() => navigate(from)}
            />
            <Heading level={1} size="base" weight="semibold">
              Creator details
            </Heading>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            {/* On a narrow page they would cover the title; they sit under the name instead. */}
            <div className="hidden items-center gap-2 @min-[768px]/page:flex">
              <CreatorActions />
            </div>
            <Button
              appearance="ghost"
              startIcon={PanelRight}
              aria-label="Collapse to panel"
              onClick={() =>
                navigate(from, {
                  state: { panel: { type: 'creator', creatorId: creator.id, tab } },
                })
              }
            />
            <Button
              appearance="ghost"
              startIcon={X}
              aria-label="Close creator details"
              onClick={() => navigate(from)}
            />
          </div>
        }
      />
      {/* Two columns that scroll on their own from 768 of page up, and one
          column that scrolls as a whole below it — or when Yak's panel takes
          the room. */}
      <AppShell.Content className="gap-0 p-0 @min-[768px]/page:flex-row @min-[768px]/page:overflow-hidden">
        <section
          aria-label="Overview"
          className={cn(
            'flex shrink-0 flex-col gap-4 p-4',
            '@min-[768px]/page:w-96 @min-[768px]/page:overflow-y-auto @min-[768px]/page:border-r @min-[768px]/page:border-surface-border',
            floatingYakClearance,
          )}
        >
          <CreatorHeading creator={creator} />
          <div className="flex items-center justify-between @min-[768px]/page:hidden">
            <CreatorActions />
          </div>
          <OverviewTab creator={creator} />
        </section>
        <Tabs
          value={tab}
          onValueChange={(value) => show(value as FullViewTab)}
          layout="hug"
          className={cn(
            'flex min-w-0 shrink-0 flex-col gap-4 px-4 pb-4 @min-[768px]/page:flex-1 @min-[768px]/page:overflow-y-auto',
            floatingYakClearance,
          )}
        >
          {/* Sticky, as the panel's strip is, so the tabs stay in reach down a long tab. */}
          <Tabs.List
            aria-label="Creator detail sections"
            className="sticky top-0 z-1 bg-surface-background-primary pt-4"
          >
            {FULL_VIEW_TABS.map((t) => (
              <Tabs.Tab key={t.value} value={t.value}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panel value="audience">
            <AudienceTab creator={creator} />
          </Tabs.Panel>
          <Tabs.Panel value="content">
            <ContentTab creator={creator} />
          </Tabs.Panel>
          <Tabs.Panel value="similar">
            <SimilarTab creator={creator} onOpen={(id) => show('similar', id)} />
          </Tabs.Panel>
        </Tabs>
      </AppShell.Content>
    </>
  )
}
