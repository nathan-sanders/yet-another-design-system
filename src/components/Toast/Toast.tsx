import type { ComponentPropsWithRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Toast as ToastPrimitive } from '@base-ui/react/toast'

import { cn } from '../../lib/cn'
import { Button } from '../Button'
import { useToast } from './useToast'
import {
  TOAST_SWIPE_DIRECTION,
  TOAST_SWIPE_EXIT,
  toastCard,
  toastContent,
  toastStack,
  toastText,
  toastViewport,
  type ToastPosition,
  type ToastType,
} from './styles'

/**
 * Toast — a brief notification that confirms something happened and then goes
 * away.
 *
 * Mirrors Figma node `40004135:15969`: `Type` Default | Success | Danger, plus
 * the Description / Has Action / Is Dismissable booleans, which become slots
 * here exactly as Banner's do.
 *
 * **Banner's transient twin.** Banner is a persistent message about the page it
 * sits in; a toast interrupts briefly and leaves. Astryx draws the line the same
 * way, and its guidance is worth repeating because no component can enforce it:
 * keep a toast to a few words, put Undo in the action slot for anything
 * reversible, and do *not* use one for a blocking error (that is Banner) or for
 * form validation (that is inline).
 *
 * **The first component here that is not just a rendered element.** Everything
 * else in this library is stateless and drawn where it is written. A toast is
 * created from anywhere in an app, queues behind other toasts, dismisses itself
 * on a timer, pauses that timer while you are looking at it, and animates in and
 * out of a stack that lives in a portal. Base UI's `Toast` supplies all of that.
 *
 * Astryx documents the split this component copies: a `useToast()` hook plus a
 * viewport for production, and a plain component that renders the card inline
 * "for previews, documentation, and static showcases". The inline one below *is*
 * the Figma component, which is what makes the variant grid in the stories a
 * static grid like Banner's.
 *
 *     // once, at the app root
 *     <Toast.Provider>
 *       <App />
 *       <Toast.Viewport />
 *     </Toast.Provider>
 *
 *     // anywhere
 *     const toast = Toast.useToast()
 *     toast.add({ title: 'Changes saved' })
 *
 *     // inline, for a story or a doc page
 *     <Toast type="success" title="Changes saved" />
 *
 * **Sixth Base UI component, and unlike Tooltip there is no ARIA to patch.**
 * Measured in `node_modules`, not assumed, because Tooltip taught this library
 * not to trust the docs on that: the viewport renders `role="region"` with
 * `aria-live="polite"`, `aria-relevant="additions text"` and a "Notifications"
 * label, takes F6 as a jump target, and pauses every dismiss timer while it is
 * hovered or focused. Each `Toast.Root` is a non-modal `role="dialog"` named by
 * its title and described by its description, and a high-priority toast is
 * additionally mirrored into a visually hidden `role="alert"`. The lesson from
 * Tooltip is *check the DOM*, not *Base UI never does ARIA*.
 *
 * **`title` is required, never a slot.** Figma agrees — only `Description` is a
 * boolean — and Base UI's `aria-labelledby` points at it, so a toast without one
 * would be a dialog with no accessible name.
 */
export interface ToastProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Which pair to draw from. Maps to the Figma `Type` property. */
  type?: ToastType
  /**
   * The semibold first line. Keep it to a few words — "Changes saved", not a
   * sentence. Required: it is what names the toast to a screen reader.
   */
  title: ReactNode
  /** The Figma `Description` slot, under the title at regular weight. */
  description?: ReactNode
  /**
   * The Figma "Has Action" slot. Takes a node rather than a label, like Banner's
   * and Tabs' `endSlot`, because what belongs here varies — usually a small
   * overlay Button, sometimes a link.
   */
  action?: ReactNode
  /** Passing this renders the dismiss button. The caller hides the toast. */
  onDismiss?: () => void
  /** Accessible name for the dismiss button. */
  dismissLabel?: string
}

export function Toast({
  type = 'default',
  title,
  description,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  ...props
}: ToastProps) {
  return (
    <div className={cn(toastCard({ type }), className)} {...props}>
      <div className={toastText()}>
        <p className="font-semibold">{title}</p>
        {description && <p className="font-normal">{description}</p>}
      </div>

      {action}

      {onDismiss && (
        <Button
          appearance="overlay"
          size="small"
          startIcon={X}
          aria-label={dismissLabel}
          onClick={onDismiss}
        />
      )}
    </div>
  )
}

Toast.displayName = 'Toast'

/* -------------------------------------------------------------------------- */
/* The managed stack                                                          */
/* -------------------------------------------------------------------------- */

export interface ToastViewportProps
  extends Omit<ComponentPropsWithRef<typeof ToastPrimitive.Viewport>, 'children'> {
  /** Where the stack sits. Swipe direction and stack growth follow from it. */
  position?: ToastPosition
  /** Accessible name for the dismiss button on every toast. */
  dismissLabel?: string
  /** Renders the stack into a different element. */
  container?: ComponentPropsWithRef<typeof ToastPrimitive.Portal>['container']
}

/**
 * The stack. Render one of these inside `Toast.Provider`, once, next to the app.
 * It portals itself, draws every toast the manager is holding, and needs nothing
 * from the caller but a `position`.
 *
 * That is a deliberate departure from Base UI's docs, which have the app map
 * over `toasts` and assemble `Root` / `Content` / `Title` / `Description` /
 * `Close` by hand. Astryx's `ToastViewport` takes no children, and a component
 * library that makes every consumer re-derive the same twenty lines is not a
 * component library. The raw parts are attached to `Toast` for the cases this
 * cannot express.
 */
