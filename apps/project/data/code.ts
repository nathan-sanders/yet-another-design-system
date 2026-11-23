import { day, today } from './dates'
import type { AgentRun, DiffFile, PullRequest, Task } from './types'

/*
 * Mobile ordering app · Code & reviews (`40006589:61263`): two of Sprint 14's
 * tasks as the section draws them, written over the sprint's own rows in
 * `tasks.ts`. Apple Pay at checkout has code in its description and comments
 * and a pull request in review; Allergen filters on menu has Yak working it.
 *
 * A description or comment is prose with `inline code` in backticks and a
 * fenced block after a blank line — ```ts checkout.config.ts — which
 * `components/RichBody.tsx` draws as the library's Code and CodeBlock.
 */

/** `Review - Pull request changes` (`40006589:62699`), its three files as drawn. */
const applePayFiles: DiffFile[] = [
  {
    path: 'src/checkout/PaymentSheet.tsx',
    language: 'tsx',
    diff: [
      '@@ -24,5 +24,9 @@ export function PaymentSheet({ order }: Props) {',
      '   const { cards } = useSavedCards();',
      '+  const applePay = useApplePay(order);',
      ' ',
      '   return (',
      '     <Sheet title="Pay">',
      '+      {applePay.available && (',
      '+        <ApplePayButton onPress={applePay.start} />',
      '+      )}',
      '       <CardList cards={cards} />',
    ].join('\n'),
  },
  {
    path: 'src/checkout/useApplePay.ts',
    language: 'ts',
    diff: [
      '@@ -0,0 +1,8 @@',
      '+export function useApplePay(order: Order) {',
      '+  const available = canMakePayments(applePay.supportedNetworks);',
      '+  const start = async () => {',
      '+    const token = await requestPayment(order.total);',
      '+    return payOrder(order.id, token);',
      '+  };',
      '+  return { available, start };',
      '+}',
    ].join('\n'),
  },
  {
    path: 'src/api/orders.ts',
    language: 'ts',
    diff: [
      '@@ -41,3 +41,3 @@',
      ' export async function payOrder(id: string, token: string) {',
      '-  return api.post(`/v1/orders/${id}/charge`, { token });',
      '+  return api.post(`/v1/orders/${id}/pay`, { token });',
      ' }',
    ].join('\n'),
  },
]

const applePayPull: PullRequest = {
  number: 218,
  title: 'Add Apple Pay to checkout',
  authorId: 'theo',
  commits: 3,
  base: 'main',
  branch: 'theo/mob-52-apple-pay',
  state: 'open',
  reviewers: [
    { personId: 'priya', state: 'approved' },
    { personId: 'sofia', state: 'requested' },
  ],
  checks: { passed: 3, total: 3 },
  files: applePayFiles,
  comments: [
    {
      id: 'rc-218-1',
      authorId: 'priya',
      age: '1h',
      at: 'PaymentSheet.tsx:29',
      body: 'Hide the button when the cart has a gift card. Apple Pay can’t split the payment.',
    },
    {
      id: 'rc-218-2',
      authorId: 'sofia',
      age: '20m',
      at: 'useApplePay.ts:5',
      body: 'Does a 402 come back here, or does the hook throw?',
    },
  ],
}

/** `Task - Yak coding agent` (`40006589:63143`): the run's steps, check and diff. */
const allergenRun: AgentRun = {
  from: 'the task and the Mobile ordering PRD',
  steps: [
    'Read MenuList.tsx and filterMenu.ts',
    'Added an allergen filter to the menu query',
    'Ran the menu tests: 12 passed',
  ],
  command: 'pnpm test menu',
  files: [
    {
      path: 'src/menu/filterMenu.ts',
      language: 'ts',
      diff: [
        '@@ -8,3 +8,5 @@',
        ' export function filterMenu(items: MenuItem[], filters: Filters) {',
        '-  return items.filter((item) => matchesSearch(item, filters.query));',
        '+  return items',
        '+    .filter((item) => matchesSearch(item, filters.query))',
        '+    .filter((item) => !hasAllergen(item, filters.allergens));',
        ' }',
      ].join('\n'),
    },
  ],
  attempt: 1,
}

/**
 * What the section changes on each task. The phase stays the sprint's, which
 * is what a sprint project's List groups by; the file's Checkout and Menu
 * would split Sprint 14 into three groups (FINDINGS 134).
 */
export const codeDetails: Record<string, Partial<Task>> = {
  'mob-52': {
    status: 'in-review',
    priority: 'high',
    due: '2026-11-26',
    estimate: '2d',
    linked: { doc: 'Mobile ordering PRD' },
    description: [
      'Add Apple Pay as a payment option in checkout. The sheet opens from `PaymentSheet` and we confirm the charge through `POST /v1/orders/{id}/pay` before showing the receipt.',
      'The merchant ID is read from `APPLE_PAY_MERCHANT_ID` so start from this config:',
      [
        '```ts checkout.config.ts',
        'export const applePay = {',
        '  merchantId: env.APPLE_PAY_MERCHANT_ID,',
        "  countryCode: 'US',",
        "  currencyCode: 'USD',",
        "  supportedNetworks: ['visa', 'masterCard', 'amex'],",
        '};',
        '```',
      ].join('\n'),
    ].join('\n\n'),
    subtasks: [
      { id: 'st-52-1', title: 'Add the Apple Pay button to the payment sheet', done: true },
      { id: 'st-52-2', title: 'Confirm the payment with the orders API', done: false },
      { id: 'st-52-3', title: 'Handle declined and cancelled payments', done: false },
    ],
    pullRequest: applePayPull,
    comments: [
      {
        id: 'c-52-1',
        authorId: 'priya',
        age: '2h',
        body: [
          'Declines come back as a 402 from the orders API. Check the error code before you show the receipt:',
          "```ts\nif (error.code === 'card_declined') return showRetry();\n```",
        ].join('\n\n'),
        replies: [
          {
            id: 'c-52-2',
            authorId: 'theo',
            age: '1h',
            body: 'Good catch. Added to the payment hook, with a retry state.',
          },
        ],
      },
    ],
    activity: [
      { id: 'e-52-4', actor: 'priya', text: 'Priya approved pull request #218', at: today },
      {
        id: 'e-52-3',
        actor: 'rule',
        text: 'Rule: moved this task when pull request #218 opened',
        at: today,
        change: { from: 'In progress', to: 'In review' },
      },
      { id: 'e-52-2', actor: 'theo', text: 'Theo opened pull request #218', at: today },
      { id: 'e-52-1', actor: 'theo', text: 'Theo created this task', at: day('2026-11-02') },
    ],
  },
  'mob-56': {
    status: 'in-progress',
    priority: 'medium',
    start: '2026-11-24',
    due: '2026-11-28',
    description:
      'Let customers hide menu items by allergen. Filter on the `allergens` array in `MenuItem` and keep the choice in the menu query.',
    agent: allergenRun,
    comments: [
      {
        id: 'c-56-1',
        authorId: 'priya',
        age: '25m',
        body: '@Yak pick this one up. Keep it to the menu query, no UI changes yet.',
      },
    ],
    activity: [
      { id: 'e-56-3', actor: 'yak', text: 'Yak proposed a change to filterMenu.ts', at: today },
      { id: 'e-56-2', actor: 'priya', text: 'Priya asked Yak to pick this up', at: today },
      { id: 'e-56-1', actor: 'priya', text: 'Priya created this task', at: day('2026-11-03') },
    ],
  },
}
