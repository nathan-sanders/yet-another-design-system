import type { Draft } from '../../data/drafts'
import { isPostType } from '../../data/postTypes'
import type { Idea, Post, PostFormat } from '../../data/types'
import { postDate } from '../calendar/model'
import { DEFAULT_PROFILE, emptyFields, networkOf, type ComposeFields } from './composeForm'

// How the composer starts from what it was opened on. Pure, so the idea → post
// hand-off is tested in node (`prefill.test.ts`).

/**
 * The format an idea's title asks for, where it says: "Reel: …" is a reel,
 * "IG Story: …" a story, "… carousel …" a carousel. A post otherwise.
 */
export function formatFromTitle(title: string): PostFormat {
  const lower = title.toLowerCase()
  if (/^(ig |instagram )?reel\b/.test(lower)) return 'reel'
  if (/^(ig |instagram )?stor(y|ies)\b/.test(lower)) return 'story'
  if (lower.includes('carousel')) return 'carousel'
  return 'post'
}

/**
 * The type a post or draft already has, on its own channel. Nothing when it
 * stored none, or one its network does not have, so the channel starts on its
 * network's first.
 */
function formatsOn(profileId: string, format: PostFormat | undefined): ComposeFields['formats'] {
  const network = networkOf(profileId)
  return network && format && isPostType(network, format) ? { [network]: format } : {}
}

/**
 * An idea becomes the post's first draft: its title is the opening line and
 * its notes the body, its photo the first media, and campaign, tags and
 * assignee carry straight over. The type the idea asks for goes on the
 * Instagram channel it starts on. The idea stays linked (`ideaId`) so the
 * board can follow the post from here.
 */
export function prefillFromIdea(idea: Idea): ComposeFields {
  const title = idea.title.replace(/^[^:]{1,24}:\s*/, '')
  const asked: PostFormat =
    formatFromTitle(idea.title) === 'post' && /carousel/i.test(idea.body)
      ? 'carousel'
      : formatFromTitle(idea.title)
  return {
    ...emptyFields(),
    profileIds: [DEFAULT_PROFILE],
    formats: formatsOn(DEFAULT_PROFILE, asked),
    caption: [title, idea.body].filter(Boolean).join('\n\n'),
    media: idea.image ? [idea.image] : [],
    campaignId: idea.campaignId,
    tagNames: idea.tagNames ?? [],
    assigneeId: idea.assigneeId,
    ideaId: idea.id,
  }
}

export function prefillFromDraft(draft: Draft): ComposeFields {
  return {
    ...emptyFields(),
    profileIds: [draft.profileId],
    formats: formatsOn(draft.profileId, draft.format),
    caption: draft.body,
    media: draft.photo ? [draft.photo] : [],
    firstComment: draft.firstComment ?? '',
    campaignId: draft.campaignId,
    tagNames: draft.tagNames ?? [],
    assigneeId: draft.assigneeId,
    needsApproval: draft.needsApproval ?? false,
    ideaId: draft.ideaId,
  }
}

export function prefillFromPost(post: Post): ComposeFields {
  return {
    ...emptyFields({ date: postDate(post), time: post.time }),
    profileIds: [post.profileId],
    formats: formatsOn(post.profileId, post.format),
    caption: post.body,
    media: post.photo ? [post.photo] : [],
    firstComment: post.firstComment ?? '',
    campaignId: post.campaignId,
    tagNames: post.tagNames ?? [],
    assigneeId: post.assigneeId,
    needsApproval: post.needsApproval ?? false,
    ideaId: post.ideaId,
  }
}
