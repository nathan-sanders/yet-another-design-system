import { Text } from '../../../src/components/Text'
import { cn } from '../../../src/lib/cn'
import { focusRing } from '../../../src/lib/focus'
import type { CalendarNote as Note } from '../data/types'
import { NOTE_COLOR_CLASSES, noteRangeLabel } from './calendarNoteColors'

interface CalendarNoteProps {
  note: Note
  /** The run started before the first day drawn: square the left end. */
  continuesBefore?: boolean
  /** The run goes past the last day drawn: square the right end, no fold. */
  continuesAfter?: boolean
  onOpen: (note: Note) => void
  className?: string
}

/**
 * Figma's `Calendar Note` (`40005949:63968`): a 24px sticky-note bar, bold
 * title then a truncating description in the hue's foreground on its
 * background, and a 12px dog-ear folded up from the bottom-right. Hover draws
 * the hue's highlight round the edge; focus keeps that edge and adds the ring.
 *
 * **The fold is a cut, not a painted corner.** The file paints the corner white
 * — the page color — which would show as a white chip over a past day's hatch
 * and in dark mode. Here the corner is clipped away so whatever is under the
 * note shows through, and the flap is the hue's foreground at 30%, the same
 * recipe as `InternalNote`'s slip, so it follows the theme. Figma's flap is
 * `Overlay/Background`, a token YADS does not have — see FINDINGS.md.
 *
 * A bar that runs off the days drawn squares that end and drops the fold: the
 * note has not finished there.
 */
export function CalendarNote({
  note,
  continuesBefore = false,
  continuesAfter = false,
  onOpen,
  className,
}: CalendarNoteProps) {
  const color = NOTE_COLOR_CLASSES[note.color]
  const label = [note.title, note.description, noteRangeLabel(note)].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={() => onOpen(note)}
      aria-label={label}
      className={cn(
        'group relative flex h-6 w-full min-w-0 items-center gap-1 rounded-md py-0.5 pr-5 pl-2 text-left',
        color.text,
        focusRing,
        continuesBefore && 'rounded-l-none',
        continuesAfter && 'rounded-r-none pr-2',
        className,
      )}
    >
      {/* The fill and its edge are a layer of their own so the corner can be
          cut out of them without cutting the focus ring, which is drawn
          outside the button's box and would be clipped with it. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-[inherit] group-hover:inset-ring group-focus-visible:inset-ring',
          color.fill,
          !continuesAfter &&
            '[clip-path:polygon(0_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%)]',
        )}
      />
      <Text render={<span />} size="sm" weight="bold" color="inherit" className="relative shrink-0">
        {note.title}
      </Text>
      {note.description ? (
        <Text
          render={<span />}
          size="sm"
          color="inherit"
          truncate
          className="relative min-w-0 flex-1"
        >
          {note.description}
        </Text>
      ) : null}
      {continuesAfter ? null : (
        <span
          aria-hidden
          className={cn(
            'absolute right-0 bottom-0 size-3 rounded-tl-sm [clip-path:polygon(0_0,100%_0,0_100%)]',
            color.flap,
          )}
        />
      )}
    </button>
  )
}
