# Toast

A brief notification that confirms something happened and then leaves. Mirrors Figma
node `40004135:15969`: `Type` default | success | danger, plus the Description / Has Action /
Is Dismissable booleans, which become slots as Banner's do. Banner's transient twin, and the two
should be described against each other: a banner stays, a toast interrupts and goes.
**Default is the Decorative/Neutral ramp, not `feedback-info`.** A toast that only confirms
something is neutral; the file says so, and Astryx agrees (it has just info and error). Success
and danger are Banner's `feedback-*` pairs, so again no `dark:` class anywhere.
**No icon rail** — Banner centers a glyph in a 16px column, Toast's text starts flush against the
16px padding. A real difference between the two, not an omission. **72 / 48 are the numbers to
check** (title + description, and title only). Figma draws the dismiss button 28×24 (`px-2` round
a 12px glyph); `Button` makes an icon-only small button a 24px square and the code is right —
Figma is the one that drifts. `overflow-clip` not ported, for the third time.
**The first component that is not just a rendered element.** It is created imperatively, queues,
dismisses on a timer, pauses that timer while you look at it, and animates in a portal. Sixth
Base UI component. API follows Astryx's split: `Toast.Provider` + `Toast.Viewport` +
`Toast.useToast()` for real use, and a plain `<Toast>` that draws the card inline "for previews
and documentation" — which *is* the Figma component, and is what makes the variant story a static
grid like Banner's. `Toast.Viewport` takes no children, deliberately unlike Base UI's docs, which
have every app hand-assemble Root/Content/Title/Description/Close. Raw parts attached as usual.
**Unlike Tooltip there is no ARIA to patch** — verified in `node_modules`, not assumed. The
viewport is a `role="region"` `aria-live="polite"` landmark named "Notifications", reachable with
F6, and it pauses every timer while hovered or focused; each root is a non-modal `role="dialog"`
named by its title. That is why `title` is required and only `description` is a slot.
**The stack is CSS.** Base UI publishes `--toast-index`, `--toast-offset-y`, `--toast-height` and
`--toast-frontmost-height`; collapsed, cards peek 12px and shrink 5% each (capped at three deep)
and all clamp to the frontmost height, and `Toast.Content[data-behind]` fades the buried text out.
`duration-medium-min` + `ease-standard` for the move, `duration-fast` for the fade. Fourth
component on the motion tokens, and more evidence for the rule above: check what the headless
primitive already measures before reaching for JavaScript.
**One authoritative `[transform:…]`,** fed by `--stack-y` / `--stack-scale`, because the swipe
offset has to compose into the same transform as the stack offset. `data-[expanded]:` sets only
those two properties (0,2,0) so it beats the base rule (0,1,0); entry and exit replace `transform`
outright at 0,2,0; the swipe-direction exits stack a third attribute to 0,3,0. Nothing depends on
the order Tailwind emits.
`position` bottom-right | bottom-center | top-right | top-center is ours, not Figma's — the file
draws a card, never a viewport — and the corner, the growth direction, the entry/exit direction
and `swipeDirection` all derive from it rather than being separate knobs. The `after:` strip on
each toast bridges the 8px gap between expanded cards: `mouseleave` does not fire over a
descendant, but the gap belongs to neither card, so without it the stack collapses as you move
down it.
**Two a11y traps, both about `aria-hidden` on something focusable, and neither caught by the
story suite** — a11y runs on first render, when the stack is empty. Found by running axe against
a live stack in the browser; do that for any component whose interesting state is not its initial
one. (1) Base UI puts `aria-hidden` on `Toast.Close` while the stack is collapsed but leaves it
tabbable, so the tabindex is kept in lockstep via `Toast.Content`'s render callback. (2) A
`priority: 'high'` toast is aria-hidden until the viewport is focused; the root's tabindex is read
back off its own resolved `aria-hidden` so it cannot drift, but an action button *inside* the
hidden subtree is still focusable and axe flags that too. Which is why **danger gets `timeout: 0`
but not `priority: 'high'`** — a toast that never leaves does not need to interrupt, and the
viewport's polite live region announces it anyway.
**`optimizeDeps` again.** `@base-ui/react/toast` had to be named in `vite.config.ts`: it was the
first Base UI subpath no story imported at module scope, so the optimizer discovered it mid-run,
re-bundled, reloaded the page under the test, and all eight Toast stories failed with "Failed to
fetch dynamically imported module". Name any new Base UI subpath there.
Left out of Astryx: `collisionBehavior: 'ignore'` (Base UI's ids always overwrite),
`onHide(reason)`, and anchored toasts — `Toast.Positioner` and `Toast.Arrow` are attached but the
managed viewport does not use them, and anchored toasts want their own provider.
