import { useCallback, useState } from 'react'

import type { Draft } from '../../data/drafts'
import { profiles } from '../../data/posts'
import { defaultPostType } from '../../data/postTypes'
import type { Network, PostFormat } from '../../data/types'
import type { DraftInput, PostInput, ScheduleAt } from '../calendar/scheduleState'

/**
 * Everything the composer edits. One post in the form can go out on several
 * channels: posts stay one channel each in the data, so saving fans out to one
 * draft or post per chosen profile, all sharing the caption and media. A
 * network can carry its own caption (`captions`), which is what lets Yak write
 * "the Threads version" into one tab while Instagram keeps the original. The
 * post type is always per network (`formats`), because the networks do not
 * share a list of types: a Reel on Instagram is a Video on TikTok.
 */
export interface ComposeFields {
  profileIds: string[]
  /** Each network's post type; a network not in here is on its first. */
  formats: Partial<Record<Network, PostFormat>>
  /** The caption for every channel without one of its own. */
  caption: string
  /** Per-network captions, overriding `caption`. */
  captions: Partial<Record<Network, string>>
  /** Photo sources, in order. */
  media: string[]
  firstComment: string
  campaignId?: string
  tagNames: string[]
  assigneeId?: string
  needsApproval: boolean
  /** The idea this came from, when it did. */
  ideaId?: string
  /** When it goes out. Null until picked. */
  at: ScheduleAt | null
}

export const DEFAULT_PROFILE = 'vv-instagram'

/** The brand's own accounts, the ones the composer offers. */
export const BRAND_PROFILES = profiles.filter((p) => p.id.startsWith('vv-'))

/** The caption tab: the one shared caption, or one network's own. */
export type CaptionTab = 'all' | Network

export function emptyFields(at: ScheduleAt | null = null): ComposeFields {
  return {
    profileIds: [DEFAULT_PROFILE],
    formats: {},
    caption: '',
    captions: {},
    media: [],
    firstComment: '',
    tagNames: [],
    needsApproval: false,
    at,
  }
}

export function networkOf(profileId: string): Network | undefined {
  return profiles.find((p) => p.id === profileId)?.network
}

/** The caption a channel goes out with: its own, or the shared one. */
export function captionFor(fields: ComposeFields, network: Network | undefined): string {
  return (network && fields.captions[network]) || fields.caption
}

/** The type a channel goes out as: the one picked on its tab, or its network's first. */
export function formatFor(fields: ComposeFields, network: Network): PostFormat {
  return fields.formats[network] ?? defaultPostType(network)
}

/** The composer's state: the fields, a setter for any one of them, and a patch. */
export function useComposeForm(initial: ComposeFields) {
  const [fields, setFields] = useState(initial)
  const patch = useCallback((change: Partial<ComposeFields>) => {
    setFields((current) => ({ ...current, ...change }))
  }, [])
  const set = useCallback(
    <K extends keyof ComposeFields>(key: K, value: ComposeFields[K]) => patch({ [key]: value }),
    [patch],
  )
  return { fields, set, patch, setFields }
}

function common(fields: ComposeFields, profileId: string) {
  const network = networkOf(profileId)
  return {
    profileId,
    body: captionFor(fields, network).trim(),
    photo: fields.media[0],
    ideaId: fields.ideaId,
    campaignId: fields.campaignId,
    tagNames: fields.tagNames.length ? fields.tagNames : undefined,
    assigneeId: fields.assigneeId,
    needsApproval: fields.needsApproval || undefined,
    format: network ? formatFor(fields, network) : undefined,
    firstComment: fields.firstComment.trim() || undefined,
  }
}

export function toDraftInput(fields: ComposeFields, profileId: string): DraftInput {
  return common(fields, profileId)
}

export function toPostInput(fields: ComposeFields, profileId: string): PostInput {
  return { ...common(fields, profileId), tags: fields.tagNames.length || undefined }
}

/** The same patch for a draft being edited in place. */
export function toDraftPatch(fields: ComposeFields, draft: Draft): Partial<Omit<Draft, 'id'>> {
  return common(fields, draft.profileId)
}
