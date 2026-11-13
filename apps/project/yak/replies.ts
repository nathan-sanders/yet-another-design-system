import { datedText } from '../data/dates'
import type { Task } from '../data/types'

// What Yak says back. A turn settles its reply the moment it is asked
// (`chat.ts`), so the log never changes its mind, and `Conversation` only
// draws what it is handed. One question is scripted, from `Project -
// Overview + Yak` (`40006277:14114`); everything else gets the house line.

/** Something Yak offers to change, drawn as a Subtle Card with its actions inside. */
export interface Proposal {
  text: string
  /** Push a task's start back by widening the lag behind its dependency. */
  lag: { taskId: string; onTaskId: string; from: number; to: number }
  /** Who is told when it is applied. */
  headsUpId: string
}

/** One paragraph of a reply: prose, or a proposal. */
export type ReplyBubble = { kind: 'text'; text: string } | { kind: 'proposal'; proposal: Proposal }

export interface ScriptedReply {
  /** The thought row's label once Yak is done. */
  summary: string
  /** The thought row's lines while Yak works. */
  phrases: string[]
  /** What Yak did, as tool calls inside the thought row's card. */
  tools: string[]
  bubbles: ReplyBubble[]
  /** "Next, I can…": chips that ask the next thing. */
  followUps?: string[]
}

const norm = (prompt: string) =>
  prompt
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[.!?…]+$/, '')

/** The questions the start screen and Home offer, in that order. */
export const SUGGESTIONS = [
  'What’s blocking Austin?',
  'Plan the rest of my week',
  'Summarize yesterday',
] as const

/**
 * "What's blocking Austin?": the permit is the one task with no slack, and
 * Yak offers to give it four days by starting equipment delivery later. The
 * tool call counts Austin's own tasks and dependencies rather than the
 * frame's 15 and 3, so it agrees with the List.
 */
function blockingAustin(tasks: Task[]): ScriptedReply {
  const austin = tasks.filter((task) => task.projectId === 'austin')
  const dependencies = austin.reduce((sum, task) => sum + (task.dependsOn?.length ?? 0), 0)
  return {
    summary: 'Checked the plan and this week’s updates',
    phrases: ['Reading the plan', 'Checking dependencies', 'Drafting'],
    tools: [`Read ${austin.length} tasks and ${dependencies} dependencies`],
    bubbles: [
      {
        kind: 'text',
        text: datedText(
          'One thing: the health permit. It can’t start until electrical passes on {2026-11-10}, and it’s the only task with no slack. If it runs past {2026-11-18}, equipment delivery moves with it.',
        ),
      },
      {
        kind: 'proposal',
        proposal: {
          text: datedText(
            'Move Equipment delivery from {2026-11-23} to {2026-11-27}. That gives the permit four days of slack, and Marcus gets a heads-up.',
          ),
          lag: { taskId: 'aus-26', onTaskId: 'aus-24', from: 5, to: 9 },
          headsUpId: 'marcus',
        },
      },
      {
        kind: 'text',
        text: datedText('Nothing else on the plan moves, so {2027-01-12} holds.'),
      },
    ],
    followUps: [
      'Draft Dana’s update',
      'Ask Marcus for the certificate',
      'Show the critical path',
      'Check other Texas stores',
      datedText('Remind me {2026-11-11}'),
    ],
  }
}

/**
 * The house line: this mock answers one question so far, and says which,
 * rather than inventing an answer about the person's real plan.
 */
function fallback(): ScriptedReply {
  return {
    summary: 'Looked for an answer',
    phrases: ['Reading the question', 'Checking the plan', 'Drafting'],
    tools: ['Checked what this mock can answer'],
    bubbles: [
      {
        kind: 'text',
        text: 'I can only answer one question in this mock so far: what’s blocking Austin. In the real product I’d read your projects and tasks to answer this one.',
      },
    ],
    followUps: [SUGGESTIONS[0]],
  }
}

export function scriptedReply(prompt: string, tasks: Task[]): ScriptedReply {
  const q = norm(prompt)
  if (q === 'whats blocking austin' || q === 'what is blocking austin') return blockingAustin(tasks)
  return fallback()
}
