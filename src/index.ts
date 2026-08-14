// Public surface of the library. Each component folder exports through here.
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { Icon } from './components/Icon'
export type { IconProps } from './components/Icon'

export { cn } from './lib/cn'

// Icons themselves are not re-exported: import them straight from lucide-react
// (`import { Plus } from 'lucide-react'`) so bundlers can tree-shake to just the
// glyphs you use. Re-exporting the whole set here would defeat that.
export type { LucideIcon } from 'lucide-react'
