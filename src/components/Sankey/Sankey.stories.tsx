import type { Meta, StoryObj } from '@storybook/react-vite'

import { Sankey } from './Sankey'
import { sankeyData } from '../Chart/sample-data'

const { nodes, flows } = sankeyData()

const meta = {
  title: 'Data Viz/Sankey',
  component: Sankey,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    height: { control: { type: 'range', min: 200, max: 560, step: 20 } },
  },
  args: {
    nodes,
    flows,
    label: 'Signups by acquisition path',
    legend: 'horizontal',
    height: 320,
  },
} satisfies Meta<typeof Sankey>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A ribbon takes the color of the node it **left**, not the one it arrives at.
 *
 * That is what makes the mix visible: `Trial` is fed by both Search and Social,
 * and the two ribbons arriving there stay different colors, so the proportion
 * each contributed can be read off the node rather than inferred from the
 * legend. Follow a color rightward and you are following where that source went.
 *
 * The ribbons are translucent for `Radar`'s reason rather than as a style — they
 * cross, and no paint order keeps crossing shapes all readable, so an overlap
 * simply reads darker.
 */
export const Playground: Story = {}

/**
 * The legend off, which is a reasonable thing to want here.
 *
 * The library's rule is that a legend stays on for every chart, with one escape
 * hatch: when something else already names the series. A Sankey's node labels do
 * exactly that, so this is the one chart where the hatch is the *expected* call
 * rather than an unusual one. It is still not the default, because a label that
 * will not fit is dropped, and a diagram narrow enough to drop them needs the
 * key back.
 */
export const NoLegend: Story = {
  args: { legend: false },
}

/**
 * Narrow, where the labels start dropping.
 *
 * A label with room on neither side is **dropped rather than clipped** — SVG
 * text neither wraps nor clips to a box, so a label that is merely narrowed runs
 * on over whatever is beside it. `TreeMap` found this first and its record has
 * the detail. Every name is still in the legend and in the hidden table.
 */
export const Narrow: Story = {
  args: { legend: 'vertical' },
  decorators: [
    (Story) => (
      <div className="max-w-64">
        <Story />
      </div>
    ),
  ],
}

/**
 * Where it stops working.
 *
 * A Sankey is right for a few stages and a modest number of nodes. Past twelve
 * nodes the categorical scale has run out and `categorical()` starts returning
 * the placeholder gray by design — which is the honest answer, not a shortfall:
 * two flows sharing a color cannot be told apart, and a gray at least says so.
 * Past a few stages the ribbons cross into a knot whatever the opacity. Group
 * the small paths into an "Other" node before reaching for more color.
 */
export const TooManyNodes: Story = {
  args: {
    label: 'Signups by acquisition path, split too far',
    nodes: [
      ...nodes,
      { key: 'refund', label: 'Refunded' },
      { key: 'winback', label: 'Win-back' },
      { key: 'dormant', label: 'Dormant' },
      { key: 'reactivated', label: 'Reactivated' },
      { key: 'expired', label: 'Expired' },
      { key: 'archived', label: 'Archived' },
      { key: 'purged', label: 'Purged' },
    ],
    flows: [
      ...flows,
      { source: 'churned', target: 'refund', value: 900 },
      { source: 'churned', target: 'dormant', value: 1600 },
      { source: 'dormant', target: 'winback', value: 500 },
      { source: 'dormant', target: 'expired', value: 700 },
      { source: 'winback', target: 'reactivated', value: 300 },
      { source: 'expired', target: 'archived', value: 400 },
      { source: 'archived', target: 'purged', value: 200 },
    ],
    height: 440,
  },
}
