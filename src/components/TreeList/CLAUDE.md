# TreeList

A hierarchy people can fold and walk with the keyboard. Not a new Base UI component: Base UI has no
tree, so this is `Collapsible` (Accordion's and SideNav.Group's) for each parent, with the tree's
own focus model hand-rolled round it — the second roving tabindex in the library after Calendar.

**Figma:** page `↪ Tree List (In Progress)` `40004748:43532`. "Tree List" `40005193:41752`
(`Guides` True/False), "Tree List Item" `40005185:40819` (`Node` Expanded/Collapsed/Leaf ×
`State` Default/Selected/Disabled/Focus, plus `Start Content`/`End Content`/`Description` booleans
and `Rails`/`Start Content Items`/`End Content Items` slots), "_Tree Rail" `40005185:40910`, all
under the Components section `40005193:41229`. Docs frame `40005193:41214`.

**Reference:** Astryx `TreeList` (astryx.atmeta.com/components/TreeList), read at the DOM rather than
from its docs, for the API shape and the accessibility model.

## API

```tsx
<TreeList
  aria-label="Project files"
  defaultExpandedIds={['src']}
  items={[
    {
      id: 'src',
      label: 'src',
      startContent: <Icon icon={FolderOpen} />,
      children: [{ id: 'app', label: 'App.tsx', onClick: open }],
    },
    { id: 'docs', label: 'Documentation', href: '/docs', endContent: <Badge>3</Badge> },
  ]}
/>
```

`items` is Astryx's `TreeListItemData` with the `is` prefixes dropped: `id`, `label`, `description`,
`children`, `expanded`, `selected`, `disabled`, `href`, `onClick`, `startContent`, `endContent`.
The tree takes `guides` (default true), `header`, and two controlled/uncontrolled pairs —
`expandedIds` / `defaultExpandedIds` / `onExpandedChange` and `selectedId` / `defaultSelectedId` /
`onSelectedChange`. The type insists on a name: `header`, `aria-label` or `aria-labelledby`.

**Data, not compound children.** Everything else in the library that has parts composes them —
`Accordion.Item`, `Menu.Item`, `SideNav.Group`. A tree is the case where that stops paying: every
row needs `aria-setsize`, `aria-posinset` and `aria-level`, the keyboard needs the visible rows in
order, and `*` needs to know which siblings are closed parents. From children that is a registry
context and a second render; from data it is `flattenVisible`. Astryx made the same call.

**What was dropped from Astryx.** `density` — YADS has one 32px row, and Figma draws one. `xstyle`.
`variant: 'lineGuides' | 'noGuides'` became `guides: boolean`, because Figma's set has a single
boolean-shaped axis and a two-word enum for on/off is a prop nobody can guess. `header` stayed: it
is how the tree gets its name without a caller having to think about `aria-labelledby`.

**Selection is tracked only when asked for.** Give the tree a `selectedId`, a `defaultSelectedId`,
an `onSelectedChange`, or flag an item `selected`, and activating a row selects it. Do none of
those and activation just runs the row's `onClick` (and toggles a parent). Astryx has no selection
state at all — `isSelected` is a static flag — and a settings tree where every row is an action
should not start painting the last one pressed. Derived from what the caller handed over, which is
the derive-don't-declare rule: the tree knows whether it was told about selection.

## The accessibility model

The WAI-ARIA tree view pattern, exactly as Astryx renders it:

```
ul[role=tree aria-label|aria-labelledby]
  li[role=treeitem tabindex=0|-1 aria-level aria-posinset aria-setsize aria-expanded? aria-selected? aria-disabled? aria-labelledby aria-describedby?]
    div|a[data-tree-row]            ← the painted row: rails, chevron, start, label + description, end
    ul[role=group]                  ← Collapsible.Panel, only while open
      li[role=treeitem] …
```

- **The `<li>` is the treeitem and holds the tab stop.** Exactly one row has `tabindex="0"`; the
  rest are `-1`. Which one is *derived every render* — the focused row if it is still visible,
  else the selected row, else the first enabled row — rather than synced in state, because a
  controlled `expandedIds` change can hide the focused row, and a tree with no `tabindex="0"`
  anywhere cannot be entered from the keyboard.
