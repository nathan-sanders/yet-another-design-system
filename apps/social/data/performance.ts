import { postMoment } from "../screens/calendar/model";
import { authorOf } from "./inbox";
import { personFor } from "./people";
import { profileFor } from "./posts";
import type {
  Network,
  Post,
  PostEvent,
  PostReply,
  PostStats,
  TicketSentiment,
} from "./types";

// What a published post did: its numbers, the public comments under it and
// the log of everything that happened to it. Generated from the post's id, so
// every past post has a full, stable story without writing twenty by hand —
// except the Facebook post the comments screenshot was drawn for (`p-10`),
// whose thread is written out.

const HOUR = 60 * 60 * 1000;

/** mulberry32, seeded from the post id: the same post always gets the same numbers. */
function seeded(id: string) {
  let seed = [...id].reduce(
    (h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761),
    0x9e3779b9,
  );
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where a network's posts land, roughly: Instagram travels, X does not. */
const REACH: Record<Network, number> = {
  instagram: 4200,
  facebook: 2600,
  threads: 1800,
  x: 1200,
  reddit: 900,
  tiktok: 5200,
  bluesky: 700,
};

const statsCache = new Map<string, PostStats>();

export function statsFor(post: Post): PostStats {
  const cached = statsCache.get(post.id);
  if (cached) return cached;
  const random = seeded(post.id);
  const base = REACH[profileFor(post).network] * (post.photo ? 1 : 0.55);
  const impressions = Math.round(base * (0.6 + random()));
  const reach = Math.round(impressions * (0.62 + random() * 0.2));
  const likes = Math.round(impressions * (0.018 + random() * 0.03));
  const comments =
    post.comments ?? Math.round(likes * (0.12 + random() * 0.25));
  const stats: PostStats = {
    impressions,
    reach,
    likes,
    comments,
    shares: Math.round(likes * (0.05 + random() * 0.2)),
    saves: Math.round(likes * (0.1 + random() * 0.3)),
    clicks: Math.round(impressions * (0.004 + random() * 0.012)),
    positive: Math.round(72 + random() * 26),
    unread: Math.min(comments, Math.round(random() * 8)),
  };
  statsCache.set(post.id, stats);
  return stats;
}

/** Everything someone did to the post, not just saw it. */
export function engagementsOf(stats: PostStats): number {
  return (
    stats.likes + stats.comments + stats.shares + stats.saves + stats.clicks
  );
}

/**
 * The account's average post, which every trend is measured against. A
 * percent change, as `Metric`'s `trend` takes it.
 */
export function trendFor(
  post: Post,
  key: "impressions" | "reach" | "engagements" | "clicks" | "rate",
): number {
  const random = seeded(`${post.id}-${key}`);
  return Math.round((random() - 0.35) * 40);
}

/**
 * Impressions per hour over the post's first day, as the Performance tab's
 * area chart takes them: a fast climb in the first two hours, then a long tail.
 */
export function firstDayImpressions(
  post: Post,
): { date: string; impressions: number }[] {
  const random = seeded(`${post.id}-hours`);
  const total = statsFor(post).impressions * 0.8;
  const start = postMoment(post).getTime();
  const shape = Array.from(
    { length: 24 },
    (_, i) => Math.exp(-((i - 1.5) ** 2) / 6) + 0.25 * Math.exp(-i / 8),
  );
  const sum = shape.reduce((a, b) => a + b, 0);
  return shape.map((weight, i) => ({
    date: new Date(start + i * HOUR).toISOString(),
    impressions: Math.round(((total * weight) / sum) * (0.85 + random() * 0.3)),
  }));
}

// Comments

/** Written out for `p-10`, after the comments tab Nathan drew. */
const NEW_FRIENDS_THREAD: PostReply[] = [
  {
    id: "nf-1",
    authorId: "cooper",
    body: "I came across your page in search of a local cafe that offers plant-based options and I feel like I’ve found the perfect place! You’ve all formed a wonderful community around not only your restaurant, but the habit of healthy and holistic eating. Giving back to the planet by using the fresh produce it has to offer, just like in your bowls, is so important!",
    ago: "3h",
    ticket: "1301",
    sentiment: "positive",
  },
  {
    id: "nf-2",
    authorId: "maria",
    body: "Trying to pick my favorite thing is like asking me to pick my favorite child… it’s the harvest bowl 😅",
    ago: "3h",
    ticket: "1302",
    sentiment: "positive",
    replies: [
      {
        id: "nf-2a",
        authorId: "zain",
        body: "😋 I love the smoked salmon harvest bowl so good!",
        ago: "2h",
        ticket: "1303",
        sentiment: "positive",
        replies: [
          {
            id: "nf-2a1",
            authorId: "nolan",
            body: "wait when did Veggie Vault get smoked salmon?",
            ago: "2h",
            ticket: "1304",
            sentiment: "neutral",
          },
        ],
      },
      {
        id: "nf-2b",
        authorId: "skylar",
        body: "Harvest bowl for the win, I get one once a week",
        ago: "1h",
        ticket: "1305",
        sentiment: "positive",
      },
      {
        id: "nf-2c",
        authorId: "lindsey",
        body: "Harvest bowl is my go-to as well",
        ago: "58m",
        ticket: "1306",
        sentiment: "neutral",
      },
    ],
  },
  {
    id: "nf-3",
    authorId: "kaylynn",
    body: "I’m loving anything with the vegan bacon 🥓🌿",
    ago: "40m",
    ticket: "1307",
    sentiment: "positive",
  },
  {
    id: "nf-4",
    authorId: "dulce",
    body: "Is the new location open on Sundays?",
    ago: "12m",
    ticket: "1308",
    sentiment: "neutral",
  },
];

/** Lines the generated threads draw from. */
const POOL: { authorId: string; body: string; sentiment: TicketSentiment }[] = [
  {
    authorId: "alena",
    body: "Need this in my life asap 🙌",
    sentiment: "positive",
  },
  {
    authorId: "davis",
    body: "Is it spicy? Asking for my mom.",
    sentiment: "neutral",
  },
  {
    authorId: "carter",
    body: "Stopped by yesterday, the staff were so kind.",
    sentiment: "positive",
  },
  {
    authorId: "ann",
    body: "The portions have been smaller lately 😕",
    sentiment: "negative",
  },
  { authorId: "mango", body: "Mango version when?? 🥭", sentiment: "neutral" },
  {
    authorId: "kaiya",
    body: "Ordering this for the office on Friday.",
    sentiment: "positive",
  },
  {
    authorId: "lydia",
    body: "Does this come gluten free?",
    sentiment: "neutral",
  },
  {
    authorId: "talan",
    body: "Best lunch in Chicago, not even close.",
    sentiment: "positive",
  },
  {
    authorId: "zain",
    body: "Waited 25 minutes for pickup today.",
    sentiment: "negative",
  },
  {
    authorId: "skylar",
    body: "Obsessed with this photo 😍",
    sentiment: "positive",
  },
];

const AGES = ["5m", "18m", "42m", "1h", "3h", "6h", "1d", "2d"];

const threadCache = new Map<string, PostReply[]>();

/** The public comments under a published post, newest last. */
export function commentsFor(post: Post): PostReply[] {
  if (post.id === "p-10") return NEW_FRIENDS_THREAD;
  const cached = threadCache.get(post.id);
  if (cached) return cached;
  const random = seeded(`${post.id}-thread`);
  const count = Math.min(statsFor(post).comments, 2 + Math.floor(random() * 4));
  const offset = Math.floor(random() * POOL.length);
  const number = 1320 + Math.floor(random() * 600);
  const thread = Array.from({ length: count }, (_, i): PostReply => {
    const line = POOL[(offset + i * 3) % POOL.length]!;
    return {
      id: `${post.id}-c${i}`,
      ...line,
      ago: AGES[AGES.length - 1 - Math.min(i, AGES.length - 1)]!,
      ticket: String(number + i),
    };
  });
  threadCache.set(post.id, thread);
  return thread;
}

/** Every comment in a thread, replies included. */
export function flatten(thread: PostReply[]): PostReply[] {
  return thread.flatMap((c) => [c, ...flatten(c.replies ?? [])]);
}

// Activity

/**
 * The post's log, oldest first: who made it and approved it, when it was
 * scheduled and went out, then what the audience and the team did after.
 * Team notes are folded in by the panel, which owns the notes added live.
 */
export function eventsFor(post: Post): PostEvent[] {
  const random = seeded(`${post.id}-events`);
  const out = postMoment(post);
  const at = (hours: number) => new Date(out.getTime() + hours * HOUR);
  const stats = statsFor(post);
  const network = profileFor(post).network;
  const networkName = {
    instagram: "Instagram",
    facebook: "Facebook",
    threads: "Threads",
    x: "X",
    reddit: "Reddit",
    tiktok: "TikTok",
    bluesky: "Bluesky",
  }[network];
  const approver = personFor("katie");
  const thread = flatten(commentsFor(post));
  // The team's steps land on working hours, days before the post went out.
  const daysBefore = (days: number) => {
    const day = new Date(out.getTime() - days * 24 * HOUR);
    day.setHours(9 + Math.floor(random() * 8), Math.floor(random() * 60));
    return day;
  };
  const created = daysBefore(4 + Math.floor(random() * 3));
  const approved = daysBefore(2);
  const events: PostEvent[] = [
    {
      id: "created",
      kind: "created",
      actorId: "nathan",
      text: "created the post",
      at: created,
    },
    {
      id: "approved",
      kind: "approved",
      actorId: approver.id,
      text: "approved it",
      at: approved,
    },
    {
      id: "scheduled",
      kind: "scheduled",
      actorId: "nathan",
      text: "scheduled it",
      at: new Date(approved.getTime() + (0.3 + random()) * HOUR),
    },
    {
      id: "published",
      kind: "published",
      text: `Published to ${networkName}`,
      at: out,
    },
  ];
  if (thread[0]) {
    events.push({
      id: "first-comment",
      kind: "comment",
      text: `First comment, from ${authorOf(thread[0].authorId).name}, opened ticket #${thread[0].ticket}`,
      at: at(0.2 + random()),
    });
  }
  const milestone =
    stats.impressions >= 1000
      ? Math.floor(stats.impressions / 1000) * 1000
      : 500;
  events.push({
    id: "milestone",
    kind: "milestone",
    text: `Passed ${milestone.toLocaleString("en-US")} impressions`,
    at: at(3 + random() * 6),
  });
  const negative = thread.find((c) => c.sentiment === "negative");
  if (negative) {
    events.push({
      id: "assigned",
      kind: "assigned",
      actorId: "nathan",
      text: `assigned ticket #${negative.ticket} to Dana Okafor`,
      at: at(1 + random() * 4),
    });
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
