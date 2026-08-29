import { Children, Fragment, isValidElement, useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { overlayLayer } from '../../lib/layers'
import { Icon } from '../Icon'
import { SelectContext, useSelect } from './context'

/**
 * Select — pick one value from a list that is too long to show all at once.
 *
 * Mirrors the Figma component sets "Select" (node 40004055:15159, `Size` x
 * `State` x `Hug`), "_Select Value" (40004055:15112), "Select Menu Item"
 * (40004067:19075, `Type` Single Select | Multi Select x `State` x `Selected`),
 * "Select Menu Group" (40004067:19193) and "Select Menu" (40004067:19226).
 *
 *     <Field label="Apple">
 *       <Select placeholder="Select apple">
 *         <Select.Item value="gala">Gala</Select.Item>
 *         <Select.Item value="fuji">Fuji</Select.Item>
 *       </Select>
 *     </Field>
 *
 * **Sixteenth Base UI component, and the third that portals** after Tooltip and
 * Menu. Where it sits among the form controls is the decision tree in CLAUDE.md:
 * the value must come from a known set, there are too many options to show at
 * once, and few enough to scroll. Typing to filter is Combobox's job — Base UI
 * is explicit that Select is not filterable beyond keyboard typeahead.
 *
 * **`Select` swallows the whole tree, not just Portal and Positioner.** Menu
 * stops at `Menu.Popup` because a menu's trigger can be any button; a Select's
 * trigger is drawn by Figma and is always the same box, so this renders Root,
 * Trigger, Value, Icon, Portal, Positioner, Popup and List, and its children are
 * simply the items. The raw parts are attached below for anything that shape
 * cannot express.
 *
 * **The popup overlaps the trigger, macOS-style.** That is Base UI's
 * `alignItemWithTrigger`, and its default: the popup opens *over* the trigger
 * with the selected item's text sitting exactly on the trigger's value text.
 * Figma draws the trigger and the menu side by side to document them separately,
 * not to specify a dropdown hanging below. It also explains a gap in the file —
 * the Select set has no **Open** state because, in this mode, an open trigger is
 * covered by its own popup and there is nothing to draw. Base UI turns the mode
 * off by itself for touch input and when there is not enough room, falling back
 * to a conventional dropdown.
 *
 * **`multiple` turns it off**, automatically and invisibly. There is no single
 * selected item to line up with the trigger when there are several, and Base
 * UI's own multi-select example sets `alignItemWithTrigger={false}` for exactly
 * that reason. A caller never sees this: passing `multiple` just changes the
 * geometry as well as the anatomy of the rows.
 *
 * **No ARIA to patch, unlike Tooltip.** Verified in `node_modules` rather than
 * assumed: the trigger carries `role="combobox"`, `aria-expanded`,
 * `aria-haspopup="listbox"` and `aria-controls`; `Select.List` carries
 * `role="listbox"` and `aria-multiselectable`; items carry `role="option"` and
 * `aria-selected`; and a group carries `role="group"` with `aria-labelledby`
 * pointed at its own label. `Select.Root` also uses Base UI's `useField`, so a
 * `Field` wrapped round this labels it and marks it invalid with no wiring here,
 * and renders its own hidden input for form submission.
 *
 * **A Field around a Select wants `nativeLabel={false}`.** The trigger is a
 * `<button>`, which is a labelable element, so a real `<label for>` would open
 * the popup on click and light the trigger up on hover. See `Field`.
 *
 * **What is left out.** `Select.Backdrop` and `Select.Arrow` (Figma draws
 * neither). `Select.Label`, because Field owns the label — the Select set's own
 * `Label` and `Sub Label` properties were removed from the file along with
 * Input's. Filtering and search, which are Combobox's. And Astryx's `hasClear`,
 * `isLoading`, `hasSelectAll` and `statusVariant`, none of which are in the file.
 */

/**
 * The trigger box. Figma's Select frame, and Input's box at the same three
 * sizes — 24 / 32 / 40 — because they are the same control drawn twice.
 *
 * **There is no vertical padding, and that is deliberate.** Figma gives the box
 * `padding-block` of 2 / 4 / 8 around a 20 / 24 / 24 line-height, which sums to
 * its 24 / 32 / 40 because a Figma stroke does not add to a frame's size. A CSS
 * border does: `border-box` would make the default size 24 + 8 + 2 = **34**, not
 * 32. Letting the line-height centre itself inside a `min-h` box lands all three
 * exactly, which is the same fix `Input` uses for its text row.
 */
const trigger = tv({
  base: [
    'flex items-center gap-3',
    'rounded-md border border-input-border bg-input-background px-3',
    'font-sans text-left text-content-primary',
    'cursor-pointer select-none',
    'hover:border-input-border-hover',
    // The trigger is the focusable element itself — a <button> — so this is the
    // ring on the element, not `focusRingWithin` as on Input's box, where focus
    // lands on a descendant <input>. It draws a 2px inner gap plus a 2px outer
    // stroke, both outside the box, so the trigger measures pixel-identical
    // focused and unfocused.
    ...focusRing,
    // Inside a Field, validity arrives as `data-invalid` on the control rather
    // than as a prop here. The `hover` copy is spelled out because both
    // selectors otherwise land on equal specificity and the winner would come
    // down to the order Tailwind happens to emit them in — Input's note.
    'data-invalid:border-feedback-danger-highlight',
    'data-invalid:hover:border-feedback-danger-highlight',
    // Base UI sets `data-disabled` on the trigger and, being a native button,
    // the `disabled` attribute too. Both are listed so the fade does not depend
    // on which one arrives; Figma's disabled is a flat opacity with no color
    // swap at all.
    'disabled:pointer-events-none disabled:opacity-40',
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      small: 'min-h-6 text-sm', // 24px, text 12/20
      default: 'min-h-8 text-base', // 32px, text 14/24
      // Figma keeps the default type at large and only grows the padding, so
      // this is `text-base` too rather than a step up.
      large: 'min-h-10 text-base', // 40px, text 14/24
    },

    /**
     * Figma's `Hug` property, name kept. False fills the container, true
     * shrink-wraps the value — a filter beside a Button rather than a field in a
     * form.
     */
    hug: {
      true: 'w-fit',
      false: 'w-full',
    },

    /**
     * Figma's `State=Invalid`, for a Select standing on its own. Inside a Field
     * the `data-invalid` rule above does the same job, and the two compose.
     */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { size: 'default', hug: false, invalid: false },
})

/**
 * The value slot.
 *
 * **The placeholder is italic**, which is invisible in a screenshot and shows up
 * only in the variable defs: Figma binds `text-base/italic regular` rather than
 * the regular face. Italic is this system's mark for text the person did not
 * enter — Input's placeholder and Field's validation message are italic for the
 * same reason. Base UI sets `data-placeholder` while nothing is selected.
 */
const value = tv({
  base: [
    'min-w-0 flex-1 truncate',
    'data-placeholder:text-content-subtle data-placeholder:italic',
  ],
})

/**
 * The popup. Figma's Select Menu: a card on the Medium elevation.
 *
 * Menu's block, unchanged, for the same reasons — `outline-none` because Base
 * UI parks focus on the popup and the browser would otherwise paint its own
 * system-accent ring on it, and Tooltip's motion off `--transform-origin` so it
 * grows out of its trigger.
 *
 * **`overflow-clip` is not ported, for the eighth time.** Figma sets it on the
 * Select Menu frame; here it would slice the focus ring off the first and last
 * rows. The rounding is kept by the List's own `overflow-y: auto`, which Base UI
 * applies itself.
 *
 * **`min-w-(--anchor-width)`** so the popup is never narrower than the trigger it
 * came out of — which matters far more in this mode than it would hanging below,
 * because the popup sits directly on top of the trigger.
 */
const popup = tv({
  base: [
    'flex flex-col',
    'rounded-lg border border-surface-border bg-surface-background-primary shadow-medium',
    'font-sans',
    'outline-none',
    'min-w-(--anchor-width) max-h-(--available-height)',
    'transition-[opacity,scale] duration-fast ease-standard origin-(--transform-origin)',
    'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
    'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
    'data-[instant]:duration-0',
  ],
})

/**
 * A row. Figma's Select Menu Item, which is the same 32px row as Menu's, with
 * the same padding and the same hover — so this is Menu's recipe, unchanged.
 *
 * Hover and keyboard highlight are one attribute: `highlightItemOnHover`
 * defaults true, so Figma's separate Hover and Focus states collapse to
 * `data-highlighted` for the background plus the shared ring for the outline.
 * Items take **real DOM focus** here — checked in `node_modules`, where Select
 * has no `aria-activedescendant` and items carry a roving `tabIndex` — so the
 * ring genuinely fires rather than being decorative.
 *
 * `group` is here so the multi-select checkbox can read `data-selected` off the
 * item, which is where Base UI puts it.
 */
const item = tv({
  base: [
    'group flex w-full items-center gap-3',
    // px-3 = spacing/3 (12px), py-1 = spacing/1 (4px), so 24 + 8 = 32px tall.
    'rounded-md px-3 py-1',
    'cursor-pointer text-base select-none',
    'text-content-primary',
    'data-highlighted:bg-surface-background-subtle',
    ...focusRing,
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/**
 * The 20px box on a multi-select row.
 *
 * Deliberately *not* reusing `Checkbox`, and for the reason Menu's checkbox item
 * gives: the visual is the same — same tokens, same 20px, same 14px glyph — but
 * the state arrives from the item rather than from the control, so this reads it
 * off the ancestor with `group-data-selected:`. A shared recipe would need a
 * variant for where its own state comes from, which is a worse abstraction than
 * one short list of classes.
 */
const indicatorBox = tv({
  base: [
    'flex size-5 shrink-0 items-center justify-center rounded-sm border',
    'bg-input-background border-input-border',
    'group-data-selected:bg-input-selected group-data-selected:border-input-selected',
    'text-input-selected-foreground',
    'transition-colors duration-fast-min ease-standard',
  ],
})

/**
 * The scroll arrows, which **Figma does not draw**.
 *
 * They are the cost of overlapping the trigger: a list long enough to run past
 * the viewport has to scroll inside a popup that is already covering its own
 * anchor, and these are how Base UI does it. Built from tokens in the popup's
 * own colors, and recorded in CLAUDE.md as a gap in the file rather than an
 * invention — Divider's `emphasis` and Menu's `destructive` again.
 *
 * Base UI unmounts them when the list does not scroll, so there is nothing to
 * hide at rest.
 */
const scrollArrow = tv({
  base: [
    'z-1 flex h-6 w-full shrink-0 items-center justify-center',
    'bg-surface-background-primary text-content-subtle',
    'data-[direction=up]:rounded-t-lg data-[direction=down]:rounded-b-lg',
  ],
})

type TriggerVariants = VariantProps<typeof trigger>

/** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
export type SelectSize = NonNullable<TriggerVariants['size']>

/**
 * The label column of a row, shared by both anatomies.
 *
 * `Select.ItemText` is rendered as a `<span>` rather than its default `<div>` so
 * it can live inside this one. It is not decoration: Base UI measures that
 * element to line the selected row up with the trigger's value text, which is
 * the whole `alignItemWithTrigger` behaviour.
 */
function ItemLabel({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <span className="flex min-w-px flex-1 flex-col items-start">
      <SelectPrimitive.ItemText render={<span />} className="text-base">
        {children}
      </SelectPrimitive.ItemText>
      {description != null && <span className="text-sm text-content-subtle">{description}</span>}
    </span>
  )
}

interface DerivedItem {
  value: unknown
  label: ReactNode
}

/**
 * Reads `{ value, label }` off the `Select.Item`s in the tree.
 *
 * This exists because of a sharp edge in Base UI: `Select.Value` renders the
 * *raw value* unless `Select.Root` was given an `items` prop to look labels up
 * in. Left alone, `<Select.Item value="gala">Gala</Select.Item>` puts **gala**
 * in the trigger rather than Gala, which is a bug a caller would have to fix by
 * writing every option out twice. Walking the children instead keeps one
 * source — the JSX — and matches how `Field` derives its `Type` and how Avatar
 * derives its content, rather than asking for something the component can see
 * for itself.
 *
 * It descends through fragments and `Select.Group`, so a mapped or grouped list
 * works. A caller who would rather be explicit can still pass `items` straight
 * through to Base UI, in which case none of this runs.
 */
function collectItems(children: ReactNode, out: DerivedItem[] = []): DerivedItem[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return
    }

    const props = child.props as { value?: unknown; children?: ReactNode }

    if (child.type === SelectItem) {
      out.push({ value: props.value, label: props.children })
    } else if (props.children != null) {
      collectItems(props.children, out)
    }
  })

  return out
}

/**
 * The trigger's text when several values are selected.
 *
 * Figma draws this as two runs at `gap-1` — the first value, then a **"+N more"**
 * counter — rather than as chips or tags, and rather than as Base UI's own
 * default of every label joined with commas. The counter is dropped entirely at
 * one value, which is why it is not simply "+0 more".
 *
 * Returning the placeholder for an empty selection is required, not tidiness: a
 * `children` function on `Select.Value` overrides the `placeholder` prop
 * completely. The `data-placeholder` attribute is set independently of it, so
 * the italic still lands.
 */
function renderMultiple(selected: unknown, items: unknown, placeholder: ReactNode) {
  const values = Array.isArray(selected) ? (selected as unknown[]) : []

  if (values.length === 0) {
    return placeholder
  }

  // `items` is whatever reached Root — the derived list, or the record/array/
  // grouped shapes Base UI also accepts from a caller. Only the flat array can
  // be read here; anything else falls through to stringifying the value, which
  // is what Base UI itself would have done.
  const entries = Array.isArray(items) ? (items as { value?: unknown; label?: ReactNode }[]) : []
  const match = entries.find((entry) => entry.value === values[0])
  const rest = values.length - 1

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate">{match?.label ?? String(values[0])}</span>
      {rest > 0 && <span className="shrink-0">+{rest} more</span>}
    </span>
  )
}

