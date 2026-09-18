import type { UniqueIdentifier } from '@dnd-kit/core'

import { findContainer, moveItem, type Containers } from './move'
import { reflow, resize } from './spans'

/**
 * A composable dashboard as one value, and every change to it as a pure
 * function: which blocks are in which row, the rows in order, every block's
 * current span, which spans were set by hand, and each row's height.
 *
 * One value so a drag's snapshot is one assignment and Escape puts *all* of
 * it back; pure functions so the arithmetic that `move.ts` and `spans.ts`
 * settle separately is composed in one tested place rather than in every
 * story that draws a dashboard. Nothing here knows about React or the DOM —
 * a story keeps a `useState<Board>` and calls these from its handlers.
 */
export interface Board {
  containers: Containers<string>
  /** Row ids in display order. */
  order: string[]
  /** Every block's current span. Written by `resizeBlock`; re-derived by `reflow` when a row's members change. */
  spans: Record<string, number>
  /** Blocks somebody sized by hand: they keep their span through a reflow. */
  manual: string[]
  /** Row heights in pixels, for rows that have been sized; the caller supplies the default. */
  heights: Record<string, number>
}

/** A board from its rows, every span shared out evenly. */
export function createBoard(rows: Containers<string>, order = Object.keys(rows)): Board {
  return settle({ containers: {}, order, spans: {}, manual: [], heights: {} }, rows, order)
}

function sameMembers(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false
  const sorted = [...b].sort()
  return [...a].sort().every((id, i) => id === sorted[i])
}

/**
 * Take a new set of containers and re-share the columns of every row whose
 * *members* changed. A row that only reordered keeps each block's span, and a
 * row that did not change at all keeps the proportional spans `resizeBlock`
 * gave it — `moveItem` and the helpers below leave an untouched row's array
 * as the same reference, which is what makes "unchanged" cheap to know. A
 * block left alone in its row forgets its hand size: it takes the whole row
 * anyway.
 */
export function settle(board: Board, containers: Containers<string>, order = board.order): Board {
  const spans = { ...board.spans }
  const manual = new Set(board.manual)
  for (const row of order) {
    const items = containers[row]
    const before = board.containers[row]
    if (items === before) continue
    if (items.length === 1) manual.delete(items[0])
    if (before && sameMembers(items, before)) continue
    reflow(items, spans, manual).forEach((span, i) => {
      spans[items[i]] = span
    })
  }
  return { ...board, containers, order, spans, manual: [...manual] }
}

/** The dashboard's rule, not the kanban's: a row with nothing in it is gone. */
export function dropEmptyRows(board: Board): Board {
  const order = board.order.filter((row) => board.containers[row].length > 0)
  return order.length === board.order.length ? board : { ...board, order }
}

/** The spans of one row, in order. */
export function rowSpans(board: Board, row: string): number[] {
  return (board.containers[row] ?? []).map((id) => board.spans[id])
}

/** Appends `id` to `row`, creating the row at the end of the board if it does not exist. */
export function addBlock(board: Board, row: string, id: string): Board {
  const containers = { ...board.containers, [row]: [...(board.containers[row] ?? []), id] }
  const order = board.order.includes(row) ? board.order : [...board.order, row]
  return settle(board, containers, order)
}

/** Removes `id` wherever it is; its row goes with it if that was the last block. */
export function removeBlock(board: Board, id: string): Board {
  const row = findContainer(board.containers, id)
  if (!row) return board
  const containers = { ...board.containers, [row]: board.containers[row].filter((item) => item !== id) }
  return dropEmptyRows(settle(board, containers))
}

/** The block wants `span` columns; `resize` in `spans.ts` decides what it gets, and it is hand-sized from here on. */
export function resizeBlock(board: Board, id: string, span: number): Board {
  const row = findContainer(board.containers, id)
  if (!row) return board
  const items = board.containers[row]
  const spans = resize(rowSpans(board, row), items.indexOf(id), span)
  const next = { ...board.spans }
  spans.forEach((value, i) => {
    next[items[i]] = value
  })
  const manual = board.manual.includes(id) ? board.manual : [...board.manual, id]
  return { ...board, spans: next, manual }
}

export function resizeRow(board: Board, row: string, height: number): Board {
  if (board.heights[row] === height) return board
  return { ...board, heights: { ...board.heights, [row]: height } }
}

/**
 * What `onDragOver` calls: a block crossing into another row joins it now,
 * while still carried, so the row grows to take it. Within one row it does
 * nothing — the sorting strategy shifts the neighbours visually.
 */
export function dragOver(board: Board, activeId: UniqueIdentifier, overId: UniqueIdentifier): Board {
  const from = findContainer(board.containers, activeId)
  const to = findContainer(board.containers, overId)
  if (!from || !to || from === to) return board
  return settle(board, moveItem(board.containers, activeId, overId))
}

/** What `onDragEnd` calls: settle the place within the row, and drop any row left empty. */
export function dragEnd(board: Board, activeId: UniqueIdentifier, overId: UniqueIdentifier | null): Board {
  const next = overId === null ? board : settle(board, moveItem(board.containers, activeId, overId))
  return dropEmptyRows(next)
}
