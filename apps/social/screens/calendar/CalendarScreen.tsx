import { useState } from 'react'
import { createPortal } from 'react-dom'
import { pointerWithin, type DragMoveEvent } from '@dnd-kit/core'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Ellipsis, FilePenLine, Link, ListFilter } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Button } from '../../../../src/components/Button'
import { Card } from '../../../../src/components/Card'
import { DragAndDrop } from '../../../../src/components/DragAndDrop'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { addDays, fromISODate, monthYear, toISODate } from '../../data/dates'
import type { CalendarNote, Post } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import {
  CalendarAgendaFace,
  CalendarPostCardFace,
  CalendarPostChipFace,
} from '../../components/PostCards'
import { DayView } from './DayView'
import { isCalendarDrag, parseTarget, placeFor, type CalendarDragData } from './drag'
import { DraftFace, DraftsPanel } from './DraftsPanel'
import { AimContext, fromOf } from './dragHooks'
import { useSchedule } from './scheduleState'
import { useCommitSchedule } from './scheduleCommit'
import { MonthView } from './MonthView'
import { NoteDialog, type NoteDialogRequest } from './NoteDialog'
import { composePath } from '../compose/paths'
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
  // A day's + Add post: the composer, on that day, and back here afterwards.
  const addPost = (date: Date) =>
    navigate(composePath({ date, from: `/plan/calendar?${params.toString()}` }))

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
  const selectedDate = shell.panel?.type === 'day' ? fromISODate(shell.panel.date) : undefined
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

  const draftsOpen = shell.panel?.type === 'drafts'
  const toggleDrafts = () => shell.setPanel(draftsOpen ? null : { type: 'drafts' })

  const { requestSchedule } = useSchedule()
  const commit = useCommitSchedule()
  // What is under the pointer, and the cell a release would land it in.
  const [carried, setCarried] = useState<CalendarDragData | null>(null)
  const [aimed, setAimed] = useState<string | null>(null)
  const endDrag = () => {
    setCarried(null)
    setAimed(null)
  }

  // With a panel open the page is 800 wide, and Figma folds Filter and Drafts
  // to icon-only buttons to make room (`40005911:33082`).
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
          // There is no New post here: the rail's New makes a post from any
          // page, and each day's + makes one on that day. On a phone only
          // Drafts stays, icon-only; the rest is not worth a wrapped bar.
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
                    startIcon={FilePenLine}
                    aria-label="Drafts"
                    aria-pressed={draftsOpen}
                    onClick={toggleDrafts}
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
                    startIcon={FilePenLine}
                    aria-pressed={draftsOpen}
                    onClick={toggleDrafts}
                  >
                    Drafts
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
            </div>
            <Button
              appearance="ghost"
              startIcon={FilePenLine}
              aria-label="Drafts"
              aria-pressed={draftsOpen}
              className="md:hidden"
              onClick={toggleDrafts}
            />
          </>
        }
      />
      {/* The grid runs edge to edge in the page, as drawn; the shell's 16px
          content padding is for blocks, and the grid's own rules do the job. */}
      <AppShell.Content className={cn('gap-0 p-0', floatingYakClearance)}>
        <DragAndDrop
          collisionDetection={pointerWithin}
          onDragStart={({ active }) => {
            if (isCalendarDrag(active.data.current)) setCarried(active.data.current)
          }}
          onDragMove={(event) => setAimed(landing(event)?.id ?? null)}
          onDragEnd={(event) => {
            const landed = landing(event)
            const data = event.active.data.current
            if (landed && isCalendarDrag(data)) commit(data, landed.at)
            endDrag()
          }}
          onDragCancel={endDrag}
        >
          <AimContext.Provider value={aimed}>
            {view === 'week' ? (
              <WeekView
                anchor={anchor}
                selectedPostId={selectedPostId}
                onOpenPost={openPost}
                onAddPost={addPost}
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
                onAddPost={addPost}
                onAddNote={addNote}
                onOpenNote={openNote}
              />
            )}
          </AimContext.Provider>

          {/* Rendered here so its drafts are inside this drag context, and
              portalled after the Page, where the shell's panels go — the
              report's Add widget panel does the same. */}
          {shell.screenPanelHost
            ? createPortal(
                <DraftsPanel
                  open={draftsOpen}
                  onClose={() => shell.setPanel(null)}
                  onSchedule={(draft) => requestSchedule({ source: 'draft', draft })}
                />,
                shell.screenPanelHost,
              )
            : null}
          {/* A copy under the pointer: a draft is carried out of the panel's
              scrolling body, and a post out of its cell, and either would be
              clipped at the edge. The source stays put, faded. */}
          {carried ? (
            <DragAndDrop.Overlay>
              {carried.source === 'draft' ? (
                <Card className="w-56 cursor-grabbing shadow-high">
                  <DraftFace draft={carried.draft} />
                </Card>
              ) : view === 'month' ? (
                <CalendarPostChipFace post={carried.post} />
              ) : (
                <Card className="size-full cursor-grabbing shadow-high">
                  {view === 'week' ? (
                    <CalendarPostCardFace post={carried.post} />
                  ) : (
                    <CalendarAgendaFace post={carried.post} />
                  )}
                </Card>
              )}
            </DragAndDrop.Overlay>
          ) : null}
        </DragAndDrop>
      </AppShell.Content>
      <NoteDialog request={noteRequest} onClose={() => setNoteRequest(null)} />
    </>
  )
}

/**
 * Where a card let go now would land, and the cell's id — or null where it
 * cannot (`placeFor`). Read off the collision itself rather than `over`, which
 * in a move event is still the one the last render saw (FINDINGS 126).
 * `pointerWithin`, so a draft still over the panel is over nothing.
 */
function landing({ active, collisions }: Pick<DragMoveEvent, 'active' | 'collisions'>) {
  const data = active.data.current
  const hit = collisions?.[0]
  if (!isCalendarDrag(data) || !hit) return null
  const target = parseTarget(String(hit.id))
  if (!target) return null
  const at = placeFor(data, target, { from: fromOf(data), now: new Date() })
  return at ? { id: String(hit.id), at } : null
}
