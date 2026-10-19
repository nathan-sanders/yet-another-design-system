import { addDays, startOfDay } from '../../data/dates'
import { statsFor } from '../../data/performance'
import { posts } from '../../data/posts'
import type { Post } from '../../data/types'
import { isPublished, postDate } from '../calendar/model'

/** The brand's published posts in the last `days`, best first by impressions. */
export function topPosts(days: number): Post[] {
  const from = addDays(startOfDay(new Date()), -(days - 1))
  return posts
    .filter((post) => isPublished(post) && postDate(post) >= from)
    .sort((a, b) => statsFor(b).impressions - statsFor(a).impressions)
    .slice(0, 4)
}
