import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { Check, ChevronRight, Copy, X } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import { parseDiff, type DiffLineType } from './diff'
import { SYNTAX_CLASS, isPlain, tokenizeLines, type SyntaxToken } from './syntax'

/**
 * CodeBlock — read-only code that stands on its own: a source file, a terminal
 * command, a config example, a diff.
 *
 * The look is the Figma set "Code Block" (page `↪ Code Block`, set
 * `40006580:1235`) and its line component `_Code Line` (`40006579:438`). The
 * API follows Meta's Astryx `CodeBlock` — one `code` string, a `language`, and
 * booleans for the chrome — narrowed to what the file draws. See the record.
 *
 * **Figma's four axes become two props and two derivations.** `Container` and
 * `Size` are props. `Header` is derived — a block has one when it has a
 * `title` or shows its language — because a header with nothing in it is not a
 * state anybody wants, and a prop that could say `header` while there was
 * nothing to put in it is a prop that would. `Line Numbers` is `lineNumbers`.
 * The underscored `_Code Line` is a drawing mechanism, not an API: its `Type`
 * follows from `highlightLines` and `diff`.
 */

/** Figma's `_Code Line` `Type` axis. */
type LineType = 'default' | 'highlighted' | DiffLineType

const block = tv({
  slots: {
    root: 'flex min-w-0 font-sans',
    header: 'flex items-center gap-2 py-2 pr-2 pl-4',
    // The title group holds its own 24px, so the header is 41 tall with or
    // without the copy button beside it — 8 + 24 + 8 + the body's 1px rule.
    titleGroup: 'flex min-h-6 min-w-0 flex-1 items-center gap-2',
    title: 'min-w-0 flex-1 truncate font-mono text-sm font-normal text-syntax-comment',
    language: 'shrink-0 text-sm text-content-subtle',
    body: 'min-w-0 flex-1',
    scroll: ['overflow-auto', focusRing, 'focus-visible:rounded-container-inner'],
    // `w-max min-w-full`, so a highlighted or added row runs the width of the
    // longest line when the block scrolls sideways, not just the visible part.
    lines: 'relative block w-max min-w-full py-3 font-mono font-normal text-syntax-variable',
    // Figma's block-level `Gutter`: the 1px rule beside the numbers, drawn once
    // across the padding as well as the rows so it does not break above the
    // first line and below the last. 28px is the row's 16px inset plus the
    // number's 12px gap.
    gutter:
      'pointer-events-none absolute inset-y-0 left-[calc(--spacing(7)+var(--code-block-number))] w-px bg-surface-border',
    controls: 'flex shrink-0 items-start gap-2 pr-2',
  },
  variants: {
    container: {
      // Container Inner, Surface/Border and the muted Syntax/Background: a
      // block that stands on its own.
      card: { root: 'rounded-container-inner border border-surface-border bg-syntax-background' },
      // No fill, rule or radius: the block takes the surface of the card or
      // panel it is set into. Only the header's rule is kept.
      section: { root: '' },
    },
    hasHeader: {
      true: { root: 'flex-col', body: 'border-t border-surface-border' },
      false: { root: 'flex-row items-start' },
    },
    size: {
      // The number column is at least Figma's fixed 20 / 16px and grows by
      // character for a file past line 99, so every row's gutter lines up.
      default: {
        lines:
          'text-base [--code-block-number:max(--spacing(5),calc(var(--code-block-digits)*1ch))]',
        // 12px down, so the 24px button sits level with the 24px first line.
        controls: 'pt-3',
      },
      small: {
        lines: 'text-sm [--code-block-number:max(--spacing(4),calc(var(--code-block-digits)*1ch))]',
        // 10px: a 24px button centred on a 20px first line that starts at 12.
        controls: 'pt-2.5',
      },
    },
    wrap: {
      true: { lines: 'w-full' },
    },
  },
})

