# AlertDialog

A dialog that asks you to confirm something you cannot undo. It shipped with **no Figma node at
all** — BentoGrid's situation rather than Accordion's, a whole component with no drawing behind it,
built because Astryx documents it as its own component and Base UI ships the primitive. The file has
since caught up: `↪ Alert Dialog` (`40004405:463`) with the component at `40004406:491`.

## The sharing rule at its strongest so far

The library's rule is *"when Base UI hands over the same component object, share it rather than copy
it — and ask the question per part, not per component."* Here the answer is "share" for every part
but one, and the evidence is one file:
`node_modules/@base-ui/react/alert-dialog/index.parts.mjs`.

`Backdrop`, `Close`, `Description`, `Popup`, `Portal`, `Title` and `Viewport` are re-exported
straight out of `../dialog/`. **`Trigger` is not even re-exported — it is
`export const AlertDialogTrigger = DialogTrigger`, the identical binding.** Only `Root` is its own,
and even that is `useRenderDialogRoot('alert-dialog', props)`: the same hook as Dialog's Root with
one string changed.

So this file re-attaches **the library's own `Dialog` wrappers**, not the raw Base UI parts.
`Dialog.Popup` renders `dialog`'s Portal, Backdrop, Viewport and Popup — the very objects
`alert-dialog` hands out — and they read their state from the Root context this Root provides. The
recipes in `Dialog/styles.ts` are reached through that, so there is no second import of them here
and nothing to keep in step.

That is a step past ContextMenu, which re-attached Menu's *items* but wrote its own Popup. Here even
the Popup is shared, because the primitive underneath is the same one. The progression is worth
keeping: ContextMenu shares rows, Autocomplete shares a popup and a field from two different
components, and this shares everything but a Root.

## What the Root changes, and it is all it changes

Reading `dialog/root/useRenderDialogRoot.mjs`: `modal` is forced to `true`,
`disablePointerDismissal` to `true`, and `role` to `alertdialog`. Nothing else differs.

**Escape still closes**, and that is correct rather than an oversight — Astryx says so explicitly
("Escape cancels") and the WAI-ARIA Alert Dialog pattern requires a way out. Note the asymmetry with
Dialog's `Required` story, which *does* refuse Escape: a required dialog and an alert dialog are
different things, and only the first one traps you.

**Do not pass `modal={false}`.** The Root ignores it. That is Base UI being right rather than Base
UI being surprising, but it will look like a bug to whoever tries it.

## Anatomy, and the two rules that live at the call site

Astryx's anatomy is Title (the question), Description (the consequence), Cancel, Action and
Backdrop — every one of them required. There is deliberately **no `×`**. `AlertDialog.Close` exists
because Cancel *is* a Close with `render`, but a bare `<AlertDialog.Close />` would paint the ghost
`×` and is the one shape not to reach for here: an alert dialog is answered by its actions, not
dismissed past.

Two of Astryx's rules are composition rather than props, for the reason Popover's record gives for
not building `Header`:

- **Cancel takes initial focus**, so the least destructive option is what a Return key on arrival
  presses. Pass a ref to `initialFocus` on the popup. The `Destructive` story asserts this rather
  than describing it.
- **Below 640px the destructive action goes above Cancel and both fill the width.** That is
  `flex-col-reverse` on the footer with `sm:flex-row sm:justify-end`. The reverse is doing real
  work: it puts Delete on top visually while leaving Cancel first in the DOM, so the tab order still
  reaches the safe option first.

## Story traps

The same two as Dialog's, and they apply for the same reasons: no `defaultOpen` (a modal alert
dialog would make a docs page inert), and `waitFor` around the visibility assertion because
`findByRole` resolves on the frame `data-starting-style` is still applied. See
`src/components/Dialog/CLAUDE.md` for the measurements behind both.

The `Destructive` play function asserts the whole of the ARIA pattern rather than just that it
opened: `role="alertdialog"`, the name from the Title, the **description** from the Description, and
focus on Cancel. The description is the half of the pattern that is easy to leave out, because a
dialog missing it still looks and behaves fine.

## How Figma models it, and where that disagrees with the code

The file now has an `Alert Dialog` component, and it is a **sibling of Dialog rather than a reuse of
it** — which is the opposite of what this file's code does, so the disagreement is worth stating
rather than smoothing over.

The code shares Dialog's parts because Base UI hands over the same objects. Figma cannot express
"the same parts under a different root", so on the canvas this is its own component drawn like
Dialog. What makes that honest rather than a duplication is the two things it *removes*:

- **No close button.** An alert dialog is answered by its actions, not dismissed past.
- **No `Content` slot.** Its anatomy is fixed — a question, a consequence, and two buttons — so the
  actions are baked into the component rather than composed at the call site.

That second one was forced by the API and then turned out to be right. `figma.createSlot` does not
exist, and detaching an instance turns a `SLOT` into a plain `FRAME`, so a slot could not have been
made programmatically. But an alert dialog holding arbitrary content is not a shape anybody wants,
which is exactly the distinction from Dialog. Properties are `Title Text` and `Description Text`.

**The button labels are not component properties**, and that is a limitation rather than a choice:
`componentPropertyReferences` accepts only `characters`, `visible` and `mainComponent`, so a nested
instance's `Label Text` cannot be bound to an outer property. Two such properties were added and
then deleted — a property that is wired to nothing is worse than no property. Set the labels on the
Button instances inside, which is ordinary Figma practice.

The responsive footer — destructive above Cancel below 640px — is **not drawn**. It is one component
per breakpoint in Figma and one `flex-col-reverse sm:flex-row` in code, so the canvas carries the
desktop shape and the record carries the rest.
