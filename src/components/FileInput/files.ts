/**
 * The pure half of `FileInput`: which files the rules keep, and how a size
 * reads. Its own module so the component file exports only a component (Fast
 * Refresh), and so the rules can be tested without a browser — `files.test.ts`.
 */

export interface ScreenRules {
  accept?: string
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
}

export interface FileRejection {
  file: File
  /** Which rule turned it away. */
  reason: 'type' | 'size' | 'count'
  /** The reason in a sentence, ready for a Field's `error`. */
  message: string
}

/** Does `file` match the native `accept` string? */
export function matchesAccept(file: File, accept: string): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith('.')) return name.endsWith(token)
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1))
      return type === token
    })
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const

/**
 * "2.4 MB". Decimal units, as Finder and Explorer's "size on disk" columns
 * read to most people, and `Intl` so the number and the unit are localized.
 */
export function formatFileSize(bytes: number): string {
  let unit = 0
  let n = bytes
  while (n >= 1000 && unit < UNITS.length - 1) {
    n /= 1000
    unit++
  }
  return new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit: UNITS[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(n)
}

/** Splits a candidate list into what the rules keep and what they turn away. */
export function screen(
  files: File[],
  { accept, maxSize, maxFiles, multiple }: ScreenRules,
) {
  const accepted: File[] = []
  const rejected: FileRejection[] = []
  const limit = multiple ? (maxFiles ?? Infinity) : 1

  for (const file of files) {
    if (accept && !matchesAccept(file, accept)) {
      rejected.push({ file, reason: 'type', message: `${file.name} isn't an accepted file type.` })
    } else if (maxSize !== undefined && file.size > maxSize) {
      rejected.push({
        file,
        reason: 'size',
        message: `${file.name} is larger than ${formatFileSize(maxSize)}.`,
      })
    } else if (accepted.length >= limit) {
      rejected.push({
        file,
        reason: 'count',
        message: multiple
          ? `Choose up to ${limit} ${limit === 1 ? 'file' : 'files'}.`
          : 'Choose one file.',
      })
    } else {
      accepted.push(file)
    }
  }
  return { accepted, rejected }
}

/** Same files, same order — the identity check, since `File` has no equality. */
export function sameFiles(a: readonly File[], b: readonly File[]) {
  return a.length === b.length && a.every((file, i) => file === b[i])
}
