# Chat — ChatMessage, ThoughtProcess, ToolCall, ChatComposer

A conversation, for a messaging app or an assistant: who said what and when, what the
assistant did on the way to saying it, and where the next thing is typed. Figma page
`↪ Chat` (`40004252:16298`), three sections: **Chat Message** (`40004252:16314`),
**Thinking & Toolcalls** (`40004252:16438`), **Chat Composer** (`40005214:43866`), and a
two-screen mock (`40005203:42342`) the `InContext` stories reproduce. Astryx's `Chat*` family
is the reference API; its names are used where the file and Astryx agree.
**One folder, four components, one `styles.ts`** — Nav's arrangement, because the four share
a direction context, two disclosure recipes and a story-only mark, and because a file that
exports components and constants breaks Fast Refresh. One stories file per component.
**No new Base UI subpath.** `ThoughtProcess` and `ToolCall` are the second and third things on
`Collapsible` after `SideNav.Group`; `ChatComposer` is the third on `Input` after Input and
TextArea. `vite.config.ts` is untouched.

## What the file draws, and what it became

| Figma | Code | |
|---|---|---|
| `Bubble` — Direction × Appearance × Size, 12 variants | `ChatMessage.Bubble` | three independent axes; direction arrives by context |
| `Bubble Group` | bubbles stacked in one `ChatMessage` at `gap-1` | not a component: nothing outside a message stacks bubbles |
| `Message` — Direction | `ChatMessage` | avatar slot, bubbles, metadata slot |
| `Message Metadata` / `_Message Status` | `ChatMessage.Metadata`, `ChatMessage.Status` | sent = status + time; received = actions + time |
| `Message Reactions` / `Message Reaction Item` | `ChatMessage.Reactions` | display-only, as drawn |
| `Agent Reply` | a composition, in `ChatMessage`'s `InContext` | `ThoughtProcess` + ghost bubble + actions + the mark |
| `Thought Process` — Process × Open | `ThoughtProcess` | `thinking` + an `icon` slot |
| `Toolcall` — Type × Open | `ToolCall` | collapsible derived from `detail` |
| `Chat Composer` — Size × Type | `ChatComposer` | `Type=Stop` derived from `streaming` |

Two of Figma's axes are **derived**, Button's icon-only rule: `Toolcall`'s `Type=Collapsable`
is "there is a `detail`", and `Chat Composer`'s `Type=Stop` is "a reply is `streaming`". A prop
that can contradict the children is a prop that will.

## ChatMessage

**`direction` is set once and travels by context.** A sent message reverses its row,
right-aligns its column, and every `Bubble` and `Metadata` inside reads the side off
`ChatMessageContext` — the tail lands on the sender's side and the row aligns with it without
being told. Each part still takes `direction` itself, for a bubble standing alone in a variants
grid.
**The tail is one corner.** `rounded-xl` on the box and `rounded-br-xs` / `rounded-bl-xs`
after it — in that order, because tailwind-merge keeps a corner utility that follows the
all-corners one and drops one that precedes it. Measured: 16 / 16 / 16 / 4, flipping with
direction.
**Default is `surface-background-subtle`, which is the canvas in both themes.** Figma binds it,
and it is right on the surface the mock draws — `surface-background-primary`, where it reads
stone-100 on white and neutral-950 on neutral-900 — and invisible on `surface-canvas`. So **a
chat log lives on `surface-background-primary`**, every bubble story wraps itself in one
(`onPrimarySurface`), and the Storybook decorator's canvas is why that wrapper exists. A
reaction pill is the same token with `shadow-low` as the only separator, kept as drawn and
said here rather than swapped for a border.
**The avatar sits beside the last bubble, not beside the timestamp.** Figma's `Offset` frame
pads the avatar `pb-7` — the 24px row plus the 4px gap — and here that padding is derived from
`metadata` being present. The wrapper is `flex`, not a plain block: an inline `Avatar` on a
line box carried the line's descender space under it and measured 6px low. Measured on the
last bubble's bottom edge since.
**Column width is `max-w-3/4`**, Astryx's cap at the nearest real fraction utility; a
long-form reply passes `className="max-w-full"`, which the mock does.
**The log is the caller's element, and it is `role="log"`.** A message cannot know whether it
is in a list, so it is an `<article>` — HTML's own example is a user-submitted comment — and the
container is the caller's `<div role="log" aria-label>`, which carries `aria-live="polite"` and
announces each message once. Not a `<ul>`: an orphan `<li>` fails axe. **`sender` is sr-only
text, not `aria-label`**, for two reasons — axe's `aria-prohibited-attr` rejects a label on a
bare element, and a live region reads *inserted text*, so a label on the article would be
silent when it mattered.
**`Metadata` shows `status` or `actions`, never both.** Figma's two directions each draw one,
and a message with both is not a shape the file has. The status word is the signal; the
glyph is `aria-hidden` and Failed's danger color is a second signal, not the only one.
`timestamp` becomes `<time dateTime>` when the ISO value is given. The actions row is wrapped
in `Tooltip.Provider` so the caller's four `Tooltip`s share a delay; Figma's buttons are ghost
`size="small"` at 30×24, which is Button's small with its border.
**Reactions are display-only.** Figma draws pills, not a picker, and anything that toggled
one would be invented. `<ul role="list" aria-label="Reactions">` — the role restated because
Safari drops list semantics from a `list-style: none` list. Plain text content: a screen
reader names an emoji itself, and `role="img"` would only add a name to author. Pinned to the
top corner opposite the tail, `-top-4` and `-left-2`/`-right-2`, pills overlapping by `-ml-1`;
measured at Figma's 16 up, 8 out, 4 overlap.
Figma's `overflow-clip` is not ported — the twelfth time — and here the reactions overlay
hangs outside the box on purpose.