/**
 * Whether the caller grouped their items.
 *
 * Figma puts the popup's 8px padding on the **group's** items wrapper rather
 * than on the panel, because a group header has to sit outside it. A flat list
 * has no group to carry that, so its rows would sit hard against the popup's
 * border — measured at a 158px popup where Figma draws 174.
 *
 * Rather than make every caller wrap a simple list in a `Select.Group` that
 * exists only to supply padding, a flat list gets the same wrapper implicitly.
 * Mixing the two is not handled: one group anywhere means the caller has taken
 * charge of the structure, and the groups supply their own padding.
 */
function hasGroup(children: ReactNode): boolean {
  let found = false

  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) {
      return
    }

    if (child.type === SelectGroup) {
      found = true
    } else if (child.type === Fragment) {
      found = hasGroup((child.props as { children?: ReactNode }).children)
    }
  })

  return found
}

export interface SelectGroupProps {
  /** Optional heading. Figma's `Group Header`, and the group's accessible name. */
  label?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A group of items, with the rule above it.
 *
 * Menu's arrangement, because Figma draws the two the same way. **The separator
 * is a sibling of the group, not a child**: the file puts a Divider inside every
 * group including the first, where it is invisible only because it lands on the
 * popup's own border and gets clipped. Rendering it as a sibling means
 * `first:hidden` does that honestly, and puts it where it belongs semantically —
 * between two groups rather than inside one.
 *
 * The items sit in a wrapper marked `role="none"` so it stays out of the
 * ownership chain between `role="listbox"` and its `role="option"` children —
 * the `aria-required-children` family of bug that stopped Tabs putting a real
 * Divider inside its `tablist`. Figma puts the padding there rather than on the
 * group because the header sits outside it: `px-5` on the header and `p-2` plus
 * the row's own `px-3` both land text 20px from the popup edge.
 */
function SelectGroup({ label, children, className }: SelectGroupProps) {
  return (
    <>
      <SelectPrimitive.Separator className="h-px shrink-0 bg-surface-border first:hidden" />
      <SelectPrimitive.Group className={cn('flex flex-col', className)}>
        {label != null && (
          <SelectPrimitive.GroupLabel className="px-5 pt-3 text-sm text-content-subtle">
            {label}
          </SelectPrimitive.GroupLabel>
        )}
        <div role="none" className="flex flex-col p-2">
          {children}
        </div>
      </SelectPrimitive.Group>
    </>
  )
}

SelectGroup.displayName = 'Select.Group'

export interface SelectItemProps
  extends Omit<ComponentPropsWithRef<typeof SelectPrimitive.Item>, 'className' | 'render'> {
  /** Lucide icon before the label. Pass the component: `startIcon={Circle}`. */
  startIcon?: LucideIcon
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  className?: string
}

/**
 * A row.
 *
 * Figma's `Type` property is not a prop: the row reads it off the Select it sits
 * in, because an item cannot sensibly disagree with its own select about whether
 * one value or several can be chosen. Single select puts a 16px check at the
 * end; multi select puts a 20px box at the start.
 */
function SelectItem({ children, startIcon, description, className, ...props }: SelectItemProps) {
  const { multiple } = useSelect()

  return (
    <SelectPrimitive.Item className={cn(item(), className)} {...props}>
      {multiple && (
        <span className={indicatorBox()}>
          <SelectPrimitive.ItemIndicator className="flex">
            {/* 14px, as in Checkbox: Figma binds the glyph to width/w-3,5. */}
            <Icon icon={Check} className="size-3.5" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
      {startIcon && <Icon icon={startIcon} />}
      <ItemLabel description={description}>{children}</ItemLabel>
      {!multiple && (
        <SelectPrimitive.ItemIndicator className="flex shrink-0">
          <Icon icon={Check} />
        </SelectPrimitive.ItemIndicator>
      )}
    </SelectPrimitive.Item>
  )
}

SelectItem.displayName = 'Select.Item'

export interface SelectProps
  extends Omit<ComponentPropsWithRef<typeof SelectPrimitive.Root>, 'className' | 'render'> {
  /** Shown while nothing is selected. Rendered italic, as Figma draws it. */
  placeholder?: ReactNode
  /** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
  size?: SelectSize
  /** Figma's `Hug`: true shrink-wraps the trigger, false fills the container. */
  hug?: boolean
  /** Maps to the trigger's `State=Invalid`, for a Select outside a Field. */
  invalid?: boolean
  /** The `Select.Item`s and `Select.Group`s to choose from. */
  children: ReactNode
  /**
   * Names the control when there is no `Field` around it — a filter in a
   * toolbar. Lands on the trigger, not on the root, which renders no element of
   * its own. Input's rule: standalone, a control still needs a name.
   */
  'aria-label'?: string
  /** Names the control from another element's text. */
  'aria-labelledby'?: string
  /** Extra classes for the trigger. */
  className?: string
}

export function Select({
  placeholder = 'Select…',
  size = 'default',
  hug = false,
  invalid = false,
  multiple = false,
  items,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: SelectProps) {
  // Only walked when the caller has not passed `items` themselves — see
  // `collectItems`. Keyed on `children` so a static list is read once.
  const derivedItems = useMemo(
    () => (items != null ? undefined : collectItems(children)),
    [items, children],
  )

  const resolvedItems = items ?? derivedItems
  const grouped = useMemo(() => hasGroup(children), [children])

  return (
    <SelectPrimitive.Root multiple={multiple} items={resolvedItems} {...props}>
      <SelectContext.Provider value={{ multiple, size }}>
        <SelectPrimitive.Trigger
          aria-invalid={invalid || undefined}
          // These follow `className` onto the trigger rather than the root,
          // which renders no element of its own — a name passed to the root
          // would land nowhere and the button would have no accessible name at
          // all.
          //
          // **Spread only when set.** Inside a Field, Base UI computes
          // `aria-labelledby` itself from the field context, and writing the key
          // with an `undefined` value overrides that rather than deferring to
          // it — which silently strips the name off every Select in a Field.
          // Caught by the story suite; the trigger kept its `aria-describedby`
          // and lost only the label, which is exactly the shape of bug axe is
          // there to find.
          {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
          {...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {})}
          className={cn(trigger({ size, hug, invalid }), className)}
        >
          <SelectPrimitive.Value className={value()} placeholder={placeholder}>
            {multiple
              ? (selected: unknown) => renderMultiple(selected, resolvedItems, placeholder)
              : undefined}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon render={<span className="flex shrink-0" />}>
            <Icon icon={ChevronDown} size={size === 'small' ? 'small' : 'base'} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner
            className={overlayLayer}
            // The macOS behaviour, and Base UI's default — see the header. It
            // cannot mean anything with several values selected, so `multiple`
            // falls back to a conventional dropdown 4px below the trigger,
            // which is also what Base UI's own multi-select example does.
            alignItemWithTrigger={!multiple}
            side="bottom"
            align="start"
            sideOffset={multiple ? 4 : 0}
          >
            <SelectPrimitive.Popup className={popup()}>
              <SelectPrimitive.ScrollUpArrow className={scrollArrow()}>
                <Icon icon={ChevronUp} />
              </SelectPrimitive.ScrollUpArrow>
              <SelectPrimitive.List className="flex flex-col">
                {grouped ? (
                  children
                ) : (
                  // `role="none"` so this stays out of the ownership chain
                  // between `role="listbox"` and its `role="option"` children —
                  // the `aria-required-children` family of bug that stopped Tabs
                  // putting a real Divider inside its `tablist`.
                  <div role="none" className="flex flex-col p-2">
                    {children}
                  </div>
                )}
              </SelectPrimitive.List>
              <SelectPrimitive.ScrollDownArrow className={scrollArrow()}>
                <Icon icon={ChevronDown} />
              </SelectPrimitive.ScrollDownArrow>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectContext.Provider>
    </SelectPrimitive.Root>
  )
}

Select.displayName = 'Select'

Select.Item = SelectItem
Select.Group = SelectGroup

/**
 * The raw Base UI parts, for the shapes the wrapper above cannot express: a
 * trigger anchored to something else, or a select held open for a screenshot.
 */
Select.Root = SelectPrimitive.Root
Select.Trigger = SelectPrimitive.Trigger
Select.Value = SelectPrimitive.Value
Select.Portal = SelectPrimitive.Portal
Select.Positioner = SelectPrimitive.Positioner
Select.RawPopup = SelectPrimitive.Popup
Select.List = SelectPrimitive.List
Select.Separator = SelectPrimitive.Separator
