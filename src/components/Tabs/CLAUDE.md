# Tabs

Switch between panels of related content. Mirrors Figma nodes `40002087:6609`
(Tab Item, `Size` × `Active` × `State`) and `40002087:6745` (Tabs, the strip and its bottom
rule). Composed API: `<Tabs>` + `<Tabs.List>` + `<Tabs.Tab>` + `<Tabs.Panel>`.
`size`: small | default | large — Button's 24 / 32 / 40 again, `px-3` at every size as in
SegmentedControl. `layout`: hug | fill (Astryx's, not in Figma — the same gap-in-the-file call
as SegmentedControl's). `startIcon` takes a `LucideIcon`; `endSlot` takes any node, because
Figma's "End Slot Items" frame usually holds a count Badge rather than an icon.
**Fifth Base UI component, and the first that is really navigation:** `role="tablist"` →
`role="tab"` → `role="tabpanel"`, `aria-selected`, the tab↔panel id wiring, roving tabindex and
arrow keys all come from Base UI. **Selection does not follow focus**, the deliberate opposite of
SegmentedControl: with panels attached, arrowing past a tab must not swap the content under you,
so Enter or Space activates. Home/End work here, unlike SegmentedControl.
**The indicator slides, in pure CSS.** `Tabs.Indicator` publishes `--active-tab-left` and
`--active-tab-width`, so one shared element transitions `translate` and `width` at
`duration-fast` + `ease-standard` — 175ms, which is what Astryx transitions its own indicator at.
Labels crossfade at `duration-fast-min`, as in SegmentedControl. Third component on the motion
tokens.
**The bold-weight trap.** Figma draws inactive labels at 400 and the active one at 600, so
selecting a tab widens it and shoves the rest of the strip sideways — under an indicator that is
mid-animation towards a target that keeps moving. The label is rendered twice, the visible copy
plus an `aria-hidden` semibold twin stacked in the same grid cell, so the cell is always as wide
as the bold text. Astryx does exactly this. `invisible`, not `hidden`: a `display: none` twin
reserves nothing. **Tab width unchanged between selected and unselected is the thing to check**
when this changes.
**Disabled hangs off `data-disabled`, not `:disabled`.** Base UI builds tabs with
`focusableWhenDisabled`, so a disabled tab keeps its place in the roving tabindex and is
announced — which means `aria-disabled="true"` and `data-disabled`, and never the native
attribute. SegmentedControl's `disabled:` classes work because its Radio takes the real one; the
same classes here fire on nothing, silently.
**The bottom rule cannot be the Divider component**, even though Figma draws it as one: `Divider`
renders `role="separator"`, and a `tablist` may only contain tabs — axe fails the story suite on
`aria-required-children`. It is an `after:` pseudo-element on the same `surface-border` token.
Nor can it be `border-b`: a border sits outside the padding box, making the strip 41px instead of
40 and leaving the 2px indicator hovering above the line rather than painting over it.
**The strip is 40px at `default`** — 4 (py-1) + 32 + 4, and the indicator hangs in that last 4px,
which is Figma's `bottom-[-4px]`. **40 / 32 / 48 are the numbers to check.**
Focus is the shared ring, which reaches 5px and so covers the strip's rule and the 4px below the
tab. The indicator is still visible through it: `Tabs.Indicator` is positioned and comes after the
tabs in the DOM, so it paints *over* their box-shadows — verified, not assumed.
Left out: `orientation="vertical"` (Base UI has it, Figma has no vertical variant, and it is
omitted from the props rather than left to break quietly); Astryx's `href` link tabs, which are a
`<nav>` of anchors and a different a11y contract; and its overflow `TabMenu` — `Menu` now
exists, so that is a composition waiting to be written rather than a blocker.
