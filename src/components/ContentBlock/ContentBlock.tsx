import { createContext, useContext } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { Icon } from '../Icon'

/**
 * ContentBlock — a bordered card that owns one titled region of a page.
 *
 * Mirrors the Figma component set "Content Block" (Yet Another Design System,
 * node 40004181:4493) and its private header, `_Content Block Header`
 * (40004181:4365). Figma draws one axis, `Floating` false | true; the header's
 * Icon / Header Slot / Actions booleans are slots here, the way Banner's
 * Title / Description / Action booleans are.
 *
 * **This is the part a bento layout is made of.** A bento view is a mosaic of
 * compartments, each holding one idea; `BentoGrid` arranges them, and this is
 * what goes in the cells. That is also why it is a container and not a stat
 * card: what a block *contains* — a number, a chart, a list — is the caller's.
 *
 * Not a Base UI component. There is no headless card primitive, so this is a
 * native `<div>`, like Badge and Banner.
 *
 * **Compound rather than a flat prop list.** Banner takes `title` / `children` /
 * `action` because a banner is always the same shape. A block is not: it may
 * have no header at all, and its body is arbitrary. So it follows Accordion and
 * Tabs — `ContentBlock.Header` and `ContentBlock.Content` — which also lets a
 * caller put something other than Content inside, a full-bleed chart say.
 *
 * **It is a `<div>`, not a `<section>`.** A named `<section>` is a landmark, and
 * a bento view has up to nine of these; nine landmarks is noise in a screen
 * reader's rotor, where nine headings is an outline. The header's real heading
 * is what makes the layout navigable — see `headingLevel`.
 */

/**
 * Set once on the root and read by the header. Two things travel: the heading
 * level, so a grid of blocks cannot land at different depths (Accordion's
 * reason, and its mechanism), and the emphasis, because the title's colour
 * depends on which surface the root chose and it cannot see that from below.
 *
 * Deliberately not exported.
 */
const ContentBlockContext = createContext<{
  headingLevel: ContentBlockHeadingLevel
  emphasis: ContentBlockEmphasis
}>({
  headingLevel: 3,
  emphasis: 'default',
})

const contentBlock = tv({
  base: [
    'flex w-full min-w-0 flex-col',
    // h-full so tiles in one grid row end level. In ordinary flow a percentage
    // height against an indefinite parent resolves to auto, so this costs
    // nothing outside a grid or a stretched flex line.
    'h-full',
    'rounded-lg border',
    // 14/24 body type, so a block's content starts from the library's base
    // rather than from whatever the page happens to set.
    'font-sans text-base',
    // Figma has overflow-clip on the frame. Deliberately not ported — the tenth
    // component to make this call. A focus ring paints *outside* the control it
    // belongs to, so a Button on the first line of a clipped block loses the top
    // of its ring.
  ],

  variants: {
    /**
     * Which surface the block sits on — bento's visual hierarchy, expressed as
     * a token pair rather than as size.
     *
     * Figma draws only `default`. The other two are code-first (the Accordion
     * route) and belong in the file next.
     */
    emphasis: {
      /** Figma's Content Block: Surface/Card Primary on Surface/Border. */
      default: 'bg-surface-card-primary border-surface-border text-content-primary',
      /** A secondary tile that should recede — the canvas colour, still bordered. */
      subtle: 'bg-surface-card-subtle border-surface-border text-content-primary',
      /**
       * The anchor cell: one loud tile carrying the headline number. Uses the
       * Action/Primary pair, which is the only ramp in the theme with a
       * foreground already tuned for contrast on its background in both themes —
       * so there is no `dark:` class here, the same finding Banner recorded.
       *
       * A ghost Button on this background is invisible (its foreground is the
       * same stone-800). Use `appearance="overlay"` in the actions slot, which
       * is what Banner does for exactly this reason.
       */
      accent: [
        'bg-action-primary-background border-action-primary-border',
        'text-action-primary-foreground',
      ],
    },

    /** Figma's `Floating` — Elevation/Drop Shadow/Low, 0 2 4 0. */
    floating: {
      true: 'shadow-low',
      false: '',
    },
  },

  defaultVariants: {
    emphasis: 'default',
    floating: false,
  },
})

type ContentBlockVariants = VariantProps<typeof contentBlock>
export type ContentBlockEmphasis = NonNullable<ContentBlockVariants['emphasis']>

/**
 * Which heading the block's title sits in. A bento view is a set of sections,
 * so its titles belong in the page outline — but only the page knows at what
 * depth, and getting it wrong is an axe `heading-order` failure rather than a
 * matter of taste. Accordion's prop, for Accordion's reason.
 */
export type ContentBlockHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * An explicit map rather than a computed tag, so TypeScript can see the whole
 * set — `` `h${level}` `` widens to `string`, which is not a JSX tag. Accordion
 * keeps the same map as elements, because Base UI's Header takes a `render`
 * prop; this is a plain `<div>`, so it wants the tag names.
 */
const HEADING: Record<ContentBlockHeadingLevel, 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
}

export interface ContentBlockProps extends ComponentPropsWithRef<'div'> {
  /** A `ContentBlock.Header` and a `ContentBlock.Content`, or any content. */
  children: ReactNode
  /** Which surface the block draws. `accent` is the anchor cell of a bento view. */
  emphasis?: ContentBlockEmphasis
  /** Raise the block off the canvas with the low drop shadow. Figma's `Floating`. */
  floating?: boolean
  /**
   * The heading the title sits in. Pick the level below whatever heading
   * introduces the layout — a page `<h1>` over a grid of blocks makes these
   * `h2`.
   */
  headingLevel?: ContentBlockHeadingLevel
}

