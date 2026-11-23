/**
 * A description or comment, read into the parts `RichBody` draws: prose
 * paragraphs (split on a blank line) and fenced code blocks. A fence's first
 * line is the language and, after a space, the file name:
 * ```ts checkout.config.ts. A fence that never closes is read as prose.
 */
export type BodyPart =
  { kind: 'text'; text: string } | { kind: 'code'; code: string; language: string; title?: string }

export function parseBody(body: string): BodyPart[] {
  const parts: BodyPart[] = []
  const prose = (text: string) => {
    for (const paragraph of text.split(/\n{2,}/)) {
      const trimmed = paragraph.trim()
      if (trimmed) parts.push({ kind: 'text', text: trimmed })
    }
  }
  const fence = /```([^\n]*)\n([\s\S]*?)\n```/g
  let last = 0
  for (const match of body.matchAll(fence)) {
    prose(body.slice(last, match.index))
    const [language = 'plaintext', ...title] = match[1].trim().split(/\s+/)
    parts.push({
      kind: 'code',
      code: match[2],
      language: language || 'plaintext',
      title: title.length ? title.join(' ') : undefined,
    })
    last = match.index + match[0].length
  }
  prose(body.slice(last))
  return parts
}