const row = tv({
  slots: {
    base: 'flex gap-4 px-4',
    numberGroup: 'flex shrink-0 gap-3 select-none',
    number: 'w-(--code-block-number) text-right text-syntax-punctuation',
    // Reserves the gutter's 1px in the row; the rule itself is drawn once by
    // the block so it can run through the padding.
    gutterSpace: 'w-px',
    content: 'flex min-w-0 flex-1 gap-2',
    marker: 'w-[1ch] shrink-0 text-syntax-punctuation',
    code: 'whitespace-pre',
  },
  variants: {
    type: {
      default: {},
      highlighted: { base: 'bg-surface-overlay-subtle' },
      added: {
        base: 'bg-syntax-added',
        number: 'text-syntax-added-marker',
        marker: 'text-syntax-added-marker',
      },
      removed: {
        base: 'bg-syntax-removed',
        number: 'text-syntax-removed-marker',
        marker: 'text-syntax-removed-marker',
      },
      context: {},
      // A hunk header has no marker column and no syntax: the whole line is
      // Syntax/Punctuation on Syntax/Diff Header.
      hunk: { base: 'bg-syntax-diff-header', code: 'text-syntax-punctuation' },
    },
    size: {
      // Each row holds its line height even when empty, so a blank line in the
      // source is a blank row rather than nothing.
      default: { base: 'min-h-6' },
      small: { base: 'min-h-5' },
    },
    wrap: {
      true: { code: 'min-w-0 whitespace-pre-wrap break-words' },
    },
  },
})

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_LABEL: Record<CopyState, string> = {
  idle: 'Copy code',
  copied: 'Copied',
  failed: 'Failed to copy',
}

const COPY_ICON = { idle: Copy, copied: Check, failed: X }

/** How long Copied (or the failure) shows before the button resets. */
const COPY_RESET_MS = 2000

function CopyButton({
  code,
  onCopy,
  onCopyError,
}: {
  code: string
  onCopy?: () => void
  onCopyError?: (error: unknown) => void
}) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    window.clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(code)
      setState('copied')
      onCopy?.()
    } catch (error) {
      setState('failed')
      onCopyError?.(error)
    }
    timer.current = window.setTimeout(() => setState('idle'), COPY_RESET_MS)
  }

  return (
    <>
      <Tooltip label={COPY_LABEL[state]}>
        <Button
          appearance="ghost"
          size="small"
          startIcon={COPY_ICON[state]}
          aria-label={COPY_LABEL[state]}
          onClick={copy}
        />
      </Tooltip>
      {/* The button's name changes too, but a name change on a focused button
          is not reliably spoken; a polite status is. Astryx does the same. */}
      <span role="status" className="sr-only">
        {state === 'idle' ? '' : COPY_LABEL[state]}
      </span>
    </>
  )
}

function Tokens({ tokens }: { tokens: SyntaxToken[] }) {
  return tokens.map((token, i) =>
    token.role ? (
      <span key={i} className={SYNTAX_CLASS[token.role]}>
        {token.content}
      </span>
    ) : (
      token.content
    ),
  )
}

