import { useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import type { ComboboxRootProps } from '@base-ui/react/combobox'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'
import { overlayLayer } from '../../lib/layers'
import { Icon } from '../Icon'
import { Token } from '../Token'
import { ComboboxContext, useCombobox } from './context'
import { empty, groupLabel, item, itemLabel, list, popup, separator } from './styles'

/**
 * Combobox — pick from a list too long to scroll, by typing to filter it.
 *
 * Mirrors the Figma component sets "Combobox" (node 40004057:15715, `Select
 * Type` x `Size` x `State`, 30 variants), "_Single Select Combobox Value"
 * (40004057:15668), "_Multi Select Combobox Value" (40004057:15991), "Combobox
 * Menu Item" (40004113:14002, `Type` Single Select | Multi Select | Radio x
 * `State` x `Selected`), "Combobox Menu Group" (40004113:14469) and "Combobox
 * Menu" (40004113:14494).
 *
 *     <Field label="Country" nativeLabel={false}>
 *       <Combobox items={countries} placeholder="Select country" />
 *     </Field>
 *
 *     <Field label="Reviewers">
 *       <Combobox multiple items={people} placeholder="Add reviewers…" />
 *     </Field>
 *
 * **Seventeenth Base UI component**, and the last of the form family bar
 * Autocomplete. Where it sits is the decision tree in CLAUDE.md: the value must
 * come from a known set, and there are too many options to scroll — so typing
 * filters. Autocomplete looks identical and differs on the one thing that
 * matters, whether a value that is not on the list is still allowed.
 *
 * ## The two shapes, and why they are different components inside
 *
 * **Single select is Base UI's input-inside-popup pattern.** The field is a
 * trigger — a value and a chevron, Select's box exactly — and the search input
 * lives in the popup's header, which is what the Combobox Menu draws. Base UI
 * detects this itself: `Combobox.Input` sets `inputInsidePopup` when it has a
 * `Positioner` above it, which turns the trigger into `role="combobox"` with
 * `aria-haspopup="dialog"` and the popup into `role="dialog"`.
 *
 * **Multi select is its Chips pattern** — Astryx's Tokenizer. There is no
 * trigger and no chevron: the field *is* the input, with the chosen values
 * sitting in front of the caret as `Token`s. That is the literal reading of the
 * Figma value component, whose placeholder text sits *after* the tokens rather
 * than in front of them, and where no chevron is drawn at all. It also avoids
 * two search boxes on one control, and avoids nesting a token's remove button
 * inside a `<button>` trigger, which is neither valid nor operable.
 *
 * ## Items come from `items`, not from children
 *
 * Unlike `Select`, whose `Select.Item` children are walked to build the label
 * list, this takes an `items` array. That is not a style choice: Base UI derives
 * the filtered list from `items` on the Root, and rows written as JSX children
 * are never filtered — so the children API would produce a combobox whose
 * search silently matches nothing. Pass a function child to control how one row
 * is drawn; it is called with an item in both the flat and the grouped case.
 *
 * ## What is left out
 *
 * `Combobox.Clear`, `Backdrop`, `Arrow` and `Row`; virtualization;
 * `Combobox.Label`, because `Field` owns the label; and Astryx's `maxEntries`,
 * `hasCreate`, `status`, `+N more` overflow, `endContent`, `isLabelHidden` and
 * `disabledMessage`. None of them are in the file. Figma has no `Hug` property
 * on this set either, unlike Select — a combobox fills its container.
 *
 * ## Half the recipes live in `styles.ts`
 *
 * The popup, the list, the row and the group's furniture are in `./styles`,
 * because Base UI's `autocomplete` subpath re-exports those parts as **the same
 * component objects** and `Autocomplete` draws them identically. The field half
 * — trigger, value, tokenizer, popup search — stays here, where only a Combobox
 * can reach it. The line between the two is the note at the top of that file.
 */

/**
 * The single-select trigger. Select's box, unchanged, because Figma draws the
 * same frame: 24 / 32 / 40 tall at `rounded-md` on `Input/Border` over
 * `Input/Background`, with a 12px inset and the chevron at the end.
 *
 * **There is no vertical padding, and that is deliberate** — Select's note, and
 * Input's before it. Figma's `padding-block` sums to the box height only because
 * a Figma stroke does not add to a frame; a CSS border does, and `border-box`
 * would render the default size at 34. Letting the line-height center inside a
 * `min-h` box lands 24 / 32 / 40 exactly.
 *
 * `group` is here so the value slot can read `data-placeholder` off the trigger,
 * which is where Base UI puts it.
 */
const trigger = tv({
  base: [
    'group flex w-full items-center gap-3',
    'rounded-md border border-input-border bg-input-background px-3',
    'font-sans text-left text-content-primary',
    'cursor-pointer select-none',
    'hover:border-input-border-hover',
    // The trigger is the focusable element itself, so this is the ring on the
    // element rather than `focusRingWithin` as on the tokenizer's box below,
    // where focus lands on a descendant <input>.
    ...focusRing,
    // Inside a Field, validity arrives as `data-invalid` rather than as a prop.
    // The `hover` copy is spelled out because both selectors otherwise land on
    // equal specificity and the winner would come down to emission order.
    'data-invalid:border-feedback-danger-highlight',
    'data-invalid:hover:border-feedback-danger-highlight',
    'disabled:pointer-events-none disabled:opacity-40',
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      small: 'min-h-6 text-sm', // 24px, text 12/20
      default: 'min-h-8 text-base', // 32px, text 14/24
      // Figma keeps the default type at large and only grows the padding.
      large: 'min-h-10 text-base', // 40px, text 14/24
    },

    /** Figma's `State=Invalid`, for a Combobox standing outside a Field. */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { size: 'default', invalid: false },
})

/**
 * The trigger's value slot.
 *
 * **The placeholder is italic**, which a screenshot does not show and only the
 * variable defs do: Figma binds `text-base/italic regular` rather than the
 * regular face. Italic is this system's mark for text the person did not enter —
 * Input's placeholder and Field's validation message are italic for the same
 * reason. `Combobox.Value` renders no element of its own, and Base UI puts
 * `data-placeholder` on the *trigger*, so the state is read through the group.
 */
const value = tv({
  base: [
    'min-w-0 flex-1 truncate',
    'group-data-placeholder:text-content-subtle group-data-placeholder:italic',
  ],
})

/**
 * The tokenizer's box.
 *
 * This is `Input`'s `box` almost class for class — same border, same fill, same
 * `flex-wrap` and `min-h` so it grows only when the tokens wrap, same
 * `data-invalid` and `:disabled` rules — and it is written out here rather than
 * imported for exactly one reason: **the ring.**
 *
 * Input's box rings on *any* focusable descendant, which is right when the only
 * one is the `<input>`. A tokenizer has more: the arrow keys walk the chips
 * themselves, and Base UI gives each one real DOM focus. Left on `focusRingWithin`
 * the field lit up identically whichever chip you were on, which tells you the
 * one thing you already knew and none of the thing you needed — measured in the
 * browser, and the reason this recipe exists.
 *
 * So the ring is scoped to the caret, and the chip carries its own. One ring at
 * a time, always on the thing that actually has focus — CLAUDE.md's rule kept
 * rather than bent, at the price of ten duplicated classes.
 *
 * Figma has no `Appearance` axis on this set, so there is no `ghost` variant to
 * carry over either.
 */
const field = tv({
  base: [
    'flex w-full flex-wrap items-center',
    'rounded-md border border-input-border bg-input-background',
    'hover:border-input-border-hover',
    // `focusRing`'s two strokes, fired by the caret rather than by the box.
    'has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-focus-focus-outer-border',
    'has-[input:focus-visible]:ring-offset-2',
    'has-[input:focus-visible]:ring-offset-focus-focus-inner-border',
    // Inside a Field, validity arrives as `data-invalid` on the control, so the
    // box reads it off its own descendant. The `hover` copy is spelled out
    // because both selectors otherwise land on equal specificity.
    'has-[[data-invalid]]:border-feedback-danger-highlight',
    'has-[[data-invalid]]:hover:border-feedback-danger-highlight',
    // Disabled is the one state the box can always see for itself: Base UI's
    // Field.Root disables the control it wraps, so either way there is a
    // `:disabled` descendant.
    'has-[:disabled]:pointer-events-none has-[:disabled]:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    size: {
      small: 'min-h-6', // 24px
      default: 'min-h-8', // 32px
      large: 'min-h-10', // 40px
    },

    /** Figma's `State=Invalid`, for a Combobox standing outside a Field. */
    invalid: {
      true: 'border-feedback-danger-highlight hover:border-feedback-danger-highlight',
      false: '',
    },
  },

  defaultVariants: { size: 'default', invalid: false },
})