export function ToastViewport({
  position = 'bottom-right',
  dismissLabel = 'Dismiss',
  container,
  className,
  ...props
}: ToastViewportProps) {
  const { toasts } = ToastPrimitive.useToastManager()

  return (
    <ToastPrimitive.Portal container={container}>
      <ToastPrimitive.Viewport
        className={cn(toastViewport({ position }), className)}
        {...props}
      >
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            toast={toast}
            swipeDirection={TOAST_SWIPE_DIRECTION[position]}
            className={cn(
              toastCard({ type: (toast.type as ToastType) ?? 'default' }),
              toastStack({ position }),
              TOAST_SWIPE_EXIT,
            )}
            /*
             * The same lockstep the dismiss button needs, one level up. A
             * `priority: 'high'` toast renders `role="alertdialog"` and is hidden
             * from assistive tech until the viewport takes focus — Base UI
             * announces a visually hidden copy instead and does not want it read
             * twice — but it keeps `tabIndex={0}`, and an aria-hidden element
             * that can take focus is an axe violation.
             *
             * Reading `aria-hidden` back off the resolved props rather than
             * recomputing the condition means this cannot drift from whatever
             * Base UI decides that condition is. Focus still gets in: F6 focuses
             * the viewport, which clears the aria-hidden and restores the stop.
             *
             * This is not a complete fix, which is why `useToast` does not make
             * danger high-priority: an action button *inside* an aria-hidden
             * toast is still focusable, and axe flags the subtree for that alone.
             * Making it unreachable would leave a persistent toast a mouse user
             * can act on and a keyboard user cannot. Opting a toast into
             * `priority: 'high'` is a deliberate trade, not a free upgrade.
             */
            render={(rootProps) => (
              <div {...rootProps} tabIndex={rootProps['aria-hidden'] ? -1 : 0} />
            )}
          >
            {/*
             * `render` as a function rather than an element, for one reason:
             * it is what hands us `state.expanded`, which the dismiss button
             * below needs. See the note on its tabIndex.
             */}
            <ToastPrimitive.Content
              className={toastContent()}
              render={(contentProps, state) => (
                <div {...contentProps}>
                  <div className={toastText()}>
                    {/*
                     * Base UI's Title renders an <h2>. Rendered as a <p> here so
                     * the markup matches Banner's, and so a stack of toasts does
                     * not drop a run of headings into a page's outline. The
                     * aria-labelledby wiring is by id and does not care about
                     * the tag.
                     */}
                    <ToastPrimitive.Title render={<p />} className="font-semibold" />
                    <ToastPrimitive.Description render={<p />} className="font-normal" />
                  </div>

                  {/*
                   * Derived from what you pass, as Banner derives its dismiss
                   * button from `onDismiss`: no action on the toast, no button.
                   * Base UI would also return null here on its own, but the
                   * label is handed to Button explicitly rather than injected —
                   * a Button with no children is the icon-only form, and its
                   * props are a union that requires an `aria-label` in that
                   * shape. Passing the label is both what satisfies the type and
                   * what the button actually is.
                   */}
                  {toast.actionProps?.children != null && (
                    <ToastPrimitive.Action
                      render={
                        <Button appearance="overlay" size="small">
                          {toast.actionProps.children}
                        </Button>
                      }
                    />
                  )}

                  <ToastPrimitive.Close
                    render={
                      <Button
                        appearance="overlay"
                        size="small"
                        startIcon={X}
                        aria-label={dismissLabel}
                        /*
                         * **The a11y trap this component carries.** Base UI puts
                         * `aria-hidden` on the close button whenever the stack is
                         * collapsed and unfocused — reasonably, since a screen
                         * reader should not read three dismiss buttons off a
                         * stack that looks like one card. But it leaves the
                         * button focusable, and an aria-hidden element that can
                         * take focus is an axe `aria-hidden-focus` violation:
                         * measured as three serious violations on a stack of
                         * three, and *not* caught by the story suite, because the
                         * a11y run happens on first render when the stack is
                         * still empty.
                         *
                         * So the tabindex is kept in lockstep with the
                         * aria-hidden. Nothing is lost: focus reaches the toast
                         * itself (Root carries tabIndex 0) and F6 jumps to the
                         * viewport, and either of those expands the stack, at
                         * which point the button is both announced and tabbable
                         * again. Re-check this on a Base UI upgrade — if they
                         * start managing the tabindex themselves, this line
                         * becomes a duplicate.
                         */
                        tabIndex={state.expanded ? 0 : -1}
                      />
                    }
                  />
                </div>
              )}
            />
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

ToastViewport.displayName = 'Toast.Viewport'

/**
 * Holds the queue. Base UI's, passed through unstyled — `limit` (3) and
 * `timeout` (5000ms) are already the defaults this system wants, and
 * `toastManager` takes a manager built with `Toast.createToastManager()` for
 * firing toasts from outside React.
 */
Toast.Provider = ToastPrimitive.Provider
Toast.Viewport = ToastViewport
Toast.useToast = useToast
Toast.createToastManager = ToastPrimitive.createToastManager

/**
 * The raw Base UI parts, for what the managed viewport cannot express: a toast
 * anchored to an element rather than stacked in a corner (`Positioner` +
 * `Arrow`), or a card assembled by hand. Same escape hatch Tooltip attaches.
 */
Toast.Root = ToastPrimitive.Root
Toast.Portal = ToastPrimitive.Portal
Toast.Content = ToastPrimitive.Content
Toast.Title = ToastPrimitive.Title
Toast.Description = ToastPrimitive.Description
Toast.Action = ToastPrimitive.Action
Toast.Close = ToastPrimitive.Close
Toast.Positioner = ToastPrimitive.Positioner
Toast.Arrow = ToastPrimitive.Arrow
