export type Network = 'instagram' | 'facebook' | 'x' | 'threads' | 'reddit' | 'tiktok' | 'bluesky'

/** A connected social account the brand posts from. */
export interface Profile {
  id: string
  network: Network
  /** What the network shows: `veggie_vault`, or `Veggie Vault` on Facebook. */
  name: string
}

export interface Person {
  id: string
  name: string
  avatar?: string
}

export interface PostComment {
  id: string
  authorId: string
  body: string
  /** How long ago, as the activity feed prints it. */
  ago: string
}

export interface Post {
  id: string
  profileId: string
  /** Weeks from the Figma week: 0 is that week, -1 the one before. */
  week: number
  /** 0 is Sunday and 1 is Monday, Figma's "today" — see `postDate`. */
  day: number
  /** 24-hour `HH:MM`. */
  time: string
  body: string
  photo?: string
  photoAlt?: string
  /** Tag count, the `Tags` pill. */
  tags?: number
  /** Comment count, shown once a post is published. */
  comments?: number
  /** The team's internal discussion, in the post detail panel. */
  thread?: PostComment[]
}

// Engage — the inbox. Customers write in on a network; each message is a ticket.

/** Someone outside the brand: who wrote in, and who the contact panel describes. */
export interface Customer {
  id: string
  /** The network handle, shown everywhere: `talan_torff`. */
  handle: string
  /** Their real name, when the network gives one. */
  name?: string
  avatar: string
  location?: string
  /** Pre-formatted, as the panel's Token prints it: `10.4K`. */
  followers?: string
  followsYou?: boolean
  tags?: string[]
}

export type TicketStatus = 'new' | 'in-progress' | 'on-hold' | 'complete'
export type TicketPriority = 'none' | 'low' | 'medium' | 'high' | 'critical'
/** `undefined` is a value here — Yak could not tell — not a missing field. */
export type TicketSentiment = 'positive' | 'neutral' | 'negative' | 'undefined'

/** What the detail view's menus can change on a ticket. */
export type TicketEdit = Partial<Pick<Ticket, 'status' | 'assigneeId' | 'priority' | 'sentiment'>>

/** A comment on a brand post, or the brand's reply under one. */
export interface ThreadComment {
  id: string
  /** A customer id, or a profile id when the brand replied. */
  authorId: string
  body: string
  ago: string
  /** The ticket it opened, if it did. */
  ticket?: string
  replies?: ThreadComment[]
}

/** A post of the brand's that customers are replying to. */
export interface BrandPost {
  id: string
  profileId: string
  time: string
  body: string
  photo?: string
  photoAlt?: string
  positive: number
  comments: number
  likes: number
  shares: number
  thread: ThreadComment[]
}

export interface Ticket {
  /** The ticket number, without the `#`: `1283`. */
  number: string
  customerId: string
  network: Network
  /** Yak's one-line summary — Figma's `Summary Label`. */
  subject: string
  body: string
  ago: string
  status: TicketStatus
  priority: TicketPriority
  sentiment: TicketSentiment
  /** A person id. Unassigned when missing. */
  assigneeId?: string
  /** Teammates who have the conversation open right now. */
  viewers?: string[]
  photo?: string
  photoAlt?: string
  /** The brand post this is a comment on. A DM has none. */
  postId?: string
  /** Replies under the customer's comment. */
  replies?: number
  /** Yak's suggested replies, cycled by "Try again". */
  drafts?: string[]
  /** The system line under the message: an assignment, a routing. */
  note?: string
}

/** The team's private note on a customer, in the contact panel. */
export interface ContactNote {
  id: string
  customerId: string
  authorId: string
  body: string
  /** Already formatted: `Jun 20`. */
  date: string
}
