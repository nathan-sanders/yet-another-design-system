import { useState } from 'react'
import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { CreditCard, Settings, ShoppingCart, Truck } from 'lucide-react'

import { Stepper } from './Stepper'
import { Button } from '../Button'
import { Field } from '../Field'
import { Input } from '../Input'

type StepperArgs = ComponentProps<typeof Stepper>

const CHECKOUT = ['Cart', 'Shipping', 'Payment', 'Review', 'Confirm']

const SETUP = [
  { label: 'Create workspace', description: 'Name and configure your workspace' },
  { label: 'Invite team members', description: 'Add collaborators by email' },
  { label: 'Set up integrations', description: 'Connect Slack, GitHub, Jira' },
  { label: 'Import data', description: 'Bring in existing projects' },
  { label: 'Launch', description: 'Go live with your team' },
]

/** A stepper that moves when you click it, starting wherever the story says. */
function Controlled({
  activeStep,
  steps = CHECKOUT,
  ...args
}: Omit<StepperArgs, 'children' | 'onStepClick'> & { steps?: string[] }) {
  const [step, setStep] = useState(activeStep)
  return (
    <Stepper {...args} activeStep={step} onStepClick={setStep}>
      {steps.map((label) => (
        <Stepper.Step key={label} label={label} />
      ))}
    </Stepper>
  )
}

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  argTypes: {
    activeStep: { control: { type: 'number', min: 0, max: 4 } },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    layout: { control: 'inline-radio', options: ['separated', 'on-track'] },
    indicator: { control: 'inline-radio', options: ['auto', 'number', 'none'] },
  },
  args: {
    activeStep: 2,
    orientation: 'horizontal',
    layout: 'separated',
    indicator: 'auto',
    children: null,
  },
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof meta>

const steps = (root: HTMLElement) => [...root.querySelectorAll<HTMLLIElement>('ol > li')]

/** A color as the browser computes it, by painting a probe. Same serializer on both sides. */
function paint(root: HTMLElement, color: string) {
  const probe = document.createElement('div')
  probe.style.backgroundColor = color
  root.append(probe)
  const value = getComputedStyle(probe).backgroundColor
  probe.remove()
  return value
}

/**
 * What a hover-only class paints, read from the stylesheet: the rule whose
 * selector names the class, painted on a probe. The element has to carry the
 * class, so a recipe that dropped it fails here too.
 */
function hoverFill(element: Element, className: string) {
  if (!element.classList.contains(className)) return `missing ${className}`
  const escaped = `.${CSS.escape(className)}`
  let fill = ''
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(escaped)) {
        fill = rule.style.backgroundColor || fill
      }
      if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules)
  return fill ? paint(element.ownerDocument.body, fill) : `no rule for ${className}`
}

/**
 * Click any step to move there. Steps before the current one are done, the
 * ones after it are upcoming — progress is never passed, only derived.
 */
export const Playground: Story = {
  render: (args) => (
    <div className="w-[640px]">
      <Controlled {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const items = steps(canvasElement)
    await expect(items.map((li) => li.dataset.progress)).toEqual([
      'complete',
      'complete',
      'current',
      'upcoming',
      'upcoming',
    ])
    await expect(items[2]).toHaveAttribute('aria-current', 'step')

    // A done step announces itself as done, and is still a button.
    await userEvent.click(canvas.getByRole('button', { name: /^Cart\W+completed$/ }))
    await expect(steps(canvasElement)[0]).toHaveAttribute('aria-current', 'step')
    await expect(canvas.getByRole('button', { name: 'Payment' })).toBeVisible()
  },
}

/**
 * Figma's four layouts at the same step. Separated gives each step its own 4px
 * bar; On Track threads the indicators onto one line. The heights are the
 * file's: 44 and 64 for a horizontal step, 40 for a vertical one without a
 * description.
 */
export const Layouts: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-[640px] gap-12">
      <Controlled activeStep={2} data-testid="h-separated" />
      <Controlled activeStep={2} layout="on-track" data-testid="h-on-track" />
      <div className="grid grid-cols-2 gap-8">
        <Controlled activeStep={2} orientation="vertical" data-testid="v-separated" />
        <Controlled
          activeStep={2}
          orientation="vertical"
          layout="on-track"
          data-testid="v-on-track"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const height = (id: string) => steps(canvas.getByTestId(id))[0].getBoundingClientRect().height

    await expect(height('h-separated')).toBe(44)
    await expect(height('h-on-track')).toBe(64)
    await expect(height('v-separated')).toBe(40)
    await expect(height('v-on-track')).toBe(40)

    // Equal widths, 4px apart: five steps across 640.
    const widths = steps(canvas.getByTestId('h-separated')).map(
      (li) => li.getBoundingClientRect().width,
    )
    await expect(new Set(widths.map(Math.round))).toEqual(new Set([125]))

    // On Track's line is one line: the first step has no line before it and
    // the last none after.
    const onTrack = steps(canvas.getByTestId('v-on-track'))
    const rail = (li: HTMLLIElement) => li.querySelector('button > span[aria-hidden]')!.children
    await expect(getComputedStyle(rail(onTrack[0])[0]).visibility).toBe('hidden')
    await expect(getComputedStyle(rail(onTrack[4])[2]).visibility).toBe('hidden')
    await expect(getComputedStyle(rail(onTrack[2])[2]).visibility).toBe('visible')
  },
}