- **`aria-labelledby` points at the label span.** So the row's name is its label and nothing else:
  not the chevron's "Toggle children", not a Badge's count in the end slot. The `WithEndContent`
  story asserts `getByRole('treeitem', { name: 'Inbox' })` for that reason. `aria-describedby`
  carries the description.
- **`aria-selected` is on the selected row only**, never `false` on the others. APG allows either;
  this keeps a tree with no selection free of the attribute entirely.
- **A closed parent's children are not in the DOM.** Base UI unmounts the panel, which is what the
  pattern wants — hidden rows are out of the accessibility tree, not merely invisible. It is also
  why `flattenVisible` computes the walk from *state*: the DOM is the thing it predicts, and during
  an exit transition the DOM briefly still holds rows that have already left the walk.
- **axe.** `nested-interactive` does not apply to `treeitem` (only to roles whose children are
  presentational), which is why the `<a>` and the chevron `<button>` inside it pass — and why
  Astryx's inner button does too. `aria-required-children`/`-parent` are satisfied by
  `tree > treeitem > group > treeitem`. Every story runs axe; `Playground` starts with two parents
  open so `role="group"` is exercised from the first story.

## Where focus lives, and where the ring is

**The ring cannot go on the focused element.** In a nested tree the `<li>` that holds focus also
holds the whole open subtree, so `focusRing` on it would ring a parent *and every child row inside
it*. `focusRingWithin` looks the wrong way (up, from a focused descendant to an ancestor), and
Tailwind's `group-focus-visible:` matches any `.group` ancestor, so a focused parent would ring every
descendant row too.

So the ring is painted on the row, keyed off its **parent's** focus: `focusRingFromParent` in
`src/lib/focus.ts`, the fourth ring in the library and the first drawn on an element that is never
focused itself. It is one arbitrary variant, `[:focus-visible>&]`, and `tokens.test.ts` reads the
token names out of it as it does the others. The `Keyboard` story proves the selector with a real
key press — a scripted `.focus()` never matches `:focus-visible`, so it has to be `userEvent.tab()`
— and asserts the ring is on the row and *not* on the `<li>`.

**Three things can take focus on a click, and the treeitem answers for all of them.** The `<li>` is
the natural target (a click on a non-focusable row focuses its nearest focusable ancestor), but the
`<a>` and the chevron `<button>` are click-focusable despite `tabindex="-1"`. Every activation and
toggle therefore calls `focusItem`, which re-parks focus on the `<li>`, and the root `onKeyDown`
resolves its row with `closest('[data-tree-id]')` rather than requiring the target *be* the `<li>` —
Calendar's `dataset.day` guard, loosened one step. Chrome sets `:focus-visible` false for a
pointer-initiated focus, so none of this paints a ring on click.

**Closing over the focused row moves focus up, not out.** Collapse a parent while focus is on one
of its descendants and the unmount would drop focus on `<body>`. `toggle` checks `isDescendant` and
focuses the parent first — but only when the tree actually holds focus, so a chevron clicked from
elsewhere does not pull focus in. The `Keyboard` story covers it.

## Click targets

- **A row with an `href` is a real `<a>`**, so middle-click, cmd-click, "copy link" and the status
  bar all work. It is `tabindex="-1"`: the `<li>` is the stop, and Enter on it calls `.click()` on
  the row, which follows the href *and* runs `onClick`. `href` + `disabled` renders the `<div>` path
  with `aria-disabled` on the `<li>` — NavItem's `<span aria-disabled>` idea, one level up.
- **Astryx's inner `<button tabindex="-1">` for `onClick` leaves is dropped.** The treeitem is
  already the control and Enter/Space are handled at the root; a second one only announces "button"
  in browse mode for nothing.
- **The chevron is a `Collapsible.Trigger`**, out of the tab order, with `aria-label="Toggle
  children"` and Base UI's own `aria-expanded`. It stops propagation, so a toggle is never also an
  activation — clicking a chevron does not select the row or run its `onClick`. Clicking the row of
  a parent *does* toggle it as well as activating it.
