import alena from '../assets/people/alena.jpg'
import ann from '../assets/people/ann.jpg'
import carter from '../assets/people/carter.jpg'
import cooper from '../assets/people/cooper.jpg'
import davis from '../assets/people/davis.jpg'
import dulce from '../assets/people/dulce.jpg'
import kaiya from '../assets/people/kaiya.jpg'
import kaylynn from '../assets/people/kaylynn.jpg'
import lindsey from '../assets/people/lindsey.jpg'
import lydia from '../assets/people/lydia.jpg'
import mango from '../assets/people/mango.jpg'
import maria from '../assets/people/maria.jpg'
import nolan from '../assets/people/nolan.jpg'
import skylar from '../assets/people/skylar.jpg'
import talan from '../assets/people/talan.jpg'
import zain from '../assets/people/zain.jpg'
import grainBowl from '../assets/photos/grain-bowl.jpg'
import veggieVault from '../assets/veggie-vault.png'
import proteinPlates from '../assets/photos/protein-plates.jpg'
import { addDays } from './dates'
import { people } from './people'
import { profiles } from './posts'
import type { BrandPost, ContactNote, Customer, Ticket } from './types'

/**
 * Engage › All messages, as the Figma screens write it (`40005911:33580`,
 * `33732`, `33894`). The first seven tickets are the file's list, word for word;
 * the next five fill the collapsed rail, which draws twelve faces and no text.
 * Portraits are the file's own, pulled from the screens' image fills.
 */

export const customers: Customer[] = [
  { id: 'kaiya', handle: 'kaiya_franci', avatar: kaiya, location: 'Austin, TX' },
  { id: 'dulce', handle: 'dulce_kenter', avatar: dulce, location: 'Chicago, IL' },
  {
    id: 'talan',
    handle: 'talan_torff',
    name: 'Talan Torff',
    avatar: talan,
    location: 'Chicago, IL',
    followers: '10.4K',
    followsYou: true,
    tags: ['Regular', 'Lentil fan', 'Chicago'],
  },
  { id: 'lydia', handle: 'Lydia_Vetrovs', avatar: lydia },
  { id: 'maria', handle: 'Maria Vaccaro', name: 'Maria Vaccaro', avatar: maria },
  { id: 'zain', handle: 'zain.vetrovs', avatar: zain, followers: '2.1K' },
  { id: 'skylar', handle: 'Skylar Curtis', name: 'Skylar Curtis', avatar: skylar },
  { id: 'cooper', handle: 'cooper.eats', avatar: cooper, location: 'Denver, CO' },
  { id: 'kaylynn', handle: 'kaylynn_dorwart', avatar: kaylynn, followsYou: true },
  { id: 'nolan', handle: 'nolanbakes', avatar: nolan },
  { id: 'lindsey', handle: 'lindsey.bsky.social', avatar: lindsey },
  { id: 'mango', handle: 'mango.mia', avatar: mango },
  // Commenters on the Protein Plates post who have not written in.
  { id: 'alena', handle: 'alena_kenter', avatar: alena },
  { id: 'davis', handle: 'davis_levin', avatar: davis },
  { id: 'carter', handle: 'carter_dokidis', avatar: carter },
  { id: 'ann', handle: 'ann_emery', avatar: ann },
]

export function customerFor(id: string): Customer {
  return customers.find((c) => c.id === id)!
}

const today = new Date()
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const numericDate = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  day: 'numeric',
  year: '2-digit',
})

export const brandPosts: BrandPost[] = [
  {
    id: 'protein-plates',
    profileId: 'vv-threads',
    time: '9:00 am',
    body: 'The new Protein Plates are here… get yours today! 🥗',
    photo: proteinPlates,
    photoAlt: 'Four Protein Plates: grilled tofu, chicken and rice, salmon, and edamame',
    positive: 82,
    comments: 14,
    likes: 19,
    shares: 4,
    thread: [
      { id: 'c1', authorId: 'alena', body: 'Need these in my life asap 🙌', ago: '3s' },
      { id: 'c2', authorId: 'davis', body: 'Is the tofu one spicy?', ago: '3s' },
      {
        id: 'c3',
        authorId: 'talan',
        body: 'Excited to try the Protein Plates! Are lentils gone forever? My go-to for every bowl, even as my base.',
        ago: '3s',
        ticket: '1283',
        replies: [
          { id: 'c3a', authorId: 'carter', body: 'I hope not, lentils are my go-to!', ago: '3s' },
          { id: 'c3b', authorId: 'ann', body: '😩 noooooooo, that would be a bummer', ago: '3s' },
        ],
      },
      {
        id: 'c4',
        authorId: 'kaylynn',
        body: 'Ordering two tomorrow for the office.',
        ago: '3s',
        ticket: '1290',
      },
    ],
  },
  {
    id: 'smoothie-week',
    profileId: 'vv-instagram',
    time: '11:30 am',
    body: 'Smoothie Week starts now. Five bowls, five days, one very good week.',
    photo: grainBowl,
    photoAlt: 'A grain bowl with greens and seeds',
    positive: 91,
    comments: 8,
    likes: 64,
    shares: 6,
    thread: [
      { id: 's1', authorId: 'cooper', body: 'Which one has the most protein?', ago: '12m', ticket: '1288' },
      { id: 's2', authorId: 'mango', body: 'Mango one or nothing 🥭', ago: '1h', ticket: '1292' },
    ],
  },
]

