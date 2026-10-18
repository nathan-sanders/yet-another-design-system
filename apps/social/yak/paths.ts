/** `#/yak?from=/plan/creators`: the full view, and the page it was opened from. */
export function yakPath(from: string): string {
  return `/yak?from=${encodeURIComponent(from)}`
}

/** Where the full view goes back to. Never itself, and Home when nothing says. */
export function yakFrom(params: URLSearchParams): string {
  const from = params.get('from')
  return from && from.startsWith('/') && !from.startsWith('/yak') ? from : '/home'
}
