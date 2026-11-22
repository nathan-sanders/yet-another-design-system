import { describe, expect, it } from 'vitest'

import { parseDiff } from './diff'
import { roleOf, tokenizeLines, type SyntaxToken } from './syntax'

/** `role:content` for every coloured token, so a test reads like the code. */
const colored = (line: SyntaxToken[]) =>
  line.filter((t) => t.role).map((t) => `${t.role}:${t.content}`)

describe('tokenizeLines', () => {
  it('colours only the first word of each bash command', () => {
    const [line] = tokenizeLines('npm install @base-ui/react lucide-react', 'bash')
    expect(colored(line)).toEqual(['function:npm'])
  })

  it('finds the command after a prompt, a pipe and &&, and leaves strings and variables alone', () => {
    const lines = tokenizeLines('$ npm run build && open "http://localhost:$PORT" | cat', 'bash')
    expect(colored(lines[0])).toEqual([
      'punctuation:$',
      'function:npm',
      'operator:&&',
      'function:open',
      'string:"http://localhost:',
      'variable:$PORT',
      'string:"',
      'operator:|',
      'function:cat',
    ])
  })

  it('paints a JSX tag name as a tag and its brackets as punctuation', () => {
    const [line] = tokenizeLines('<Button onClick={go}>Hi</Button>', 'tsx')
    expect(colored(line)).toContain('tag:Button')
    expect(colored(line)).toContain('punctuation:<')
    expect(colored(line)).toContain('attribute:onClick')
    // JSX text is plain, not the type Prism's maybe-class-name would make it.
    expect(line.find((t) => t.content.includes('Hi'))?.role).toBeUndefined()
  })

  it('reads a CSS custom property as a property and a length as one number', () => {
    const [line] = tokenizeLines('  --radius: 0.75rem;', 'css')
    expect(colored(line)).toEqual([
      'property:--radius',
      'punctuation::',
      'number:0.75',
      'number:rem',
      'punctuation:;',
    ])
  })

  it('keeps blank lines, so a blank line in the source is a row', () => {
    expect(tokenizeLines('a\n\nb', 'ts')).toHaveLength(3)
    expect(tokenizeLines('a\n\nb', 'plaintext')).toHaveLength(3)
  })

  it('treats an unknown language as plain text rather than failing', () => {
    expect(tokenizeLines('x = 1', 'cobol')).toEqual([[{ content: 'x = 1' }]])
  })
})

describe('roleOf', () => {
  it('lets the innermost known name win', () => {
    expect(roleOf(['string', 'interpolation', 'interpolation-punctuation'], 'ts')).toBe(
      'punctuation',
    )
    expect(roleOf(['template-string', 'template-punctuation'], 'ts')).toBe('string')
  })

  it('treats a class name inside an embedded script as a type, not a tag', () => {
    expect(roleOf(['tag', 'script', 'class-name'], 'tsx')).toBe('type')
  })
})

describe('parseDiff', () => {
  it('splits markers off and recognizes hunks and the file header', () => {
    const lines = parseDiff(['--- a/x.css', '+++ b/x.css', '@@ -1 +1 @@', ' a', '-b', '+c', 'd'])
    expect(lines.map((l) => l.type)).toEqual([
      'hunk',
      'hunk',
      'hunk',
      'context',
      'removed',
      'added',
      'context',
    ])
    expect(lines.map((l) => l.text)).toEqual([
      '--- a/x.css',
      '+++ b/x.css',
      '@@ -1 +1 @@',
      'a',
      'b',
      'c',
      'd',
    ])
  })
})