export function brandPostFor(id: string): BrandPost {
  return brandPosts.find((p) => p.id === id)!
}

export const tickets: Ticket[] = [
  {
    number: '1281',
    customerId: 'kaiya',
    network: 'threads',
    subject: 'Asks for menu favorites',
    body: 'What is your favorite thing to get from @veggie_vault?',
    ago: '3s',
    status: 'new',
    priority: 'low',
    sentiment: 'positive',
    drafts: [
      'Honestly? The Harvest Bowl with extra roasted squash. What should we try next, @kaiya_franci?',
      'Ours is the Green Goddess wrap, but the team is split. What do you usually get?',
    ],
  },
  {
    number: '1282',
    customerId: 'dulce',
    network: 'threads',
    subject: 'Complains about smaller portions',
    body: 'What is going on with your portion sizes lately? The bowls look half empty compared to last month.',
    ago: '3s',
    status: 'new',
    priority: 'high',
    sentiment: 'negative',
    photo: grainBowl,
    photoAlt: 'A bowl from Veggie Vault',
    drafts: [
      "Sorry about that, @dulce_kenter. Our portions haven't changed, so this one missed the mark. Can you DM us your order number so we can make it right?",
      "That's not the bowl we mean to serve. DM us the location and we'll look into it today.",
    ],
  },
  {
    number: '1283',
    customerId: 'talan',
    network: 'threads',
    subject: 'Asks if lentils are gone',
    body: 'Excited to try the Protein Plates! Are lentils gone forever? My go-to for every bowl, even as my base.',
    ago: '3s',
    status: 'new',
    priority: 'low',
    sentiment: 'positive',
    assigneeId: 'nathan',
    viewers: ['nathan'],
    postId: 'protein-plates',
    replies: 2,
    note: `Assigned to Nathan Sanders from Customer Support inbox at 9:16 am on ${numericDate.format(today)}`,
    drafts: [
      'Not gone at all, @talan_torff! Lentils are still on the menu, and you can swap them in as the base of any Protein Plate. Thanks for being a regular, enjoy your next bowl!',
      "Lentils aren't going anywhere! Ask for them as the base on any Protein Plate. See you soon, @talan_torff.",
      'Good news: lentils stay. Any Protein Plate can be built on them, just ask at the counter.',
    ],
  },
  {
    number: '1284',
    customerId: 'lydia',
    network: 'reddit',
    subject: 'Recommends your protein bowls',
    body: 'You should check out u/Veggie_Vault, their protein bowls are elite',
    ago: '1m',
    status: 'new',
    priority: 'low',
    sentiment: 'positive',
    drafts: ['Thanks for the shout-out, u/Lydia_Vetrovs! Elite is going on the menu board.'],
  },
  {
    number: '1285',
    customerId: 'maria',
    network: 'facebook',
    subject: 'Wants an order status update',
    body: 'Could you please check on my order for me? Thanks!',
    ago: '4m',
    status: 'new',
    priority: 'medium',
    sentiment: 'neutral',
    drafts: [
      "Hi Maria, happy to check! Could you send us your order number in a DM? We'll look it up right away.",
    ],
  },
  {
    number: '1286',
    customerId: 'zain',
    network: 'tiktok',
    subject: 'Joke about smoothie bowls',
    body: 'When I hop on a meeting right after eating my Smoothie Bowl… teeth: purple. confidence: unmatched.',
    ago: '9m',
    status: 'new',
    priority: 'low',
    sentiment: 'neutral',
    drafts: ['The açaí smile is a power move. 💜'],
  },
  {
    number: '1287',
    customerId: 'skylar',
    network: 'facebook',
    subject: 'Checkout error needs help',
    body: 'I need some help. I keep getting an error when I check out.',
    ago: '11m',
    status: 'new',
    priority: 'low',
    sentiment: 'neutral',
    drafts: [
      "Sorry about that, Skylar! Could you DM us a screenshot of the error and the browser you're using? We'll get it fixed.",
    ],
  },
  {
    number: '1288',
    customerId: 'cooper',
    network: 'instagram',
    subject: 'Asks which bowl has the most protein',
    body: 'Which one has the most protein?',
    ago: '12m',
    status: 'in-progress',
    priority: 'low',
    sentiment: 'neutral',
    postId: 'smoothie-week',
    drafts: [
      'The PB Power bowl, with 24g! Add hemp seeds for another 6g, @cooper.eats.',
    ],
  },
  {
    number: '1289',
    customerId: 'nolan',
    network: 'x',
    subject: 'Asks about catering',
    body: 'Do you do catering for 30 people? Planning a team lunch for next Friday.',
    ago: '25m',
    status: 'new',
    priority: 'medium',
    sentiment: 'positive',
    drafts: [
      'We do! Send us a DM with the date and address and our catering team will put together a menu.',
    ],
  },
  {
    number: '1290',
    customerId: 'kaylynn',
    network: 'threads',
    subject: 'Plans a team order',
    body: 'Ordering two tomorrow for the office.',
    ago: '3s',
    status: 'new',
    priority: 'low',
    sentiment: 'positive',
    postId: 'protein-plates',
    drafts: ['Love that! Order ahead in the app and they will be ready when you walk in.'],
  },
  {
    number: '1291',
    customerId: 'lindsey',
    network: 'bluesky',
    subject: 'Reports a wrong order',
    body: 'Got someone else’s order today, no dressing and no fork. Not great.',
    ago: '48m',
    status: 'in-progress',
    priority: 'critical',
    sentiment: 'negative',
    drafts: [
      "That's on us, Lindsey, and we're sorry. DM us your receipt and we'll refund it and send a credit for your next bowl.",
    ],
  },
  {
    number: '1292',
    customerId: 'mango',
    network: 'instagram',
    subject: 'Loves the mango bowl',
    body: 'Mango one or nothing 🥭',
    ago: '1h',
    status: 'new',
    priority: 'none',
    sentiment: 'undefined',
    postId: 'smoothie-week',
    drafts: ['A person of taste. 🥭'],
  },
]

