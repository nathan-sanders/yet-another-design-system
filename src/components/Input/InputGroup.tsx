import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { InputGroupContext, useInputGroup } from './context'
import {
  ICON_SIZE,
  addon,
  addonText,
  box,
  control,
  type InputAppearance,
  type InputGroupAddonAlign,
  type InputSize,
} from './styles'

/**
 * InputGroup — a text field with things attached to it: an icon inside the
 * border, a button at the trailing edge, a row of controls above or below.
 *
 * Mirrors the Figma component set "Input Group" (node 40004051:14425): the same
 * 3 sizes x 5 states as `Input`, plus a Start Slot, an End Slot and a `Display`
 * property that puts them beside the text or stacked around it.
 *
 *     <Field label="Website" description="Include the protocol">
 *       <InputGroup>
 *         <InputGroup.Addon align="inline-start" icon={Link} />
 *         <InputGroup.Input placeholder="example.com" />
 *         <InputGroup.Addon align="inline-end">
 *           <Button appearance="ghost" size="small" startIcon={Copy} aria-label="Copy" />
 *         </InputGroup.Addon>
 *       </InputGroup>
 *     </Field>
 *
 * **Base UI does not have this component**, unlike almost everything else here —
 * it is not in their list, and `/components/input-group` is a 404. The pattern
 * is shadcn's, whose addon `align` values are Figma's `Display` property
 * unrolled per slot. The `<input>` inside is still Base UI's.
 *
 * **The label belongs to `Field`**, as it does for `Input` — Figma's Field set
 * nests this with its own `Label` switched off.
 *
 * **Why this is not a set of props on `Input`.** Meta's Astryx does merge the
 * two into one `TextInput`, and it works there because its slots are a fixed
 * menu — a leading icon, a clear button, a spinner. These slots hold whatever
 * you put in them, which needs a composed API rather than a `ReactNode` prop,
 * and the stacked form is a different layout rather than a different skin.
 *
 * **`align` is per addon, and Figma's `Display` is not.** Figma switches both
 * slots together; here an icon can sit beside the text while a row of actions
 * sits underneath. That is the case the unrolled version exists for, and the one
 * thing in this component the Figma does not yet draw.
 */
export interface InputGroupProps {
  /** `InputGroup.Input` and `InputGroup.Addon` elements. */
  children: ReactNode
  /** Field size. Set once here and read by every part inside. */
  size?: InputSize
  /**
   * `ghost` drops the fill and the stroke until you go near the field. The
   * addons stay visible throughout, which is what makes this the shape a global
   * search entry wants: the magnifier says "field" while the box says nothing.
   */
  appearance?: InputAppearance
  /**
   * Maps to Figma's `State=Invalid`, for a group standing on its own. Inside a
   * `Field`, set it there instead.
   */
  invalid?: boolean
  /** Extra classes for the outermost element — the bordered box. */
  className?: string
}

/**
 * The text itself. Same `<input>` as `Input` renders, minus the label block —
 * that belongs to the group.
 */
export interface InputGroupInputProps
  extends Omit<
    ComponentPropsWithRef<typeof InputPrimitive>,
    'className' | 'render' | 'children' | 'size'
  > {
  /** Extra classes for the `<input>`. */
  className?: string
}

/**
 * Disabling: pass `disabled` here, or to the `Field` around the group, and the
 * box fades and stops taking pointers for itself. A Button sitting in an addon
 * is **not** disabled by either — nothing reaches into arbitrary children — so
 * disable it too, or it stays clickable inside a field that looks inert.
 */
function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  const { size } = useInputGroup()

  return <InputPrimitive className={cn(control({ size }), className)} {...props} />
}

InputGroupInput.displayName = 'InputGroup.Input'

interface InputGroupAddonBaseProps extends Omit<ComponentPropsWithRef<'div'>, 'className'> {
  /**
   * Where the addon sits. The two `inline-*` values put it on the same line as
   * the text; the two `block-*` values give it a row of its own.
   */
  align?: InputGroupAddonAlign
  /**
   * A Lucide icon, rendered through `<Icon>` at the group's size so the glyph
   * lands at Figma's 12px at small and 16px above it. Pass the component itself:
   * `icon={Search}`, not `<Search />`. For anything that is not a single icon —
   * a Button, a Select, a chip — use `children` instead.
   */
  icon?: LucideIcon
  /** Extra classes for the addon. */
  className?: string
}

export type InputGroupAddonProps = InputGroupAddonBaseProps & {
  children?: ReactNode
}

function InputGroupAddon({
  align = 'inline-start',
  icon,
  children,
  className,
  ...props
}: InputGroupAddonProps) {
  const { size } = useInputGroup()

  return (
    // `data-align` is not styled off — the placement comes from the recipe's
    // `order` and width classes. It is here so the rendered DOM says what each
    // slot is, which a component made of anonymous <div>s otherwise does not.
    <div data-align={align} className={cn(addon({ align, size }), className)} {...props}>
      {icon && <Icon icon={icon} size={ICON_SIZE[size]} />}
      {children}
    </div>
  )
}

InputGroupAddon.displayName = 'InputGroup.Addon'

export interface InputGroupTextProps extends Omit<ComponentPropsWithRef<'span'>, 'className'> {
  children: ReactNode
  className?: string
}

/**
 * Text inside an addon — a `https://` prefix, a `USD` suffix, an `@`. Subtle
 * rather than primary, so it reads as part of the field's chrome and not as
 * something the person typed. Takes its size from the addon around it.
 */
function InputGroupText({ children, className, ...props }: InputGroupTextProps) {
  return (
    <span className={cn(addonText(), className)} {...props}>
      {children}
    </span>
  )
}

InputGroupText.displayName = 'InputGroup.Text'

export function InputGroup({
  children,
  size = 'default',
  appearance = 'default',
  invalid = false,
  className,
}: InputGroupProps) {
  return (
    <div className={cn(box({ size, appearance, invalid }), className)}>
      <InputGroupContext.Provider value={{ size }}>{children}</InputGroupContext.Provider>
    </div>
  )
}

InputGroup.Input = InputGroupInput
InputGroup.Addon = InputGroupAddon
InputGroup.Text = InputGroupText
InputGroup.displayName = 'InputGroup'
