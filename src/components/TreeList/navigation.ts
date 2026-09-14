import type { MouseEvent, ReactNode } from 'react'

/**
 * The tree's model and the arithmetic of walking it, kept out of the component
 * so a node test can pin it. Every way a tree can be keyboard-wrong renders
 * perfectly — ArrowDown skipping a row, `*` expanding a disabled sibling, End
 * landing on a collapsed parent's hidden child — so this is the half that gets
 * asserted, and the stories prove the geometry. Pagination's `labels.ts` and
 * Calendar's `month.ts` are the precedent.
 */

/** One node in the hierarchy. Astryx's `TreeListItemData`, with its `is` prefixes dropped. */
export interface TreeListItem {
  /**
   * The caller's id, and it has to be stable across renders: it is the key
   * for expansion, selection and focus, and the tree finds a row's element by
   * it after a keyboard move.
   */
  id: string
  label: ReactNode
  /** A second, quieter line under the label. */
  description?: ReactNode
  children?: TreeListItem[]
  /** Open on first render. Read once, and not at all when `expandedIds` is controlled. */
  expanded?: boolean
  /** Selected on first render. The first flagged item wins; ignored when `selectedId` is controlled. */
  selected?: boolean
  disabled?: boolean
  /** Makes the row a real link. A disabled link renders as plain text. */
  href?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** Content before the label — an `Icon`, typically. Nothing is drawn by default. */
  startContent?: ReactNode
  /** Content after the label — a `Badge` count, typically. */
  endContent?: ReactNode
}

/** A row as it appears on screen: an item plus where it sits in the visible order. */
export interface TreeRow {
  id: string
  /** 1-based, `aria-level`. */
  level: number
  /** 1-based position among its siblings, `aria-posinset`. */
  index: number
  /** Sibling count, `aria-setsize`. */
  setSize: number
  parentId: string | null
  hasChildren: boolean
  expanded: boolean
  disabled: boolean
}

/**
 * The rows a person can see, in reading order. A collapsed parent hides its
 * whole subtree, whatever any descendant's own `expanded` says — a grandchild
 * flagged open inside a closed folder is still out of sight, and must be out of
 * the keyboard order too. Computed from state rather than the DOM because Base
 * UI unmounts a closed panel, so the DOM is the thing this exists to predict.
 */
export function flattenVisible(
  items: readonly TreeListItem[],
  expandedIds: readonly string[],
): TreeRow[] {
  const rows: TreeRow[] = []
  const open = new Set(expandedIds)

  function walk(nodes: readonly TreeListItem[], level: number, parentId: string | null) {
    nodes.forEach((node, i) => {
      const hasChildren = (node.children?.length ?? 0) > 0
      const expanded = hasChildren && open.has(node.id)
      rows.push({
        id: node.id,
        level,
        index: i + 1,
        setSize: nodes.length,
        parentId,
        hasChildren,
        expanded,
        disabled: node.disabled === true,
      })
      if (expanded) walk(node.children!, level + 1, node.id)
    })
  }

  walk(items, 1, null)
  return rows
}

/**
 * The ids an item list asks to start with. Walks every node, not just the
 * visible ones — an `expanded` grandchild inside a collapsed parent still counts,
 * so opening the parent later finds it already open, which is what the flag
 * promised. `selected` is single-select, so only the first flagged id is
 * returned; the type cannot say that, so this does.
 */
export function flaggedIds(
  items: readonly TreeListItem[],
  flag: 'expanded' | 'selected',
): string[] {
  const ids: string[] = []
  function walk(nodes: readonly TreeListItem[]) {
    for (const node of nodes) {
      if (node[flag]) {
        ids.push(node.id)
        if (flag === 'selected') return true
      }
      if (node.children && walk(node.children)) return true
    }
    return false
  }
  walk(items)
  return ids
}

/** Adds or removes one id, without duplicating it. Table's `toggleKey`, for a tree. */
export function toggleId(ids: readonly string[], id: string, on: boolean): string[] {
  const without = ids.filter((candidate) => candidate !== id)
  return on ? [...without, id] : without
}

function indexOf(rows: readonly TreeRow[], id: string): number {
  return rows.findIndex((row) => row.id === id)
}

/** The row after this one in reading order, or null at the end. APG trees do not wrap. */
export function nextId(rows: readonly TreeRow[], id: string): string | null {
  const i = indexOf(rows, id)
  return i >= 0 && i < rows.length - 1 ? rows[i + 1].id : null
}

/** The row before this one, or null at the start. */
export function prevId(rows: readonly TreeRow[], id: string): string | null {
  const i = indexOf(rows, id)
  return i > 0 ? rows[i - 1].id : null
}

export function firstId(rows: readonly TreeRow[]): string | null {
  return rows.length > 0 ? rows[0].id : null
}

/** The last *visible* row — the deepest open child of the last parent, not the last top-level item. */
export function lastId(rows: readonly TreeRow[]): string | null {
  return rows.length > 0 ? rows[rows.length - 1].id : null
}

export function parentId(rows: readonly TreeRow[], id: string): string | null {
  return rows.find((row) => row.id === id)?.parentId ?? null
}

/** The first child of an expanded parent, and null for a leaf or a closed one. */
export function firstChildId(rows: readonly TreeRow[], id: string): string | null {
  const i = indexOf(rows, id)
  if (i < 0 || !rows[i].expanded) return null
  const next = rows[i + 1]
  return next && next.parentId === id ? next.id : null
}

/** Whether `id` sits anywhere under `ancestorId` — the check that rescues focus when a parent closes over it. */
export function isDescendant(rows: readonly TreeRow[], id: string, ancestorId: string): boolean {
  let current = parentId(rows, id)
  while (current !== null) {
    if (current === ancestorId) return true
    current = parentId(rows, current)
  }
  return false
}

/**
 * What `*` opens: every closed, enabled parent at the same level as this row,
 * this row included. Leaves have nothing to open, an open parent is already
 * open, and a disabled one stays as it is.
 */
export function siblingsToExpand(rows: readonly TreeRow[], id: string): string[] {
  const row = rows.find((candidate) => candidate.id === id)
  if (!row) return []
  return rows
    .filter(
      (candidate) =>
        candidate.parentId === row.parentId &&
        candidate.hasChildren &&
        !candidate.expanded &&
        !candidate.disabled,
    )
    .map((candidate) => candidate.id)
}

/**
 * Type-ahead: the next row whose label starts with the typed character, looking
 * from just after the current row and wrapping round — so pressing the same
 * letter again keeps moving, and a lone match is reachable from itself.
 * Case-insensitive; a character that matches nothing returns null and the
 * focus stays put.
 */
export function typeahead(
  names: readonly { id: string; text: string }[],
  fromId: string | null,
  char: string,
): string | null {
  if (names.length === 0 || char.length === 0) return null
  const wanted = char.toLocaleLowerCase()
  const start = fromId === null ? -1 : names.findIndex((name) => name.id === fromId)
  for (let step = 1; step <= names.length; step++) {
    const candidate = names[(start + step) % names.length]
    if (candidate.text.trim().toLocaleLowerCase().startsWith(wanted)) return candidate.id
  }
  return null
}
