import { useEffect, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Card } from '../Card'
import { Icon } from '../Icon'
import { formatElapsed } from './elapsed'
import {
  disclosureChevron,
  disclosurePanel,
  disclosureTrigger,
  THINKING_PHRASE_INTERVAL,
  THINKING_PHRASES,
} from './styles'

/**
 * ThoughtProcess — what an assistant did before it answered, folded away.
 *
 * Mirrors the Figma component set "Thought Process" (`40005214:43979`):
 * `Process` Thinking | Thought × `Open` True | False. A quiet row above an
 * assistant's reply that opens onto a `Card` of `ToolCall`s.
 *
 *     <ThoughtProcess thinking icon={<Mark />}>
 *       <ToolCall status="running">Reading the file</ToolCall>
 *     </ThoughtProcess>
 *
 *     <ThoughtProcess label="Checked three components">
 *       <ToolCall status="done">Read Button.tsx</ToolCall>
 *     </ThoughtProcess>
 *
 * **A single disclosure, on Base UI's `Collapsible`.** Not `Accordion` — its
 * record says a disclosure with no group round it is a different component,
 * and this is that component. It is the second thing on `Collapsible` after
 * `SideNav.Group`, and the panel line is that one's, verbatim: Base UI
 * measures the panel into `--collapsible-panel-height` and the height
 * transitions to it.
 *
 * **Figma's two states are one prop and one slot.** `thinking` picks the
 * default label — "Thinking" while it is happening, "Thought summary" once it
 * is not — and sets `aria-busy`. While it thinks a timer counts up on the
 * left of the phrase, one tick a second from `elapsed`; it sits *before* the
 * phrase so the phrase's changing length never moves it. **While it thinks, the label rotates**
 * through `phrases` every 2.4 seconds, each one fading in on the motion
 * tokens. The default set is the system speaking in its own voice — "Reading
 * the record", "Measuring, not assuming", "Yet another pass" — because the
 * row is on screen with nothing else happening, and that is the moment a
 * brand gets. Pass `phrases` for an app's own lines, or `label` to pin one.
 * A screen reader is not told about each swap: the row is already `aria-busy`,
 * and eight announcements a reply would be noise. The Thinking row also leads with a 24px mark,
 * which is the `icon` slot; the row's left padding tightens to 8px to hold
 * it, and that is derived from the slot being filled rather than from
 * `thinking`, because it is the only thing the two rows actually differ in.
 * The mark itself is the application's — the file draws the Yet scribble,
 * which is a brand, and `SideNav` makes the same call with its `logo` slot.
 * So is its motion: the stories pass `<Mark animate />` here and a still
 * `<Mark />` everywhere else, and this component animates nothing itself.
 *
 * **What goes past the file.** The row has a hover wash; Figma draws bare
 * text, but a row that opens something is a button, and every quiet button
 * here shows `action-ghost-background-hover` under the pointer.
 */
export interface ThoughtProcessProps
  extends Omit<
    ComponentPropsWithRef<typeof CollapsiblePrimitive.Root>,
    'className' | 'render' | 'children'
  > {
  /** Whether it is still going. Picks the default label and marks the row busy. */
  thinking?: boolean
  /**
   * The row's text. Defaults to "Thought summary", or to the rotating
   * `phrases` while `thinking`. Set it to pin the row to one line.
   */
  label?: ReactNode
  /**
   * What the row says while `thinking`, in turn — one every 2.4 seconds,
   * looping. Defaults to the system's own lines. One entry stops the rotation.
   */
  phrases?: readonly string[]
  /**
   * Seconds already spent when the row mounts — for a reply that started
   * before this screen did. While `thinking` the row counts up from here on
   * its own, one tick a second; once it stops, the timer is not shown.
   */
  elapsed?: number
  /** A 24px mark leading the row — the assistant's, while it thinks. */
  icon?: ReactNode
  /** What was done: `ToolCall`s, or anything else, inside the panel's Card. */
  children: ReactNode
  /** Extra classes for the outermost element. */
  className?: string
}

export function ThoughtProcess({
  thinking = false,
  label,
  phrases = THINKING_PHRASES,
  elapsed = 0,
  icon,
  children,
  className,
  ...props
}: ThoughtProcessProps) {
  const rotating = thinking && label === undefined && phrases.length > 1
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!rotating) return
    const id = setInterval(() => setIndex((i) => (i + 1) % phrases.length), THINKING_PHRASE_INTERVAL)
    return () => clearInterval(id)
  }, [rotating, phrases.length])

  // The timer: the caller's starting point, then one tick a second for as
  // long as the row thinks. Restarting from `elapsed` when it changes is what
  // lets a caller re-seed it, and stopping when `thinking` drops is what
  // leaves the last count in place rather than resetting to zero.
  const [seconds, setSeconds] = useState(elapsed)
  useEffect(() => setSeconds(elapsed), [elapsed])
  useEffect(() => {
    if (!thinking) return
    const id = setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [thinking])

  const text = label ?? (thinking ? (phrases[index % phrases.length] ?? 'Thinking') : 'Thought summary')

  return (
    <CollapsiblePrimitive.Root
      className={cn('flex flex-col items-start', className)}
      aria-busy={thinking || undefined}
      {...props}
    >
      <CollapsiblePrimitive.Trigger className={disclosureTrigger({ leading: Boolean(icon) })}>
        {icon}
        {/* The timer sits before the phrase so the phrase, which changes
            length every few seconds, never moves it. Tabular figures and a
            floor of one spacing step under "59s" keep the phrase's own start
            still while the count climbs. */}
        {thinking && (
          <span className="min-w-6 text-left tabular-nums" data-testid="thought-process-timer">
            {formatElapsed(seconds)}
          </span>
        )}
        {/* Keyed on the text so each phrase mounts fresh and replays the
            fade-in; a pinned label never remounts. */}
        <span key={rotating ? String(text) : undefined} className={rotating ? 'animate-fade-in' : undefined}>
          {text}
        </span>
        <Icon icon={ChevronDown} className={disclosureChevron} />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Panel className={cn(disclosurePanel, 'w-full')}>
        {/* Figma's 4px between the row and the card. Inside the panel so the
            measured height includes it and nothing jumps when it opens. */}
        <div className="pt-1">
          <Card padding={3}>{children}</Card>
        </div>
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}

ThoughtProcess.displayName = 'ThoughtProcess'