/** Closed tickets, shown under a customer's past conversations. */
export const pastTickets: Ticket[] = [
  {
    number: '1102',
    customerId: 'talan',
    network: 'threads',
    subject: 'Asks about gluten-free bowls',
    body: 'Do you have a gluten-free option for the bowls?',
    ago: '3w',
    status: 'complete',
    priority: 'low',
    sentiment: 'positive',
  },
  {
    number: '0987',
    customerId: 'talan',
    network: 'threads',
    subject: 'Wants the smoothie to stay',
    body: 'Loved the new smoothie, any chance it sticks around?',
    ago: '3w',
    status: 'complete',
    priority: 'low',
    sentiment: 'positive',
  },
  {
    number: '0912',
    customerId: 'dulce',
    network: 'threads',
    subject: 'Asks about opening hours',
    body: 'Are you open on the 4th?',
    ago: '2mo',
    status: 'complete',
    priority: 'low',
    sentiment: 'neutral',
  },
]

/**
 * How many past conversations the panel's count says. The file draws two and
 * counts five: the count is everything, the list is the latest.
 */
export const pastCounts: Record<string, number> = { talan: 5, dulce: 1 }

export const contactNotes: ContactNote[] = [
  {
    id: 'n1',
    customerId: 'talan',
    authorId: 'nathan',
    body: 'Regular since 2023. Prefers replies in DMs over public threads.',
    date: shortDate.format(addDays(today, -6)),
  },
  {
    id: 'n2',
    customerId: 'talan',
    authorId: 'katie',
    body: 'Flagged the lentil feedback to the menu team.',
    date: shortDate.format(addDays(today, -5)),
  },
  {
    id: 'n3',
    customerId: 'dulce',
    authorId: 'dana',
    body: 'Second portion complaint this month, both from the Wicker Park location.',
    date: shortDate.format(addDays(today, -12)),
  },
]

/** Whoever wrote a comment: a customer, a teammate, or the brand itself. */
export function authorOf(id: string): { name: string; avatar?: string } {
  const customer = customers.find((c) => c.id === id)
  if (customer) return { name: customer.handle, avatar: customer.avatar }
  const person = people.find((p) => p.id === id)
  if (person) return { name: person.name, avatar: person.avatar }
  const profile = profiles.find((p) => p.id === id)
  if (profile) return { name: profile.name, avatar: veggieVault }
  return { name: id }
}

/** The account a reply goes out from: the first one on the ticket's network. */
export function replyAccountFor(ticket: Ticket) {
  return profiles.find((p) => p.network === ticket.network)
}