/**
 * The tokenizer's chip row, inside the box above.
 *
 * ## The vertical padding is not slack, it is the exact centring gap
 *
 * A field's inner height is its box minus two borders — **22 / 30 / 38** — and a
 * Token is 20 at small and 24 above it. Half of what is left over is where a
 * single row of tokens actually sits: **1 / 3 / 7**. Setting the padding to
 * anything *less* than that still looks right with one row, because
 * `items-center` makes up the difference — and then betrays itself the moment a
 * second row arrives and there is no spare height left to center in. The first
 * row jerks upwards by the difference.
 *
 * Measured before the fix: 4px above the first token at the default size with
 * one row, 3px with three. Small was already exact and never moved, which is
 * what made it easy to miss. Making the padding equal the centring gap means
 * `items-center` has nothing to do in the one-row case, so **the first row never
 * moves** — the box just grows downwards.
 *
 * `flex-wrap` is what lets it grow at all: the box may only get taller when the
 * tokens run onto a second line, never for the first one.
 *
 * ## And the left inset is the same number
 *
 * A token 12px from the left edge but 3px from the top reads as misaligned,
 * because it is — so once there are tokens, the left padding drops to match the
 * vertical one and the first token sits the same distance from all three edges.
 *
 * **Only once there are tokens.** With an empty field the caret is the first
 * thing in the row, and its placeholder belongs at the same 12px as every other
 * field in the library. `role="toolbar"` is the hook: Base UI puts it on this
 * element exactly when the selection is non-empty, which is exactly when a token
 * is drawn. The trailing 12px is left alone — it is what keeps the caret's text
 * off the right border.
 *
 * `gap-1` is Figma's 4px, measured between the two tokens and between the last
 * token and the placeholder.
 */
