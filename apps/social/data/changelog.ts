/**
 * What changed in Yet Social, release by release, newest first. Written from
 * the app's own pull requests: one release per day something shipped, in the
 * words a person using the app would want, with the PR behind each line.
 *
 * Unlike the rest of `data/`, these dates are real and absolute. A changelog
 * is history, so it does not slide with today the way the schedule does.
 */

export type ChangeKind = 'new' | 'improved' | 'fixed'

export interface Change {
  kind: ChangeKind
  text: string
  /** The pull request on GitHub, when the change had one of its own. */
  pr?: number
}

export interface Release {
  /** ISO date it shipped. */
  date: string
  title: string
  summary: string
  changes: Change[]
}

export const REPO = 'https://github.com/nathan-sanders/yet-another-design-system'

export const changeKinds: Record<
  ChangeKind,
  { label: string; color: 'emerald' | 'blue' | 'amber' }
> = {
  new: { label: 'New', color: 'emerald' },
  improved: { label: 'Improved', color: 'blue' },
  fixed: { label: 'Fixed', color: 'amber' },
}

export const releases: Release[] = [
  {
    date: '2026-10-30',
    title: 'Settings, and post types for every network',
    summary:
      'Settings opens from your account menu, with every page built. The composer now knows what each network can post.',
    changes: [
      { kind: 'new', text: 'Settings, with the changelog as its first page.' },
      {
        kind: 'new',
        text: 'Settings › Billing: your plan, Yak credits this cycle, the card on file and past invoices.',
        pr: 366,
      },
      {
        kind: 'new',
        text: 'Settings › General, Notifications, Channels, Team and Integrations. Switch the theme, choose what notifies you, see which channel needs reconnecting, and invite people up to your plan’s seats.',
      },
      {
        kind: 'new',
        text: 'The composer offers only the post types each network publishes, and each channel keeps its own: a Reel on Instagram is a Video on TikTok.',
        pr: 362,
      },
      {
        kind: 'fixed',
        text: 'A long description beside a checkbox, radio or switch wraps instead of running off the edge.',
        pr: 363,
      },
      {
        kind: 'improved',
        text: 'Column names stay at the top of a table while you scroll it, starting with your Reports list.',
        pr: 365,
      },
    ],
  },
  {
    date: '2026-10-29',
    title: 'Campaigns',
    summary:
      'Plan › Campaigns gathers every post, idea, creator and asset behind a launch, and each campaign gets a page of its own.',
    changes: [
      {
        kind: 'new',
        text: 'Plan › Campaigns, as a table or as a timeline you can page through twelve weeks at a time.',
        pr: 354,
      },
      {
        kind: 'new',
        text: 'A page for every campaign, with an overview of what is published, scheduled and missing, and a way to cancel it.',
        pr: 355,
      },
      {
        kind: 'new',
        text: 'A campaign’s Plan tab spots empty days in its schedule before they happen.',
        pr: 356,
      },
      { kind: 'new', text: 'Ideas, Creators and Assets tabs on a campaign page.', pr: 357 },
      {
        kind: 'new',
        text: 'A campaign’s Measure tab, a report built for that campaign alone.',
        pr: 360,
      },
      {
        kind: 'improved',
        text: 'A campaign row opens its details beside the list, and the breadcrumb marks where you are.',
        pr: 361,
      },
    ],
  },
  {
    date: '2026-10-22',
    title: 'Asset library',
    summary:
      'Every photo and video your team uses lives in one library, and Engage gains the views a busy inbox needs.',
    changes: [
      {
        kind: 'new',
        text: 'The asset library: folders, saved views, file details, and drag-and-drop upload.',
        pr: 351,
      },
      {
        kind: 'new',
        text: 'Engage › All assignments, Spam and Complete, with live counts in the nav.',
        pr: 334,
      },
      {
        kind: 'new',
        text: 'Click an empty hour on the calendar to start a post at that time.',
        pr: 332,
      },
      { kind: 'new', text: 'Create a tag right from the Tags field.', pr: 348 },
      { kind: 'improved', text: 'Tags and notes on a contact can be edited in place.', pr: 352 },
      {
        kind: 'improved',
        text: 'A day picked in the month view opens laid out like the day view.',
        pr: 333,
      },
      {
        kind: 'improved',
        text: 'Measure no longer lists Alerts, which had nothing behind it.',
        pr: 335,
      },
    ],
  },
  {
    date: '2026-10-21',
    title: 'The composer',
    summary: 'Write a post, ask Yak for help beside it, and drag work straight onto the calendar.',
    changes: [
      { kind: 'new', text: 'The post composer, with a live preview for each network.', pr: 325 },
      {
        kind: 'new',
        text: 'Yak opens beside the composer and can rewrite, shorten or suggest as you go.',
        pr: 326,
      },
      { kind: 'new', text: 'Every idea gets a page of its own.', pr: 327 },
      {
        kind: 'new',
        text: 'Drag a post to reschedule it, or drag a draft from the Drafts panel onto the calendar.',
        pr: 318,
      },
      {
        kind: 'new',
        text: 'Add widget opens a catalog of every widget: click one to add it, or drag it into place.',
        pr: 316,
      },
      { kind: 'new', text: 'Private messages read as a chat in the inbox.', pr: 323 },
      { kind: 'improved', text: 'My inbox splits into Open and Complete.', pr: 322 },
      {
        kind: 'improved',
        text: 'Calendar top bars lose their create buttons; New in the nav does that job everywhere.',
        pr: 313,
      },
      {
        kind: 'improved',
        text: 'A post’s detail panel is reorganized around the post itself.',
        pr: 324,
      },
    ],
  },
  {
    date: '2026-10-20',
    title: 'Notifications',
    summary: 'The bell in the nav opens everything that needs you, in one panel.',
    changes: [
      { kind: 'new', text: 'The Notifications panel.', pr: 312 },
      {
        kind: 'improved',
        text: 'A similar creator opens on top of the one you were looking at, so Back takes you there.',
        pr: 311,
      },
    ],
  },
  {
    date: '2026-10-19',
    title: 'Home',
    summary:
      'Yet Social now opens on a daily brief from Yak, and every number in Measure leads to the posts behind it.',
    changes: [
      {
        kind: 'new',
        text: 'Home: your daily brief, with today’s tasks and the week ahead.',
        pr: 304,
      },
      {
        kind: 'new',
        text: 'A New button in the nav for posts, ideas, notes and reports.',
        pr: 275,
      },
      {
        kind: 'new',
        text: 'Notes on the calendar that span days, like a campaign window.',
        pr: 286,
      },
      { kind: 'new', text: 'Engage › Comments by post.', pr: 285 },
      { kind: 'new', text: 'New report, with eight report types to start from.', pr: 296 },
      {
        kind: 'new',
        text: 'Click a day, a slice, a bar or a row in Measure to read the messages behind it.',
        pr: 281,
      },
      {
        kind: 'new',
        text: 'Your account menu, with your status, from your name in the nav.',
        pr: 302,
      },
      { kind: 'improved', text: '“+3 more” in the month view opens the whole day.', pr: 295 },
      {
        kind: 'fixed',
        text: 'Past days in the month view no longer shade over their posts.',
        pr: 290,
      },
    ],
  },
  {
    date: '2026-10-18',
    title: 'Measure and Yak',
    summary: 'Reports, trends and creators arrive, and Yak takes over search.',
    changes: [
      {
        kind: 'new',
        text: 'Measure › Reports: build a board of widgets and rearrange it by dragging.',
        pr: 261,
      },
      { kind: 'new', text: 'Measure › Discover, for what people are saying about you.', pr: 264 },
      { kind: 'new', text: 'Plan › Creators, and Yak as a full page.', pr: 265 },
      { kind: 'new', text: 'Creator details, and the full list of creators.', pr: 269 },
      { kind: 'new', text: 'Plan › Ideas, a board you drag ideas across.', pr: 274 },
      {
        kind: 'improved',
        text: 'Ask Yak from the bar at the bottom of any page; it replaces search.',
        pr: 266,
      },
      { kind: 'improved', text: 'Yak’s mark scribbles while it is thinking.', pr: 268 },
    ],
  },
  {
    date: '2026-10-17',
    title: 'First release',
    summary:
      'Yet Social opens with a calendar of every scheduled post and an inbox for every reply.',
    changes: [
      {
        kind: 'new',
        text: 'The calendar, by week, month or day, and the details of every post.',
        pr: 230,
      },
      {
        kind: 'new',
        text: 'Engage › All messages, with the conversation and the contact beside it.',
        pr: 238,
      },
      {
        kind: 'new',
        text: 'Published posts show their stats, comments, activity and performance.',
        pr: 244,
      },
      { kind: 'new', text: 'My inbox, for the messages assigned to you.', pr: 253 },
      {
        kind: 'new',
        text: 'Internal notes your team can reply to, on posts and messages.',
        pr: 260,
      },
      {
        kind: 'fixed',
        text: 'On a phone, the inbox no longer opens a message by itself.',
        pr: 254,
      },
    ],
  },
]
