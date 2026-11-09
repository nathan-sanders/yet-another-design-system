import { useMemo, useState, type FocusEvent } from 'react'

/**
 * Whether a control is being pointed at or has keyboard focus, so the Yak
 * mark inside it can play its scribble. Spread `handlers` on the control.
 *
 * Keyboard focus only (`:focus-visible`): clicking the nav item opens the
 * panel and leaves the item focused, and a mark that kept scribbling after
 * the click would be motion with nothing behind it. Inside the floating bar,
 * the input matches `:focus-visible` on a click too, so the mark plays while
 * you type there, which is what that bar is for.
 */
export function useMarkActive() {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const handlers = useMemo(
    () => ({
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: (event: FocusEvent<HTMLElement>) =>
        setFocused((event.target as HTMLElement).matches(':focus-visible')),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      },
    }),
    [],
  )

  return { active: hovered || focused, handlers }
}
