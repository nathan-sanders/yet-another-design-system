import type { Meta, StoryObj } from "@storybook/react-vite";

import { Metric } from "./Metric";
import { MetricCard } from "./MetricCard";
import { MetricGrid } from "./MetricGrid";
import { TrendBadge } from "./TrendBadge";
import { ContentBlock } from "../ContentBlock";
import { Spark } from "../Spark";
import { dailyData } from "../Chart/sample-data";
import { sentiment } from "../Chart";

const meta = {
  title: "Data Viz/Metric",
  component: Metric,
  argTypes: {
    trend: { control: { type: "range", min: -50, max: 50, step: 1 } },
    goodDirection: { control: "inline-radio", options: ["up", "down"] },
  },
  args: {
    label: "Total sessions",
    value: "1,234",
    trend: 8,
    goodDirection: "up",
  },
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A metric on its own — no card, no padding. It is content. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-66">
      <Metric {...args} />
    </div>
  ),
};

/**
 * Figma's `Metric Card`: a `Card emphasis="subtle" padding={3}` around the same
 * `Metric`.
 *
 * Both halves already existed — Figma's own component contains a `Card`
 * instance, and the tokens line up exactly, down to the 12px padding and the
 * radius. What this adds is the pairing, which is used constantly and easy to
 * get wrong in either direction: a `default` card would draw a border the design
 * does not have, and a `subtle` card on the canvas is invisible.
 */
export const Card: Story = {
  render: (args) => (
    // On a **primary** surface, not the canvas.
    //
    // `--surface-background-subtle` and `--surface-canvas` are the same stone in
    // both themes, so a subtle card sitting straight on the canvas is invisible
    // — `Card`'s own record warns about exactly this, and a metric row was the
    // first thing to walk into it. In real use these sit inside a
    // `ContentBlock`, which is a primary surface, and that is where Figma draws
    // them too.
    <div className="bg-surface-background-primary w-74 rounded-lg p-4">
      <MetricCard {...args} />
    </div>
  ),
};

/**
 * The row a dashboard opens with — and the top of the reference screenshot this
 * whole exercise started from.
 *
 * Resize the window below 768px: it goes to **two** columns, not one. That is
 * the single thing separating `MetricGrid` from `BentoGrid`, and its whole
 * reason to exist. Four numbers stay perfectly legible two-up, and stacking them
 * turns a glance into four screens of scrolling.
 */
export const Grid: Story = {
  render: () => (
    <ContentBlock>
      <ContentBlock.Header>Overview</ContentBlock.Header>
      <ContentBlock.Content>
        <MetricGrid>
          <MetricCard label="Total sessions" value="12,480" trend={8} />
          <MetricCard label="Signups" value="3,204" trend={12} />
          <MetricCard label="Conversion" value="4.2%" trend={-3} />
          <MetricCard
            label="Churn"
            value="1.8%"
            trend={-6}
            goodDirection="down"
          />
        </MetricGrid>
      </ContentBlock.Content>
    </ContentBlock>
  ),
};

/**
 * The trend badge, and the distinction it keeps.
 *
 * **Direction comes from the sign** — `8` is up, `-3` is down, `0` is neutral —
 * so a number and its arrow cannot contradict each other.
 *
 * **Sentiment is a separate question**, because "up is good" is not universal.
 * `goodDirection="down"` flips the *colour* and leaves the *arrow* alone: the
 * arrow reports what the number did, the colour says how to feel about it.
 * Churn falling by 6% is green and pointing down, which is exactly right and
 * what a component fusing the two would get wrong.
 */
export const Trend: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">
          goodDirection=&quot;up&quot; — sessions, signups, revenue
        </figcaption>
        <div className="flex items-center gap-3">
          <TrendBadge trend={8} />
          <TrendBadge trend={0} />
          <TrendBadge trend={-3} />
        </div>
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-content-subtle font-mono text-sm">
          goodDirection=&quot;down&quot; — churn, load time, cost
        </figcaption>
        <div className="flex items-center gap-3">
          <TrendBadge trend={8} goodDirection="down" />
          <TrendBadge trend={0} goodDirection="down" />
          <TrendBadge trend={-3} goodDirection="down" />
        </div>
      </figure>
    </div>
  ),
};

/**
 * With a spark beside the number — Figma's `Spark Chart` slot, at a 24px gap.
 *
 * The spark is `decorative`, and that is the right call rather than laziness:
 * the value and its trend are stated in text right beside it, so announcing the
 * shape as well would hand a screen reader a vaguer second version of a number
 * it has just read.
 */
export const WithSpark: Story = {
  render: () => (
    <div className="bg-surface-background-primary rounded-lg p-4">
      <MetricGrid columns={3}>
        <MetricCard
          label="Total sessions"
          value="12,480"
          trend={8}
          spark={
            <Spark
              data={dailyData(14)}
              dataKey="sessions"
              type="area"
              height={36}
              decorative
            />
          }
        />
        <MetricCard
          label="Signups"
          value="3,204"
          trend={-3}
          spark={
            <Spark
              data={dailyData(14)}
              dataKey="signups"
              type="area"
              color={sentiment.negative}
              height={36}
              decorative
            />
          }
        />
        <MetricCard
          label="Conversions"
          value="862"
          trend={1}
          spark={
            <Spark
              data={dailyData(14)}
              dataKey="conversions"
              type="bar"
              height={36}
              decorative
            />
          }
        />
      </MetricGrid>
    </div>
  ),
};
