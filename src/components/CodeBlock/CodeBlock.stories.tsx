import type { Meta, StoryObj } from '@storybook/react-vite'
import { Play } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { CodeBlock } from './CodeBlock'
import { Button } from '../Button'
import { ContentBlock } from '../ContentBlock'
import { Tooltip } from '../Tooltip'

/** The value a token resolves to, read through the same path the element's own color takes. */
function tokenColor(token: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(--${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

const counter = `import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <Button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </Button>
  );
}
`

const themeDiff = `@@ -1,5 +1,6 @@
 :root {
   --font-code: 'Geist Mono';
-  --radius: 0.5rem;
+  --radius: 0.75rem;
+  --radius-inner: 0.25rem;
 }
`

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  argTypes: {
    container: { control: 'inline-radio', options: ['card', 'section'] },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    language: { control: 'text' },
    title: { control: 'text' },
    maxHeight: { control: 'text' },
  },
  args: {
    code: counter,
    language: 'tsx',
    title: 'Counter.tsx',
    lineNumbers: true,
  },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeBlock>

export default meta
type Story = StoryObj<typeof meta>

/** One block with controls. */
export const Playground: Story = {}

/**
 * Figma's Preview: a file with a title, numbered lines and line 4
 * highlighted; a one-line command with no header, its Copy in a column of its
 * own beside the line; and a diff.
 */
export const Preview: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="grid w-fit grid-cols-[repeat(2,30rem)] items-start gap-8">
      <CodeBlock
        code={counter}
        language="tsx"
        title="Counter.tsx"
        lineNumbers
        highlightLines={[4]}
        data-testid="file"
      />
      <div className="flex flex-col gap-8">
        <CodeBlock
          code="npm install @base-ui/react lucide-react"
          language="bash"
          languageLabel={false}
          data-testid="snippet"
        />
        <CodeBlock code={themeDiff} language="css" title="theme.css" diff data-testid="diff" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const file = canvasElement.querySelector<HTMLElement>('[data-testid="file"]')!
    const snippet = canvasElement.querySelector<HTMLElement>('[data-testid="snippet"]')!
    const diff = canvasElement.querySelector<HTMLElement>('[data-testid="diff"]')!

    // Figma's geometry: a 41px header (its rule included), 24px rows inside
    // 12px of padding, and the 1px border top and bottom — 307 for ten lines,
    // which is Figma's 211 for six plus four rows.
    const rows = file.querySelectorAll<HTMLElement>('[data-line]')
    await expect(rows).toHaveLength(10)
    await expect(file.getBoundingClientRect().height).toBe(1 + 41 + 12 + 10 * 24 + 12 + 1)
    await expect(rows[0].getBoundingClientRect().height).toBe(24)
    await expect(getComputedStyle(file).backgroundColor).toBe(tokenColor('syntax-background'))

    // Line 4 is highlighted and line 3 is not.
    await expect(getComputedStyle(rows[3]).backgroundColor).toBe(
      tokenColor('surface-overlay-subtle'),
    )
    await expect(getComputedStyle(rows[2]).backgroundColor).toBe('rgba(0, 0, 0, 0)')

    // Tokens wear the Syntax roles: `import` is a keyword, 'react' a string,
    // and `Button` inside a tag is a tag.
    const keyword = within(rows[0]).getByText('import')
    await expect(getComputedStyle(keyword).color).toBe(tokenColor('syntax-keyword'))
    const string = within(rows[0]).getByText("'react'")
    await expect(getComputedStyle(string).color).toBe(tokenColor('syntax-string'))
    const tag = within(rows[5]).getByText('Button')
    await expect(getComputedStyle(tag).color).toBe(tokenColor('syntax-tag'))

    // Line numbers are hidden from assistive tech and from a text selection.
    const number = rows[0].querySelector<HTMLElement>('[aria-hidden]')!
    await expect(getComputedStyle(number).userSelect).toBe('none')

    // The headerless snippet is one 24px row in 12px of padding plus the border.
    await expect(snippet.getBoundingClientRect().height).toBe(50)
    const copy = within(snippet).getByRole('button', { name: 'Copy code' })
    const line = snippet.querySelector<HTMLElement>('[data-line]')!
    // Copy sits level with the first line and to the right of all code.
    await expect(copy.getBoundingClientRect().top).toBe(line.getBoundingClientRect().top)
    await expect(copy.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      line.getBoundingClientRect().right,
    )

    // The diff: a hunk header, a removed line and an added line, markers in
    // their own column.
    const diffRows = diff.querySelectorAll<HTMLElement>('[data-line]')
    await expect(getComputedStyle(diffRows[3]).backgroundColor).toBe(tokenColor('syntax-removed'))
    await expect(getComputedStyle(diffRows[4]).backgroundColor).toBe(tokenColor('syntax-added'))
    await expect(diffRows[4].textContent).toBe('+  --radius: 0.75rem;')
    // The label is the language the diff is in, as the file draws it.
    await expect(within(diff).getByText('css')).toBeVisible()
  },
}

/**
 * Figma's sixteen Code Block variants: Container × Header × Size × Line
 * Numbers. `Header` is not a prop — a block has one when it has a `title` or
 * shows its language — so the headerless column turns the label off.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-10">
      {(['card', 'section'] as const).map((container) => (
        <div key={container} className="grid w-fit grid-cols-[repeat(2,22rem)] items-start gap-6">
          {(['default', 'small'] as const).flatMap((size) =>
            [true, false].map((header) => (
              <CodeBlock
                key={`${size}-${header}`}
                code={counter.split('\n').slice(0, 6).join('\n')}
                language="tsx"
                title={header ? 'Counter.tsx' : undefined}
                languageLabel={header}
                container={container}
                size={size}
                lineNumbers={header}
              />
            )),
          )}
        </div>
      ))}
    </div>
  ),
}

/**
 * Figma's twelve `_Code Line` types, which are not a prop either: `Highlighted`
 * comes from `highlightLines`, and `Added`, `Removed`, `Context` and `Hunk` from
 * reading the code as a diff. Both sizes.
 */
export const LineTypes: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="grid w-fit grid-cols-[repeat(2,24rem)] items-start gap-6">
      {(['default', 'small'] as const).map((size) => (
        <div key={size} className="flex flex-col gap-4">
          <CodeBlock
            code={'const count = 0;\nconst count = 0;'}
            language="ts"
            languageLabel={false}
            copyButton={false}
            size={size}
            lineNumbers
            highlightLines={[2]}
          />
          <CodeBlock
            code={'@@ -1,2 +1,2 @@\n const count = 0;\n-const count = 0;\n+const count = 1;'}
            language="ts"
            languageLabel={false}
            copyButton={false}
            size={size}
            lineNumbers
            diff
          />
        </div>
      ))}
    </div>
  ),
}

