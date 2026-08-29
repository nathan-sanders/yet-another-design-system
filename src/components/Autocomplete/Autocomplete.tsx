import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete'
import type { AutocompleteRootProps } from '@base-ui/react/autocomplete'
import { Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'
import { Avatar } from '../Avatar'
import type { AvatarProps } from '../Avatar'
import { Icon } from '../Icon'
import { addon, box, control, ICON_SIZE } from '../Input/styles'
import type { InputAppearance, InputSize } from '../Input/styles'
import { empty, groupLabel, item, itemLabel, list, popup, separator } from '../Combobox/styles'
import { AutocompleteContext, useAutocomplete } from './context'

/**
 * Autocomplete — free text, with suggestions that do not constrain it.
 *
 * Mirrors the Figma component sets "Autocomplete" (node 40004146:6778, `Size` x
 * `State` x an `Icon` boolean, 15 variants), "_Autocomplete Value"
 * (40004146:6731), "Autocomplete Menu Item" (40004146:6981, `State` x `Type`
 * Default | Avatar), "Autocomplete Menu Group" (40004147:7312) and
 * "Autocomplete Menu" (40004147:7345).
 *
 *     <Field label="Search">
 *       <Autocomplete items={recentSearches} placeholder="Search anything…" />
 *     </Field>
 *
 * **Twentieth Base UI component**, the fifth that portals, and the last of the
 * form family. Where it sits is the decision tree in CLAUDE.md: the value does
 * *not* have to come from a known set, but suggestions help — a search box that
 * remembers recent searches.
 *
 * ## The one thing that makes it not a Combobox
 *
 * The two look identical and differ on exactly one rule: **a value that is not
 * on the list is still allowed.** That is not a styling difference, and Base UI
 * expresses it in the API rather than in a prop — `value` here is the input
 * *string*, not a chosen item, and there is no `selectionMode`, no
 * `ItemIndicator` and no `selected` state on a row. Choosing a suggestion just
 * writes its label into the input, which is a shortcut for typing rather than a
 * commitment to the list.
 *
 * ## It is an Input, not a trigger
 *
 * There is one shape, unlike Combobox's two, and Figma draws it as an Input
 * Group: a bordered field with a magnifier in the start slot and no chevron. So
 * the field is literally `Input`'s box — `box`, `addon` and `control` from
 * `Input/styles.ts`, at the same 24 / 32 / 40 — and `focusRingWithin` is
 * *correct* here in the way it was not for Combobox's tokenizer, because
 * `Autocomplete.InputGroup` has exactly one focusable descendant.
 *
 * `InputGroup` also earns its place twice over: Base UI resolves the popup's
 * anchor to it, so `--anchor-width` is the whole field's width without the ref
 * Combobox's tokenizer needed, and it takes a `mousedown` anywhere in the group
 * down to the caret.
 *
 * ## Items come from `items`, not from children
 *
 * Base UI derives the filtered list from `items` on the Root, so rows written as
 * JSX children are never filtered. Pass a function child to control how one row
 * is drawn; it is called with an item in both the flat and the grouped case.
 *
 * ## What is left out
 *
 * `Autocomplete.Trigger` and `Value` — this component has no trigger and its
 * value is the input's own; `Clear`, `Backdrop`, `Arrow`, `Row` and `Status`,
 * none of which Figma draws; `grid`, `inline` and virtualization; and
 * `Autocomplete.Label`, because `Field` owns the label.
 */

/**
 * The magnifier's slot. Figma's `Icon` boolean, on by default.
 *
 * `addon`'s `inline-start` carries `pl-3` and `control` carries `px-3`, which is
 * Figma's `px-3` on the box plus its `gap-3` — the glyph 12px from the border and
 * the text 12px after the glyph.
 */
const startSlot = addon

/**
 * The 20px avatar at the start of a row — Figma's `Type=Avatar`.
 *
 * `x-small` is the Avatar scale's 20px step, which is what the file draws, and it
 * fits the row's 24px inner height with 2px either side. Not interactive: the
 * whole row is the hit target, so the avatar is a picture rather than a link.
 */
const AVATAR_SIZE = 'x-small' as const

type RootProps = AutocompleteRootProps<AutocompleteItemData>

/** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
export type AutocompleteSize = InputSize

/**
 * Shared with `Input`, and not in Figma yet — see the `appearance` variant in
 * `Input/styles.ts`. `ghost` is the case that note names out loud: a global
 * search entry that should sit quieter than a form field, kept findable by the
 * magnifier beside it.
 */
export type AutocompleteAppearance = InputAppearance

/**
 * The picture at the start of a row. Deliberately narrower than `AvatarProps`:
 * the row is the hit target, so an avatar here is never a link or a button, and
 * its size is Figma's rather than the caller's.
 */
export type AutocompleteItemAvatar = Pick<
  AvatarProps,
  'src' | 'alt' | 'name' | 'initials' | 'status' | 'statusLabel'
>

/** One row's worth of data. `label` is what the filter matches against. */
export interface AutocompleteItemData {
  /** The text written into the input when this row is chosen. */
  value: string
  /** The visible text, and what typing filters on. */
  label: string
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  /**
   * A person at the start of the row — Figma's `Type=Avatar`, **derived from
   * this rather than asked for with a prop.** A row cannot sensibly disagree
   * with its own data about whether it has an avatar.
   */
  avatar?: AutocompleteItemAvatar
  /** Grays the row out and stops it being chosen. */
  disabled?: boolean
}

/** A heading and its rows. Base UI names a group's heading `value`. */
export interface AutocompleteItemGroup {
  /** The heading text. */
  value: string
  items: readonly AutocompleteItemData[]
}

function isGrouped(
  items: readonly AutocompleteItemData[] | readonly AutocompleteItemGroup[] | undefined,
): items is readonly AutocompleteItemGroup[] {
  return items != null && items.length > 0 && 'items' in items[0]
}

export interface AutocompleteItemProps
  extends Omit<
    ComponentPropsWithRef<typeof AutocompletePrimitive.Item>,
    'className' | 'render'
  > {
  /** Lucide icon before the label. Pass the component: `startIcon={Circle}`. */
  startIcon?: LucideIcon
  /** A person before the label — Figma's `Type=Avatar`. */
  avatar?: AutocompleteItemAvatar
  /** Secondary line under the label. Figma's `Sub Label`. */
  description?: ReactNode
  className?: string
}

/**
 * A row.
 *
 * The same 32px row as Combobox's, Select's and Menu's — the recipe is shared
 * through `Combobox/styles.ts`, because Base UI hands both components the same
 * `Popup`, `List` and `Group`. What it does *not* have is a mark for a chosen
 * value: `AutocompleteItem`'s state is `{ disabled, highlighted }` and nothing
 * else, which is the same fact as "off-list values are allowed" seen from the
 * row's side.
 *
 * Figma's `Type` is not a prop: an avatar in the data draws the Avatar row, and
 * its absence draws the Default one.
 */
function AutocompleteItem({
  children,
  startIcon,
  avatar,
  description,
  className,
  ...props
}: AutocompleteItemProps) {
  const { size } = useAutocomplete()

  return (
    <AutocompletePrimitive.Item className={cn(item(), className)} {...props}>
      {avatar != null && <Avatar size={AVATAR_SIZE} className="shrink-0" {...avatar} />}
      {startIcon && <Icon icon={startIcon} size={ICON_SIZE[size]} />}
      <span className={itemLabel()}>
        <span className="text-base">{children}</span>
        {description != null && <span className="text-sm text-content-subtle">{description}</span>}
      </span>
    </AutocompletePrimitive.Item>
  )
}

AutocompleteItem.displayName = 'Autocomplete.Item'

export interface AutocompleteGroupProps {
  /** The heading. Figma's `Group Header`, and the group's accessible name. */
  label?: ReactNode
  /**
   * The rows this group owns. Base UI hands them to any
   * `Autocomplete.Collection` inside, which is how a grouped list stays filtered
   * per group.
   */
  items?: readonly AutocompleteItemData[]
  children: ReactNode
  className?: string
}

/**
 * A group of rows, with the rule above it.
 *
 * Combobox's arrangement, because Figma draws the two menus the same way — the
 * separator is a **sibling** of the group rather than a child, so `first:hidden`
 * can hide the one the file draws against the panel's own border. The rows sit
 * in a wrapper marked `role="none"` so it stays out of the ownership chain
 * between `role="listbox"` and its `role="option"` children.
 *
 * `AutocompletePrimitive.Separator` is one of the five parts that is genuinely
 * its own component rather than Combobox's, which is why this is written out
 * again where the recipes are not.
 */
function AutocompleteGroup({ label, items, children, className }: AutocompleteGroupProps) {
  return (
    <>
      <AutocompletePrimitive.Separator className={separator()} />
      <AutocompletePrimitive.Group items={items} className={cn('flex flex-col', className)}>
        {label != null && (
          <AutocompletePrimitive.GroupLabel className={groupLabel()}>
            {label}
          </AutocompletePrimitive.GroupLabel>
        )}
        <div role="none" className="flex flex-col p-2">
          {children}
        </div>
      </AutocompletePrimitive.Group>
    </>
  )
}

AutocompleteGroup.displayName = 'Autocomplete.Group'

export interface AutocompleteProps
  extends Pick<
    RootProps,
    | 'open'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'onOpenChangeComplete'
    | 'value'
    | 'defaultValue'
    | 'onValueChange'
    | 'disabled'
    | 'readOnly'
    | 'required'
    | 'name'
    | 'id'
    | 'form'
    | 'modal'
    | 'mode'
    | 'autoHighlight'
    | 'openOnInputClick'
    | 'submitOnItemClick'
    | 'filter'
    | 'limit'
    | 'locale'
    | 'itemToStringValue'
    | 'onItemHighlighted'
    | 'actionsRef'
    | 'inputRef'
  > {
  /**
   * The suggestions — flat, or an array of `{ value, items }` groups. **This is
   * what gets filtered**; rows written as children are not, which is why there
   * is no children-only form.
   *
   * Nothing here constrains what the field will accept. That is the whole
   * distinction from `Combobox`.
   */
  items?: readonly AutocompleteItemData[] | readonly AutocompleteItemGroup[]
  /** Maps to the Figma `Size` property: Small 24 · Default 32 · Large 40. */
  size?: AutocompleteSize
  /** Shared with `Input`. `ghost` is the quiet global-search field. */
  appearance?: AutocompleteAppearance
  /** Maps to `State=Invalid`, for an Autocomplete standing outside a Field. */
  invalid?: boolean
  /** Shown while the field is empty. Rendered italic, as Figma draws it. */
  placeholder?: string
  /**
   * The glyph in the start slot — Figma's `Icon` boolean, which is on by
   * default and draws a magnifier. Pass `null` to draw no icon at all.
   */
  startIcon?: LucideIcon | null
  /** Shown in place of the list when the filter matches nothing. */
  emptyMessage?: ReactNode
  /**
   * How one row is drawn. Called with an item in both the flat and the grouped
   * case — the group wrapper is this component's business, not the caller's.
   * Anything else is rendered inside the list as-is, for a hand-built tree.
   */
  children?: ((item: AutocompleteItemData) => ReactNode) | ReactNode
  /** Names the control when there is no `Field` around it. Lands on the input. */
  'aria-label'?: string
  /** Names the control from another element's text. */
  'aria-labelledby'?: string
  /** Extra classes for the field. */
  className?: string
}

export function Autocomplete({
  items,
  size = 'default',
  appearance = 'default',
  invalid = false,
  placeholder = 'Search…',
  startIcon = Search,
  emptyMessage = 'No results found.',
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: AutocompleteProps) {
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
    // Base UI overloads `Root` on flat-versus-grouped `items`, so a union of the
    // two matches neither overload even though the runtime takes both — it makes
    // the same `'items' in items[0]` test `isGrouped` does above. The cast picks
    // the flat form, whose element type is this component's own.
    <AutocompletePrimitive.Root
      items={items as readonly AutocompleteItemData[] | undefined}
      {...props}
    >
      <AutocompleteContext.Provider value={{ size }}>
        <AutocompletePrimitive.InputGroup
          className={cn(box({ appearance, size, invalid }), className)}
        >
          {startIcon != null && (
            <span className={startSlot({ align: 'inline-start', size })}>
              <Icon icon={startIcon} size={ICON_SIZE[size]} />
            </span>
          )}
          <AutocompletePrimitive.Input
            aria-invalid={invalid || undefined}
            className={control({ size })}
            placeholder={placeholder}
            {...naming}
          />
        </AutocompletePrimitive.InputGroup>

        <AutocompletePrimitive.Portal>
          <AutocompletePrimitive.Positioner
            className={overlayLayer}
            side="bottom"
            align="start"
            sideOffset={4}
          >
            {/* **No `aria-label` here, ever.** The input is outside the popup,
                so Base UI leaves the panel on `role="presentation"`, where a
                name is not merely unnecessary but prohibited — axe's
                `aria-prohibited-attr`. Combobox spreads one only in its
                single-select shape, where the same element is a real dialog
                because the search field lives inside it. There is no such shape
                here. */}
            <AutocompletePrimitive.Popup className={popup()}>
              <AutocompletePrimitive.Empty>
                <div className={empty()}>{emptyMessage}</div>
              </AutocompletePrimitive.Empty>

              <AutocompletePrimitive.List className={list()}>
                {custom ? (
                  children
                ) : grouped ? (
                  (group: AutocompleteItemGroup) => (
                    <AutocompleteGroup key={group.value} label={group.value} items={group.items}>
                      <AutocompletePrimitive.Collection>
                        {renderItem}
                      </AutocompletePrimitive.Collection>
                    </AutocompleteGroup>
                  )
                ) : (
                  // `role="none"` so this stays out of the ownership chain
                  // between `role="listbox"` and its `role="option"` children.
                  <div role="none" className="flex flex-col p-2">
                    <AutocompletePrimitive.Collection>
                      {renderItem}
                    </AutocompletePrimitive.Collection>
                  </div>
                )}
              </AutocompletePrimitive.List>
            </AutocompletePrimitive.Popup>
          </AutocompletePrimitive.Positioner>
        </AutocompletePrimitive.Portal>
      </AutocompleteContext.Provider>
    </AutocompletePrimitive.Root>
  )
}

/** The row a caller gets without writing one. */
function defaultItem(data: AutocompleteItemData) {
  return (
    <AutocompleteItem
      key={data.value}
      value={data}
      avatar={data.avatar}
      description={data.description}
      disabled={data.disabled}
    >
      {data.label}
    </AutocompleteItem>
  )
}

Autocomplete.displayName = 'Autocomplete'

Autocomplete.Item = AutocompleteItem
Autocomplete.Group = AutocompleteGroup

/**
 * The raw Base UI parts, for the shapes the wrapper above cannot express — an
 * autocomplete held open for a screenshot, or a list rendered inline.
 */
Autocomplete.Root = AutocompletePrimitive.Root
Autocomplete.InputGroup = AutocompletePrimitive.InputGroup
Autocomplete.Input = AutocompletePrimitive.Input
Autocomplete.Clear = AutocompletePrimitive.Clear
Autocomplete.Portal = AutocompletePrimitive.Portal
Autocomplete.Positioner = AutocompletePrimitive.Positioner
Autocomplete.RawPopup = AutocompletePrimitive.Popup
Autocomplete.List = AutocompletePrimitive.List
Autocomplete.Collection = AutocompletePrimitive.Collection
Autocomplete.Empty = AutocompletePrimitive.Empty
Autocomplete.Status = AutocompletePrimitive.Status
Autocomplete.Separator = AutocompletePrimitive.Separator
Autocomplete.useFilter = AutocompletePrimitive.useFilter
