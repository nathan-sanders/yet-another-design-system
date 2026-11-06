import { describe, expect, it } from 'vitest'

import { categorical, placeholder } from '../Chart/palette'
import { describeSegments, resolveSegments } from './segments'

describe('resolveSegments', () => {
  it('colors by position in the full list, so an empty part repaints nothing', () => {
    const resolved = resolveSegments([
      { label: 'A', value: 2 },
      { label: 'B', value: 0 },
      { label: 'C', value: 3 },
    ])
    expect(resolved.map((s) => s.label)).toEqual(['A', 'C'])
    expect(resolved[1]?.color).toBe(categorical(2))
  })

  it('keeps a color the caller set', () => {
    const [first] = resolveSegments([{ label: 'A', value: 1, color: 'var(--x)' }])
    expect(first?.color).toBe('var(--x)')
  })

  it('treats negative and non-finite values as empty', () => {
    const resolved = resolveSegments([
      { label: 'A', value: -4 },
      { label: 'B', value: Number.NaN },
      { label: 'C', value: 1 },
    ])
    expect(resolved.map((s) => s.label)).toEqual(['C'])
  })

  it('falls back to one placeholder when there is nothing to draw', () => {
    expect(resolveSegments([{ label: 'A', value: 0 }])).toEqual([
      { label: '', value: 1, color: placeholder },
    ])
  })
})

describe('describeSegments', () => {
  const parts = [
    { label: 'Done', value: 1 },
    { label: 'Blocked', value: 0 },
    { label: 'To do', value: 3 },
  ]

  it('names each part with its share and skips the empty ones', () => {
    expect(describeSegments('Open work', parts)).toBe('Open work: Done 25%, To do 75%')
  })

  it('uses a custom format when given one', () => {
    expect(describeSegments('Tasks', parts, (v) => `${v} tasks`)).toBe(
      'Tasks: Done 1 tasks, To do 3 tasks',
    )
  })

  it('says so when there is nothing', () => {
    expect(describeSegments('Open work', [])).toBe('Open work: no data')
  })
})
