import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { Ellipsis, ListFilter, Plus } from 'lucide-react'

import { AppShell } from '../../../../src/components/AppShell'
import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { ContentBlock } from '../../../../src/components/ContentBlock'
import {
  DragAndDrop,
  DragHandle,
  findContainer,
  moveItem,
  Sortable,
  type Containers,
} from '../../../../src/components/DragAndDrop'
import { Menu } from '../../../../src/components/Menu'
import { SegmentedControl } from '../../../../src/components/SegmentedControl'
import { Heading } from '../../../../src/components/Text'
import { TopBar } from '../../../../src/components/TopBar'
import { cn } from '../../../../src/lib/cn'
import { floatingYakClearance } from '../../components/FloatingYak'
import { IdeaCard } from '../../components/IdeaCard'
import { ideaCardId } from '../../data/ideas'
import type { IdeaGroup } from '../../data/types'
import { useShell } from '../../shell/ShellContext'
import { UNASSIGNED, useIdeas } from './ideasState'

type IdeasView = 'board' | 'gallery'

/**
 * Plan › Ideas (`40005911:32981`): posts that have not been written yet, on a
 * board of groups. The columns are `ContentBlock`s on the subtle surface with
 * a `Sortable` inside each, the shape of DragAndDrop's Kanban story; cards
 * move between columns while they are carried and settle on drop. Gallery
 * (`?view=gallery`) has no frame: it is the same cards in a grid, each with
 * its group as a Badge (FINDINGS 70).
 */
export function IdeasScreen() {
  const [params, setParams] = useSearchParams()
  const shell = useShell()
  const { ideas, groups, board, setBoard, addIdea, addGroup, clearGroup, removeGroup } = useIdeas()
  const view: IdeasView = params.get('view') === 'gallery' ? 'gallery' : 'board'

  // A card or column just added takes focus, once React has drawn it.
  const [focusTarget, setFocusTarget] = useState<string | null>(null)
  useEffect(() => {
    if (!focusTarget) return
    document.getElementById(focusTarget)?.focus()
    setFocusTarget(null)
  }, [focusTarget])

  const newIdea = (groupId: string) => setFocusTarget(ideaCardId(addIdea(groupId)))

  // Escape puts every card back where the drag found it.
  const snapshot = useRef<Containers<string>>(board)
  const handlers = {
    onDragStart() {
      snapshot.current = board
    },
    onDragOver({ active, over }: DragOverEvent) {
      if (!over) return
      setBoard((current) => {
        const from = findContainer(current, active.id)
        const to = findContainer(current, over.id)
        if (!from || !to || from === to) return current
        return moveItem(current, active.id, over.id)
      })
    },
    onDragEnd({ active, over }: DragEndEvent) {
      if (!over) return
      setBoard((current) => moveItem(current, active.id, over.id))
    },
    onDragCancel() {
      setBoard(() => snapshot.current)
    },
  }

  const openIdea = () => shell.notBuilt('Idea details')

  return (
    <>
      <TopBar
        start={
          <div className="flex items-center gap-3">
            <Heading level={1} size="base" weight="semibold">
              Ideas
            </Heading>
            <SegmentedControl
              aria-label="View"
              value={view}
              onValueChange={(value) => {
                const next = new URLSearchParams(params)
                if (value === 'board') next.delete('view')
                else next.set('view', String(value))
                setParams(next, { replace: true })
              }}
            >
              <SegmentedControl.Item value="board">Board</SegmentedControl.Item>
              <SegmentedControl.Item value="gallery">Gallery</SegmentedControl.Item>
            </SegmentedControl>
          </div>
        }
        end={
          <div className="flex items-center gap-2">
            <Button
              appearance="ghost"
              startIcon={ListFilter}
              onClick={() => shell.notBuilt('Filtering ideas')}
            >
              Filter
            </Button>
            <Button
              appearance="ghost"
              startIcon={Ellipsis}
              aria-label="More"
              onClick={() => shell.notBuilt('More actions')}
            />
          </div>
        }
      />
      {view === 'board' ? (
        <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
          <DragAndDrop {...handlers}>
            {/* The board is the scroller, both ways: overflow-x makes overflow-y
                auto too, so the page itself never scrolls here. The track
                inside starts at the top (`items-start`) and is at least the
                board's height, so it grows with the tallest column and every
                column ends level holding all its cards. Stretched to the
                board instead, the columns stopped short and cards spilled
                out of them at short heights. */}
            <div className="-mx-4 flex flex-1 items-start overflow-auto px-4 pb-1">
              <div className="flex min-h-full w-full shrink-0 gap-3">
                {groups.map((group) => (
                  <IdeaColumn
                    key={group.id}
                    group={group}
                    ids={board[group.id] ?? []}
                    onNewIdea={() => newIdea(group.id)}
                    onClear={() => clearGroup(group.id)}
                    onRemove={() => removeGroup(group.id)}
                    onRename={() => shell.notBuilt('Renaming a group')}
                    renderCard={(id) => (
                      <Sortable.Item
                        key={id}
                        id={id}
                        label={ideas[id].title}
                        role="listitem"
                        className="group/idea"
                      >
                        <IdeaCard idea={ideas[id]} onClick={openIdea} />
                        {/* Figma draws no grip; the keyboard needs one, so it
                          shows on hover and on focus (FINDINGS 69). */}
                        <DragHandle className="absolute top-2 right-2 bg-surface-background-primary opacity-0 group-hover/idea:opacity-100 focus-visible:opacity-100" />
                      </Sortable.Item>
                    )}
                  />
                ))}
                {/* Figma's New Group column: a 44px strip with one button at its top. */}
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-surface-border bg-surface-background-subtle py-2">
                  <Button
                    appearance="ghost"
                    startIcon={Plus}
                    aria-label="New group"
                    onClick={() => setFocusTarget(newIdeaButtonId(addGroup()))}
                  />
                </div>
              </div>
            </div>
          </DragAndDrop>
        </AppShell.Content>
      ) : (
        <AppShell.Content className={cn('gap-3', floatingYakClearance)}>
          <ul
            aria-label="Ideas"
            className="grid shrink-0 grid-cols-1 gap-3 @min-[560px]/page:grid-cols-2 @min-[860px]/page:grid-cols-3 @min-[1080px]/page:grid-cols-4"
          >
            {groups.flatMap((group) =>
              (board[group.id] ?? []).map((id) => (
                <li key={id} className="flex">
                  <IdeaCard idea={ideas[id]} status={group.name} onClick={openIdea} />
                </li>
              )),
            )}
          </ul>
        </AppShell.Content>
      )}
    </>
  )
}

