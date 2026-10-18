import type { ClientRect, CollisionDetection, DroppableContainer } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'

import { spareRowCollision } from './collision'

/**
 * Two 300px rows on a 1200px board, a half-width block in each, and a 64px
 * spare under them — the keyboard case `closestCorners` gets wrong: a block
 * the arrow key moved to the spare's top-left corner is still nearer the
 * block above it than the strip it is on.
 */
function rect(top: number, height: number, width = 1200): ClientRect {
  return { top, left: 0, width, height, bottom: top + height, right: width }
}

const rects = new Map([
  ['row-1', rect(0, 300)],
  ['a', rect(0, 300, 600)],
  ['row-2', rect(312, 300)],
  ['b', rect(312, 300, 600)],
  ['spare-1', rect(624, 64)],
])
const containers = [...rects.keys()].map((id) => ({ id }) as DroppableContainer)

function hit(detect: CollisionDetection, top: number, droppableContainers = containers) {
  const collisions = detect({
    active: { id: 'a' } as never,
    collisionRect: rect(top, 300, 600),
    droppableRects: rects,
    droppableContainers,
    pointerCoordinates: null,
  })
  return collisions[0]?.id
}

describe('spareRowCollision', () => {
  it("picks the spare once the block's top reaches it, where closestCorners would not", () => {
    expect(hit(spareRowCollision(undefined), 624)).toBe('b')
    expect(hit(spareRowCollision('spare-1'), 624)).toBe('spare-1')
    expect(hit(spareRowCollision('spare-1'), 900)).toBe('spare-1')
  })

  it('leaves everything above the spare to the fallback', () => {
    expect(hit(spareRowCollision('spare-1'), 600)).toBe('b')
    expect(hit(spareRowCollision('spare-1'), 10)).toBe('a')
  })

  it('never returns a spare that is not an enabled droppable', () => {
    const enabled = containers.filter((entry) => entry.id !== 'spare-1')
    expect(hit(spareRowCollision('spare-1'), 624, enabled)).toBe('b')
  })
})
