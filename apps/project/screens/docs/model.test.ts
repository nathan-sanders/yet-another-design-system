import { describe, expect, it } from 'vitest'

import { docs, type DocBlock } from '../../data/docs'
import {
  compareBlocks,
  docsShown,
  joinBack,
  joinForward,
  linkedCount,
  linkedOrder,
  markdownShortcut,
  moveBlock,
  pasteLines,
  slashQuery,
  splitBlock,
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

describe('the editor', () => {
  const lines: DocBlock[] = [
    { id: 'h', kind: 'heading', text: 'Opening checklist' },
    { id: 'a', kind: 'item', text: 'Permits clear', taskId: 'aus-24' },
    { id: 'p', kind: 'paragraph', text: 'Soft open runs' },
    { id: 'list', kind: 'tasks' },
    { id: 'q', kind: 'paragraph', text: '' },
  ]

  it('breaks a line at the caret, and the Token goes with the words after it', () => {
    const { blocks, caret } = splitBlock(lines, 'a', 'Permits clear', 7, 'n')
    expect(blocks.slice(1, 3)).toEqual([
      { id: 'a', kind: 'item', text: 'Permits' },
      { id: 'n', kind: 'item', text: ' clear', taskId: 'aus-24' },
    ])
    expect(caret).toEqual({ id: 'n', offset: 0 })
  })

  it('keeps the Token on the line when Enter is at its end', () => {
    const { blocks } = splitBlock(lines, 'a', 'Permits clear', 13, 'n')
    expect(blocks[1]).toMatchObject({ id: 'a', taskId: 'aus-24' })
    expect(blocks[2]).toEqual({ id: 'n', kind: 'item', text: '' })
  })

  it('follows a heading with a paragraph, and opens a line above from the start', () => {
    expect(splitBlock(lines, 'h', 'Opening checklist', 17, 'n').blocks[1]).toEqual({
      id: 'n',
      kind: 'paragraph',
      text: '',
    })
    const above = splitBlock(lines, 'p', 'Soft open runs', 0, 'n')
    expect(above.blocks.map((b) => b.id)).toEqual(['h', 'a', 'n', 'p', 'list', 'q'])
    expect(above.caret).toEqual({ id: 'p', offset: 0 })
  })

  it('ends a list when Enter is in an empty bulleted line', () => {
    const { blocks } = splitBlock(lines, 'a', '', 0, 'n')
    expect(blocks[1]).toEqual({ id: 'a', kind: 'paragraph', text: '', taskId: 'aus-24' })
  })

  it('makes a bulleted line a paragraph before it joins anything', () => {
    expect(joinBack(lines, 'a', 'Permits clear')?.blocks[1]).toMatchObject({
      id: 'a',
      kind: 'paragraph',
    })
  })

  it('joins a paragraph to the line above, the caret where they meet', () => {
    const joined = joinBack(lines, 'p', 'Soft open runs')!
    expect(joined.blocks[1]).toEqual({
      id: 'a',
      kind: 'item',
      text: 'Permits clearSoft open runs',
      taskId: 'aus-24',
    })
    expect(joined.caret).toEqual({ id: 'a', offset: 13 })
    expect(joined.joined).toEqual({ from: 'p', into: 'a' })
  })

  it('never deletes a live card with Backspace, only an empty line under it', () => {
    const empty = joinBack(lines, 'q', '')!
    expect(empty.blocks.map((b) => b.id)).toEqual(['h', 'a', 'p', 'list'])
    expect(empty.caret).toEqual({ id: 'p', offset: 14 })
    expect(joinBack(lines, 'q', 'words')).toBeNull()
  })

  it('takes the next line up with Delete at the end of one', () => {
    const joined = joinForward(lines, 'h', 'Opening checklist')!
    expect(joined.blocks[0]).toMatchObject({ id: 'h', text: 'Opening checklistPermits clear' })
  })

  it('reads Markdown at the start of a line only with the caret after it', () => {
    expect(markdownShortcut('# ', 2)).toEqual({ kind: 'heading', marker: '# ' })
    expect(markdownShortcut('- ', 2)).toEqual({ kind: 'item', marker: '- ' })
    expect(markdownShortcut('[] ', 3)?.kind).toBe('todo')
    expect(markdownShortcut('- already here', 14)).toBeNull()
  })

  it('moves a block, and leaves one at the end where it is', () => {
    expect(moveBlock(lines, 'p', -1).map((b) => b.id)).toEqual(['h', 'p', 'a', 'list', 'q'])
    expect(moveBlock(lines, 'h', -1)).toBe(lines)
  })

  it('pastes lines as blocks, Markdown and all, with the rest of the line last', () => {
    let n = 0
    const { blocks, caret } = pasteLines(
      lines,
      'p',
      'Soft open runs',
      4,
      ' one\n- two\nthree',
      () => `x${++n}`,
    )
    expect(blocks.slice(2, 5)).toEqual([
      { id: 'p', kind: 'paragraph', text: 'Soft one' },
      { id: 'x1', kind: 'item', text: 'two' },
      { id: 'x2', kind: 'paragraph', text: 'three open runs' },
    ])
    expect(caret).toEqual({ id: 'x2', offset: 5 })
  })
})
