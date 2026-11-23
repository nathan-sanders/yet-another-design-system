import { code } from '../../../../src/components/Code/styles'
import { datedText } from '../../data/dates'

/**
 * The words of a line with their formatting: bold, italic, inline code and
 * links. A line is saved as a short string in a Markdown dialect — `**bold**`,
 * `*italic*`, `` `code` ``, `[words](https://…)` — so a doc's blocks, versions and comparisons stay
 * strings, and a line with no formatting is saved exactly as before. The editor
 * works on runs: stretches of words that share their formatting.
 */
export interface Run {
  text: string
  bold?: boolean
  italic?: boolean
  /** A name or flag inside the sentence, drawn as the library's Code (`Docs - Code block from slash menu`). */
  code?: boolean
  href?: string
}

export type Mark = 'bold' | 'italic' | 'code'

const same = (a: Run, b: Run) =>
  Boolean(a.bold) === Boolean(b.bold) &&
  Boolean(a.italic) === Boolean(b.italic) &&
  Boolean(a.code) === Boolean(b.code) &&
  a.href === b.href

/** Runs with the empty ones dropped and neighbours that look alike joined. */
export function normalize(runs: Run[]): Run[] {
  const out: Run[] = []
  for (const run of runs) {
    if (!run.text) continue
    const last = out[out.length - 1]
    if (last && same(last, run)) out[out.length - 1] = { ...last, text: last.text + run.text }
    else {
      const clean: Run = { text: run.text }
      if (run.bold) clean.bold = true
      if (run.italic) clean.italic = true
      if (run.code) clean.code = true
      if (run.href) clean.href = run.href
      out.push(clean)
    }
  }
  return out
}

/** The index of the closing `**` from `from`, stepping over `*italic*` inside it. */
function closeBold(md: string, from: number): number {
  let italic = false
  for (let k = from; k < md.length; k++) {
    if (md[k] === '\\') k++
    else if (md.startsWith('**', k) && !italic) return k
    else if (md[k] === '*') italic = !italic
  }
  return -1
}

/** The index of the closing `*` from `from`. */
function closeItalic(md: string, from: number): number {
  for (let k = from; k < md.length; k++) {
    if (md[k] === '\\') k++
    else if (md.startsWith('**', k)) k++
    else if (md[k] === '*') return k
  }
  return -1
}

/** The index of the `]` that closes a link's words from `from`. */
function closeBracket(md: string, from: number): number {
  for (let k = from; k < md.length; k++) {
    if (md[k] === '\\') k++
    else if (md[k] === ']') return k
  }
  return -1
}

/** A saved line as runs. Anything that does not close is read as the characters it is. */
export function parseInline(md: string, marks: Omit<Run, 'text'> = {}): Run[] {
  const out: Run[] = []
  let words = ''
  const flush = () => {
    if (words) out.push({ text: words, ...marks })
    words = ''
  }
  for (let i = 0; i < md.length;) {
    const c = md[i]
    if (c === '\\' && i + 1 < md.length) {
      words += md[i + 1]
      i += 2
      continue
    }
    if (md.startsWith('**', i)) {
      const end = closeBold(md, i + 2)
      if (end > i + 2) {
        flush()
        out.push(...parseInline(md.slice(i + 2, end), { ...marks, bold: true }))
        i = end + 2
        continue
      }
    } else if (c === '*') {
      const end = closeItalic(md, i + 1)
      if (end > i + 1) {
        flush()
        out.push(...parseInline(md.slice(i + 1, end), { ...marks, italic: true }))
        i = end + 1
        continue
      }
    } else if (c === '`') {
      // Code is read as the characters it holds: no stars or brackets inside it.
      const end = md.indexOf('`', i + 1)
      if (end > i + 1) {
        flush()
        out.push({ text: md.slice(i + 1, end), ...marks, code: true })
        i = end + 1
        continue
      }
    } else if (c === '[') {
      const end = closeBracket(md, i + 1)
      const close = end > i ? md.indexOf(')', end) : -1
      if (end > i + 1 && md[end + 1] === '(' && close > end + 1) {
        flush()
        const href = md.slice(end + 2, close)
        out.push(...parseInline(md.slice(i + 1, end), { ...marks, href }))
        i = close + 1
        continue
      }
    }
    words += c
    i++
  }
  flush()
  return normalize(out)
}

