import type { Meta, StoryObj } from '@storybook/react-vite'

import { TreeMap } from './TreeMap'
import { treeMapData } from '../Chart/sample-data'

const meta = {
  title: 'Data Viz/TreeMap',
  component: TreeMap,
  argTypes: {
    legend: { control: 'inline-radio', options: ['horizontal', 'vertical', false] },
    showValues: { control: 'boolean' },
    height: { control: { type: 'range', min: 200, max: 520, step: 20 } },
  },
  args: {
    groups: treeMapData(),
    label: 'Sessions by channel',
    legend: 'horizontal',
    showValues: false,
    height: 320,
  },
} satisfies Meta<typeof TreeMap>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma's chart: three groups, each a block of tiles in one color.
 *
 * **Color belongs to the group, not the tile.** That is what lets a treemap
 * show eleven rectangles with three colors — and it is why this form keeps
 * working where a donut stops: past about six slices a donut's small arcs are
 * unreadable, while a treemap's small rectangles are merely small.
 */
export const Playground: Story = {}

/**
 * The only chart in the library whose marks carry their own text.
 *
 * Every other one keeps text outside the data, because several of the twelve
 * categorical hues are illegible underneath it. A treemap has nowhere else to
 * put a label, so Figma solves it with a **plate** — a translucent panel using
 * `Data Viz/Utility/Accessibility Overlay` at its own 56%.
 *
 * That token's first job is outlining a mark that cannot separate from its
 * ground. This is a second, and it works for the same reason: it is the neutral
 * at 56%, and it flips with the theme, so `content-inverse` is the right text
 * color in both. Switch to dark in the toolbar and watch the plate invert.
 */
export const WithValues: Story = {
  args: { showValues: true },
}

/**
 * Small tiles lose their label rather than clipping it.
 *
 * A label cut off by its own tile is worse than no label, and the value is still
 * in the tooltip and the accessibility table either way. This story has a long
 * tail of small channels to force the case.
 */
export const LongTail: Story = {
  args: {
    groups: [
      {
        key: 'organic',
        label: 'Organic',
        tiles: [
          { name: 'Search', value: 5200 },
          { name: 'Direct', value: 900 },
          { name: 'Referral', value: 220 },
          { name: 'Email', value: 110 },
          { name: 'Feed', value: 60 },
        ],
      },
      {
        key: 'paid',
        label: 'Paid',
        tiles: [
          { name: 'Display', value: 1800 },
          { name: 'Video', value: 300 },
          { name: 'Retarget', value: 120 },
          { name: 'Affiliate', value: 70 },
        ],
      },
    ],
    label: 'Sessions by channel, with a long tail',
  },
}
