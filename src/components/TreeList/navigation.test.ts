import { describe, expect, it } from 'vitest'

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
} from './navigation'

/**
 * The stories prove the rows are 32px tall and the guide lines land under the
 * chevrons. What they cannot cheaply prove is the walking order — every wrong
 * answer below is a tree that looks right and moves focus somewhere else.
 */

/*
  src/
    components/      (open)
      Button.tsx
      Card.tsx
    lib/             (closed, has children)
      cn.ts
    App.tsx
  public/            (closed, disabled)
    favicon.ico
  README.md
*/
const items: TreeListItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      { id: 'lib', label: 'lib', children: [{ id: 'cn', label: 'cn.ts' }] },
      { id: 'app', label: 'App.tsx' },
    ],
  },
  { id: 'public', label: 'public', disabled: true, children: [{ id: 'favicon', label: 'favicon.ico' }] },
  { id: 'readme', label: 'README.md' },
]

const rows = flattenVisible(items, ['src', 'components'])
const ids = rows.map((row) => row.id)

describe('flattenVisible', () => {
  it('lists the visible rows in reading order', () => {
    expect(ids).toEqual(['src', 'components', 'button', 'card', 'lib', 'app', 'public', 'readme'])
  })

  it('carries level, position and set size for aria', () => {
    const card = rows.find((row) => row.id === 'card')!
    expect(card).toMatchObject({ level: 3, index: 2, setSize: 2, parentId: 'components' })
    const readme = rows.find((row) => row.id === 'readme')!
    expect(readme).toMatchObject({ level: 1, index: 3, setSize: 3, parentId: null })
  })

  /**
   * The case the DOM cannot be asked about: a grandchild flagged open inside a
   * closed parent. Base UI has unmounted it, so it must not be in the walk.
   */
  it('hides everything under a collapsed parent, even an expanded grandchild', () => {
    const closed = flattenVisible(items, ['components'])
    expect(closed.map((row) => row.id)).toEqual(['src', 'public', 'readme'])
  })

  it('does not report a leaf as expanded, whatever expandedIds says', () => {
    const leafOpen = flattenVisible(items, ['readme'])
    expect(leafOpen.find((row) => row.id === 'readme')!.expanded).toBe(false)
  })

  it('is empty for no items', () => {
    expect(flattenVisible([], [])).toEqual([])
  })
})

describe('flaggedIds', () => {
  const flagged: TreeListItem[] = [
    { id: 'a', label: 'a', expanded: true, children: [{ id: 'b', label: 'b', selected: true }] },
    {
      id: 'c',
      label: 'c',
      children: [{ id: 'd', label: 'd', expanded: true, selected: true, children: [{ id: 'e', label: 'e' }] }],
    },
  ]

  it('collects every expanded id, including ones hidden under a closed parent', () => {
    expect(flaggedIds(flagged, 'expanded')).toEqual(['a', 'd'])
  })

  it('returns only the first selected id', () => {
    expect(flaggedIds(flagged, 'selected')).toEqual(['b'])
  })
})

describe('toggleId', () => {
  it('adds and removes without duplicating', () => {
    expect(toggleId(['a'], 'b', true)).toEqual(['a', 'b'])
    expect(toggleId(['a', 'b'], 'b', true)).toEqual(['a', 'b'])
    expect(toggleId(['a', 'b'], 'a', false)).toEqual(['b'])
    expect(toggleId(['b'], 'a', false)).toEqual(['b'])
  })
})

describe('next and previous', () => {
  it('cross from a last grandchild to the next visible row', () => {
    expect(nextId(rows, 'card')).toBe('lib')
    expect(prevId(rows, 'lib')).toBe('card')
  })

  it('stop at the ends rather than wrapping', () => {
    expect(nextId(rows, 'readme')).toBeNull()
    expect(prevId(rows, 'src')).toBeNull()
  })

  it('return null for a row that is not visible', () => {
    expect(nextId(rows, 'favicon')).toBeNull()
  })
})

describe('first and last', () => {
  it('first is the top row', () => {
    expect(firstId(rows)).toBe('src')
  })

  it('last is the deepest visible row, not the last top-level item', () => {
    const deep = flattenVisible(items, ['src', 'lib'])
    // src > lib is open, but `readme` still follows it at level 1.
    expect(lastId(deep)).toBe('readme')
    const deeper = flattenVisible([{ id: 'x', label: 'x', children: [{ id: 'y', label: 'y' }] }], ['x'])
    expect(lastId(deeper)).toBe('y')
  })

  it('are null for an empty tree', () => {
    expect(firstId([])).toBeNull()
    expect(lastId([])).toBeNull()
  })
})

describe('parent and first child', () => {
  it('walk up and down one level', () => {
    expect(parentId(rows, 'card')).toBe('components')
    expect(parentId(rows, 'src')).toBeNull()
    expect(firstChildId(rows, 'components')).toBe('button')
  })

  it('first child is null for a leaf and for a collapsed parent', () => {
    expect(firstChildId(rows, 'app')).toBeNull()
    expect(firstChildId(rows, 'lib')).toBeNull()
  })
})

describe('isDescendant', () => {
  it('is true any number of levels down and false across branches', () => {
    expect(isDescendant(rows, 'card', 'src')).toBe(true)
    expect(isDescendant(rows, 'card', 'components')).toBe(true)
    expect(isDescendant(rows, 'card', 'lib')).toBe(false)
    expect(isDescendant(rows, 'src', 'src')).toBe(false)
  })
})

describe('siblingsToExpand', () => {
  it('opens the closed, enabled parents at the same level, self included', () => {
    // At level 2 under src: components (open), lib (closed parent), app (leaf).
    expect(siblingsToExpand(rows, 'app')).toEqual(['lib'])
    expect(siblingsToExpand(rows, 'lib')).toEqual(['lib'])
  })

  it('skips a disabled sibling', () => {
    // Level 1: src (open), public (closed but disabled), readme (leaf).
    expect(siblingsToExpand(rows, 'readme')).toEqual([])
    const closedAll = flattenVisible(items, [])
    expect(siblingsToExpand(closedAll, 'readme')).toEqual(['src'])
  })

  it('is empty for an unknown row', () => {
    expect(siblingsToExpand(rows, 'nope')).toEqual([])
  })
})

describe('typeahead', () => {
  const names = [
    { id: 'src', text: 'src' },
    { id: 'components', text: 'components' },
    { id: 'card', text: 'Card.tsx' },
    { id: 'readme', text: 'README.md' },
  ]

  it('finds the next match after the current row, case-insensitively', () => {
    expect(typeahead(names, 'src', 'c')).toBe('components')
    expect(typeahead(names, 'components', 'c')).toBe('card')
    expect(typeahead(names, 'src', 'R')).toBe('readme')
  })

  it('wraps round, and can land back on the row it started from', () => {
    expect(typeahead(names, 'readme', 's')).toBe('src')
    expect(typeahead(names, 'src', 's')).toBe('src')
  })

  it('starts from the top when nothing is focused', () => {
    expect(typeahead(names, null, 'c')).toBe('components')
  })

  it('returns null when nothing matches', () => {
    expect(typeahead(names, 'src', 'z')).toBeNull()
    expect(typeahead([], null, 'a')).toBeNull()
  })
})
