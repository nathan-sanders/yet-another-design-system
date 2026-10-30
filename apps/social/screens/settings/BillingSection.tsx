import type { ReactNode } from 'react'
import { Download, Users } from 'lucide-react'

import { Badge } from '../../../../src/components/Badge'
import { Button } from '../../../../src/components/Button'
import { Icon } from '../../../../src/components/Icon'
import { ProgressBar } from '../../../../src/components/ProgressBar'
import { pixel, proportional, Table, type TableColumn } from '../../../../src/components/Table'
import { Heading, Text } from '../../../../src/components/Text'
import { card, invoicesFor, nextRenewal, plan, yakCredits, type Invoice } from '../../data/billing'
import { useShell } from '../../shell/ShellContext'

const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // $99, but $81.40: cents only when there are some.
  trailingZeroDisplay: 'stripIfInteger',
})

const count = new Intl.NumberFormat('en-US')

/**
 * Settings › Billing: the plan, Yak's monthly credits, the card on file and
 * the invoices, in that order, after the Claude desktop app's Billing page.
 * Code-first, no Figma frame. Each block is a title and its detail on the
 * left with the one action it offers on the right; nothing here is wired to
 * a real payment flow, so the actions say they aren't built.
 */
export function BillingSection() {
  const { notBuilt } = useShell()
  const today = new Date()
  const renews = longDate.format(nextRenewal(today))
  const invoices = invoicesFor(today)

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'date',
      header: 'Date',
      width: pixel(120),
      renderCell: (invoice) => (
        <time dateTime={invoice.date.toISOString().slice(0, 10)}>
          {longDate.format(invoice.date)}
        </time>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: proportional(1, 120),
      renderCell: (invoice) => invoice.description,
    },
    {
      key: 'total',
      header: 'Total',
      width: pixel(96),
      numeric: true,
      renderCell: (invoice) => money.format(invoice.total),
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(88),
      renderCell: () => <Badge color="emerald">Paid</Badge>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      // 176 = the 149px Download PDF button and the cell's 12px each side, rounded up.
      width: pixel(176),
      align: 'right',
      renderCell: (invoice) => (
        <Button
          appearance="ghost"
          startIcon={Download}
          aria-label={`Download PDF, ${longDate.format(invoice.date)} invoice`}
          onClick={() => notBuilt('Invoice downloads')}
        >
          Download PDF
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <Heading level={3} size="lg" weight="semibold">
          Billing
        </Heading>
        <Text color="subtle">Your plan, payment method and invoices for this workspace.</Text>
      </div>

      <BillingBlock
        title={`${plan.name} plan`}
        lead={
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-background-subtle text-content-subtle">
            <Icon icon={Users} size="x-large" />
          </span>
        }
        action={
          <Button appearance="secondary" onClick={() => notBuilt('Changing plans')}>
            Adjust plan
          </Button>
        }
      >
        <Text>
          {plan.seats} seats and {plan.channels} channels, {money.format(plan.price)} a month.
        </Text>
        <Text color="subtle">
          {plan.seatsUsed} of {plan.seats} seats in use. Renews automatically on {renews}.
        </Text>
      </BillingBlock>

      <BillingBlock
        title="Yak credits"
        badge={<Badge color="blue">New</Badge>}
        action={
          <Button appearance="secondary" onClick={() => notBuilt('Buying Yak credits')}>
            Buy {count.format(yakCredits.pack)} credits
          </Button>
        }
      >
        <Text>
          Your {plan.name} plan includes {count.format(yakCredits.included)} Yak credits each month,
          for drafting, replies and reports.
        </Text>
        <ProgressBar
          label="Used this cycle"
          value={yakCredits.used}
          max={yakCredits.included}
          valueLabel
          formatValue={() =>
            `${count.format(yakCredits.used)} of ${count.format(yakCredits.included)}`
          }
          getAriaValueText={() =>
            `${count.format(yakCredits.used)} of ${count.format(yakCredits.included)} credits`
          }
          className="mt-2 max-w-md"
        />
        <Text size="sm" color="subtle">
          Resets on {renews}.
        </Text>
      </BillingBlock>

      <div className="flex flex-col gap-6">
        <BillingBlock
          title="Payment"
          action={
            <Button appearance="secondary" onClick={() => notBuilt('Adding payment methods')}>
              Add payment method
            </Button>
          }
        >
          <Text color="subtle">
            Your default payment method is charged for plan renewals and Yak credit top-ups.
          </Text>
        </BillingBlock>
        <BillingBlock
          title={
            <span className="flex items-center gap-3">
              <CardMark />
              <span>
                {card.brand} <span aria-hidden>••••</span>
                <span className="sr-only">ending in</span> {card.last4}
              </span>
            </span>
          }
          titleWeight="normal"
          badge={<Badge color="blue">Default</Badge>}
          action={
            <Button appearance="secondary" onClick={() => notBuilt('Updating your card')}>
              Update
            </Button>
          }
        >
          <Text color="subtle">Expires {card.expires}</Text>
        </BillingBlock>
      </div>

      {/* A div, not a named section: the Table's scroll region is already the
          "Invoices" landmark, and two of them fail axe's landmark-unique. */}
      <div className="flex flex-col gap-3">
        <Heading level={4} size="base" weight="semibold">
          Invoices
        </Heading>
        <Table label="Invoices" columns={columns} data={invoices} idKey="id" sortable={false} />
      </div>
    </div>
  )
}

/**
 * One block of the page: a title row (with an optional badge) and its detail
 * on the left, its action on the right. Below the dialog's `@xl` the action
 * drops under the detail rather than squeezing it.
 */
function BillingBlock({
  title,
  titleWeight = 'semibold',
  lead,
  badge,
  action,
  children,
}: {
  title: ReactNode
  titleWeight?: 'normal' | 'semibold'
  lead?: ReactNode
  badge?: ReactNode
  action: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col items-start gap-4 @xl/settings:flex-row @xl/settings:justify-between @xl/settings:gap-8">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {lead}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={4} size="base" weight={titleWeight}>
              {title}
            </Heading>
            {badge}
          </div>
          {children}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  )
}

/**
 * The card's brand, drawn as a small card rather than the network's logo:
 * a mock app has no business shipping Visa's artwork.
 */
function CardMark() {
  return (
    <span
      aria-hidden
      className="flex h-6 w-9 items-center justify-center rounded-xs border border-surface-border bg-surface-background-primary text-xs font-bold tracking-wide text-content-emphasized"
    >
      VISA
    </span>
  )
}