const chips = tv({
  base: [
    'flex min-w-0 flex-1 flex-wrap items-center gap-1 self-stretch',
    'pr-3 pl-3',
  ],

  variants: {
    // Each pair is the same number twice: half of the field's inner height less
    // the token's, which is where one row centers itself anyway.
    size: {
      small: 'py-px [&[role=toolbar]]:pl-px', // (22 − 20) / 2 = 1
      default: 'py-0.75 [&[role=toolbar]]:pl-0.75', // (30 − 24) / 2 = 3
      large: 'py-1.75 [&[role=toolbar]]:pl-1.75', // (38 − 24) / 2 = 7
    },
  },

  defaultVariants: { size: 'default' },
})

/**
 * The caret inside the tokenizer. Not `Input`'s `control`, which carries its own
 * padding and `order` for the addon layout — here the chip row owns both.
 *
 * `min-w-16` rather than letting it shrink to nothing: a flex child with
 * `flex-1` and no minimum collapses the moment the tokens fill the line, which
 * leaves nowhere to type. With a minimum it wraps onto the next line instead —
 * which is the field's *one* license to grow. 64px is the smallest that still
 * shows a few characters; more than that and a field wraps while there is
 * plainly room left on the line.
 */
const chipsInput = tv({
  base: [
    'min-w-16 flex-1 bg-transparent outline-none',
    'text-content-primary',
    'placeholder:text-content-subtle placeholder:italic',
    'disabled:cursor-not-allowed',
  ],

  variants: {
    size: {
      small: 'min-h-5 text-sm', // matches a small Token: 20px
      default: 'min-h-6 text-base', // matches a default Token: 24px
      large: 'min-h-6 text-base',
    },
  },

  defaultVariants: { size: 'default' },
})

