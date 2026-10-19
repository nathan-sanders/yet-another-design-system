import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor } from 'storybook/test'
import { LineSeries } from './LineSeries'
import { dailyData } from '../Chart/sample-data'

const meta = { title: 'Probe/Line', component: LineSeries, args: { data: dailyData(31), xKey: 'date', series: [{ key: 'sessions', label: 'Sessions' }], label: 'x' } } satisfies Meta<typeof LineSeries>
export default meta
export const P: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const surface = canvasElement.querySelector<SVGElement>('.recharts-surface')!
    surface.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    await waitFor(() => expect(canvasElement.querySelector('.recharts-tooltip-wrapper')?.textContent).toBe('x'), { timeout: 1500 })
  },
}
