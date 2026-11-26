import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildRegistry, serialize, toItemName } from '../scripts/build-registry.ts'

/**
 * registry.json is what `npx shadcn add @yads/<name>` installs from, and it is
 * generated: `node scripts/build-registry.ts` reads every component's imports
 * and writes the file list, the YADS components it pulls in, and the npm
 * packages it needs.
 *
 * So the failure to guard against is a component that changed after the file
 * was last written — a new import of `../Tooltip`, a new helper file, a new
 * npm package. Nothing else would notice: Storybook imports from `src`
 * directly, so every story stays green while somebody's install comes back
 * missing a file. This test regenerates the registry in memory and compares.
 *
 * When it fails, run `npm run registry` and commit the result.
 */

const ROOT = join(import.meta.dirname, '..')

describe('registry.json', () => {
  it('matches what scripts/build-registry.ts generates from the source', () => {
    const committed = readFileSync(join(ROOT, 'registry.json'), 'utf8')
    expect(committed).toBe(serialize(buildRegistry(ROOT)))
  })

  it('has one item per component folder, plus the theme', () => {
    const registry = buildRegistry(ROOT)
    const names = registry.items.map((i) => i.name)
    expect(names[0]).toBe('theme')
    expect(new Set(names).size).toBe(names.length)
  })

  it('names items the way the docs spell them', () => {
    expect(toItemName('Button')).toBe('button')
    expect(toItemName('AlertDialog')).toBe('alert-dialog')
    expect(toItemName('OTPInput')).toBe('otp-input')
    expect(toItemName('TextArea')).toBe('text-area')
  })

  it('ships no story, test or story-only helper', () => {
    const paths = buildRegistry(ROOT).items.flatMap((i) => i.files.map((f) => f.path))
    for (const p of paths) {
      expect(p).not.toMatch(/\.(stories|test)\.tsx?$|story-|sample-/)
    }
  })

  it('pulls in the parts the docs promise for Button and Radial', () => {
    const items = new Map(buildRegistry(ROOT).items.map((i) => [i.name, i]))
    expect(items.get('button')?.registryDependencies).toEqual(
      expect.arrayContaining(['@yads/icon', '@yads/lib-cn', '@yads/lib-focus']),
    )
    expect(items.get('radial')?.registryDependencies).toContain('@yads/chart')
    expect(items.get('lib-cn')?.files[0].target).toBe('@lib/cn.ts')
    expect(items.get('button')?.files.map((f) => f.target)).toContain('@components/Button/index.ts')
  })
})
