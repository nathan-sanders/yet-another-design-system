import { useCallback, useLayoutEffect, useRef, type KeyboardEvent } from 'react'

/**
 * A line you can type in: `contenteditable="plaintext-only"`, so a paste
 * arrives as words and nothing else. React renders no children into it — the
 * words are written in while it is not being edited, so typing is never
 * interrupted by a render — and they are saved when it loses focus. Enter
 * finishes the line rather than breaking it.
 *
 * The words go in from a callback ref as well as on a change, because the
 * element can be swapped while the hook lives on: the title leaves the page
 * for the compare view and comes back, and an effect keyed on the words alone
 * would leave the new element empty.
 */
export function useEditable(value: string, onCommit: (text: string) => void, onEnter?: () => void) {
  const element = useRef<HTMLElement | null>(null)
  const latest = useRef(value)
  latest.current = value

  const fill = (el: HTMLElement | null) => {
    if (el && document.activeElement !== el && el.textContent !== latest.current)
      el.textContent = latest.current
  }
  const ref = useCallback((el: HTMLElement | null) => {
    element.current = el
    fill(el)
  }, [])
  useLayoutEffect(() => fill(element.current), [value])

  return {
    ref: ref as never,
    contentEditable: 'plaintext-only' as const,
    suppressContentEditableWarning: true,
    spellCheck: true,
    onBlur: () => {
      const text = (element.current?.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (text !== value) onCommit(text)
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        element.current?.blur()
        onEnter?.()
      }
      if (event.key === 'Escape') element.current?.blur()
    },
  }
}
