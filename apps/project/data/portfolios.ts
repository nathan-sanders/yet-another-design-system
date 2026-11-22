/**
 * The four portfolios, as Plan - Portfolios (`40006296:27641`) lists them,
 * and the projects each holds — every one of the twelve in exactly one, so
 * the counts add to twelve as Yak's line says. The Roadmap draws one lane a
 * portfolio in this order (`40006278:14156`).
 *
 * The budgets are the file's and add up across Plan and Reports: $1.76M
 * spent of $2.34M. The next milestone is not written down; it is the
 * soonest one among the portfolio's projects, which is what the file prints
 * for all four.
 */
export interface Portfolio {
  id: string
  name: string
  ownerId: string
  projectIds: string[]
  budget: { spent: number; total: number }
}

export const portfolios: Portfolio[] = [
  {
    id: 'store-expansion',
    name: 'Store expansion',
    ownerId: 'dana',
    projectIds: ['austin', 'dallas', 'houston', 'san-antonio'],
    budget: { spent: 1_200_000, total: 1_600_000 },
  },
  {
    id: 'menu',
    name: 'Menu',
    ownerId: 'priya',
    projectIds: ['protein-plates', 'winter-menu', 'spring-menu'],
    budget: { spent: 84_000, total: 140_000 },
  },
  {
    id: 'digital',
    name: 'Digital',
    ownerId: 'theo',
    projectIds: ['mobile-ordering', 'loyalty'],
    budget: { spent: 410_000, total: 480_000 },
  },
  {
    id: 'brand-people',
    name: 'Brand & people',
    ownerId: 'katie',
    projectIds: ['gift-cards', 'spring-hiring', 'supplier-audit'],
    budget: { spent: 62_000, total: 120_000 },
  },
]

export function portfolioFor(id: string | undefined): Portfolio | undefined {
  return portfolios.find((p) => p.id === id)
}

/** "$1.2M", "$84K", as the Budget column reads. */
export const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
