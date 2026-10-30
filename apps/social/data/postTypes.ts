import type { Network, PostFormat } from './types'

/**
 * The post types each network lets a scheduler publish, in the order the
 * composer's strip shows them; the first is where a channel starts. From
 * Nathan's *Post Types by Social Network* doc (2026-10-29). Formats only the
 * native app can make (Instagram Live and Notes) are left out, and Reddit,
 * which the doc does not cover, takes its own submit tabs. Threads' "Image or
 * carousel" is one type here, since a second image is what makes the carousel.
 */
export const POST_TYPES: Record<Network, { value: PostFormat; label: string }[]> = {
  instagram: [
    { value: 'post', label: 'Post' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'reel', label: 'Reel' },
    { value: 'trial-reel', label: 'Trial reel' },
    { value: 'story', label: 'Story' },
  ],
  facebook: [
    { value: 'post', label: 'Post' },
    { value: 'reel', label: 'Reel' },
    { value: 'story', label: 'Story' },
  ],
  tiktok: [
    { value: 'video', label: 'Video' },
    { value: 'carousel', label: 'Photo carousel' },
    { value: 'inbox-draft', label: 'Draft to inbox' },
  ],
  x: [
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'gif', label: 'GIF' },
    { value: 'link', label: 'Link' },
    { value: 'poll', label: 'Poll' },
    { value: 'thread', label: 'Thread' },
  ],
  threads: [
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'poll', label: 'Poll' },
    { value: 'thread', label: 'Thread' },
  ],
  bluesky: [
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'link-card', label: 'Link card' },
    { value: 'thread', label: 'Thread' },
  ],
  reddit: [
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'link', label: 'Link' },
    { value: 'poll', label: 'Poll' },
  ],
}

/** Where a channel starts: its network's first type. */
export function defaultPostType(network: Network): PostFormat {
  return POST_TYPES[network][0]!.value
}

/** Whether the network has this type at all. */
export function isPostType(network: Network, format: PostFormat): boolean {
  return POST_TYPES[network].some((type) => type.value === format)
}

/**
 * The type as its network names it ("Photo carousel" on TikTok). A post that
 * stored no type reads "Post", as it always has.
 */
export function postTypeLabel(network: Network, format: PostFormat | undefined): string {
  if (!format) return 'Post'
  return POST_TYPES[network].find((type) => type.value === format)?.label ?? 'Post'
}