export interface CodeBlockProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  /** The code, as one string. It is also exactly what Copy puts on the clipboard. */
  code: string
  /**
   * The language to highlight as: `tsx`, `ts`, `jsx`, `js`, `json`, `css`,
   * `html`, `bash` (also `sh`, `shell`, `zsh`), `yaml`, `markdown`, `python`,
   * `go`, `rust`, `sql` and the rest of Prism's bundle. `plaintext` (the
   * default) turns highlighting off; a language Prism does not know does the
   * same rather than failing.
   */
  language?: string
  /**
   * Filename or label for the header — `Counter.tsx`. Give one whenever the
   * code is a file. A title or a visible language label is what gives the
   * block a header at all.
   */
  title?: string
  /**
   * Show the language in the header. On by default, and hidden for
   * `plaintext`. Turn it off, with no `title`, for a headerless one-line
   * command: Copy then moves to its own column beside the first line.
   */
  languageLabel?: boolean
  /** `card` (the default) stands on its own; `section` blends into the surface it is set in. */
  container?: 'card' | 'section'
  /** `default` sets code at `text-base/mono` (24px lines), `small` at `text-sm/mono` (20px). */
  size?: 'default' | 'small'
  /** Number the lines. Leave off under five lines, where numbers add noise. */
  lineNumbers?: boolean
  /** The number of the first line, so an excerpt reads with its real line numbers. */
  startLineNumber?: number
  /** Lines to highlight, in the same numbering as the gutter (so after `startLineNumber`). */
  highlightLines?: number[]
  /**
   * Read `code` as a unified diff: `+` added, `-` removed, `@@` a hunk header,
   * anything else context. The marker gets its own column and the rest of each
   * line keeps `language`'s highlighting. The label reads `diff`.
   */
  diff?: boolean
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean
  /**
   * The tallest the code may be before it scrolls, as a CSS length or a number
   * of pixels. The header stays put; only the code scrolls.
   */
  maxHeight?: number | string
  /** Show the copy button. On by default. */
  copyButton?: boolean
  /** Called after the code is copied. */
  onCopy?: () => void
  /** Called when the clipboard write fails; the button shows a cross. */
  onCopyError?: (error: unknown) => void
  /**
   * Your own controls, placed just before Copy — in the header when there is
   * one, beside the first line when there is not, and never over the code.
   * Ghost small icon Buttons match Copy.
   */
  actions?: ReactNode
  /**
   * Let the header fold the code away. Needs a header; a headerless block
   * ignores it. The title, the language and a chevron become the toggle.
   */
  collapsible?: boolean
  /** Whether a collapsible block starts open. Defaults to `true`. */
  defaultOpen?: boolean
  /** Controlled open state for a collapsible block. */
  open?: boolean
  /** Called when a collapsible block opens or closes. */
  onOpenChange?: (open: boolean) => void
}

