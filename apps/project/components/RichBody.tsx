import { Fragment, type ReactNode } from 'react'

import { Code } from '../../../src/components/Code'
import { CodeBlock } from '../../../src/components/CodeBlock'
import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { datedText } from '../data/dates'
import { parseBody } from './body'

/** A paragraph's words with each `name` in backticks drawn as the library's Code. */
export function InlineCode({ text }: { text: string }): ReactNode {
  return text
    .split(/`([^`\n]+)`/)
    .map((part, i) =>
      i % 2 ? <Code key={i}>{part}</Code> : <Fragment key={i}>{datedText(part)}</Fragment>,
    )
}

/**
 * A task's description or a comment, as `Task - Code in description`
 * (`40006589:61264`) draws them: paragraphs 12 apart with `inline code` in
 * Code, and each fenced block a CodeBlock. A block with a file name gets the
 * header and, from five lines, numbers; one without is the headerless
 * snippet, as the comment's is. `size="small"` is the comment's step.
 */
export function RichBody({
  body,
  size = 'default',
  className,
}: {
  body: string
  size?: 'default' | 'small'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {parseBody(body).map((part, i) =>
        part.kind === 'text' ? (
          // pre-line: a task made from a request carries its answers a line each.
          <Text key={i} className="whitespace-pre-line">
            <InlineCode text={part.text} />
          </Text>
        ) : (
          <CodeBlock
            key={i}
            code={part.code}
            language={part.language}
            title={part.title}
            languageLabel={Boolean(part.title)}
            lineNumbers={Boolean(part.title) && part.code.split('\n').length >= 5}
            size={size}
          />
        ),
      )}
    </div>
  )
}
