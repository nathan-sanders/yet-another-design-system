/**
 * Other tools the workspace talks to, for Settings › Integrations. Each is
 * drawn as a lettermark rather than its logo, the way Billing draws the card:
 * a mock app has no business shipping other companies' artwork.
 */

export interface Integration {
  id: string
  name: string
  /** One or two letters for the mark. */
  mark: string
  /** What it does in Yet Social, in a sentence. */
  description: string
  connected: boolean
  /** Who connected it, and the detail of how, once it is. */
  detail?: string
}

export const integrations: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    mark: 'S',
    description: 'Post approvals, failed posts and new tickets to a channel.',
    connected: true,
    detail: 'Posting to #social, connected by Katie Powell',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    mark: 'GD',
    description: 'Pick photos and video from Drive in the composer and the asset library.',
    connected: true,
    detail: 'Veggie Vault › Marketing, connected by Nathan Sanders',
  },
  {
    id: 'canva',
    name: 'Canva',
    mark: 'C',
    description: 'Open a post’s image in Canva and bring the edit back to the draft.',
    connected: false,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    mark: 'Sh',
    description: 'Tag products in posts, and see what each post sold in Reports.',
    connected: false,
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    mark: 'GA',
    description: 'Count the site visits a post sends, beside its likes and reach.',
    connected: false,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    mark: 'Z',
    description: 'Send new mentions and tickets to the other tools your team uses.',
    connected: false,
  },
]
