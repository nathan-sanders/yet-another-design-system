import { HEALTH } from '../../../components/taskMeta'
import type { GoalHealth } from '../../../data/goals'

/**
 * A goal's health as its Badge says it: a project's four, and Done in Blue,
 * as Sign Dallas lease wears it (`Plan - Goals`, `40006279:15314`).
 */
export const GOAL_HEALTH: Record<
  GoalHealth,
  { label: string; color: 'amber' | 'red' | 'green' | 'neutral' | 'blue' }
> = { ...HEALTH, done: { label: 'Done', color: 'blue' } }

/** The choices a check-in offers, in the Segment Control's order. */
export const CONFIDENCE: GoalHealth[] = ['on-track', 'at-risk', 'off-track']
