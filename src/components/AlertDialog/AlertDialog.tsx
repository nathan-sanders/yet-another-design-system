import type { ComponentPropsWithRef } from 'react'
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'

import { Dialog } from '../Dialog'

/**
 * AlertDialog — a dialog that asks you to confirm something you cannot undo.
 *
 * **No Figma node.** The file draws a Dialog and nothing else, so this is
 * BentoGrid's situation rather than Accordion's: a whole component with no
 * drawing behind it, built because Astryx documents it as its own component and
 * Base UI ships the primitive. It owes the file a drawing, and that is recorded
 * rather than quietly left.
 *
 * **This is the sharing rule at its strongest so far, and it is worth being
 * precise about how strong.** ContextMenu re-attached Menu's *items*. Autocomplete
 * shared Combobox's popup parts and Input's box. Here, reading
 * `@base-ui/react/alert-dialog/index.parts.mjs`, every part but one is
 * re-exported straight out of `../dialog/` — and `AlertDialogTrigger` is not
 * merely re-exported, it is `export const AlertDialogTrigger = DialogTrigger`,
 * the identical binding. Only `Root` is its own, and even that is
 * `useRenderDialogRoot('alert-dialog', props)`: the same hook, one string
 * different.
 *
 * So this file re-attaches **the library's own `Dialog` wrappers**, not the raw
 * Base UI parts. `Dialog.Popup` renders `dialog`'s Portal, Backdrop, Viewport
 * and Popup, which are the very objects `alert-dialog` hands out, and they read
 * their state from the Root context this Root provides. The recipes in
 * `Dialog/styles.ts` are reached through that, so there is no second import of
 * them here and nothing to keep in step.
 *
 * **What the Root changes, and it is all it changes.** `modal` is forced to
 * `true`, `disablePointerDismissal` to `true`, and `role` to `alertdialog`.
 * Escape still closes — Astryx agrees ("Escape cancels"), and so does the
 * WAI-ARIA Alert Dialog pattern. Do not pass `modal={false}`; the Root ignores
 * it, which is Base UI being right rather than Base UI being surprising.
 *
 * **Anatomy is Astryx's, and every part of it is required**: a Title (the
 * question), a Description (the consequence), a Cancel and an Action. There is
 * deliberately no `x`. `AlertDialog.Close` exists because Cancel *is* a Close
 * with `render` — but a bare `<AlertDialog.Close />`, which would paint the
 * ghost `x`, is the one shape not to reach for here: an alert dialog is answered
 * by its actions, not dismissed past.
 *
 * **Two content rules that live at the call site rather than in a prop.** Cancel
 * takes initial focus, so the least destructive option is the one a Return key
 * lands on — pass a ref to `initialFocus` on the popup, as `Destructive` does.
 * And below 640px Astryx stacks the actions with the destructive one on top and
 * both full width, which is `max-sm:` on the footer row. Neither is built as a
 * `Footer` part, for the reason Popover's record gives for not building
 * `Header`: the call site is already the whole of it.
 */

export interface AlertDialogProps
  extends ComponentPropsWithRef<typeof AlertDialogPrimitive.Root> {}

/**
 * The root. Nothing is re-declared, so `open`, `defaultOpen`, `onOpenChange`,
 * `onOpenChangeComplete`, `actionsRef` and `handle` arrive free — while `modal`
 * and `disablePointerDismissal` are pinned by Base UI regardless of what is
 * passed.
 */
export function AlertDialog(props: AlertDialogProps) {
  return <AlertDialogPrimitive.Root {...props} />
}

AlertDialog.displayName = 'AlertDialog'

AlertDialog.Trigger = AlertDialogPrimitive.Trigger

/**
 * The library's Dialog parts, re-attached rather than rebuilt. See the docblock
 * above for why this is a reuse and not a resemblance.
 */
AlertDialog.Popup = Dialog.Popup
AlertDialog.Title = Dialog.Title
AlertDialog.Description = Dialog.Description
AlertDialog.Body = Dialog.Body
AlertDialog.Close = Dialog.Close

/** The raw Base UI parts, for shapes the wrappers cannot express. */
AlertDialog.Root = AlertDialogPrimitive.Root
AlertDialog.Portal = AlertDialogPrimitive.Portal
AlertDialog.Backdrop = AlertDialogPrimitive.Backdrop
AlertDialog.Viewport = AlertDialogPrimitive.Viewport
AlertDialog.RawPopup = AlertDialogPrimitive.Popup
