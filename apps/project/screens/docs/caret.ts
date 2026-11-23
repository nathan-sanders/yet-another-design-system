/**
 * The caret in a block you type in. A block is `contenteditable` with plain
 * text in it, so a place in it is a count of characters from its start, which
 * is what the editor's edits take and give back.
 */

/** Where the selection starts and ends in `el`, as character counts; null when it is elsewhere. */
export function caretRange(el: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null
  const before = document.createRange()
  before.selectNodeContents(el)
  before.setEnd(range.startContainer, range.startOffset)
  const start = before.toString().length
  before.setEnd(range.endContainer, range.endOffset)
  return { start, end: before.toString().length }
}

/** A character count inside `el` as a DOM position, in the text node that holds it. */
function position(el: HTMLElement, offset: number): [Node, number] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let left = offset
  let node = walker.nextNode()
  let last: Node | null = null
  while (node) {
    const length = node.textContent?.length ?? 0
    if (left <= length) return [node, left]
    left -= length
    last = node
    node = walker.nextNode()
  }
  // Past the end: the end of the last text, not a place on the element after
  // it, where a caret has no box and `caretLine` would read it as the first line.
  return last ? [last, last.textContent?.length ?? 0] : [el, el.childNodes.length]
}

/** Focuses `el` with the caret `offset` characters in (or at the end), or a selection to `end`. */
export function placeCaret(el: HTMLElement, offset: number | 'end', end?: number) {
  el.focus({ preventScroll: false })
  const selection = window.getSelection()
  if (!selection) return
  const length = el.textContent?.length ?? 0
  const range = document.createRange()
  range.setStart(...position(el, offset === 'end' ? length : offset))
  if (end !== undefined && end !== offset) range.setEnd(...position(el, end))
  else range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

/** The caret's box on screen, for putting the slash menu under it. */
export function caretRect(el: HTMLElement): DOMRect {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null
  range?.collapse(true)
  const rect = range?.getClientRects()[0]
  return rect && rect.height > 0 ? rect : el.getBoundingClientRect()
}

/**
 * Whether the caret is on the block's first or last line as it wraps, which
 * is when ArrowUp and ArrowDown leave it for the block above or below. An
 * empty block has no caret box to measure, and is both.
 */
export function caretLine(el: HTMLElement): { first: boolean; last: boolean } {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return { first: true, last: true }
  const range = selection.getRangeAt(0).cloneRange()
  range.collapse(true)
  const rect = range.getClientRects()[0]
  if (!rect || rect.height === 0) return { first: true, last: true }
  const box = el.getBoundingClientRect()
  const line = parseFloat(getComputedStyle(el).lineHeight) || rect.height
  return { first: rect.top - box.top < line * 0.75, last: box.bottom - rect.bottom < line * 0.75 }
}
