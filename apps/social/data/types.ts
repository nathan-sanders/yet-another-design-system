export type Network = 'instagram' | 'facebook' | 'x' | 'threads' | 'reddit' | 'tiktok' | 'bluesky'

/** Each network's name, as its own brand writes it. */
export const NETWORK_NAMES: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  threads: 'Threads',
  reddit: 'Reddit',
  tiktok: 'TikTok',
  bluesky: 'Bluesky',
}

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
  /** Presence, the dot on their face in a note. */
  status?: 'online' | 'offline'
}

export interface PostComment {
  id: string
  authorId: string
  body: string
  /** How long ago, as the activity feed prints it. */
  ago: string
  /** Notes answering this one, drawn one step in under it. */
  replies?: PostComment[]
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

/**
 * The ten colors Figma's `Calendar Note` set (`40005949:63968`) offers. The file
 * names two of them `Magenta` and `Aqua`, which the library has no tokens for;
 * they are drawn here in `fuchsia` and `cyan` — see FINDINGS.md.
 */
export type NoteColor =
  | 'neutral'
  | 'green'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'fuchsia'
  | 'cyan'

/** A day in the Figma week's terms, as a `Post` places itself. */
export interface CalendarDay {
  week: number
  day: number
}

/**
 * A note pinned across one or more days of the calendar — a campaign's run, an
 * event to plan around. The team writes them; they are not posts.
 */
export interface CalendarNote {
  id: string
  title: string
  description?: string
  color: NoteColor
  /** Both ends inclusive. */
  start: CalendarDay
  end: CalendarDay
}

// Engage — the inbox. Customers write in on a network; each message is a ticket.

/** Someone outside the brand: who wrote in, and who the contact panel describes. */
export interface Customer {
  id: string
  /** The network handle, shown everywhere: `talan_torff`. */
  handle: string
  /** Their real name, when the network gives one. */
  name?: string
  /** Absent for accounts with no photo; Avatar draws their initials. */
  avatar?: string
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

/** One message in a ticket's `history`. */
export interface TicketReply {
  id: string
  /** A customer id, or a brand profile id for a reply the team sent. */
  authorId: string
  body: string
  ago: string
  /** The teammate who sent a brand reply, shown under it. A person id. */
  sentBy?: string
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
  /**
   * Teammates who have this conversation open right now, not counting you:
   * your own face follows whichever message you open (`withViewer` in
   * `screens/inbox/model.ts`).
   */
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
  /**
   * The conversation after the first message, from before this session: the
   * brand's replies (a profile id) and the customer's answers, oldest first.
   */
  history?: TicketReply[]
  /** The Measure mention it was opened from ("Open in Engage"), if it was. */
  mentionId?: string
  /**
   * Something here you have not seen: the message itself, never opened, or a
   * reply in its conversation since you last opened it. Either way the card
   * shows the file's `New Indicator`; this only changes what it says aloud.
   * Opening the ticket clears it (`markTicketSeen`).
   */
  unseen?: 'message' | 'reply'
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

// Plan — what a post did once it went out.

/** A public comment on a published post. Each one is a ticket, as in the inbox. */
export interface PostReply {
  id: string
  /** A customer id, or a profile id when the brand replied. */
  authorId: string
  body: string
  ago: string
  /** The ticket number, without the `#`. */
  ticket: string
  sentiment: TicketSentiment
  replies?: PostReply[]
}

/** The numbers a published post earned. Counts, except `positive`, a percent. */
export interface PostStats {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  /** Share of comments Yak read as positive, 0–100. */
  positive: number
  /** Comments nobody on the team has opened yet. */
  unread: number
}

/** One line in a post's activity log. */
export interface PostEvent {
  id: string
  kind:
    | 'created'
    | 'note'
    | 'approved'
    | 'scheduled'
    | 'published'
    | 'comment'
    | 'milestone'
    | 'assigned'
  /** A person id, when someone did it. The system did it otherwise. */
  actorId?: string
  /** What happened, after the actor's name. */
  text: string
  at: Date
}

// Measure › Reports

/**
 * The three kinds of report on Measure › Reports (`40005911:34877`), each with
 * its badge color: a topic monitor (pink), a custom report (blue) and one of
 * Yet's own built-in reports (green).
 */
export type ReportKind = 'topic' | 'custom' | 'builtin'

/**
 * What a new report is for, picked from New report's first step. Each one
 * opens on a board of its own (`boardFixture`); `blank` opens on none. The
 * fixtures written before the picker existed have no type.
 */
export type ReportType =
  'media' | 'listening' | 'competitive' | 'crisis' | 'campaign' | 'trend' | 'performance' | 'blank'

export interface Report {
  id: string
  name: string
  kind: ReportKind
  /** Minutes since the last edit; absent on built-in reports nobody has edited. */
  editedMinutes?: number
  /** The badge that stands in for the edit time on a built-in report. */
  status?: 'new' | 'updated'
  /** A person's id, or `'yet'` for a built-in report. */
  createdBy: string
  /** `'all'`, or the first faces shown and how many more there are. */
  sharedWith: 'all' | { people: string[]; more: number }
  delivery?: 'Daily' | 'Weekly' | 'Monthly'
  /** What the report tracks, first the one it is about. Its trend lines. */
  topics: string[]
  /** The template it was made from, for a report made in this session. */
  type?: ReportType
  /** Where its numbers come from, as set when it was made. */
  sources?: WidgetSources
}

/** The panel's Visualization options (`_Pulse Viz Option`, `40005872:24935`). */
export type WidgetViz = 'line' | 'area' | 'bar' | 'donut' | 'metric' | 'table'

/**
 * What a widget is. `chart` widgets are a measure across a set of series, and
 * can be drawn as any `WidgetViz`; the other four have a shape of their own.
 */
export type WidgetKind =
  | 'chart'
  | 'overview'
  | 'stories'
  | 'voices'
  | 'spikes'
  /** New articles and posts as they are found, with the interactions each is predicted to reach. */
  | 'feed'
  /** How much was written against how much people engaged with it, on one time axis. */
  | 'timeline'
  /** Discover's brand sentiment: the gauge, and what the brand is praised and criticized for. */
  | 'sentiment'
  /** Discover's trending topics. */
  | 'trending'
  /** The brand's own best published posts. */
  | 'posts'

export type WidgetMeasure = 'mentions' | 'engagements' | 'reach'

export type WidgetSources = 'all' | 'social' | 'news'

export type GroupBy = 'hour' | 'day' | 'week'

export interface Widget {
  id: string
  kind: WidgetKind
  title: string
  viz: WidgetViz
  measure: WidgetMeasure
  /** The series a chart draws, in order — color and marker come from position. */
  series: string[]
  sources: WidgetSources
  groupBy: GroupBy
  /** The Edit panel's three switches. */
  compare: boolean
  spikes: boolean
  legend: boolean
}

export interface Story {
  id: string
  title: string
  outlet: string
  /** A social network, or `news` / `web` for an outlet with no network mark. */
  source: Network | 'news' | 'web'
  sourceLabel: string
  hoursAgo: number
  engagements: number
  /** Engagements per hour, right now. */
  velocity: number
  sentiment: 'Positive' | 'Neutral' | 'Negative'
}

/** A story in a live feed: just found, and how far it is expected to go. */
export interface FeedItem extends Story {
  /** Minutes since it was found. */
  foundMinutes: number
  /** The interactions it is predicted to have 24 hours after publishing. */
  predicted: number
}

export interface Voice {
  id: string
  name: string
  handle: string
  source: Network | 'web'
  mentions: number
  reach: number
}

export interface Spike {
  id: string
  title: string
  detail: string
  icon: 'zap' | 'up' | 'flame' | 'megaphone' | 'down'
  change: string
  tone: 'red' | 'green' | 'yellow' | 'neutral'
}

/** A campaign an idea can belong to. Campaigns has no screen yet, so this is all it is. */
export interface Campaign {
  id: string
  name: string
}

/** One card on Plan › Ideas: a post that has not been written yet. */
export interface Idea {
  id: string
  title: string
  body: string
  image?: string
  campaignId?: string
}

/** A column on the Ideas board. Figma calls them groups ("New group"). */
export interface IdeaGroup {
  id: string
  name: string
}

// Measure — the mentions behind a number

export type MentionSentiment = 'positive' | 'neutral' | 'negative'

/** A reply under a mention, from someone else on the network. */
export interface MentionReply {
  id: string
  /** A customer id, or a profile id when the brand replied. */
  authorId: string
  body: string
  /** Hours since it was posted. */
  hoursAgo: number
}

/**
 * One public post that counts toward a number on Measure: a mention of the
 * brand or a rival, or a post in a trend. Authors are inbox `customers`, so
 * one can be opened in Engage as a ticket.
 */
export interface Mention {
  id: string
  authorId: string
  network: Network
  /** Hours since it was posted. */
  hoursAgo: number
  body: string
  photo?: string
  sentiment: MentionSentiment
  /** The brand or topic it counts toward, as a report's series names it. */
  topic: string
  likes: number
  shares: number
  /** The replies under it, oldest first. Its comment count is their length. */
  thread: MentionReply[]
}