## ThoughtProcess

**A single disclosure on `Collapsible`, not an `Accordion`.** Accordion's record says a
disclosure with no group round it is a different component; this is that component. The panel
is `SideNav.Group`'s line verbatim — `h-(--collapsible-panel-height)`, `overflow-clip` with a
4px margin so a focus ring inside is not sliced, `duration-fast ease-standard` — and the chevron
is Accordion's `group-data-[panel-open]:rotate-180`. Both recipes are shared with `ToolCall`
from `styles.ts`.
**Figma's two states are one prop and one slot.** `thinking` picks the default label —
"Thinking" while it is happening, "Thought summary" once it is not — and sets `aria-busy` on
the root. The Thinking row also leads with a 24px mark, which is the `icon` slot; the row's
left padding drops from 12 to 8 to hold it, and that is derived from the slot being filled
rather than from `thinking`, because it is the only thing the two rows differ in. **The mark
is the application's** — the file draws the Yet scribble, which is a brand, and `SideNav`
makes the same call with its `logo`. `story-mark.tsx` is the story-only SVG, `Nav/story-logo`'s
twin, with `stroke="currentColor"` so it follows `Content/Emphasized` through the theme. The
"thinking" animation Figma names on that node is therefore the application's too.
**The row is 24px and the panel is a `Card padding={3}`**, Figma's numbers; the 4px between
them is `pt-1` *inside* the panel, so the measured height includes it and nothing jumps.
**The hover wash goes past the file.** Figma draws the row as bare text; a row that opens
something is a button, and every quiet button here shows `action-ghost-background-hover`
under the pointer. Still owed to the file — see *Drawing it in Figma*.

## ToolCall

**Collapsible is derived from `detail`.** Figma's `Type=Collapsable` is a boolean about whether
there is a panel, so the panel's presence is the boolean. Without one the row is a plain
`<div>`; with one it is a Collapsible whose trigger is the row, chevron in the `Label` frame
at `gap-1`, and whose panel is `pl-6` — Figma's `Content`.
**Four statuses where the file draws one.** Figma's row carries a hollow `Circle`, which is
`pending`; `running` (`Loader`, spinning), `done` (`CircleCheck`) and `error` (`CircleX`, on
`content-danger`) went past it the way Menu's `destructive` did, and the file has caught up
— see *Drawing it in Figma*. The glyph carries the status
for a reader — `Icon`'s `label`, so `role="img"` — and the row's text does not have to repeat
it. **The spinner turns itself off under `prefers-reduced-motion`**: the global 1ms clamp
turns an infinite rotation into a jitter, not a rest — the hole Carousel's `scroll-behavior`
found, from the other side.
**No wash on this trigger.** It sits flush inside a Card with no padding to put one in, so
hover lifts the text to `content-primary` instead.

## ChatComposer

**Input's box, stacked.** `box({ size, ring: 'textarea' })` from `Input/styles.ts` is the
outer `<form>` — border, hover, `rounded-md`, the `has-[:disabled]` fade — turned from a
wrapping row into `flex-col items-stretch` and given Figma's `shadow-medium`
(`elevation/drop-shadow/medium`). The field is Base UI's `Input` with a `<textarea>` through
`render`, TextArea's arrangement and its reasons: attributes on the render element where
they are typed for a textarea, `id`/`name`/`disabled` through the primitive.
**`box` grew `ring: 'textarea'` for this.** The box holds a send button and a row of actions,
so `focusRingWithin` would ring it for every one of them; `has-[textarea:focus-visible]` scopes
it to the caret, NumberInput's reason at a different tag. The buttons carry their own ring.
Measured with real Tab presses: the form's `box-shadow` gains the 4px spread on the field
and loses it when focus moves to the send button, which gains it. One ring at a time.
**Enter sends, Shift+Enter breaks the line.** Astryx's contract. Enter with any other modifier,
or while an IME is composing, is left to the browser. `preventDefault` then
`form.requestSubmit()`, so the send button and the key go through one submit handler, which
ignores blank text, `streaming` and `disabled`. Base UI's `Field.Control` only treats Enter as
a commit on an `<input>` tag, so nothing fights this.
**The field is always controlled underneath.** The send button needs to know whether there is
anything to send, so the uncontrolled value is mirrored in state (TextArea's counter
arrangement) — and unlike TextArea the primitive is handed `currentValue` rather than
`defaultValue`, so that sending can clear it. A controlled caller clears its own.
**The send button is `aria-disabled`, never `disabled`.** `box` fades and freezes on *any*
`:disabled` descendant, so a natively disabled send button greyed the whole composer every
time the field was empty. `aria-disabled` plus `pointer-events-none` keeps it in the tab order,
which is also the shape WAI-ARIA prefers for "not yet". The same rule reaches anything a
caller puts in `actions`: a disabled Button there disables the composer.
**Figma's `Type` is derived from `streaming`.** While a reply arrives the primary send button
becomes a secondary `Square` stop button wired to `onStop`, and Enter is held back.
**The arithmetic.** Figma draws 96 / 72 with the stroke inside the frame, so the content is
the outer height minus two borders, Input's rule, and the row against each border gives up a
pixel:

    default  (8-1) + 24 + 8 = 39   +  12 + 32 + (12-1) = 55   + 2 = 96
    small    (4-1) + 24 + 4 = 31   +   8 + 24 + (8-1) = 39   + 2 = 72