/**
 * A diff in two sides, `split`: context on both, the removed line beside the
 * two lines that replaced it (the second with nothing beside it), the hunk
 * header across both, and each side numbered from that header. Below it, the
 * same diff wrapped and with no language, which labels itself `diff`.
 */
export const Split: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex w-180 flex-col gap-6">
      <CodeBlock
        code={themeDiff}
        language="css"
        title="theme.css"
        diff
        split
        lineNumbers
        data-testid="split"
      />
      <CodeBlock code={themeDiff} title="theme.css" diff split wrap data-testid="plain" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const split = canvasElement.querySelector<HTMLElement>('[data-testid="split"]')!
    const plain = canvasElement.querySelector<HTMLElement>('[data-testid="plain"]')!
    const before = split.querySelectorAll<HTMLElement>('[data-side="before"]')
    const after = split.querySelectorAll<HTMLElement>('[data-side="after"]')
    const numberOf = (cell: HTMLElement) =>
      cell.querySelector('[aria-hidden] > span')?.textContent ?? ''

    // Five rows a side, and each row's two sides share a top and a height.
    await expect(before).toHaveLength(5)
    await expect(after).toHaveLength(5)
    for (const [i, cell] of before.entries()) {
      await expect(cell.getBoundingClientRect().top).toBe(after[i].getBoundingClientRect().top)
      await expect(cell.getBoundingClientRect().height).toBe(24)
    }

    // The removed line sits beside its replacement; the second added line has
    // an empty, unfilled side beside it.
    await expect(getComputedStyle(before[2]).backgroundColor).toBe(tokenColor('syntax-removed'))
    await expect(getComputedStyle(after[2]).backgroundColor).toBe(tokenColor('syntax-added'))
    await expect(before[3].textContent).toBe('')
    await expect(getComputedStyle(before[3]).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(getComputedStyle(after[3]).backgroundColor).toBe(tokenColor('syntax-added'))

    // Each side counts from `@@ -1,5 +1,6 @@`: the closing brace is line 4
    // before and line 5 after.
    await expect(numberOf(before[4])).toBe('4')
    await expect(numberOf(after[4])).toBe('5')

    // The hunk header runs across both sides.
    const lines = split.querySelector<HTMLElement>('code')!
    const hunk = within(split).getByText('@@ -1,5 +1,6 @@').closest<HTMLElement>('.col-span-2')!
    await expect(hunk.getBoundingClientRect().width).toBe(lines.getBoundingClientRect().width)

    // A diff in no language says it is a diff; one in css said css.
    await expect(within(plain).getByText('diff')).toBeVisible()
    await expect(within(split).getByText('css')).toBeVisible()
  },
}

/**
 * Every language the block knows, in one place, so the Syntax tokens can be
 * checked together in either theme. Bash is the one added on top of Prism's
 * bundle; `plaintext` paints everything in `Syntax/Variable`.
 */
