import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ComponentPropsWithRef, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { ChevronRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import {
  firstChildId,
  firstId,
  flaggedIds,
  flattenVisible,
  isDescendant,
  lastId,
  nextId,
  parentId,
  prevId,
  siblingsToExpand,
  toggleId,
  typeahead,
  type TreeListItem,
  type TreeRow,
} from './navigation'
import { chevron as chevronBox, panel, rail, row as rowRecipe, tree, treeHeader } from './styles'

/**
 * TreeList — a hierarchy people can fold and walk with the keyboard.
 *
 * Mirrors the Figma sets `Tree List` (node 40005193:41752, `Guides=True|False`)
 * and `Tree List Item` (40005185:40819, `Node=Expanded|Collapsed|Leaf` ×
 * `State=Default|Selected|Disabled|Focus`), with `_Tree Rail` (40005185:40910)
 * drawing the guide lines. The API is Astryx's `TreeList`: a data array, not
 * compound children, because a tree has to know its own shape — set size,
 * position, what is visible — to be walkable, and only the data can say.
 *
 * ## The accessibility model
 *
 * The WAI-ARIA tree view pattern, as Astryx renders it: `<ul role="tree">` of
 * `<li role="treeitem">`, each carrying `aria-level`, `aria-posinset` and
 * `aria-setsize`, a parent carrying `aria-expanded` and its children in a
 * `<ul role="group">`. One row holds `tabindex="0"` and the rest `-1` — the
 * roving tabindex Calendar hand-rolled first, because Base UI has no tree.
 * Arrow keys move through the *visible* rows, Right opens a parent or steps
 * into it, Left closes one or steps out, Home and End go to the ends, `*` opens
 * every sibling, a letter jumps to the next row starting with it, and Enter or
 * Space does what a click does. All of that arithmetic is in `navigation.ts`,
 * pinned by a node test.
 *
 * ## Where focus lives, and where the ring is
 *
 * Focus is on the `<li>`, because that is the treeitem. But in a nested tree
 * the `<li>`'s box holds every open descendant, so a ring on it would ring the
 * parent and all of its children. The ring is painted on the row instead, keyed
 * off its *parent's* focus — `focusRingFromParent` in `src/lib/focus.ts`, the
 * fourth ring in the library and the first drawn on an element that is never
 * focused itself.
 *
 * ## Click targets
 *
 * A row with an `href` is a real `<a>` (middle-click, copy link, the status
 * bar all work); every other row is a `<div>` that the `<li>` answers for. The
 * chevron is a Base UI `Collapsible.Trigger`, out of the tab order — pressing
 * Right or Left on the row does its job from the keyboard. Astryx also wraps an
 * `onClick` leaf in an inner `<button tabindex="-1">`; that is dropped here,
 * because the treeitem is already the control and a second one only announces
 * "button" for nothing.
 *
 * ## Selection is tracked only when you ask for it
 *
 * Give the tree a `selectedId`, a `defaultSelectedId`, an `onSelectedChange`,
 * or flag an item `selected`, and activating a row selects it. Do none of
 * those and activation just runs the row's `onClick` — a settings tree where
 * every row is an action should not start painting the last one you pressed.
 */

export type { TreeListItem } from './navigation'

interface TreeListBaseProps
  extends Omit<
    ComponentPropsWithRef<'div'>,
    'children' | 'onSelect' | 'aria-label' | 'aria-labelledby'
  > {
  /** The hierarchy. Every item needs a stable `id`. */
  items: readonly TreeListItem[]
  /**
   * Whether the guide lines are drawn. Figma's `Guides` axis, Astryx's
   * `variant`. Off, the rails keep their width so nothing moves.
   * @default true
   */
  guides?: boolean
  /** Ids of the open parents. Makes expansion controlled. */
  expandedIds?: readonly string[]
  /** Open parents on first render. Overrides the items' own `expanded` flags. */
  defaultExpandedIds?: readonly string[]
  onExpandedChange?: (ids: string[]) => void
  /** The selected row. Makes selection controlled; `null` for none. */
  selectedId?: string | null
  /** The selected row on first render. Overrides the items' own `selected` flags. */
  defaultSelectedId?: string | null
  onSelectedChange?: (id: string) => void
}

/**
 * The tree has to have a name. A `header` names it visibly and wires
 * `aria-labelledby` itself; otherwise say it with `aria-label` or point at
 * something with `aria-labelledby`.
 */
type TreeListName =
  | { header: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { header?: ReactNode; 'aria-label': string; 'aria-labelledby'?: string }
  | { header?: ReactNode; 'aria-label'?: string; 'aria-labelledby': string }

export type TreeListProps = TreeListBaseProps & TreeListName

/** What every node needs from the tree, passed down the recursion. */
interface TreeContext {
  guides: boolean
  expanded: ReadonlySet<string>
  selectedId: string | null
  tabStopId: string | null
  toggle: (id: string, open: boolean) => void
  activate: (item: TreeListItem, row: TreeRow, event: MouseEvent<HTMLElement>) => void
}

export function TreeList({
  items,
  guides = true,
  header,
  expandedIds: expandedProp,
  defaultExpandedIds,
  onExpandedChange,
  selectedId: selectedProp,
  defaultSelectedId,
  onSelectedChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...props
}: TreeListProps) {
  const headerId = useId()
  const rootRef = useRef<HTMLUListElement>(null)

  // Table's controlled/uncontrolled pair: the prop wins when given, the state
  // is only written when it is not, and the change handler fires either way.
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<readonly string[]>(
    () => defaultExpandedIds ?? flaggedIds(items, 'expanded'),
  )
  const expandedIds = expandedProp ?? uncontrolledExpanded
  const expanded = useMemo(() => new Set(expandedIds), [expandedIds])

  const hasSelectedFlag = useMemo(() => flaggedIds(items, 'selected').length > 0, [items])
  const [uncontrolledSelected, setUncontrolledSelected] = useState<string | null>(
    () => defaultSelectedId ?? flaggedIds(items, 'selected')[0] ?? null,
  )
  // `!== undefined`, not `??`: null is a value here, meaning "nothing selected".
  const selectedId = selectedProp !== undefined ? selectedProp : uncontrolledSelected
  const selectable =
    selectedProp !== undefined ||
    defaultSelectedId !== undefined ||
    onSelectedChange !== undefined ||
    hasSelectedFlag

  const rows = useMemo(() => flattenVisible(items, expandedIds), [items, expandedIds])

  const [focusedId, setFocusedId] = useState<string | null>(null)
  // Set only by a keyboard move or a click, so mounting the tree never steals
  // focus. Calendar's arrangement.
  const shouldFocusRef = useRef(false)

  const elementFor = useCallback(
    (id: string) =>
      // Ids are the caller's strings, so they need escaping where Calendar's
      // day keys never did.
      rootRef.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`) ?? null,
    [],
  )

  useEffect(() => {
    if (!shouldFocusRef.current || focusedId === null) return
    shouldFocusRef.current = false
    elementFor(focusedId)?.focus()
  }, [focusedId, elementFor])

  const focusItem = useCallback(
    (id: string) => {
      shouldFocusRef.current = true
      setFocusedId(id)
      // Usually the element already exists (every move lands on a mounted
      // row), so focus it now rather than a render later — and when the same
      // row is clicked twice, the state does not change and the effect would
      // not run at all.
      elementFor(id)?.focus()
    },
    [elementFor],
  )

  /*
    Derived every render rather than synced: a controlled `expandedIds` change
    can hide the focused row, and a tree with no `tabindex="0"` anywhere is a
    tree the keyboard cannot enter.
  */
  const visible = (id: string | null) => (id !== null && rows.some((r) => r.id === id) ? id : null)
  const tabStopId =
    visible(focusedId) ?? visible(selectedId) ?? rows.find((r) => !r.disabled)?.id ?? firstId(rows)

  const commitExpanded = useCallback(
    (next: string[]) => {
      if (expandedProp === undefined) setUncontrolledExpanded(next)
      onExpandedChange?.(next)
    },
    [expandedProp, onExpandedChange],
  )

  const commitSelected = useCallback(
    (next: string) => {
      if (selectedProp === undefined) setUncontrolledSelected(next)
      onSelectedChange?.(next)
    },
    [selectedProp, onSelectedChange],
  )

  const toggle = useCallback(
    (id: string, open: boolean) => {
      /*
        Closing a parent over the focused row would unmount it and drop focus
        on <body>. Move focus up to the parent first — but only if the tree
        actually holds focus; a chevron clicked from elsewhere should not
        pull it in.
      */
      if (
        !open &&
        focusedId !== null &&
        isDescendant(rows, focusedId, id) &&
        rootRef.current?.contains(document.activeElement)
      ) {
        focusItem(id)
      }
      commitExpanded(toggleId(expandedIds, id, open))
    },
    [commitExpanded, expandedIds, focusItem, focusedId, rows],
  )

  const activate = useCallback(
    (item: TreeListItem, row: TreeRow, event: MouseEvent<HTMLElement>) => {
      // `pointer-events: none` stops a real click; a synthetic `.click()` from
      // Enter still arrives here.
      if (row.disabled) return
      focusItem(item.id)
      if (selectable) commitSelected(item.id)
      item.onClick?.(event)
      if (row.hasChildren) toggle(item.id, !row.expanded)
    },
    [commitSelected, focusItem, selectable, toggle],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLUListElement>) => {
      // A key pressed anywhere in a row belongs to that row — the <a> and the
      // chevron can hold focus after a click, and the treeitem answers for both.
      const target = event.target as HTMLElement
      const element = target.closest<HTMLElement>('[data-tree-id]')
      const id = element?.dataset.treeId
      if (!id) return
      const current = rows.find((r) => r.id === id)
      if (!current) return

      let next: string | null = null
      switch (event.key) {
        case 'ArrowDown':
          next = nextId(rows, id)
          break
        case 'ArrowUp':
          next = prevId(rows, id)
          break
        case 'ArrowRight':
          if (current.hasChildren && !current.expanded) {
            if (!current.disabled) toggle(id, true)
          } else {
            next = firstChildId(rows, id)
          }
          break
        case 'ArrowLeft':
          if (current.expanded) {
            if (!current.disabled) toggle(id, false)
          } else {
            next = parentId(rows, id)
          }
          break
        case 'Home':
          next = firstId(rows)
          break
        case 'End':
          next = lastId(rows)
          break
        case 'Enter':
        case ' ':
          // One path for keyboard and pointer: on an <a> this follows the
          // href as well as running the handler.
          element?.querySelector<HTMLElement>(':scope > [data-tree-row]')?.click()
          break
        case '*': {
          const ids = siblingsToExpand(rows, id)
          if (ids.length > 0) commitExpanded([...expandedIds, ...ids])
          break
        }
        default: {
          if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
          const names = rows.map((r) => ({
            id: r.id,
            text:
              elementFor(r.id)?.querySelector('[data-tree-label]')?.textContent ?? '',
          }))
          next = typeahead(names, id, event.key)
          // A letter that matches nothing is not the tree's to swallow.
          if (next === null) return
        }
      }

      event.preventDefault()
      if (next !== null) focusItem(next)
    },
    [commitExpanded, elementFor, expandedIds, focusItem, rows, toggle],
  )

  const context = useMemo<TreeContext>(
    () => ({ guides, expanded, selectedId, tabStopId, toggle, activate }),
    [guides, expanded, selectedId, tabStopId, toggle, activate],
  )

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      {/*
        Not a heading element: the tree is a widget, and putting its name in
        the page outline is noise. SideNav.Section's call. It sits beside the
        <ul> rather than inside it because a <div> is not a valid child of
        role="tree".
      */}
      {header !== undefined && header !== null ? (
        <div id={headerId} className={treeHeader}>
          {header}
        </div>
      ) : null}
      <ul
        ref={rootRef}
        role="tree"
        aria-label={ariaLabel}
        aria-labelledby={header !== undefined && header !== null ? headerId : ariaLabelledby}
        className={tree()}
        onKeyDown={onKeyDown}
      >
        {items.map((item, i) => (
          <TreeNode
            key={item.id}
            item={item}
            level={1}
            index={i + 1}
            setSize={items.length}
            parentId={null}
            context={context}
          />
        ))}
      </ul>
    </div>
  )
}

TreeList.displayName = 'TreeList'

interface TreeNodeProps {
  item: TreeListItem
  level: number
  index: number
  setSize: number
  parentId: string | null
  context: TreeContext
}

/**
 * One item and, if it is open, its children. The row's shape is computed here
 * rather than looked up in the flattened list, because a closing panel keeps
 * its children mounted for the exit transition after they have left that list.
 */
function TreeNode({ item, level, index, setSize, parentId, context }: TreeNodeProps) {
  const labelId = useId()
  const descriptionId = useId()

  const hasChildren = (item.children?.length ?? 0) > 0
  const disabled = item.disabled === true
  const row: TreeRow = {
    id: item.id,
    level,
    index,
    setSize,
    parentId,
    hasChildren,
    expanded: hasChildren && context.expanded.has(item.id),
    disabled,
  }
  const selected = context.selectedId === item.id
  const isLink = item.href !== undefined && !disabled

  const treeitem = {
    role: 'treeitem',
    'data-tree-id': item.id,
    tabIndex: context.tabStopId === item.id ? 0 : -1,
    'aria-level': level,
    'aria-posinset': index,
    'aria-setsize': setSize,
    // Only on the selected row, never `false` — APG allows either, and this
    // keeps a tree with no selection free of the attribute entirely.
    'aria-selected': selected || undefined,
    'aria-disabled': disabled || undefined,
    // The label alone names the row: neither "Toggle children" nor a Badge's
    // count in the end slot leaks into it.
    'aria-labelledby': labelId,
    'aria-describedby': item.description ? descriptionId : undefined,
    // The ring is on the row, keyed off this element's focus.
    className: 'outline-none',
  } as const

  const rowClassName = rowRecipe({ selected, disabled })
  const onClick = (event: MouseEvent<HTMLElement>) => context.activate(item, row, event)

  const content = (
    <>
      {/*
        Figma's Rails slot, always rendered: empty at level 1 it is 0px wide
        but still takes the row's 8px gap, which is what puts the top-level
        chevron at x=8. One rail per ancestor, gap-less, 16 each.
      */}
      <span aria-hidden className="flex shrink-0 self-stretch">
        {Array.from({ length: level - 1 }, (_, i) => (
          <span key={i} className={rail({ guides: context.guides })} />
        ))}
      </span>
      {hasChildren ? (
        <CollapsiblePrimitive.Trigger
          tabIndex={-1}
          aria-label="Toggle children"
          className={chevronBox}
          // A toggle is not an activation: the row underneath must not also
          // select and run its onClick.
          onClick={(event) => event.stopPropagation()}
        >
          <Icon
            icon={ChevronRight}
            className={cn(
              'transition-transform duration-fast-min ease-standard',
              row.expanded && 'rotate-90',
            )}
          />
        </CollapsiblePrimitive.Trigger>
      ) : (
        // Figma's Chevron Spacer: a leaf keeps the column so labels line up.
        <span aria-hidden className="size-4 shrink-0" />
      )}
      {item.startContent !== undefined && item.startContent !== null ? (
        <span className="flex shrink-0 items-center">{item.startContent}</span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col py-1">
        <span id={labelId} data-tree-label className="truncate text-base text-content-primary">
          {item.label}
        </span>
        {item.description !== undefined && item.description !== null ? (
          <span id={descriptionId} className="truncate text-sm text-content-subtle">
            {item.description}
          </span>
        ) : null}
      </span>
      {item.endContent !== undefined && item.endContent !== null ? (
        <span className="flex shrink-0 items-center">{item.endContent}</span>
      ) : null}
    </>
  )

  const rowElement = isLink ? (
    // Out of the tab order: the <li> is the stop, and Enter on it clicks this.
    <a href={item.href} tabIndex={-1} data-tree-row className={rowClassName} onClick={onClick}>
      {content}
    </a>
  ) : (
    <div data-tree-row className={rowClassName} onClick={onClick}>
      {content}
    </div>
  )

  if (!hasChildren) return <li {...treeitem}>{rowElement}</li>

  return (
    <CollapsiblePrimitive.Root
      render={<li />}
      {...treeitem}
      aria-expanded={row.expanded}
      open={row.expanded}
      disabled={disabled}
      onOpenChange={(open) => context.toggle(item.id, open)}
    >
      {rowElement}
      <CollapsiblePrimitive.Panel render={<ul />} role="group" className={panel()}>
        {item.children!.map((child, i) => (
          <TreeNode
            key={child.id}
            item={child}
            level={level + 1}
            index={i + 1}
            setSize={item.children!.length}
            parentId={item.id}
            context={context}
          />
        ))}
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}