/**
 * The popup's search row — Figma's 48px Span holding an Input Group with a
 * magnifier in its start slot.
 *
 * **It has no box of its own**, which is not a simplification: the header's
 * variable defs carry no `Input/Border` and no `Input/Background` at all, so the
 * field really is drawn bare, with only the rule underneath separating it from
 * the list.
 *
 * **And it draws no focus ring**, which is the one place this library's "every
 * focusable thing takes `focusRing`" rule is deliberately set aside. Base UI
 * moves focus here the instant the popup opens, so a ring would be permanent
 * chrome rather than a signal that anything was focused — and there is nothing
 * else in the panel for focus to have come from.
 *
 * The geometry is Figma's: `p-2` round a 32px row, `pl-5` putting the magnifier
 * 20px from the popup edge, `gap-3` putting the text 12px after it. 8 + 32 + 8
 * lands the 48.
 */
const search = tv({
  base: [
    'flex shrink-0 items-center gap-3',
    'border-b border-surface-border',
    'py-2 pr-5 pl-5',
    'text-content-primary',
  ],
})

/** The `<input>` in that row. Same italic placeholder as everywhere else. */
const searchInput = tv({
  base: [
    'min-h-8 min-w-0 flex-1 bg-transparent outline-none',
    'text-base text-content-primary',
    'placeholder:text-content-subtle placeholder:italic',
  ],
})

/**
 * The 20px mark at the start of a row, in both of its shapes.
 *
 * Deliberately *not* reusing `Checkbox` or `Radio`, for the reason Select's and
 * Menu's copies give: the visual is identical — same tokens, same 20px, same
 * 14px glyph and 8px dot — but the state arrives from the *item* rather than
 * from a control of its own, so it is read off the ancestor with
 * `group-data-selected:`. A shared recipe would need a variant for where its own
 * state comes from, which is a worse abstraction than one short list of classes.
 */
const indicatorBox = tv({
  base: [
    'flex size-5 shrink-0 items-center justify-center border',
    'bg-input-background border-input-border',
    'group-data-selected:bg-input-selected group-data-selected:border-input-selected',
    'text-input-selected-foreground',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    /** Figma's Multi Select row is a square; its Radio row is a circle. */
    shape: {
      check: 'rounded-sm',
      radio: 'rounded-full',
    },
  },

  defaultVariants: { shape: 'check' },
})

type TriggerVariants = VariantProps<typeof trigger>

/** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
export type ComboboxSize = NonNullable<TriggerVariants['size']>

/**
 * Which mark a chosen row wears in a single select. Figma's Combobox Menu Item
 * has three `Type`s and the Combobox itself has two, so the third — Radio — is
 * a choice within single select rather than a third kind of combobox.
 */
export type ComboboxIndicator = 'check' | 'radio'

/** One row's worth of data. `label` is what the filter matches against. */
export interface ComboboxItemData {
  /** The value kept when this row is chosen, and submitted with a form. */
  value: string | number
  /** The visible text, and what typing filters on. */
  label: string
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /** Grays the row out and stops it being chosen. */
  disabled?: boolean
}