const escape = (text: string) => text.replace(/[\\*[\]`]/g, (c) => `\\${c}`)

/** Runs as the saved string: links outermost, then bold, then italic, then code. */
export function serializeInline(runs: Run[]): string {
  const groups = (list: Run[], key: (r: Run) => string | boolean | undefined) => {
    const out: Run[][] = []
    for (const run of list) {
      const last = out[out.length - 1]
      if (last && key(last[0]) === key(run)) last.push(run)
      else out.push([run])
    }
    return out
  }
  return groups(normalize(runs), (r) => r.href)
    .map((linked) => {
      const inner = groups(linked, (r) => Boolean(r.bold))
        .map((bolded) => {
          const words = groups(bolded, (r) => Boolean(r.italic))
            .map((italic) => {
              const text = groups(italic, (r) => Boolean(r.code))
                .map((g) => {
                  const raw = g.map((r) => r.text).join('')
                  // Inside backticks nothing is escaped, and a backtick cannot be said.
                  return g[0].code ? `\`${raw.replace(/`/g, '')}\`` : escape(raw)
                })
                .join('')
              return italic[0].italic ? `*${text}*` : text
            })
            .join('')
          return bolded[0].bold ? `**${words}**` : words
        })
        .join('')
      return linked[0].href ? `[${inner}](${linked[0].href.replace(/\)/g, '%29')})` : inner
    })
    .join('')
}

/** A saved line's runs as you read them, its `{2026-11-18}` dates written out. */
export function readRuns(md: string): Run[] {
  return normalize(parseInline(md).map((r) => ({ ...r, text: datedText(r.text) })))
}

/** A saved line as you read it, still formatted: what a line of the editor holds. */
export function readInline(md: string): string {
  return serializeInline(readRuns(md))
}

export function plainText(runs: Run[]): string {
  return runs.map((r) => r.text).join('')
}

/** The words between two character counts, keeping their formatting. */
export function sliceRuns(runs: Run[], start: number, end = Infinity): Run[] {
  const out: Run[] = []
  let at = 0
  for (const run of runs) {
    const from = Math.max(start - at, 0)
    const to = Math.min(end - at, run.text.length)
    if (to > from) out.push({ ...run, text: run.text.slice(from, to) })
    at += run.text.length
  }
  return normalize(out)
}

/** A saved line in two at a character count, both halves keeping their formatting. */
export function splitInline(md: string, at: number): [string, string] {
  const runs = parseInline(md)
  return [serializeInline(sliceRuns(runs, 0, at)), serializeInline(sliceRuns(runs, at))]
}

export function joinInline(a: string, b: string): string {
  return serializeInline([...parseInline(a), ...parseInline(b)])
}

export function inlineLength(md: string): number {
  return plainText(parseInline(md)).length
}

/** Plain words put in at a character count; they take no formatting of their own. */
export function insertPlain(runs: Run[], at: number, text: string, end = at): Run[] {
  return normalize([...sliceRuns(runs, 0, at), { text }, ...sliceRuns(runs, end)])
}

/** Whether every character between two counts carries a mark (or a link, for `href`). */
export function hasMark(runs: Run[], start: number, end: number, mark: Mark | 'href'): boolean {
  const part = sliceRuns(runs, start, end)
  return part.length > 0 && part.every((r) => Boolean(r[mark]))
}

/**
 * ⌘B and ⌘I: the mark comes off a stretch that is all marked, and goes onto
 * one that is partly or not at all, as Notion and Google Docs do it.
 */
export function toggleMark(runs: Run[], start: number, end: number, mark: Mark): Run[] {
  const on = !hasMark(runs, start, end, mark)
  return normalize([
    ...sliceRuns(runs, 0, start),
    ...sliceRuns(runs, start, end).map((r) => ({ ...r, [mark]: on })),
    ...sliceRuns(runs, end),
  ])
}

/** A link put on a stretch of words, or taken off it with no address. */
export function setLink(runs: Run[], start: number, end: number, href?: string): Run[] {
  return normalize([
    ...sliceRuns(runs, 0, start),
    ...sliceRuns(runs, start, end).map((r) => ({ ...r, href: href || undefined })),
    ...sliceRuns(runs, end),
  ])
}

/**
 * The whole link a character count is in or at either end of, across runs
 * that share its address — a link with one bold word in it is three runs.
 */
export function linkAround(
  runs: Run[],
  offset: number,
): { start: number; end: number; href: string } | null {
  const spans: { start: number; end: number; href: string }[] = []
  let at = 0
  for (const run of runs) {
    const end = at + run.text.length
    const last = spans[spans.length - 1]
    if (run.href && last && last.href === run.href && last.end === at) last.end = end
    else if (run.href) spans.push({ start: at, end, href: run.href })
    at = end
  }
  return spans.find((span) => offset >= span.start && offset <= span.end) ?? null
}

/** What a typed address becomes: a bare domain gets https, a mailto or http(s) stays. */
export function normalizeHref(input: string): string | null {
  const href = input.trim()
  if (!href) return null
  if (/^(https?:|mailto:)/i.test(href) || isInternal(href)) return href
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(href)) return `https://${href}`
  return null
}

