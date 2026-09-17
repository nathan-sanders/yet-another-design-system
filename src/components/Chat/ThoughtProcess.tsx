import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Card } from '../Card'
import { Icon } from '../Icon'
import { disclosureChevron, disclosurePanel, disclosureTrigger } from './styles'

/**
 * ThoughtProcess — what an assistant did before it answered, folded away.
 *
 * Mirrors the Figma component set "Thought Process" (`40005214:43979`):
 * `Process` Thinking | Thought × `Open` True | False. A quiet row above an
 * assistant's reply that opens onto a `Card` of `ToolCall`s.
 *
 *     <ThoughtProcess thinking elapsed="4s" icon={<Mark />}>
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
 * is not — and sets `aria-busy`. The Thinking row also leads with a 24px mark,
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
  /** The row's text. Defaults to "Thinking" or "Thought summary" by `thinking`. */
  label?: ReactNode
  /** How long it has taken, beside the label: "4s". */
  elapsed?: ReactNode
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
  elapsed,
  icon,
  children,
  className,
  ...props
}: ThoughtProcessProps) {
  return (
    <CollapsiblePrimitive.Root
      className={cn('flex flex-col items-start', className)}
      aria-busy={thinking || undefined}
      {...props}
    >
      <CollapsiblePrimitive.Trigger className={disclosureTrigger({ leading: Boolean(icon) })}>
        {icon}
        <span>{label ?? (thinking ? 'Thinking' : 'Thought summary')}</span>
        {elapsed !== undefined && <span>{elapsed}</span>}
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