/** A heading and its rows. Base UI names a group's heading `value`. */
export interface ComboboxItemGroup {
  /** The heading text. */
  value: string
  items: readonly ComboboxItemData[]
}

/** Everything a chosen value can be: one item, several, or nothing. */
export type ComboboxValue = ComboboxItemData | ComboboxItemData[] | null

type RootProps = ComboboxRootProps<ComboboxItemData, false>

function isGrouped(
  items: readonly ComboboxItemData[] | readonly ComboboxItemGroup[] | undefined,
): items is readonly ComboboxItemGroup[] {
  return items != null && items.length > 0 && 'items' in items[0]
}

/**
 * The text to show for a chosen value.
 *
 * `{ value, label }` is the shape Base UI resolves labels from without being
 * told, and it is the shape `items` documents — but a caller building rows by
 * hand can put anything in `value`, so this falls back the way Base UI's own
 * `stringifyAsLabel` does rather than rendering `[object Object]`.
 */
function labelOf(chosen: unknown): string {
  if (chosen == null) {
    return ''
  }

  if (typeof chosen === 'object') {
    const record = chosen as { label?: unknown; value?: unknown }

    if (record.label != null) {
      return String(record.label)
    }

    if (record.value != null) {
      return String(record.value)
    }
  }

  return String(chosen)
}

export interface ComboboxItemProps
  extends Omit<ComponentPropsWithRef<typeof ComboboxPrimitive.Item>, 'className' | 'render'> {
  /** Lucide icon before the label. Pass the component: `startIcon={Circle}`. */
  startIcon?: LucideIcon
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  className?: string
}

/**
 * A row.
 *
 * Figma's `Type` is not a prop here: the row reads it off the Combobox it sits
 * in, because a row cannot sensibly disagree with its own combobox about whether
 * one value or several can be chosen. Multi select puts a 20px square at the
 * start, `indicator="radio"` puts a 20px circle there, and a plain single select
 * puts a 16px check at the end.
 */
function ComboboxItem({
  children,
  startIcon,
  description,
  className,
  ...props
}: ComboboxItemProps) {
  const { multiple, indicator } = useCombobox()
  const leading = multiple || indicator === 'radio'

  return (
    <ComboboxPrimitive.Item className={cn(item(), className)} {...props}>
      {leading && (
        <span className={indicatorBox({ shape: multiple ? 'check' : 'radio' })}>
          <ComboboxPrimitive.ItemIndicator className="flex">
            {multiple ? (
              // 14px, as in Checkbox: Figma binds the glyph to width/w-3,5.
              <Icon icon={Check} className="size-3.5" />
            ) : (
              // 8px, as in Radio.
              <span className="size-2 rounded-full bg-input-selected-foreground" />
            )}
          </ComboboxPrimitive.ItemIndicator>
        </span>
      )}
      {startIcon && <Icon icon={startIcon} />}
      <span className={itemLabel()}>
        <span className="text-base">{children}</span>
        {description != null && <span className="text-sm text-content-subtle">{description}</span>}
      </span>
      {!leading && (
        <ComboboxPrimitive.ItemIndicator className="flex shrink-0">
          <Icon icon={Check} />
        </ComboboxPrimitive.ItemIndicator>
      )}
    </ComboboxPrimitive.Item>
  )
}

ComboboxItem.displayName = 'Combobox.Item'

export interface ComboboxGroupProps {
  /** The heading. Figma's `Group Header`, and the group's accessible name. */
  label?: ReactNode
  /**
   * The rows this group owns. Base UI hands them to any `Combobox.Collection`
   * inside, which is how a grouped list stays filtered per group.
   */
  items?: readonly ComboboxItemData[]
  children: ReactNode
  className?: string
}

