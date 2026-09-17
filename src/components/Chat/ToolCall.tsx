import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import {
  disclosureChevron,
  disclosurePanel,
  TOOL_CALL_ICON,
  TOOL_CALL_LABEL,
  toolCall,
  toolCallTrigger,
  type ToolCallStatus,
} from './styles'

/**
 * ToolCall — one thing an assistant did on the way to its answer.
 *
 * Mirrors the Figma component set "Toolcall" (`40005215:44005`): `Type`
 * Default | Collapsable × `Open`. A 16px glyph, a label, and — when there is
 * something to show — a chevron and a panel indented under the label.
 *
 *     <ToolCall status="done">Read Button.tsx</ToolCall>
 *     <ToolCall status="running" detail={<pre>…</pre>}>Running the tests</ToolCall>
 *
 * **Collapsible is derived from `detail`.** Figma's `Type` axis is a boolean
 * about whether there is a panel, and a row that has one to show is the only
 * row that should open. The rule from Button's icon-only form: a prop that
 * can contradict the children is a prop that will.
 *
 * **Four statuses where the file draws one.** Figma's row carries a hollow
 * circle, which is `pending`; `running`, `done` and `error` go past it the
 * way Menu's `destructive` did, and are owed to the file. The glyph is the
 * thing that says which, so it carries a label of its own and the row's text
 * does not have to repeat it. `running` spins, and turns the spin off under
 * reduced motion itself — the global 1ms clamp makes an infinite rotation a
 * jitter rather than a rest, the same hole Carousel's smooth scroll found.
 */
export interface ToolCallProps
  extends Omit<ComponentPropsWithRef<'div'>, 'className' | 'children'> {
  /** Where the call is. Figma draws `pending`. */
  status?: ToolCallStatus
  /** What was called, in a few words: "Read Button.tsx". */
  children: ReactNode
  /** What came back. Present, the row becomes a disclosure with this in its panel. */
  detail?: ReactNode
  /** Whether the detail is showing. Controlled; only means anything with `detail`. */
  open?: boolean
  /** The starting state when `open` is not controlled. */
  defaultOpen?: boolean
  /** Called with the next state when the row is pressed. */
  onOpenChange?: (open: boolean) => void
  /** Extra classes for the outermost element. */
  className?: string
}

function StatusGlyph({ status }: { status: ToolCallStatus }) {
  return (
    <Icon
      icon={TOOL_CALL_ICON[status]}
      label={TOOL_CALL_LABEL[status]}
      className={cn(status === 'running' && 'animate-spin motion-reduce:animate-none')}
    />
  )
}

export function ToolCall({
  status = 'pending',
  children,
  detail,
  className,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: ToolCallProps) {
  if (detail === undefined) {
    return (
      <div className={cn(toolCall({ status }), className)} {...props}>
        <StatusGlyph status={status} />
        <span>{children}</span>
      </div>
    )
  }

  return (
    <CollapsiblePrimitive.Root
      className={cn('flex flex-col items-start gap-1', className)}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      {...props}
    >
      <CollapsiblePrimitive.Trigger className={cn(toolCall({ status }), toolCallTrigger)}>
        <StatusGlyph status={status} />
        {/* Figma's `Label` frame: text and chevron at `gap-1`, tighter than
            the row's `gap-2` from the glyph. */}
        <span className="inline-flex items-center gap-1">
          <span>{children}</span>
          <Icon icon={ChevronDown} className={disclosureChevron} />
        </span>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Panel className={cn(disclosurePanel, 'w-full')}>
        {/* Figma's `Content`: indented past the glyph, `pl-6`. */}
        <div className="pl-6 text-base text-content-subtle">{detail}</div>
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}

ToolCall.displayName = 'ToolCall'