export const Languages: Story = {
  parameters: { controls: { disable: true } },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="grid w-fit grid-cols-[repeat(2,30rem)] items-start gap-6">
      <CodeBlock
        language="json"
        title="package.json"
        code={`{
  "name": "yet-another-design-system",
  "private": true,
  "version": "0.0.0",
  "dependencies": { "react": "^19.2.8" },
  "sideEffects": null
}`}
      />
      <CodeBlock
        language="css"
        title="theme.css"
        code={`:root {
  /* the radius roles */
  --shape-button: var(--radius-md);
  color-scheme: light;
}

.dark { color-scheme: dark !important; }`}
      />
      <CodeBlock
        language="bash"
        code={`# install, then run Storybook
npm install prism-react-renderer
npm run storybook -- --port 6006 && open "http://localhost:$PORT"`}
      />
      <CodeBlock
        language="html"
        code={`<!doctype html>
<button type="button" class="btn" disabled>
  Save &amp; close
</button>`}
      />
      <CodeBlock
        language="python"
        title="generate.py"
        code={`def to_oklch(hex: str, alpha=1.0) -> str:
    """Convert a Figma hex to OKLCH."""
    if not hex.startswith("#"):
        raise ValueError(f"bad color {hex}")
    return None`}
      />
      <CodeBlock language="plaintext" code={'Plain text, no colour at all.\nTwo lines of it.'} />
    </div>
  ),
}

/**
 * `collapsible` makes the title, the language and a chevron the toggle, and
 * folds the code away under the header. Copy stays a separate button — a button
 * inside the toggle would be a button inside a button.
 */
export const Collapsible: Story = {
  args: { collapsible: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: /Counter\.tsx/ })
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'))
    await waitFor(() => expect(canvasElement.querySelector('[data-line]')).toBeNull())
    await userEvent.click(toggle)
    await waitFor(() => expect(canvasElement.querySelector('[data-line]')).not.toBeNull())
  },
}

/**
 * `maxHeight` keeps a long file from taking over the page: the header stays and
 * the code scrolls. The scroll region takes a tab stop so a keyboard can reach
 * it.
 */
export const Scrollable: Story = {
  args: {
    title: 'many-lines.ts',
    language: 'ts',
    maxHeight: 240,
    code: Array.from({ length: 50 }, (_, i) => `const line${i + 1} = ${i + 1};`).join('\n'),
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('group', { name: 'many-lines.ts' })
    await expect(region.getBoundingClientRect().height).toBe(240)
    await expect(region.scrollHeight).toBeGreaterThan(240)
    await expect(region).toHaveAttribute('tabindex', '0')
    // Past line 9 the gutter widens by a character, and every row stays aligned.
    const numbers = [
      ...canvasElement.querySelectorAll('[data-line] [aria-hidden] > span:first-child'),
    ]
    const widths = new Set(numbers.map((n) => n.getBoundingClientRect().width))
    await expect(widths.size).toBe(1)
  },
}

/**
 * A long line scrolls sideways by default; `wrap` breaks it instead. The
 * highlighted row runs the full width of the longest line either way.
 */
export const Wrap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {[false, true].map((wrap) => (
        <CodeBlock
          key={String(wrap)}
          title={wrap ? 'wrap' : 'scroll'}
          language="bash"
          wrap={wrap}
          highlightLines={[1]}
          code="astryx upgrade --from 0.6.0 --apply --path apps/web/src --install-deps --verbose"
        />
      ))}
    </div>
  ),
}

/**
 * `startLineNumber` numbers an excerpt with its real line numbers, and
 * `highlightLines` uses the same numbers.
 */
export const Excerpt: Story = {
  args: {
    title: 'Counter.tsx',
    code: counter.split('\n').slice(3, 9).join('\n'),
    startLineNumber: 4,
    highlightLines: [4],
  },
}

/**
 * Your own controls go in `actions`, just before Copy — in the header, or beside
 * the first line with no header. Ghost small icon Buttons match Copy.
 */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const run = (
      <Tooltip label="Run">
        <Button appearance="ghost" size="small" startIcon={Play} aria-label="Run" />
      </Tooltip>
    )
    return (
      <div className="flex flex-col gap-6">
        <CodeBlock title="Counter.tsx" language="tsx" code={counter} actions={run} />
        <CodeBlock language="bash" languageLabel={false} code="npm run storybook" actions={run} />
      </div>
    )
  },
}

/**
 * Copy puts the `code` prop on the clipboard exactly — a diff keeps its
 * markers — and says so: the icon turns to a check and a polite status reads
 * "Copied".
 */
export const CopyToClipboard: Story = {
  args: { code: themeDiff, language: 'css', title: 'theme.css', diff: true, lineNumbers: false },
  play: async ({ canvasElement, args }) => {
    let written = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void (written = text) },
    })
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Copied'))
    await expect(written).toBe(args.code)
    await expect(canvas.getByRole('button', { name: 'Copied' })).toBeVisible()
  },
}

/**
 * `section` drops the fill, rule and radius so the block blends into the
 * surface it is set in — here a ContentBlock — keeping only the header's rule.
 * `card` is the standalone form.
 */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ContentBlock>
      <ContentBlock.Header>Install</ContentBlock.Header>
      <CodeBlock
        container="section"
        language="bash"
        title="Terminal"
        code={'npm install @base-ui/react lucide-react\nnpm run storybook'}
        data-testid="section"
      />
    </ContentBlock>
  ),
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector<HTMLElement>('[data-testid="section"]')!
    const style = getComputedStyle(section)
    await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(style.borderTopWidth).toBe('0px')
  },
}
