import type { Decorator } from '@storybook/react-vite'

import { cn } from '../../lib/cn'

/**
 * The surface every chart story sits on.
 *
 * A chart is almost never on the canvas. In an application it lives inside a
 * `ContentBlock` or a `Card`, both of which paint `surface-background-primary`
 * — and the chart's own rules assume it: outline plot points are filled with
 * that token to hide the line under them, the quadrant form's label plates use
 * it to cover the crosshair, and the hover halo is drawn against it. A chart
 * shown straight on the canvas therefore lies twice: it looks a step lighter
 * than it will in the product, and every surface-filled mark reads as a white
 * blob on gray. Nathan asked for the stories to stop doing that (2026-09-18).
 *
 * This is the panel `Metric`'s stories already used — `ContentBlock`'s radius
 * and padding, no header — so a story reads as the chart in its block without
 * being a story about the block. Storybook nests a story's own decorators inside
 * the meta's, so a story that wants a narrower panel says so through
 * `parameters.surfaceWidth` (a width class) rather than wrapping itself: a
 * wrapper inside the panel would leave the panel full width around a narrow
 * chart, which is not what a narrow block looks like.
 */
export const onSurface: Decorator = (Story, context) => (
  <div
    className={cn(
      'bg-surface-background-primary rounded-lg p-4',
      context.parameters.surfaceWidth as string | undefined,
    )}
  >
    <Story />
  </div>
)
