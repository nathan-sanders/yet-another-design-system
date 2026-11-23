import { describe, expect, it } from 'vitest'

import { parseBody } from '../../components/body'
import { codeDetails } from '../../data/code'
import { tasks } from '../../data/tasks'
import { diffStat, neighbours, statLine } from './model'

describe('diffStat', () => {
  it('counts Apple Pay’s pull request as the file draws it: 3 files, +13 −1', () => {
    expect(statLine(codeDetails['mob-52'].pullRequest!.files)).toBe('3 files · +13 −1')
  })

  it('reads a file header as chrome, not a line removed and a line added', () => {
    const diff = '--- a/x.ts\n+++ b/x.ts\n@@ -1 +1 @@\n-a\n+b'
    expect(diffStat([{ path: 'x.ts', language: 'ts', diff }])).toEqual({
      files: 1,
      added: 1,
      removed: 1,
    })
  })
})

describe('parseBody', () => {
  it('reads Apple Pay’s description as two paragraphs and the titled config block', () => {
    const parts = parseBody(codeDetails['mob-52'].description!)
    expect(parts.map((p) => p.kind)).toEqual(['text', 'text', 'code'])
    expect(parts[2]).toMatchObject({ language: 'ts', title: 'checkout.config.ts' })
    expect(parts[2].kind === 'code' && parts[2].code.split('\n')).toHaveLength(6)
  })

  it('reads a fence with no file name as a headerless snippet', () => {
    const parts = parseBody('Check it:\n\n```ts\nreturn 1;\n```')
    expect(parts[1]).toEqual({ kind: 'code', code: 'return 1;', language: 'ts', title: undefined })
  })

  it('leaves a fence that never closes as the words it is', () => {
    expect(parseBody('```ts\nhalf')).toEqual([{ kind: 'text', text: '```ts\nhalf' }])
  })
})

describe('neighbours', () => {
  it('steps through a project’s tasks and nobody else’s', () => {
    const task = tasks.find((t) => t.id === 'mob-52')!
    const at = neighbours(task, tasks)
    const project = tasks.filter((t) => t.projectId === 'mobile-ordering')
    expect(at.total).toBe(project.length)
    expect(project[at.position - 1].id).toBe('mob-52')
    expect(at.previous?.projectId).toBe('mobile-ordering')
    expect(at.next?.projectId).toBe('mobile-ordering')
  })
})
