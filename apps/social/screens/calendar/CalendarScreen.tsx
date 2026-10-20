import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  Lightbulb,
  Link,
  ListFilter,
  SquarePen,
} from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { addDays, fromISODate, monthYear, toISODate } from '../../data/dates'
import type { CalendarNote, Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { DayView } from './DayView'
import { MonthView } from './MonthView'
import { NoteDialog, type NoteDialogRequest } from './NoteDialog'
import { today, type CalendarView } from './model'
import { WeekView } from './WeekView'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'

const STEP_LABEL: Record<CalendarView, string> = { day: 'day', week: 'week', month: 'month' }

/**
 * Plan › Calendar: the week by hour (`40005911:32756`), the month
 * (`40005911:33286`) and a day. The view and the date live in the URL
 * (`?view=month&date=2025-07-07`) so every state has a link.
 */
export function CalendarScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const navigate = useNavigate()

  const view: CalendarView =
    params.get('view') === 'day' || params.get('view') === 'month'
      ? (params.get('view') as CalendarView)
      : 'week'
  const anchor = fromISODate(params.get('date')) ?? today

  const go = (next: { view?: CalendarView; date?: Date }) => {
    const nextParams = new URLSearchParams(params)
    if (next.view) nextParams.set('view', next.view)
    if (next.date) nextParams.set('date', toISODate(next.date))
    setParams(nextParams)
  }

  const step = (direction: 1 | -1) => {
    if (view === 'month') {
      go({ date: new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1) })
    } else {
      go({ date: addDays(anchor, direction * (view === 'week' ? 7 : 1)) })
    }
  }

  const selectedPostId = shell.panel?.type === 'post' ? shell.panel.postId : undefined
  const selectedDate =
    shell.panel?.type === 'day' ? fromISODate(shell.panel.date) : undefined
  const openDay = (date: Date) =>
    shell.setPanel(
      selectedDate && toISODate(selectedDate) === toISODate(date)
        ? null
        : { type: 'day', date: toISODate(date) },
    )
  const openPost = (post: Post) =>
    shell.setPanel(selectedPostId === post.id ? null : { type: 'post', postId: post.id })

  const [noteRequest, setNoteRequest] = useState<NoteDialogRequest | null>(null)
  const addNote = (date: Date) => setNoteRequest({ mode: 'new', date })
  const openNote = (note: CalendarNote) => setNoteRequest({ mode: 'edit', note })

  // With a panel open the page is 800 wide, and Figma folds Filter and Ideas to
  // icon-only buttons to make room (`40005911:33082`). New post keeps its label.
  const compact = shell.panel !== null

  return (
    <>
      <TopBar
        start={
          // One child: TopBar's start slot stretches each child to `flex-1`
          // (it is shaped for a search field), so the controls go in one row.
          <div className="flex items-center gap-2">
            <Heading level={1} size="base" weight="semibold" className="shrink-0 max-md:sr-only">
              {monthYear.format(anchor)}
            </Heading>
            <SegmentedControl
              aria-label="Calendar view"
              value={view}
              onValueChange={(value) => go({ view: value as CalendarView })}
            >
              <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
              <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
              <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
            </SegmentedControl>
            <div className="flex items-center">
              <Button
                appearance="ghost"
                startIcon={ArrowLeft}
                aria-label={`Previous ${STEP_LABEL[view]}`}
                onClick={() => step(-1)}
              />
              <Button
                appearance="ghost"
                className="max-md:hidden"
                onClick={() => go({ date: today })}
              >
                Today
              </Button>
              <Button
                appearance="ghost"
                startIcon={ArrowRight}
                aria-label={`Next ${STEP_LABEL[view]}`}
                onClick={() => step(1)}
              />
            </div>
          </div>
        }
        end={
          // On a phone only New post stays, icon-only; the rest is one tap
          // away in the real product and not worth a wrapped bar here.
          <>
            <div className="flex items-center gap-2 max-md:hidden">
              {compact ? (
                <>
                  <Button
                    appearance="ghost"
                    startIcon={ListFilter}
                    aria-label="Filter"
                    onClick={() => shell.notBuilt('Filtering')}
                  />
                  <Button
                    appearance="ghost"
                    startIcon={Lightbulb}
                    aria-label="Ideas"
                    onClick={() => navigate('/plan/ideas')}
                  />
                </>
              ) : (
                <>
                  <Button
                    appearance="ghost"
                    startIcon={ListFilter}
                    onClick={() => shell.notBuilt('Filtering')}
                  >
                    Filter
                  </Button>
                  <Button
                    appearance="ghost"
                    startIcon={Lightbulb}
                    onClick={() => navigate('/plan/ideas')}
                  >
                    Ideas
                  </Button>
                </>
              )}
              <Button
                appearance="ghost"
                startIcon={Link}
                aria-label="Share"
                onClick={() => shell.notBuilt('Sharing')}
              />
              <Button
                appearance="ghost"
                startIcon={Ellipsis}
                aria-label="More"
                onClick={() => shell.notBuilt('More actions')}
              />
              <Button
                appearance="primary"
                startIcon={SquarePen}
                onClick={() => shell.notBuilt('The post composer')}
              >
                New post
              </Button>
            </div>
            <Button
              appearance="primary"
              startIcon={SquarePen}
              aria-label="New post"
              className="md:hidden"
              onClick={() => shell.notBuilt('The post composer')}
            />
          </>
        }
      />
      {/* The grid runs edge to edge in the page, as drawn; the shell's 16px
          content padding is for blocks, and the grid's own rules do the job. */}
      <AppShell.Content className={cn('gap-0 p-0', floatingYakClearance)}>
        {view === 'week' ? (
          <WeekView
            anchor={anchor}
            selectedPostId={selectedPostId}
            onOpenPost={openPost}
            onAddPost={() => shell.notBuilt('The post composer')}
            onAddNote={addNote}
            onOpenNote={openNote}
          />
        ) : view === 'month' ? (
          <MonthView
            anchor={anchor}
            selectedPostId={selectedPostId}
            selectedDate={selectedDate}
            onOpenPost={openPost}
            onOpenDay={openDay}
            onOpenNote={openNote}
          />
        ) : (
          <DayView
            anchor={anchor}
            selectedPostId={selectedPostId}
            onOpenPost={openPost}
            onAddPost={() => shell.notBuilt('The post composer')}
            onAddNote={addNote}
            onOpenNote={openNote}
          />
        )}
      </AppShell.Content>
      <NoteDialog request={noteRequest} onClose={() => setNoteRequest(null)} />
    </>
  )
}
