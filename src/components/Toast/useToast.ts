import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Toast as ToastPrimitive } from '@base-ui/react/toast'

import type { ToastType } from './styles'

/**
 * The hook lives in its own module for the same reason Avatar's styles do: a
 * file that exports both components and non-components breaks React Fast
 * Refresh, and oxlint says so.
 */

type ToastManager = ReturnType<typeof ToastPrimitive.useToastManager>
type BaseAddOptions = Parameters<ToastManager['add']>[0]

/** The action button on a managed toast, as a label and a handler. */
export interface ToastActionOptions {
  label: ReactNode
  onClick?: () => void
}

export interface ToastAddOptions extends Omit<BaseAddOptions, 'type' | 'actionProps'> {
  /** Maps to the Figma `Type` property. Defaults to `default`. */
  type?: ToastType
  /**
   * Renders the action button. Base UI's own shape is a raw `actionProps` bag;
   * this narrows it to the two things a toast action ever is, so callers never
   * hand-assemble button props.
   */
  action?: ToastActionOptions
}

export interface ToastManagerValue extends Omit<ToastManager, 'add'> {
  add: (options: ToastAddOptions) => string
}

/**
 * Creates and manages toasts. Base UI's `useToastManager` with `toasts`,
 * `update`, `close` and `promise` passed straight through; only `add` is
 * wrapped, and only to apply two defaults.
 *
 * **Danger persists.** A `danger` toast gets `timeout: 0` unless the caller says
 * otherwise. That is Astryx's rule — an info toast auto-hides, an error toast
 * waits to be dismissed — and a failure that scrolls past unread is the one
 * thing a notification system must not do.
 *
 * **What danger deliberately does *not* get is `priority: 'high'`.** It is
 * tempting, because it is the toast equivalent of Banner announcing danger as
 * `role="alert"` rather than a polite `role="status"`. But Base UI implements it
 * by hiding the real toast from assistive tech (`aria-hidden`) until the viewport
 * takes focus and announcing a visually hidden copy instead — while leaving the
 * toast and everything inside it focusable. An aria-hidden subtree containing a
 * focusable action button is an axe `aria-hidden-focus` violation, measured, and
 * the only fixes are to make the buttons unreachable or to give up the
 * announcement. A danger toast that never leaves the screen does not need to
 * interrupt: the viewport is already an `aria-live="polite"` region, so it is
 * announced at the next pause and then simply stays there. `priority: 'high'` is
 * still available per toast for something genuinely urgent — see the note on
 * `Toast.Root`'s tabIndex in `Toast.tsx` for what it costs.
 *
 * Deduplication needs no wrapper: passing an `id` that is already on screen
 * updates that toast in place and restarts its timer, which is Astryx's
 * `uniqueID` with `collisionBehavior: 'overwrite'`.
 */
export function useToast(): ToastManagerValue {
  const manager = ToastPrimitive.useToastManager()
  const { add: baseAdd } = manager

  const add = useCallback(
    ({ type = 'default', action, ...options }: ToastAddOptions) =>
      baseAdd({
        type,
        // Before the spread, so an explicit timeout still wins — the same
        // ordering trick Banner uses to let a caller override `role`.
        ...(type === 'danger' ? { timeout: 0 } : null),
        ...options,
        actionProps: action ? { children: action.label, onClick: action.onClick } : undefined,
      }),
    [baseAdd],
  )

  return useMemo(() => ({ ...manager, add }), [manager, add])
}