export function ContentBlock({
  children,
  emphasis = 'default',
  floating = false,
  headingLevel = 3,
  className,
  ...props
}: ContentBlockProps) {
  return (
    <div className={cn(contentBlock({ emphasis, floating }), className)} {...props}>
      <ContentBlockContext.Provider value={{ headingLevel, emphasis }}>
        {children}
      </ContentBlockContext.Provider>
    </div>
  )
}

const header = tv({
  base: [
    'flex items-center gap-2',
    // min-h-12 = height/h-12 (48px), pl-4 = spacing/4, pr-2 / py-2 = spacing/2.
    // The right side is 8 rather than 16 because Figma expects a button there,
    // and a 32px ghost button carries its own 12px of padding. A header with no
    // actions therefore sits 8px off the right edge, which is Figma's drawing
    // and not an oversight.
    'min-h-12 pt-2 pr-2 pb-2 pl-4',
    // A min-height rather than a height: a title that wraps grows the row
    // instead of spilling out of it. Accordion's trigger makes the same call.
  ],
})

const title = tv({
  base: 'min-w-0 font-semibold [word-break:break-word]',
  variants: {
    emphasis: {
      /** Figma's Content/Emphasized — the title outranks the body text. */
      default: 'text-content-emphasized',
      subtle: 'text-content-emphasized',
      /**
       * On the anchor cell there is no second colour to promote to: the root
       * already carries Action/Primary's foreground, and Content/Emphasized on
       * that background is unreadable. Weight does the work instead.
       */
      accent: 'text-current',
    },
  },
  defaultVariants: {
    emphasis: 'default',
  },
})

export interface ContentBlockHeaderProps extends ComponentPropsWithRef<'div'> {
  /** The title. Keep it short — "Engagement rate", not a sentence. */
  children: ReactNode
  /**
   * The Figma "Icon" slot, at 16px. Pass the component itself:
   * `icon={Users}`, not `<Users />` — Button, Badge and Banner all take an icon
   * this way.
   */
  icon?: LucideIcon
  /**
   * The Figma "Header Slot Items" — something that belongs *with* the title and
   * reads after it, usually a Badge carrying a delta. Left-aligned, beside the
   * heading, which is what distinguishes it from `actions`.
   *
   * Named `titleSlot` and not `slot`, for two reasons that agree. `slot` is a
   * real DOM attribute (Shadow DOM assignment), typed `string`, so the bare
   * name would have to `Omit` it off the element props — the third time this
   * library has hit that collision, after Divider's `style` and Banner's
   * `title`. And `Tabs.Tab` already calls its version `endSlot`, so a qualified
   * slot name is the house spelling; this one says which end it is on.
   */
  titleSlot?: ReactNode
  /**
   * The Figma "Actions Items" — controls for the block, pushed to the right
   * edge. Usually one icon-only Button at the **default** size: the header is
   * `min-h-12` with 8px of padding above and below, which leaves exactly the
   * 32px a default Button is, so nothing here has to shrink to fit. Use
   * `appearance="overlay"` when the block is `emphasis="accent"`.
   */
  actions?: ReactNode
}

function ContentBlockHeader({
  children,
  icon,
  titleSlot,
  actions,
  className,
  ...props
}: ContentBlockHeaderProps) {
  const { headingLevel, emphasis } = useContext(ContentBlockContext)
  const Heading = HEADING[headingLevel]

  return (
    <div className={cn(header(), className)} {...props}>
      {/*
        Figma's "Span": the icon, the title and the header slot travel together
        as one group, so the actions push against the group rather than against
        the text. min-w-0 lets a long unbroken title wrap instead of shoving the
        actions off the edge — Banner's fix, in the same place.
      */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {icon && <Icon icon={icon} size="base" />}
        {/*
          A real `<h2>`–`<h6>` rather than a `role="heading"` / `aria-level`
          pair: the tag is what a screen reader's outline is built from, and it
          needs no ARIA to say so. Colour comes from the root's emphasis, which
          the context is carrying.
        */}
        <Heading className={title({ emphasis })}>{children}</Heading>
        {titleSlot}
      </div>

      {actions && <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}

ContentBlockHeader.displayName = 'ContentBlock.Header'

const content = tv({
  base: [
    'flex min-w-0 flex-col gap-2',
    // px-4 pb-4 = spacing/4, and no top padding: Figma leaves it at 0 because
    // the header's 8px already sits above it.
    'px-4 pt-0 pb-4',
    // Unless there is no header. Then this is the first child and has to put
    // the 16 back itself. Derived from position rather than from a `hasHeader`
    // prop the caller could contradict, and it costs no JavaScript.
    'first:pt-4',
  ],
})

export interface ContentBlockContentProps extends ComponentPropsWithRef<'div'> {
  /** Whatever the block is about. */
  children: ReactNode
}

/**
 * The body. Nothing is said here about type beyond the 14/24 the root sets:
 * what goes in a block is the caller's content, not the component's — the same
 * position `Accordion.Panel` and `Tabs.Panel` take.
 *
 * Leave it out for content that should reach the block's edges: a chart, or an
 * image that runs to the border.
 */
function ContentBlockContent({ children, className, ...props }: ContentBlockContentProps) {
  return (
    <div className={cn(content(), className)} {...props}>
      {children}
    </div>
  )
}

ContentBlockContent.displayName = 'ContentBlock.Content'

ContentBlock.Header = ContentBlockHeader
ContentBlock.Content = ContentBlockContent

ContentBlock.displayName = 'ContentBlock'
