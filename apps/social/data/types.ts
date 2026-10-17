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
  /** Weeks from the current one: 0 is this week, -1 last week. */
  week: number
  /** 0 is Sunday — the calendar's weeks start on Sunday, as Figma draws them. */
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