/**
 * `indicator` per stepper, overridable per step: `auto` (a check when done, a
 * ring when current, a number ahead), `number`, an `icon` of your own, or
 * `none`, where the bar and the label carry it alone.
 *
 * The check is a 10px Lucide glyph inside the 16px badge — drawn as part of the
 * mark, not an `Icon`, which only comes in 14, 16, 20 and 24.
 */
export const Indicators: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const icons = [ShoppingCart, Truck, CreditCard, Settings]
    const labels = ['Cart', 'Shipping', 'Payment', 'Settings']
    return (
      <div className="grid grid-cols-4 gap-8">
        {(['auto', 'number', 'icon', 'none'] as const).map((mode) => (
          <Stepper
            key={mode}
            data-testid={mode}
            activeStep={2}
            orientation="vertical"
            indicator={mode === 'icon' ? 'auto' : mode}
            aria-label={`Indicator ${mode}`}
          >
            {labels.map((label, index) => (
              <Stepper.Step
                key={label}
                label={label}
                icon={mode === 'icon' ? icons[index] : undefined}
              />
            ))}
          </Stepper>
        ))}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const auto = steps(canvas.getByTestId('auto'))

    const check = auto[0].querySelector('svg')!.getBoundingClientRect()
    await expect([check.width, check.height]).toEqual([10, 10])
    const badge = auto[3].querySelector('[data-stepper-indicator]')!
    await expect(badge.getBoundingClientRect().width).toBe(16)
    await expect(badge.textContent).toBe('4')

    // Number mode keeps the number on every step, done ones included.
    await expect(steps(canvas.getByTestId('number'))[0].textContent).toContain('1')
    await expect(steps(canvas.getByTestId('none'))[0].querySelector('svg')).toBeNull()
  },
}

/**
 * A status changes the indicator's glyph and color and is read out — never the
 * track, which still shows how far along the flow is.
 */
export const Status: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-80">
      <Stepper activeStep={3} orientation="vertical" onStepClick={() => {}}>
        <Stepper.Step label="Email verified" description="you@example.com" status="success" />
        <Stepper.Step label="Phone verified" description="+1 (555) 012-3456" status="success" />
        <Stepper.Step
          label="Identity document"
          description="Passport upload failed"
          status="error"
        />
        <Stepper.Step label="Address verification" description="Pending review" />
        <Stepper.Step label="Background check" description="Starts after review" />
      </Stepper>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Identity document\W+error$/ })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /^Email verified\W+completed$/ }),
    ).toHaveAccessibleDescription('you@example.com')

    // Hover is the Ghost button's wash, and an upcoming badge steps up to
    // `Action/Secondary/Border` so it does not vanish into it. A story cannot
    // reach CSS `:hover` (Table's record), so this reads the rule Tailwind
    // emitted for each class instead — which also catches one it never generated.
    const upcoming = canvas.getByRole('button', { name: 'Background check' })
    const badge = upcoming.querySelector('[data-stepper-indicator]')!
    await expect(hoverFill(upcoming, 'hover:bg-action-ghost-background-hover')).toBe(
      paint(canvasElement, 'var(--action-ghost-background-hover)'),
    )
    await expect(hoverFill(badge, 'group-hover/step:bg-action-secondary-border')).toBe(
      paint(canvasElement, 'var(--action-secondary-border)'),
    )
    await expect(getComputedStyle(badge).backgroundColor).toBe(
      paint(canvasElement, 'var(--surface-border)'),
    )
  },
}

