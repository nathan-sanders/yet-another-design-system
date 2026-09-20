import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Form as FormPrimitive } from '@base-ui/react/form'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'

/**
 * Form — the `<form>` a set of Fields sits in, and the thing that decides
 * *when* their values are checked and what happens when they are submitted.
 *
 * Mirrors the Figma page "↪ Form", drawn from this component the day it was
 * built — the ProgressBar route, with nothing in the file to read first.
 *
 *     <Form onFormSubmit={(values) => save(values)}>
 *       <Field name="email" label="Email">
 *         <Input type="email" required />
 *       </Field>
 *       <Form.Actions>
 *         <Button appearance="secondary">Cancel</Button>
 *         <Button type="submit">Save</Button>
 *       </Form.Actions>
 *     </Form>
 *
 * **Twenty-second Base UI component.** Base UI's `Form` renders `<form
 * noValidate>`, validates every Field inside it on submit, focuses the first
 * invalid control, and only then calls `onFormSubmit` with the values keyed by
 * Field `name` — so the browser's bubbles are off and the message is Field's.
 * `errors` is the server's half: a Field with an entry under its name is
 * invalid and shows the text, and clears it the moment its value changes.
 * `validationMode` says when the checking happens — on submit by default,
 * then following the field as it changes; a Field's own `validationMode` wins
 * over the form's.
 *
 * **`name` goes on the Field, not the control.** Every control reads the
 * Field's name first, and `Checkbox.Group` reads it *only* — a group inside an
 * unnamed Field never reaches the form at all. Inside a named Field a grouped
 * Checkbox carries `value`, not `name`.
 *
 * **A 16px column.** Astryx's `FormLayout` stacks fields at 16, measured, and
 * it is what Panel and Drawer bodies were already stacking Fields at by hand.
 * `Row` and `Actions` are the two other shapes those bodies kept re-drawing.
 */
const form = tv({
  base: 'flex w-full flex-col gap-4 font-sans',
})

/**
 * Fields that pair up — first and last name, city and state and ZIP. Astryx's
 * horizontal layout: equal columns at 16px, and one column below `sm`. `sm`
 * (640) rather than `md` (768) because 768 is the shell's nav swap, while
 * content re-flows at `sm:` — Card's grids and AlertDialog's footer both turn
 * there.
 */
const formRow = tv({
  base: 'grid w-full gap-4 sm:grid-flow-col sm:auto-cols-fr',
})

/**
 * The button row. `end` is the shape twelve story files had hand-rolled as
 * `flex justify-end gap-2`. `stretch` is the sign-in shape: every button full
 * width, and `flex-col-reverse` so the *last* child — the primary, as in every
 * other footer — lands on top without the caller reordering its children.
 */
const formActions = tv({
  base: 'flex gap-2',
  variants: {
    align: {
      end: 'flex-row justify-end',
      start: 'flex-row justify-start',
      stretch: 'flex-col-reverse items-stretch',
    },
  },
  defaultVariants: {
    align: 'end',
  },
})

export type FormActionsAlign = NonNullable<VariantProps<typeof formActions>['align']>

/** What `onFormSubmit` receives: one entry per named Field. Base UI's `Form.Values`. */
export type FormValues = FormPrimitive.Values
/** The `errors` prop — a message, or several, per Field `name`. */
export type FormErrors = NonNullable<FormPrimitive.Props['errors']>
/** When the form checks its fields: `onSubmit` (default), `onBlur` or `onChange`. */
export type FormValidationMode = FormPrimitive.ValidationMode
/** The second argument to `onFormSubmit`: the native event and a reason. */
export type FormSubmitEventDetails = FormPrimitive.SubmitEventDetails
/**
 * What `actionsRef` resolves to — `validate(fieldName?)`. Base UI calls this
 * type `Form.Actions`; here that name is the button row, so the imperative
 * handle takes the word Carousel and Dialog already use for theirs.
 */
export type FormHandle = FormPrimitive.Actions

export interface FormProps<Values extends FormValues = FormValues>
  extends Omit<FormPrimitive.Props<Values>, 'className' | 'render'> {
  /** Extra classes for the `<form>`. */
  className?: string
}

export function Form<Values extends FormValues = FormValues>({
  className,
  ...props
}: FormProps<Values>) {
  return <FormPrimitive<Values> className={cn(form(), className)} {...props} />
}

Form.displayName = 'Form'

export interface FormRowProps extends ComponentPropsWithRef<'div'> {
  /** Two or three Fields, side by side. */
  children: ReactNode
}

function FormRow({ className, ...props }: FormRowProps) {
  return <div className={cn(formRow(), className)} {...props} />
}

FormRow.displayName = 'Form.Row'

export interface FormActionsProps extends ComponentPropsWithRef<'div'> {
  /** Where the buttons sit. `stretch` stacks them full width, primary on top. */
  align?: FormActionsAlign
  /**
   * The buttons. The one that submits needs `type="submit"` — `Button`
   * defaults to `button`, so a form with none of them cannot be submitted by
   * Enter.
   */
  children: ReactNode
}

function FormActions({ align = 'end', className, ...props }: FormActionsProps) {
  return <div className={cn(formActions({ align }), className)} {...props} />
}

FormActions.displayName = 'Form.Actions'

Form.Row = FormRow
Form.Actions = FormActions

/**
 * The raw primitive, for a form that wants none of the column — Field's and
 * Drawer's escape hatch under the same namespace.
 */
Form.Root = FormPrimitive