/**
 * A group of rows, with the rule above it.
 *
 * Select's arrangement, because Figma draws the two menus the same way. **The
 * separator is a sibling of the group, not a child**: the file puts a Divider
 * inside every group including the first, where it is invisible only because it
 * lands on the panel's own border and gets clipped. Rendering it as a sibling
 * lets `first:hidden` do that honestly.
 *
 * The rows sit in a wrapper marked `role="none"` so it stays out of the
 * ownership chain between `role="listbox"` and its `role="option"` children.
 * Figma puts the 8px there rather than on the group because the header sits
 * outside it: `px-5` on the header and `p-2` plus the row's own `px-3` both land
 * text 20px from the popup edge.
 */
function ComboboxGroup({ label, items, children, className }: ComboboxGroupProps) {
  return (
    <>
      <ComboboxPrimitive.Separator className={separator()} />
      <ComboboxPrimitive.Group items={items} className={cn('flex flex-col', className)}>
        {label != null && (
          <ComboboxPrimitive.GroupLabel className={groupLabel()}>
            {label}
          </ComboboxPrimitive.GroupLabel>
        )}
        <div role="none" className="flex flex-col p-2">
          {children}
        </div>
      </ComboboxPrimitive.Group>
    </>
  )
}

ComboboxGroup.displayName = 'Combobox.Group'

export interface ComboboxProps
  extends Pick<
    RootProps,
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'disabled'
    | 'readOnly'
    | 'required'
    | 'name'
    | 'id'
    | 'modal'
    | 'autoHighlight'
    | 'filter'
    | 'limit'
    | 'inputValue'
    | 'defaultInputValue'
    | 'onInputValueChange'
    | 'isItemEqualToValue'
    | 'itemToStringLabel'
    | 'itemToStringValue'
    | 'actionsRef'
    | 'inputRef'
  > {
  /**
   * The rows to choose from — flat, or an array of `{ value, items }` groups.
   * **This is what gets filtered**; rows written as children are not, which is
   * why there is no children-only form.
   */
  items?: readonly ComboboxItemData[] | readonly ComboboxItemGroup[]
  /**
   * Several values rather than one, shown as removable `Token`s inside the
   * field. Changes the whole anatomy: no trigger, no chevron, and the search
   * input moves out of the popup and into the field.
   */
  multiple?: boolean
  /** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
  size?: ComboboxSize
  /**
   * Which mark a chosen row wears in a single select — Figma's third Combobox
   * Menu Item `Type`. Ignored when `multiple`, which always draws its square.
   */
  indicator?: ComboboxIndicator
  /** Maps to `State=Invalid`, for a Combobox standing outside a Field. */
  invalid?: boolean
  /**
   * Shown while nothing is chosen: on the trigger in a single select, in the
   * caret in a multi select. Rendered italic, as Figma draws it, and reused as
   * the popup dialog's accessible name.
   */
  placeholder?: string
  /** The popup search field's placeholder. Single select only. */
  searchPlaceholder?: string
  /** What the popup search field is called out loud. Single select only. */
  searchLabel?: string
  /** Shown in place of the list when the filter matches nothing. */
  emptyMessage?: ReactNode
  /** The chosen value. An array when `multiple`. */
  value?: ComboboxValue
  /** The initially chosen value, for an uncontrolled combobox. */
  defaultValue?: ComboboxValue
  /** Called when the chosen value changes. */
  onValueChange?: (value: ComboboxValue) => void
  /**
   * How one row is drawn. Called with an item in both the flat and the grouped
   * case — the group wrapper is this component's business, not the caller's.
   * Anything else is rendered inside the list as-is, for a hand-built tree.
   */
  children?: ((item: ComboboxItemData) => ReactNode) | ReactNode
  /**
   * Names the control when there is no `Field` around it. Lands on the trigger
   * or on the caret, not on the root, which renders no element of its own.
   */
  'aria-label'?: string
  /** Names the control from another element's text. */
  'aria-labelledby'?: string
  /** Extra classes for the field — the trigger, or the tokenizer's box. */
  className?: string
}