- **Enter and Space share the pointer's path** via `rowEl.click()`. One code path, so the keyboard
  cannot drift from the mouse. A disabled row's `pointer-events: none` stops a real click but not a
  synthetic one, so `activate` guards `disabled` itself.

## Keyboard

| Key | Does |
|---|---|
| ↓ / ↑ | next / previous visible row; stops at the ends (APG trees do not wrap) |
| → | opens a closed parent; on an open one, steps to its first child |
| ← | closes an open parent; on anything else, steps to the parent |
| Home / End | first row / deepest last visible row |
| Enter / Space | activates — selects (if selection is on), runs `onClick`, follows `href`, toggles a parent |
| `*` | opens every closed, enabled parent at the same level, this row included |
| a letter | jumps to the next row whose label starts with it, wrapping; a miss is not swallowed |

All of the arithmetic is `navigation.ts` — `flattenVisible`, `nextId`/`prevId`, `firstChildId`,
`parentId`, `siblingsToExpand`, `typeahead`, `isDescendant` — pinned by `navigation.test.ts` in the
node project. Type-ahead reads label text from the DOM (`[data-tree-label]`) because labels are
`ReactNode`s; the module stays string-only.

## The animation, and the clip it needs

Each parent is a `Collapsible.Root` rendered as the `<li>`, with the `<ul role="group">` as its
`Panel`. SideNav.Group's panel classes: Base UI measures the panel and publishes
`--collapsible-panel-height`, the height transitions to it over `duration-fast ease-standard`, and
collapses to zero under `data-[starting-style]` / `data-[ending-style]`. The chevron turns 90° on
`duration-fast-min` — one `ChevronRight` rotated, Tailwind's `rotate` property, not `transform`.

**`overflow-clip` with a 4px `overflow-clip-margin`, not `overflow-hidden`.** The ring paints 2+2px
outside a row, and a plain `overflow-hidden` on the panel keeps clipping every child row's ring long
after the height has returned to `auto` — the class stays, and Base UI exposes no "mid-transition"
state to key it off. The clip margin lets the ring through on every side while still bounding the
collapsing content. Measured: `overflow: clip / overflow-clip-margin: 4px` on the open panel, and a
level-2 row's ring complete on all four sides in the screenshot. **SideNav.Group has the
`overflow-hidden` version of this today** and clips its child rows' rings; unrecorded there.

Two known edges, recorded rather than fixed: Safari does not implement `overflow-clip-margin`, so
there the ring is clipped at the panel edge exactly as SideNav's is; and a grandchild opening while
its parent's own 175ms transition is still running measures against the parent's stale pixel height
until that returns to `auto`.

## Fills decided against Figma, with sign-off

Two of the file's bindings were not followed, both settled with Nathan before the build:

- **Hover and selected are `surface-overlay-subtle`**, Table's translucent wash, not the
  `Surface/Background Subtle` the Selected and Focus variants bind. That token *is* the canvas —
  `neutral-100` light, `neutral-950` dark, the same as `--surface-canvas` — so a tree sitting on the
  page would have shown no hover and no selection at all, and a tree only ever works on a card. The
  wash darkens a light surface and lightens a dark one (measured: `oklab(0.268 … / 0.1)` light,
  `oklab(0.97 … / 0.1)` dark), so a hovered selected row still departs from a resting one — the
  row-fill ordering rule from Table.
- **The selected label stays `content-primary`.** The file bound both label and description to
  `Content/Subtle` on the Selected variants; Astryx keeps the text unchanged, and so does every other
  selected row here. Treated as a slip.

**Both are fixed in the file.** The three Selected variants' text is rebound to Content/Primary and
Content/Subtle as Default has them, and the Selected and Focus row fills to Surface/Overlay Subtle.
The Focus variant's fill is a stand-in for the wash a keyboard-focused row usually also has under the
pointer; in code, focus paints only the ring, per the house rule that a focused component is
pixel-identical to an unfocused one.

## Measured

Against the Figma export and again in the Browser pane on the `Playground` story, 280 wide:

