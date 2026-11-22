import { describe, expect, it } from 'vitest'

import { docs } from '../../data/docs'
import {
  compareBlocks,
  docsShown,
  linkedCount,
  linkedOrder,
  slashQuery,
  versionRows,
} from './model'

const plan = docs.find((d) => d.id === 'austin-plan')!
const version = (id: string) => plan.versions!.find((v) => v.id === id)!

describe('All docs', () => {
  it('lists the file’s eight docs and leaves files out', () => {
    const all = docsShown(docs, 'all', 'nathan')
    expect(all.map((d) => d.name)).toEqual([
      'Austin opening plan',
      'Austin vendor contacts',
      'Crew training guide',
      'Protein Plates launch brief',
      'Mobile ordering PRD',
      'Holiday gift card copy deck',
      'Winter tasting notes',
      'Loyalty pricing model',
    ])
    expect(all.map(linkedCount)).toEqual([12, 3, 5, 8, 21, 4, 6, 2])
  })

  it('Mine is what you own or edited; Shared is what was shared with you by name', () => {
    expect(docsShown(docs, 'mine', 'nathan').map((d) => d.id)).toEqual([
      'crew-training',
      'protein-brief',
      'loyalty-pricing',
    ])
    expect(docsShown(docs, 'shared', 'nathan').map((d) => d.id)).toEqual([
      'mobile-prd',
      'gift-card-copy',
      'winter-tasting',
    ])
  })
})

describe('compare', () => {
  it('against yesterday is the file’s two changes: twelve crew became fourteen, and the soft open is new', () => {
    const { rows, changes } = compareBlocks(plan.blocks!, version('yesterday').blocks)
    expect(changes).toBe(2)
    const marked = rows.filter((r) => r.kind === 'removed' || r.added)
    expect(marked.map((r) => [r.kind === 'removed' ? 'removed' : 'added', r.block.id])).toEqual([
      ['removed', 'crew'],
      ['added', 'soft-open'],
    ])
    // The old crew line sits right above the new one, as drawn.
    const at = rows.findIndex((r) => r.kind === 'removed')
    expect(rows[at + 1]).toMatchObject({ kind: 'block', block: { id: 'crew' } })
  })

  it('counts a removed block once, where it used to sit', () => {
    const without = plan.blocks!.filter((b) => b.id !== 'kitchen')
    const { rows, changes } = compareBlocks(without, plan.blocks!)
    expect(changes).toBe(1)
    const at = rows.findIndex((r) => r.kind === 'removed')
    expect(rows[at - 1].block.id).toBe('crew')
    expect(rows[at + 1].block.id).toBe('grand')
  })

  it('the doc against itself has no changes', () => {
    expect(compareBlocks(plan.blocks!, version('today').blocks).changes).toBe(0)
  })
})

describe('history', () => {
  it('the file’s top version is current until you change something', () => {
    expect(versionRows(plan, 'nathan').map((v) => [v.id, v.current])).toEqual([
      ['today', true],
      ['yesterday', false],
      ['oct-30', false],
      ['oct-26', false],
    ])
    const edited = versionRows({ ...plan, edited: true }, 'nathan')
    expect(edited[0]).toMatchObject({ id: 'now', authorId: 'nathan', current: true })
    expect(edited[1]).toMatchObject({ id: 'today', current: false })
  })
})

describe('linked tasks', () => {
  it('lists the three the doc mentions first, in its order, then the rest', () => {
    const order = linkedOrder(plan)
    expect(order.slice(0, 3)).toEqual(['aus-24', 'aus-16', 'aus-26'])
    expect(order).toHaveLength(12)
  })
})

describe('slash', () => {
  it('reads the words after the slash', () => {
    expect(slashQuery('/Task ')).toBe('task')
    expect(slashQuery('/')).toBe('')
    expect(slashQuery('Soft open')).toBeNull()
  })
})