export function CodeBlock({
  code,
  language = 'plaintext',
  title,
  languageLabel = true,
  container = 'card',
  size = 'default',
  lineNumbers = false,
  startLineNumber = 1,
  highlightLines,
  diff = false,
  wrap = false,
  maxHeight,
  copyButton = true,
  onCopy,
  onCopyError,
  actions,
  collapsible = false,
  defaultOpen = true,
  open,
  onOpenChange,
  className,
  style,
  ...props
}: CodeBlockProps) {
  // One trailing newline is how files end, not a blank last line to draw.
  const source = code.endsWith('\n') ? code.slice(0, -1) : code
  const first = Math.max(1, startLineNumber)

  const rows = useMemo(() => {
    const lines = source.split('\n')
    if (!diff) {
      return tokenizeLines(source, language).map((tokens) => ({
        type: 'default' as LineType,
        marker: undefined as string | undefined,
        tokens,
      }))
    }
    // A diff is highlighted as its language with the markers taken off and the
    // hunk headers left out, so a multi-line string or comment still reads
    // across the lines it spans.
    const parsed = parseDiff(lines)
    const codeLines = parsed.filter((line) => line.type !== 'hunk').map((line) => line.text)
    const highlighted = tokenizeLines(codeLines.join('\n'), language)
    let next = 0
    return parsed.map((line) => ({
      type: line.type as LineType,
      marker: line.type === 'hunk' ? undefined : line.marker,
      tokens: line.type === 'hunk' ? [{ content: line.text }] : highlighted[next++],
    }))
  }, [source, language, diff])

  const highlighted = new Set(highlightLines)
  const label = diff ? 'diff' : isPlain(language) ? undefined : language
  const showLanguage = languageLabel && label !== undefined
  const hasHeader = Boolean(title) || showLanguage
  const isCollapsible = collapsible && hasHeader
  const slots = block({ container, hasHeader, size, wrap })
  const digits = String(first + rows.length - 1).length

  const controls = (actions || copyButton) && (
    <>
      {actions}
      {copyButton && <CopyButton code={code} onCopy={onCopy} onCopyError={onCopyError} />}
    </>
  )

  const titleContent = (
    <>
      {isCollapsible && (
        <Icon
          icon={ChevronRight}
          size="small"
          className="shrink-0 text-content-subtle transition-transform duration-fast ease-standard group-data-[panel-open]:rotate-90"
        />
      )}
      <span className={slots.title()}>{title}</span>
      {showLanguage && <span className={slots.language()}>{label}</span>}
    </>
  )

  const body = (
    <div className={slots.body()}>
      <div
        // A scroll region you can only reach by dragging is unreachable from a
        // keyboard, so it takes a tab stop and a name (axe's
        // scrollable-region-focusable). Astryx names it the same way.
        role="group"
        aria-label={title ?? label ?? 'Code'}
        tabIndex={0}
        className={cn(slots.scroll(), maxHeight !== undefined && 'max-h-(--code-block-max-height)')}
        style={
          maxHeight === undefined
            ? undefined
            : ({
                '--code-block-max-height':
                  typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
              } as CSSProperties)
        }
      >
        <pre className="m-0">
          <code
            className={slots.lines()}
            style={{ '--code-block-digits': digits } as CSSProperties}
          >
            {lineNumbers && <span aria-hidden className={slots.gutter()} />}
            {rows.map((line, i) => {
              const number = first + i
              const type: LineType =
                line.type === 'default' && highlighted.has(number) ? 'highlighted' : line.type
              const parts = row({ type, size, wrap })
              return (
                <span key={i} className={cn('block', parts.base())} data-line={number}>
                  {lineNumbers && (
                    <span aria-hidden className={parts.numberGroup()}>
                      <span className={parts.number()}>{number}</span>
                      <span className={parts.gutterSpace()} />
                    </span>
                  )}
                  <span className={parts.content()}>
                    {line.marker !== undefined && (
                      <span className={parts.marker()}>{line.marker}</span>
                    )}
                    <span className={parts.code()}>
                      <Tokens tokens={line.tokens} />
                    </span>
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )

  const content = hasHeader ? (
    <>
      <div className={slots.header()}>
        {isCollapsible ? (
          <CollapsiblePrimitive.Trigger
            className={cn(
              slots.titleGroup(),
              // The ring needs room round the text: 8px of it on the left and 4px on
              // the right, each taken back with a negative margin so nothing moves.
              'group -my-1 -mr-1 -ml-2 cursor-pointer rounded-button py-1 pr-1 pl-2 text-left',
              focusRing,
            )}
          >
            {titleContent}
          </CollapsiblePrimitive.Trigger>
        ) : (
          <div className={slots.titleGroup()}>{titleContent}</div>
        )}
        {controls}
      </div>
      {isCollapsible ? (
        <CollapsiblePrimitive.Panel className="h-(--collapsible-panel-height) overflow-clip [overflow-clip-margin:--spacing(1)] transition-[height] duration-fast ease-standard data-[ending-style]:h-0 data-[starting-style]:h-0">
          {body}
        </CollapsiblePrimitive.Panel>
      ) : (
        body
      )}
    </>
  ) : (
    <>
      {body}
      {/* With no header, Copy sits in its own column beside the first line, so
          it never covers code and a one-line command reads as one row. */}
      {controls && <div className={slots.controls()}>{controls}</div>}
    </>
  )

  if (isCollapsible) {
    return (
      <CollapsiblePrimitive.Root
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        className={cn(slots.root(), className)}
        style={style}
        data-container={container}
        {...props}
      >
        {content}
      </CollapsiblePrimitive.Root>
    )
  }

  return (
    <div
      className={cn(slots.root(), className)}
      style={style}
      data-container={container}
      {...props}
    >
      {content}
    </div>
  )
}

CodeBlock.displayName = 'CodeBlock'
