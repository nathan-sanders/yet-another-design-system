import { describe, expect, it } from 'vitest'

import { findContainer, moveBetweenContainers, moveItem, reorder, type Containers } from './move'

/**
 * The stories prove a card lands in the column it was dropped on. What they
 * cannot cheaply prove is every edge of the arithmetic — an off-by-one here is
 * a card that lands one slot away from where the screen reader said it would.
 */
const board: Containers = {
  todo: ['a', 'b', 'c'],
  doing: ['d'],
  done: [],
}

describe('findContainer', () => {
  it('finds the container holding an item', () => {
    expect(findContainer(board, 'b')).toBe('todo')
    expect(findContainer(board, 'd')).toBe('doing')
  })

  it('returns a container id as itself', () => {
    expect(findContainer(board, 'done')).toBe('done')
  })

  it('returns null for an id nobody owns', () => {
    expect(findContainer(board, 'zzz')).toBeNull()
  })
})

describe('reorder', () => {
  it('moves forwards and backwards', () => {
    expect(reorder(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(reorder(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('returns the same reference when nothing moves', () => {
    const list = ['a', 'b']
    expect(reorder(list, 1, 1)).toBe(list)
    expect(reorder(list, 5, 0)).toBe(list)
  })
})

describe('moveBetweenContainers', () => {
  it('moves to an index in another container', () => {
    const next = moveBetweenContainers(board, 'a', 'todo', 'doing', 0)
    expect(next.todo).toEqual(['b', 'c'])
    expect(next.doing).toEqual(['a', 'd'])
    expect(next.done).toBe(board.done)
  })

  it('appends when no index is given, and clamps one past the end', () => {
    expect(moveBetweenContainers(board, 'a', 'todo', 'doing').doing).toEqual(['d', 'a'])
    expect(moveBetweenContainers(board, 'a', 'todo', 'doing', 99).doing).toEqual(['d', 'a'])
  })

  it('moves into an empty container', () => {
    expect(moveBetweenContainers(board, 'c', 'todo', 'done').done).toEqual(['c'])
  })

  it('keeps an emptied source container rather than deleting it', () => {
    const next = moveBetweenContainers(board, 'd', 'doing', 'done')
    expect(next.doing).toEqual([])
    expect('doing' in next).toBe(true)
  })

  it('reorders within one container', () => {
    expect(moveBetweenContainers(board, 'a', 'todo', 'todo', 2).todo).toEqual(['b', 'c', 'a'])
  })

  it('returns the same reference when the item is not in the source', () => {
    expect(moveBetweenContainers(board, 'd', 'todo', 'done')).toBe(board)
    expect(moveBetweenContainers(board, 'a', 'todo', 'nowhere')).toBe(board)
  })
})

describe('moveItem', () => {
  it('takes the place of the item it is over', () => {
    const next = moveItem(board, 'a', 'd')
    expect(next.todo).toEqual(['b', 'c'])
    expect(next.doing).toEqual(['a', 'd'])
  })

  it('goes to the end of a container it is over', () => {
    expect(moveItem(board, 'a', 'doing').doing).toEqual(['d', 'a'])
    expect(moveItem(board, 'a', 'done').done).toEqual(['a'])
  })

  it('reorders within a container', () => {
    expect(moveItem(board, 'a', 'c').todo).toEqual(['b', 'c', 'a'])
    expect(moveItem(board, 'c', 'a').todo).toEqual(['c', 'a', 'b'])
  })

  it('is a no-op over itself, over its own container, or over an unknown id', () => {
    expect(moveItem(board, 'a', 'a')).toBe(board)
    expect(moveItem(board, 'a', 'zzz')).toBe(board)
    // Over its own container: the item is already the last one.
    expect(moveItem(board, 'c', 'todo')).toBe(board)
  })
})