/**
 * `**words**`, `*words*` or `` `words` `` typed and closed: the marks go and
 * the words take the formatting, as Notion does it. `caret` is just after the
 * closing star or backtick.
 */
export function inlineShortcut(
  runs: Run[],
  caret: number,
): { runs: Run[]; caret: number; mark: Mark } | null {
  const before = plainText(runs).slice(0, caret)
  const code = /`([^`\s](?:[^`]*[^`\s])?)`$/.exec(before)
  if (code) {
    const start = caret - code[1].length - 2
    const marked = toggleMark(
      [
        ...sliceRuns(runs, 0, start),
        ...sliceRuns(runs, start + 1, caret - 1),
        ...sliceRuns(runs, caret),
      ],
      start,
      start + code[1].length,
      'code',
    )
    return { runs: marked, caret: start + code[1].length, mark: 'code' }
  }
  const bold = /\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/.exec(before)
  const italic = bold ? null : /(?:^|[^*])\*([^*\s](?:[^*]*[^*\s])?)\*$/.exec(before)
  const hit = bold ?? italic
  if (!hit) return null
  const stars = bold ? 2 : 1
  const words = hit[1]
  const start = caret - words.length - stars * 2
  const marked = toggleMark(
    [
      ...sliceRuns(runs, 0, start),
      ...sliceRuns(runs, start + stars, caret - stars),
      ...sliceRuns(runs, caret),
    ],
    start,
    start + words.length,
    bold ? 'bold' : 'italic',
  )
  return { runs: marked, caret: start + words.length, mark: bold ? 'bold' : 'italic' }
}

/** A link to somewhere in this app — another doc, a task — which opens in place. */
export function isInternal(href: string): boolean {
  return href.startsWith('#')
}

// ---- The DOM of a line

/**
 * A link inside a line, as the library's `Link` draws one: its color and its
 * from-font underline. Copied, because Link's recipe is not exported and these
 * anchors are written by hand into the editable line (FINDINGS 127).
 */
export const LINK_CLASS =
  'cursor-pointer text-action-link-foreground hover:text-action-link-foreground-hover underline decoration-from-font [text-decoration-skip-ink:none] [text-underline-position:from-font]'

/**
 * Inline code inside a line wears the library's Code recipe: these `<code>`s
 * are written by hand into the editable line, so they can't be the component.
 */
const CODE_CLASS = code()

/** A line's runs as elements: `<a>` round `<strong>` round `<em>` round `<code>` round the words. */
export function runsToNodes(runs: Run[]): Node[] {
  return normalize(runs).map((run) => {
    let node: Node = document.createTextNode(run.text)
    if (run.code) {
      const code = document.createElement('code')
      code.className = CODE_CLASS
      code.append(node)
      node = code
    }
    if (run.italic) {
      const em = document.createElement('em')
      em.append(node)
      node = em
    }
    if (run.bold) {
      const strong = document.createElement('strong')
      strong.append(node)
      node = strong
    }
    if (run.href) {
      const a = document.createElement('a')
      // setAttribute, not .href, so a doc's own "#/docs/…" is kept as written.
      a.setAttribute('href', run.href)
      if (!isInternal(run.href)) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      a.className = LINK_CLASS
      a.append(node)
      node = a
    }
    return node
  })
}

/**
 * What the browser left in a line, read back as runs. Typing inside a
 * `<strong>` keeps typing bold; anything else it might put there (a styled
 * `<span>` after a deletion across marks) is read for the bold and italic it
 * shows, and everything unknown is just its words.
 */
export function runsFromDom(el: Node, marks: Omit<Run, 'text'> = {}): Run[] {
  const out: Run[] = []
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push({ text: node.textContent ?? '', ...marks })
      return
    }
    if (!(node instanceof HTMLElement)) return
    const next = { ...marks }
    const tag = node.tagName
    const weight = node.style.fontWeight
    if (tag === 'STRONG' || tag === 'B' || weight === 'bold' || Number(weight) >= 600)
      next.bold = true
    if (tag === 'EM' || tag === 'I' || node.style.fontStyle === 'italic') next.italic = true
    if (tag === 'CODE') next.code = true
    if (tag === 'A' && node.getAttribute('href')) next.href = node.getAttribute('href')!
    out.push(...runsFromDom(node, next))
  })
  return normalize(out)
}

/** Whether a line's elements are exactly what its runs would draw, so nothing stray is left. */
export function domIsCanonical(el: HTMLElement, runs: Run[]): boolean {
  const probe = document.createElement('div')
  probe.append(...runsToNodes(runs))
  return probe.innerHTML === el.innerHTML
}