/**
 * A vertical step's `children` sit under its label — fields, a summary, a
 * banner. Render them for the current step only and the flow opens a step at a
 * time. The content lines up with the label, and is not part of the step's
 * button.
 */
export const CustomContent: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [step, setStep] = useState(0)
    const flow = [
      { label: 'Project details', description: 'Name it and point us at the source' },
      { label: 'Review the build', description: 'What we detected from your default branch' },
      { label: 'Deploy', description: 'Ships to production' },
      { label: 'Live' },
    ]
    return (
      <div className="w-[640px]">
        <Stepper activeStep={step} orientation="vertical" indicator="number" onStepClick={setStep}>
          {flow.map((item, index) => (
            <Stepper.Step key={item.label} {...item}>
              {step === index && index < flow.length - 1 && (
                <div className="flex flex-col gap-3">
                  {index === 0 && (
                    <div className="flex gap-3">
                      <Field label="Project name" className="flex-1">
                        <Input placeholder="My project" />
                      </Field>
                      <Field label="Repository URL" className="flex-1">
                        <Input placeholder="https://github.com/…" />
                      </Field>
                    </div>
                  )}
                  <div>
                    <Button onClick={() => setStep(index + 1)}>Continue</Button>
                  </div>
                </div>
              )}
            </Stepper.Step>
          ))}
        </Stepper>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = steps(canvasElement)[0]
    const label = within(first).getByText('Project details').getBoundingClientRect()
    const field = within(first).getByText('Project name').getBoundingClientRect()
    await expect(field.left).toBe(label.left)

    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await expect(steps(canvasElement)[1]).toHaveAttribute('aria-current', 'step')
    await expect(canvas.queryByText('Project name')).toBeNull()
  },
}

/**
 * Below 112px a step, a horizontal stepper collapses on its own: a segmented
 * track, with the current step and Previous / Next under it. It is a container
 * query on the stepper's width, so it needs no measuring. Every step keeps its
 * name in the list for assistive tech.
 */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-12">
      <div className="w-80" data-testid="narrow">
        <Controlled activeStep={1} steps={['Cart', 'Shipping', 'Delivery', 'Payment']} />
      </div>
      <div className="w-[464px]" data-testid="wide">
        <Controlled activeStep={1} steps={['Cart', 'Shipping', 'Delivery', 'Payment']} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const narrow = canvas.getByTestId('narrow')
    const wide = canvas.getByTestId('wide')
    const summary = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-stepper-summary]')!

    // Four steps collapse below 4 × 112 + 3 × 4 = 460.
    await expect(getComputedStyle(summary(narrow)).display).toBe('flex')
    await expect(getComputedStyle(summary(wide)).display).toBe('none')
    // The targets are gone, so the steps leave the tab order; the names stay in the list.
    await expect(within(narrow).queryAllByRole('button', { name: /Cart/ })).toHaveLength(0)
    await expect(steps(narrow)[0].textContent).toContain('Cart')

    await expect(within(narrow).getByRole('button', { name: 'Previous step' })).toBeEnabled()
    await userEvent.click(within(narrow).getByRole('button', { name: 'Next step' }))
    await expect(steps(narrow)[2]).toHaveAttribute('aria-current', 'step')
    await expect(summary(narrow).textContent).toContain('Step 3 of 4')
  },
}

/**
 * Leave out `onStepClick` and the steps are plain list items — no buttons, no
 * hover, nothing in the tab order. For a flow that only moves forward through
 * its own buttons.
 */
export const ReadOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-80">
      <Stepper activeStep={1} orientation="vertical" layout="on-track">
        {SETUP.map((item) => (
          <Stepper.Step key={item.label} {...item} />
        ))}
      </Stepper>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
    await expect(canvas.getByRole('list', { name: 'Progress' })).toBeVisible()
  },
}

/**
 * The keyboard reaches each step in order and the ring is the library's one
 * focus ring, on the step's target.
 */
export const Keyboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[640px]">
      <Controlled activeStep={2} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    const cart = canvas.getByRole('button', { name: /^Cart\W+completed$/ })
    await expect(cart).toHaveFocus()
    await expect(getComputedStyle(cart).boxShadow).not.toBe('none')

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await expect(steps(canvasElement)[1]).toHaveAttribute('aria-current', 'step')
  },
}