/** A new group hands focus to its own add button, the first thing you would do next. */
function newIdeaButtonId(groupId: string) {
  return `new-idea-in-${groupId}`
}

/**
 * One group: Figma's Content Block on the subtle surface, its title and count,
 * an add button and a menu, then the cards and a "New idea" row under them.
 * Unassigned has no menu in the frame, and it is the group a deleted group's
 * ideas fall back into, so it never gets one.
 */
function IdeaColumn({
  group,
  ids,
  onNewIdea,
  onClear,
  onRemove,
  onRename,
  renderCard,
}: {
  group: IdeaGroup
  ids: string[]
  onNewIdea: () => void
  onClear: () => void
  onRemove: () => void
  onRename: () => void
  renderCard: (id: string) => ReactNode
}) {
  return (
    <ContentBlock
      emphasis="subtle"
      headingLevel={2} // Figma's 267 is what four groups get at 1440; they share the room
      // between 256 and 320, and past that the board scrolls sideways.
      className="h-auto max-w-80 min-w-64 flex-1 basis-0"
    >
      <ContentBlock.Header
        titleSlot={<Badge color="neutral">{ids.length}</Badge>}
        actions={
          <>
            <Button
              id={newIdeaButtonId(group.id)}
              appearance="ghost"
              startIcon={Plus}
              aria-label={`New idea in ${group.name}`}
              onClick={onNewIdea}
            />
            {group.id !== UNASSIGNED && (
              <Menu>
                <Menu.Trigger
                  render={
                    <Button
                      appearance="ghost"
                      startIcon={Ellipsis}
                      aria-label={`${group.name} actions`}
                    />
                  }
                />
                <Menu.Popup aria-label={`${group.name} actions`}>
                  <Menu.Group>
                    <Menu.Item onClick={onRename}>Rename</Menu.Item>
                    <Menu.Item onClick={onClear} disabled={ids.length === 0}>
                      Clear ideas
                    </Menu.Item>
                    <Menu.Item destructive onClick={onRemove}>
                      Delete group
                    </Menu.Item>
                  </Menu.Group>
                </Menu.Popup>
              </Menu>
            )}
          </>
        }
      >
        {group.name}
      </ContentBlock.Header>
      <ContentBlock.Content className="flex-1 gap-2 px-2 pb-4">
        {/* The Sortable is the whole column body, "New idea" included, so an
            empty group is a full-height target: a tall card carried by
            keyboard is placed by its corners, and a 48px floor at the top of
            Done was never closer than the cards beside it. The list role
            sits one level in, on the cards alone. */}
        <Sortable
          id={group.id}
          label={group.name}
          items={ids}
          className="flex flex-1 flex-col gap-2 rounded-md"
        >
          {ids.length > 0 && (
            <div role="list" aria-label={group.name} className="flex flex-col gap-2">
              {ids.map(renderCard)}
            </div>
          )}
          <div className="flex justify-center">
            <Button appearance="ghost" startIcon={Plus} onClick={onNewIdea}>
              New idea
            </Button>
          </div>
        </Sortable>
      </ContentBlock.Content>
    </ContentBlock>
  )
}