`pt-1.75 pb-2` / `pt-0.75 pb-1` on the field, `px-3 pt-3 pb-2.75` / `px-3 pt-2 pb-1.75` on the
action row — real quarter-steps of the 4px scale, as TextArea's are. **Both sizes are 14/24**:
Figma binds `text/base/line-height` on the placeholder in all four variants, so the small
composer tightens its chrome and keeps its type, unlike Input's small, which drops to 12/20.
`Sizes` asserts both heights and both button heights.
**It grows.** `field-sizing-content` takes the field from one line to a `max-h-52` cap (eight
lines) and then `overflow-y-auto`. TextArea's record parked this as "one utility class the day a
design wants it"; a composer is that design, and its record now points here. Chromium and
Safari have it; Firefox keeps to `rows` and a scrollbar. `Grows` measures the growth and the
cap in Chromium.
**Not here, on purpose.** Astryx's `drawer` (attachments), `headerActions`, `headerContext`
(context-window usage) and `status` messages — none are drawn, and the two slots that are
(`actions` at the start of the row, `endActions` before the send button) cover the mock. A
`Kbd` "⏎" hint: not drawn either; the contract lives here and in the story text.

## Stories

Every geometry claim above is a play-function measurement, TextArea's idiom. Decorators are
story-level (`onPrimarySurface`, `atFigmaWidth`) rather than on the meta, because Storybook
*adds* a story's decorators to the meta's — the `InContext` shells shipped 700px wide inside a
white card until that was understood. Both disclosures have a story that starts open, so
axe sees the panel.

## Drawing it in Figma

**The page was `(In Progress)` on the Docs side and is filled now**, in the same sitting: the
header description, the Preview's Light and Dark frames, and the Best practices block. The
Preview holds the file's own `Chat` composition (`40005242:44860`, a sent `Message` over an
`Agent Reply`) with a `Chat Composer` under it — and **it had to go on a card**. The Docs
preview frames are the canvas color, so the sent bubble vanished in the first render, exactly
as the rule above says; the column is a `Surface/Background Primary` frame with
`Surface/Border`, `spacing/6` padding and `border-radius/rounded-lg`, and the Dark copy is a
clone, re-resolving its tokens through the frame's own mode.
**`Toolcall` gained a `Status` axis** (`Pending | Running | Done | Error`, `40005215:44005`),
the Menu-`destructive` route: the three drawn variants were renamed `Status=Pending` and each
cloned three times with the nested lucide instance swapped — `loader`, `circle-check`,
`circle-x` — and the Error trio's glyph stroke and label fill rebound to `Content/Danger`. All
twelve read back by glyph name and variable id, not by screenshot. The `Message Reactions`
set was left as drawn.
**Still owed:** `ThoughtProcess`'s hover wash, which the file draws as bare text; a `State`
axis on `Thought Process` is the shape it would take.

## Best practices

Mirrored from the **Best practices** block on `↪ Chat` (`40004252:16306`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Put a chat log on `surface-background-primary`. The default bubble is the canvas color and disappears anywhere else.
- Set `direction` on the message and let the bubbles and the row follow. One place decides which side a turn is on.
- Stack a sender's consecutive bubbles in one message, with one metadata row under the last of them.
- Wrap the messages in `role="log"` with a name, and give each message a `sender`. That is what a screen reader hears arrive.
- Reach for a ghost bubble for a long assistant reply. It keeps the text column and drops the box.
- Give the composer an `aria-label`. There is no Field here to name it, and a placeholder is not a name.
- Let `streaming` swap the send button for stop. There is no `type` to set, and Enter is held back for you.

**Don't**

- Do not put both a delivery status and an actions row under one message. A sent message reports; a received one offers.
- Do not natively `disable` a button inside the composer. The box fades on any disabled descendant; use `aria-disabled` as the send button does.
- Do not build a reaction picker on the pills. They report what was said back; picking is a different component.
- Do not ship the Yet mark from a component. It comes in through `avatar` and `icon` slots because it is the application's.
- Do not make a tool call collapsible with a prop. Give it a `detail` and it opens; without one there is nothing to open.
