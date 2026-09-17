import { tv, type VariantProps } from 'tailwind-variants'
import {
  CheckCheck,
  Circle,
  CircleCheck,
  CircleX,
  Loader,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react'

import { focusRing } from '../../lib/focus'

/**
 * The recipes behind the chat family — `ChatMessage` and its parts,
 * `ThoughtProcess`, `ToolCall` and `ChatComposer`.
 *
 * One folder, four components, one `styles.ts`: Nav's arrangement. They live
 * here rather than beside each component because the folder exports both
 * components and constants, and a file doing both breaks React Fast Refresh —
 * the reason `Input`, `Avatar` and `Menu` each have one of these.
 *
 * Figma page `↪ Chat` (`40004252:16298`), sections **Chat Message**
 * (`40004252:16314`), **Thinking & Toolcalls** (`40004252:16438`) and **Chat
 * Composer** (`40005214:43866`).
 */

/** Who a message is from, which decides which side it sits on. Figma's `Direction`. */
export type ChatDirection = 'sent' | 'received'

/**
 * A message: an optional avatar beside a column of bubbles with a metadata row
 * under them. Figma `Message` (`40005211:43865`, `Direction` Sent | Received).
 *
 * The avatar wrapper's `pb-7` is Figma's `Offset` frame — 24px of metadata row
 * plus the 4px gap — so the avatar lines up with the last bubble rather than
 * with the timestamp. It is derived from `metadata` being present, not
 * declared: without a row there is nothing to offset from.
 */
export const message = tv({
  slots: {
    root: 'flex items-end gap-2',
    // `flex` so an inline avatar is a flex item rather than sitting on a line
    // box, which would add the line's descender space under it.
    avatar: 'flex shrink-0 self-end',
    column: 'flex min-w-0 flex-col gap-1',
  },
  variants: {
    direction: {
      sent: { root: 'flex-row-reverse', column: 'items-end' },
      received: { column: 'items-start' },
    },
    /**
     * How wide the column may go. `hug` is Astryx's cap on a message —
     * 80% / 280px there, three quarters here, the nearest real fraction
     * utility — so a short message stays a bubble and a long one leaves room
     * to see which side it is on. `fill` takes the whole column: Figma's
     * `Agent Reply` draws its Bubble Group at fill, because a long-form
     * assistant reply reads as page text and wants the page's measure.
     * Carousel's words for the same choice.
     */
    layout: {
      hug: { column: 'max-w-3/4' },
      fill: { column: 'w-full' },
    },
    hasMetadata: {
      true: { avatar: 'pb-7' },
      false: {},
    },
  },
  defaultVariants: { direction: 'received', layout: 'hug', hasMetadata: false },
})

type MessageVariants = VariantProps<typeof message>
/** How wide a message's column may go: a capped bubble, or the whole column. */
export type ChatMessageLayout = NonNullable<MessageVariants['layout']>

/**
 * The bubble. Figma `Bubble` (`40004252:16398`): `Direction` × `Appearance`
 * Default | Emphasized | Ghost × `Size` Default | Small — twelve variants,
 * which come apart into three independent axes here.
 *
 * Three corners are `rounded-xl` and the fourth, at the bottom on the sender's
 * side, is `rounded-xs` — the tail. `rounded-br-xs` sits *after* `rounded-xl`
 * so tailwind-merge keeps both; the other way round the corner would be lost.
 *
 * **Default is `surface-background-subtle`, which is the canvas in both
 * themes.** A default bubble on `surface-canvas` is invisible; a chat log sits
 * on `surface-background-primary`, where it reads as stone-100 on white and
 * neutral-950 on neutral-900. Emphasized is the inverse pair.
 *
 * Figma's `overflow-clip` is not ported — the twelfth time — and here the
 * reactions overlay hangs outside the box on purpose.
 */
export const bubble = tv({
  base: [
    'relative max-w-full rounded-xl',
    'font-sans text-content-primary',
    // Real messages wrap, and a pasted URL must not push the column wider.
    // `pre-wrap` keeps the newlines a person typed with Shift+Enter.
    'wrap-break-word whitespace-pre-wrap',
  ],
  variants: {
    appearance: {
      default: 'bg-surface-background-subtle',
      emphasized: 'bg-surface-background-emphasized text-content-inverse',
      // Padding kept, so ghost text lines up with a filled bubble's — the
      // long-form assistant reply, Astryx's use for it.
      ghost: 'bg-transparent',
    },
    size: {
      default: 'px-3 py-2 text-base', // 8 + 24 + 8 = 40
      small: 'px-2 py-1 text-sm', // 4 + 20 + 4 = 28
    },
    direction: {
      sent: 'rounded-br-xs',
      received: 'rounded-bl-xs',
    },
  },
  defaultVariants: { appearance: 'default', size: 'default', direction: 'received' },
})

type BubbleVariants = VariantProps<typeof bubble>
/** Figma's `Appearance`. */
export type ChatBubbleAppearance = NonNullable<BubbleVariants['appearance']>
/** Figma's `Size`: Default 40 · Small 28, at one line of text. */
export type ChatBubbleSize = NonNullable<BubbleVariants['size']>

/**
 * The reactions overlay. Figma `Message Reactions` (`40005245:45130`) holding
 * `Message Reaction Item`s (`40005245:45122`): 24px pills overlapping by 4px,
 * pinned to the bubble's top corner opposite the tail, 8px out and 16px up.
 */
export const reactions = tv({
  base: 'absolute -top-4 m-0 flex list-none p-0',
  variants: {
    direction: {
      sent: '-left-2',
      received: '-right-2',
    },
  },
  defaultVariants: { direction: 'received' },
})

/**
 * One reaction pill. Figma draws it as the bubble's own `surface-background-
 * subtle` with `shadow-low` as the only thing separating the two — kept, and
 * said out loud in the record. `-ml-1` is Figma's -4px overlap.
 */
export const reactionPill = tv({
  base: [
    'flex h-6 min-w-6 items-center justify-center gap-1 rounded-full px-1.5',
    'bg-surface-background-subtle text-sm text-content-primary shadow-low',
    '-ml-1 first:ml-0',
  ],
})

/**
 * The row under the bubbles. Figma `Message Metadata` (`40004252:16599`):
 * `min-h-6`, `px-3` so the text lines up with the bubble's, `gap-2` between
 * the status or actions and the timestamp. Sent rows are right-aligned.
 */
export const metadata = tv({
  base: 'flex min-h-6 items-center gap-2 px-3 font-sans text-sm text-content-subtle',
  variants: {
    direction: {
      sent: 'justify-end',
      received: '',
    },
  },
  defaultVariants: { direction: 'received' },
})

/** Whether a sent message arrived. Figma `_Message Status` (`40004252:16507`). */
export type ChatDeliveryStatus = 'delivered' | 'read' | 'failed'

/** The status chip: a 12px glyph and a word. Failed is the one that changes color. */
export const status = tv({
  base: 'inline-flex items-center gap-1',
  variants: {
    status: {
      delivered: '',
      read: '',
      failed: 'text-content-danger',
    },
  },
})

/** Figma's three glyphs, read off the variants: send, check-check, x. */
export const DELIVERY_ICON: Record<ChatDeliveryStatus, LucideIcon> = {
  delivered: Send,
  read: CheckCheck,
  failed: X,
}

/** The words Figma draws beside them. */
export const DELIVERY_LABEL: Record<ChatDeliveryStatus, string> = {
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
}

/**
 * The disclosure row of a `ThoughtProcess`. Figma `Thought Process`
 * (`40005214:43979`): a 24px row of `text-base` on `content-subtle`, `gap-1`,
 * chevron last. Its two states differ in one thing — the Thinking row leads
 * with a 24px mark and pulls its left padding in to 8 to hold it — so the
 * padding is a variant keyed off whether there is a leading element.
 *
 * The hover wash goes past Figma, which draws the row as bare text. A row that
 * opens something is a button, and a button wants an affordance under the
 * pointer; `action-ghost-background-hover` is what every other quiet button
 * here uses.
 */
export const disclosureTrigger = tv({
  base: [
    'group inline-flex min-h-6 items-center gap-1 rounded-md',
    'font-sans text-base text-content-subtle',
    'cursor-pointer transition-colors duration-fast-min ease-standard',
    'hover:bg-action-ghost-background-hover',
    ...focusRing,
  ],
  variants: {
    leading: {
      true: 'pl-2 pr-3',
      false: 'px-3',
    },
  },
  defaultVariants: { leading: false },
})

/**
 * What the Thinking row says while it waits, in turn. The row is on screen
 * with nothing else moving, so it is the one place the system gets to speak
 * in its own voice — and each line is a rule from the records, said the way
 * the records say it. Astryx's composer has one phrase; this rotates.
 * Override with `phrases`, or pin one with `label`.
 */
export const THINKING_PHRASES = [
  'Thinking',
  'Reading the record',
  'Checking the tokens',
  'Measuring, not assuming',
  'Asking Figma',
  'Minding the four-pixel grid',
  'Deriving, not declaring',
  'Yet another pass',
] as const

/**
 * How long each phrase stays, in milliseconds. A reading cadence rather
 * than a transition, which is why it is not one of the motion tokens — the
 * longest of those is 1300ms and a line of five words wants longer than
 * that. The crossfade between phrases *is* on the tokens: `animate-fade-in`,
 * `duration-fast` on `ease-standard`.
 */
export const THINKING_PHRASE_INTERVAL = 2400

/**
 * The panel under a disclosure — `SideNav.Group`'s line, verbatim. Base UI
 * measures the panel and publishes `--collapsible-panel-height`; this
 * transitions to it and collapses to zero for the frame before opening and
 * before closing. `overflow-clip` with a 4px margin rather than `overflow-
 * hidden`, so a focus ring on the first row inside is not sliced off.
 */
export const disclosurePanel =
  'h-(--collapsible-panel-height) overflow-clip [overflow-clip-margin:--spacing(1)] transition-[height] duration-fast ease-standard data-[ending-style]:h-0 data-[starting-style]:h-0'

/**
 * The chevron on a disclosure — Accordion's line. Figma swaps chevron-down for
 * chevron-up; a 180° turn is the same two pictures with a transition between
 * them, timed with the panel so they finish together.
 */
export const disclosureChevron =
  'transition-transform duration-fast ease-standard group-data-[panel-open]:rotate-180'

/**
 * Where a tool call is. Figma `Toolcall` (`40005215:44005`) draws one state, a
 * hollow circle; the other three go past the file and are owed to it.
 */
export type ToolCallStatus = 'pending' | 'running' | 'done' | 'error'

/** The tool call row: a 16px status glyph, `gap-2`, and the label. */
export const toolCall = tv({
  base: 'flex min-h-6 items-center gap-2 font-sans text-base text-content-subtle',
  variants: {
    status: {
      pending: '',
      running: '',
      done: '',
      error: 'text-content-danger',
    },
  },
  defaultVariants: { status: 'pending' },
})

/**
 * The same row when it opens a detail. No padding to put a wash in — the row
 * sits flush inside a Card — so hover lifts the text to `content-primary`
 * instead, and the ring is the ordinary one.
 */
export const toolCallTrigger = [
  'group cursor-pointer rounded-xs text-left',
  'transition-colors duration-fast-min ease-standard hover:text-content-primary',
  ...focusRing,
]

export const TOOL_CALL_ICON: Record<ToolCallStatus, LucideIcon> = {
  pending: Circle,
  running: Loader,
  done: CircleCheck,
  error: CircleX,
}

/** What the glyph is called out loud — the label text does not say it. */
export const TOOL_CALL_LABEL: Record<ToolCallStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  done: 'Done',
  error: 'Failed',
}

