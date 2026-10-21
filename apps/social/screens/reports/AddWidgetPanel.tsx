import { useState, type PointerEventHandler } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { LayoutDashboard, Plus, Search } from 'lucide-react'

import { ClickableCard } from '../../../../src/components/Card'
import { Icon } from '../../../../src/components/Icon'
import { InputGroup } from '../../../../src/components/Input'
import { Panel } from '../../../../src/components/Panel'
import { Heading, Text } from '../../../../src/components/Text'
import { cn } from '../../../../src/lib/cn'
import {
  CATALOG_GROUPS,
  catalogDragId,
  searchCatalog,
  type CatalogDragData,
  type CatalogEntry,
} from './widgetCatalog'

/**
 * A report board's Add widget panel: every widget a report can hold, grouped
 * and searchable. Code-first — the file has no catalog.
 *
 * A tile is added two ways. **Click it** (or Enter, or Space) and it goes in
 * a row of its own at the foot of the board, and the panel stays open for the
 * next one. **Drag it** onto the board and it goes where it is dropped.
 *
 * The board renders this panel, not the shell, and portals it after the Page
 * (`ShellState.screenPanelHost`): a drag only reaches the drop targets inside
 * its own `DragAndDrop`, and the board's is inside the page.
 */
export function AddWidgetPanel({
  open,
  onClose,
  onAdd,
  announcement,
}: {
  open: boolean
  onClose: () => void
  onAdd: (entry: CatalogEntry) => void
  /** Said once a widget is added, in the panel's status line. */
  announcement: string
}) {
  const [query, setQuery] = useState('')
  const found = searchCatalog(query)

  return (
    <Panel
      aria-label="Add widget"
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      resizable
    >
      <Panel.Header icon={Plus} closeButton>
        Add widget
      </Panel.Header>
      <Panel.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <InputGroup>
            <InputGroup.Addon>
              <Icon icon={Search} />
            </InputGroup.Addon>
            <InputGroup.Input
              aria-label="Search widgets"
              placeholder="Search widgets"
              value={query}
              onValueChange={setQuery}
            />
          </InputGroup>
          <Text size="sm" color="subtle">
            Click a widget to add it, or drag it onto the board.
          </Text>
        </div>

        {found.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <Icon icon={LayoutDashboard} className="mb-2 text-content-subtle" aria-hidden />
            <Text weight="semibold">No widgets match “{query.trim()}”</Text>
            <Text size="sm" color="subtle">
              Try a chart type, like donut or table.
            </Text>
          </div>
        ) : (
          CATALOG_GROUPS.map((group) => {
            const entries = found.filter((entry) => entry.group === group)
            if (entries.length === 0) return null
            return (
              <section key={group} className="flex flex-col gap-2">
                <Heading level={3} size="sm" weight="semibold" color="subtle">
                  {group}
                </Heading>
                <ul aria-label={group} className="grid grid-cols-2 gap-2">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex">
                      <CatalogTile entry={entry} onAdd={() => onAdd(entry)} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}

        <p role="status" className="sr-only">
          {announcement}
        </p>
      </Panel.Body>
    </Panel>
  )
}

/**
 * One widget in the catalog: a `ClickableCard` that adds on click and lifts on
 * a pointer drag.
 *
 * **Only the pointer listener is spread.** dnd-kit's keyboard listener would
 * make Enter and Space start a keyboard drag, and then the tile could not be
 * clicked from the keyboard at all. Click is the keyboard's and the screen
 * reader's way in, so the button stays a plain button, with none of dnd-kit's
 * drag attributes either — they would announce a drag the keyboard cannot do.
 */
function CatalogTile({ entry, onAdd }: { entry: CatalogEntry; onAdd: () => void }) {
  const data: CatalogDragData = { source: 'catalog', entry }
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: catalogDragId(entry), data })
  return (
    <ClickableCard
      ref={setNodeRef}
      // dnd-kit types its listeners as `Function`.
      onPointerDown={listeners?.onPointerDown as PointerEventHandler | undefined}
      onClick={onAdd}
      className={cn('w-full cursor-grab', isDragging && 'opacity-40')}
    >
      <CatalogTileFace entry={entry} />
    </ClickableCard>
  )
}

/** The tile's contents, shared with the copy carried under the pointer. */
export function CatalogTileFace({ entry }: { entry: CatalogEntry }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 text-left">
      <Icon icon={entry.icon} className="mb-1 text-content-subtle" />
      <Text render={<span />} weight="semibold" color="emphasized">
        {entry.title}
      </Text>
      <Text render={<span />} size="sm" color="subtle" truncate={2}>
        {entry.description}
      </Text>
    </div>
  )
}