export function Combobox({
  items,
  multiple = false,
  size = 'default',
  indicator = 'check',
  invalid = false,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  emptyMessage = 'No results found.',
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: ComboboxProps) {
  // The tokenizer has no trigger, so Base UI anchors the panel to the `<input>`
  // — which is only the part of the field left over after the tokens, and drifts
  // right as they are added. Pointing it at the box instead puts the panel under
  // the whole field and makes `--anchor-width` the field's width, which is what
  // Figma draws. The trigger shape needs none of this; it *is* the anchor.
  const fieldRef = useRef<HTMLDivElement>(null)
  const grouped = isGrouped(items)
  const renderItem = typeof children === 'function' ? children : defaultItem
  const custom = children != null && typeof children !== 'function'

  // **Spread only when set.** Inside a Field, Base UI computes `aria-labelledby`
  // from the field context, and writing the key with an `undefined` value
  // overrides that rather than deferring to it — which silently strips the name
  // off the control. Select's bug, and the shape of thing axe is there to find.
  const naming = {
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
    ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
  }

  return (
    <ComboboxPrimitive.Root
      items={items as RootProps['items']}
      multiple={multiple}
      value={valueProp as RootProps['value']}
      defaultValue={defaultValue as RootProps['defaultValue']}
      // Wrapped rather than cast: `multiple` is a runtime boolean, so Base UI's
      // own signature is the union of the one-value and many-values shapes, and
      // a cast in either direction would be a lie about one of them.
      onValueChange={
        onValueChange
          ? (next: ComboboxItemData | ComboboxItemData[] | null) => onValueChange(next)
          : undefined
      }
      {...props}
    >
      <ComboboxContext.Provider value={{ multiple, size, indicator }}>
        {multiple ? (
          // The tokenizer. Input's box down to the class list, so a Combobox,
          // an Input, an InputGroup and a Select are all visibly the same
          // field — see `field` above for the one thing that had to differ.
          <div ref={fieldRef} className={cn(field({ size, invalid }), className)}>
            <ComboboxPrimitive.Chips className={chips({ size })}>
              <ComboboxPrimitive.Value>
                {(chosen: ComboboxItemData[]) =>
                  chosen.map((chip) => {
                    const label = labelOf(chip)

                    return (
                      <ComboboxPrimitive.Chip
                        key={label}
                        // The chip takes real DOM focus from the arrow keys, so
                        // it takes the ring too — and the box's is scoped to the
                        // caret so the two never fire together.
                        className={cn(focusRing)}
                        render={
                          // Token is the look; Base UI is the behavior. The
                          // remove button goes in the end slot because Token's
                          // own `onRemove` would draw a second one — and
                          // `interactive` has to be said out loud here, since
                          // the control Token normally derives it from lives
                          // outside its own props.
                          <Token
                            size={size === 'small' ? 'small' : 'default'}
                            // 6px inside the field's 8px box. Concentric corners
                            // of the same radius never read as parallel; see the
                            // `radius` variant in Token's `styles.ts`.
                            radius="sm"
                            interactive
                            endSlot={
                              <ComboboxPrimitive.ChipRemove
                                render={<Token.Remove />}
                                aria-label={`Remove ${label}`}
                              />
                            }
                          />
                        }
                      >
                        {label}
                      </ComboboxPrimitive.Chip>
                    )
                  })
                }
              </ComboboxPrimitive.Value>
              <ComboboxPrimitive.Input
                aria-invalid={invalid || undefined}
                className={chipsInput({ size })}
                placeholder={placeholder}
                {...naming}
              />
            </ComboboxPrimitive.Chips>
          </div>
        ) : (
          <ComboboxPrimitive.Trigger
            aria-invalid={invalid || undefined}
            {...naming}
            className={cn(trigger({ size, invalid }), className)}
          >
            <span className={value()}>
              <ComboboxPrimitive.Value placeholder={placeholder} />
            </span>
            <ComboboxPrimitive.Icon render={<span className="flex shrink-0" />}>
              <Icon icon={ChevronDown} size={size === 'small' ? 'small' : 'base'} />
            </ComboboxPrimitive.Icon>
          </ComboboxPrimitive.Trigger>
        )}

        <ComboboxPrimitive.Portal>
          <ComboboxPrimitive.Positioner
            className={overlayLayer}
            anchor={multiple ? fieldRef : undefined}
            side="bottom"
            align="start"
            sideOffset={4}
          >
            {/* The panel is a `role="dialog"` in the single-select shape, so it
                needs a name, and Base UI's own example uses the placeholder for
                it — the only text this component reliably has. In the tokenizer
                the same element drops to `role="presentation"`, where a name is
                not merely unnecessary but **prohibited**: axe's
                `aria-prohibited-attr`, caught by the story suite. */}
            <ComboboxPrimitive.Popup
              className={popup()}
              {...(multiple ? {} : { 'aria-label': placeholder })}
            >
              {!multiple && (
                <div className={search()}>
                  <Icon icon={Search} className="shrink-0" />
                  <ComboboxPrimitive.Input
                    aria-label={searchLabel}
                    className={searchInput()}
                    placeholder={searchPlaceholder}
                  />
                </div>
              )}

              <ComboboxPrimitive.Empty>
                <div className={empty()}>{emptyMessage}</div>
              </ComboboxPrimitive.Empty>

              <ComboboxPrimitive.List className={list()}>
                {custom ? (
                  children
                ) : grouped ? (
                  (group: ComboboxItemGroup) => (
                    <ComboboxGroup key={group.value} label={group.value} items={group.items}>
                      <ComboboxPrimitive.Collection>{renderItem}</ComboboxPrimitive.Collection>
                    </ComboboxGroup>
                  )
                ) : (
                  // `role="none"` so this stays out of the ownership chain
                  // between `role="listbox"` and its `role="option"` children —
                  // the `aria-required-children` family of bug that stopped Tabs
                  // putting a real Divider inside its `tablist`.
                  <div role="none" className="flex flex-col p-2">
                    <ComboboxPrimitive.Collection>{renderItem}</ComboboxPrimitive.Collection>
                  </div>
                )}
              </ComboboxPrimitive.List>
            </ComboboxPrimitive.Popup>
          </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
      </ComboboxContext.Provider>
    </ComboboxPrimitive.Root>
  )
}

/** The row a caller gets without writing one. */
function defaultItem(data: ComboboxItemData) {
  return (
    <ComboboxItem
      key={String(data.value)}
      value={data}
      description={data.description}
      disabled={data.disabled}
    >
      {data.label}
    </ComboboxItem>
  )
}

Combobox.displayName = 'Combobox'

Combobox.Item = ComboboxItem
Combobox.Group = ComboboxGroup

/**
 * The raw Base UI parts, for the shapes the wrapper above cannot express — a
 * combobox held open for a screenshot, or a popup anchored to something else.
 */
Combobox.Root = ComboboxPrimitive.Root
Combobox.Trigger = ComboboxPrimitive.Trigger
Combobox.Input = ComboboxPrimitive.Input
Combobox.Value = ComboboxPrimitive.Value
Combobox.Chips = ComboboxPrimitive.Chips
Combobox.Chip = ComboboxPrimitive.Chip
Combobox.ChipRemove = ComboboxPrimitive.ChipRemove
Combobox.Portal = ComboboxPrimitive.Portal
Combobox.Positioner = ComboboxPrimitive.Positioner
Combobox.RawPopup = ComboboxPrimitive.Popup
Combobox.List = ComboboxPrimitive.List
Combobox.Collection = ComboboxPrimitive.Collection
Combobox.Empty = ComboboxPrimitive.Empty
Combobox.Separator = ComboboxPrimitive.Separator
Combobox.useFilter = ComboboxPrimitive.useFilter
