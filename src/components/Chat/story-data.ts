/**
 * Dummy content for the chat stories, and the same words the Figma page's
 * mock screens and Preview carry — one conversation in two places, so a
 * designer reading the canvas and a developer reading Storybook see the
 * same thread.
 *
 * Not exported from the library barrel: it is story furniture, like
 * `story-mark.tsx`. The conversation is about this design system, which
 * keeps the examples honest — every claim in it is one the records make.
 */

/** The rail's recent chats, newest first. The first is the open one. */
export const chats = [
  'Bubble contrast in dark mode',
  'Composer keyboard contract',
  'Reaction pill overlap',
  'Thought process copy',
] as const

/** The conversation the `InContext` stories draw. */
export const conversation = {
  title: chats[0],
  prompt: 'Does the default chat bubble still read in dark mode? It looks close to the page.',
  sentAt: { label: '12:30 PM', dateTime: '2026-09-17T12:30' },
  thought: {
    summary: 'Checked the bubble against both surfaces',
    elapsed: '4s',
    toolCalls: [
      { status: 'done', label: 'Read tokens/semantic.json' },
      { status: 'done', label: 'Measured surface-background-subtle on both canvases' },
      { status: 'done', label: 'Checked the record for the surface rule' },
    ],
  },
  reply:
    'It reads, but only on a primary surface. The default bubble is surface-background-subtle, ' +
    'which is the canvas color in both themes — so on the page canvas it vanishes, and on ' +
    'surface-background-primary it sits one neutral step off: stone-100 on white in light, ' +
    'neutral-950 on neutral-900 in dark. That is the rule the Chat record states, and the ' +
    'InContext story paints the log on the primary surface for exactly that reason.',
  repliedAt: { label: '12:31 PM', dateTime: '2026-09-17T12:31' },
} as const

/** A messaging thread — two people, grouped bubbles — for the `Group` story. */
export const thread = {
  sent: [
    'I have a couple of questions about the new API.',
    'First, how should we handle pagination?',
    'And second, what is the rate limit?',
  ],
  sentAt: '11:00 AM',
  received: [
    'For pagination, use cursor-based with a limit parameter. The response includes a nextCursor field.',
    'The rate limit is 100 requests per minute per key. Past it you get a 429 with a Retry-After header.',
  ],
  receivedAt: '11:01 AM',
} as const