/** Figma `Chat Composer`'s `Size`: Default 96 · Small 72, at one line. */
export type ChatComposerSize = 'default' | 'small'

/**
 * The composer's `<textarea>`. Its own recipe rather than `TextArea`'s: that
 * one's `py-*` and a `pt-*`/`pb-*` pair are a tailwind-merge order question,
 * and the composer is one line of padding.
 *
 * ## The arithmetic
 *
 * Figma draws the group at 96 / 72 with the stroke inside the frame, so the
 * content is the outer height minus two borders — Input's rule. The text row
 * is `py-2` / `py-1` around a 24px line in the file, and the row above the
 * border gets the token minus one:
 *
 *     default  (8-1) + 24 + 8 = 39   +  12 + 32 + (12-1) = 55   + 2 = 96
 *     small    (4-1) + 24 + 4 = 31   +   8 + 24 + (8-1) = 39   + 2 = 72
 *
 * **Both sizes are 14/24.** Figma binds `text/base/line-height` on the
 * placeholder in all four variants; the small composer keeps the reading size
 * and only tightens its chrome, unlike Input's small, which drops to 12/20.
 *
 * `field-sizing-content` grows the field with what is typed, to a cap of eight
 * lines (`max-h-52` is 208 = 7 + 8×24 + 8 − 7, near enough) and then scrolls.
 * Chromium and Safari have it; Firefox falls back to `rows` and a scrollbar.
 */
export const composerTextarea = tv({
  base: [
    'w-full min-w-0 resize-none bg-transparent px-3 outline-none',
    'font-sans text-content-primary',
    // Figma sets the placeholder in `text-base/italic regular` — Input's rule.
    'placeholder:text-content-subtle placeholder:italic',
    'disabled:cursor-not-allowed',
    'field-sizing-content max-h-52 overflow-y-auto',
  ],
  variants: {
    size: {
      default: 'pt-1.75 pb-2 text-base',
      small: 'pt-0.75 pb-1 text-base',
    },
  },
  defaultVariants: { size: 'default' },
})

/**
 * The action row under the text. Figma's `End Slot Content`: `p-3` at default
 * holding 32px buttons, `px-3 py-2` at small holding 24px ones; the bottom
 * padding gives up a pixel to the border, as the text row's top does.
 */
export const composerActions = tv({
  base: 'flex items-center gap-2',
  variants: {
    size: {
      default: 'px-3 pt-3 pb-2.75',
      small: 'px-3 pt-2 pb-1.75',
    },
  },
  defaultVariants: { size: 'default' },
})
