/**
 * The apps the showcase lists. One entry per folder under `apps/`; the order
 * here is the order on the page.
 */
export interface ShowcaseApp {
  /** Folder name, which is also the path the app is served from. */
  slug: string
  name: string
  /** A sentence or two: what the product is. */
  description: string
  /** A screenshot in `showcase/`, or none until one is taken. */
  image?: string
}

export const apps: ShowcaseApp[] = [
  {
    slug: 'social',
    name: 'Yet Social',
    description:
      'Social media management: schedule posts, run campaigns, answer customers and report on all of it, with Yak, an assistant, beside every screen.',
    image: 'social.png',
  },
  {
    slug: 'project',
    name: 'Yet Project',
    description:
      'Project management for a cross-functional team: projects, the tasks inside them and the plan above them.',
    image: 'project.png',
  },
]