| | Figma | Rendered |
|---|---|---|
| row height, label only | 32 | 32 (`py-1` round a 24px line; nothing sets `h-`) |
| row height, with description | — (`Description` boolean) | 52 (4 + 24 + 20 + 4) |
| row padding | 0 / 8 / 0 / 0, gap 8, radius 8 | same |
| chevron x, level 1 / 2 / 3 | 8 / 24 / 40 | 8 / 24 / 40 |
| rail | 16 wide, 1px `Surface/Border` right edge, stretch | 16, `border-r border-surface-border`, `self-stretch` |
| guide line x, level 2 / 3 | 16 / 32 | 16 / 32 — under the centre of the parent's chevron |
| leaf | 16px `Chevron Spacer` | `size-4` span |
| disabled | `opacity/opacity-40` | `opacity-40 pointer-events-none` |

**The indent is 16 per level, and the top-level chevron sits at 8 — from one detail of the file.**
The `Rails` slot is 0.001px wide when empty and *still takes the row's 8px gap*, which is what puts
the level-1 chevron at x=8 with no left padding. The rails wrapper is therefore always rendered,
empty at level 1, rather than the row taking `pl-2`; and the rails are packed gap-less inside it
rather than being direct children of the `gap-2` row, which would have made the indent 24.

**`guides={false}` keeps the width.** Figma's `Guides=False` variant has the same rails with the line
hidden, so the indent is identical either way; the `Guides` story asserts a level-2 chevron lands at
24 in both trees.

## Traps

- **The Browser pane freezes the animation clock.** A panel closed by a click sits mounted at its
  full height forever there, which reads as "the panel never unmounts". It does — the `Keyboard`
  story asserts the closed subtree leaves the DOM in real Chromium. Measure open geometry on a story
  that starts open, and `finish()` animations before reading a transitioned color: the dark-mode
  wash read back as the light value until the `transition-colors` was finished.
- **`:focus-visible` needs a real key.** `element.focus()` from a play function never rings; the
  `Keyboard` story uses `userEvent.tab()` and `userEvent.keyboard`.
- **Ids are the caller's strings**, so the focus effect's selector goes through `CSS.escape` —
  Calendar's day keys never needed it.
- **`userEvent.click` throws on a `pointer-events: none` element.** The `Disabled` story drives the
  disabled row with `focus()` + Enter instead.
- **`StoryObj<typeof TreeList>`, not `typeof meta`.** The props are a union (three ways to be named),
  and `typeof meta` cannot narrow it per story — Nav's trap, ProgressBar's note.

## Stories

`Playground` (open from the start, so axe sees `role="group"`), `Guides`, `WithIcons`,
`WithDescriptions`, `WithEndContent`, `Selected`, `Disabled`, `Links`, `Keyboard`, `Controlled`,
`InContext`. Each demo story asserts the claim in its name; `Selected` uses Table's 1px-canvas
composite to compare a translucent fill with an opaque one, and never a color-string regex.

## Best practices

Mirrored from the **Best practices** block on `↪ Tree List` (`40005193:41214`) in Figma. The two
are one text in two places — change one and change the other.

**Do**

- Name the tree: a header people can see, or an aria-label when the name is already on the page.
- Give every row an id that survives re-renders. Expansion, selection and focus are all keyed on it.
- Put an href on a row that goes somewhere and an onClick on one that does something. A link row is a real link, and Enter follows it.
- Start with the branches people need already open. A tree that opens fully closed is a list of folders.
- Keep the start slot to a 16px icon and the end slot to a Badge, so labels line up down the column.

**Don't**

- Do not use it for a flat list. With no children anywhere it is a list with a chevron column; use a plain list.
- Do not use it for site navigation. That is Side Navigation — a landmark with aria-current, not a widget with aria-selected.
- Do not nest past four levels. Each one costs 16px, and at 280 wide the labels run out of room.
- Do not put a button in a row's end slot. The row is already a control, and a second one inside it can only be reached with the pointer.
- Do not hide the guides to save space. The rails stay either way, so nothing gets narrower.
