import type { QueueView } from './model'

/** A queue segment, with a request open beside it: `#/requests/queue/new?item=photo-shoot`. */
export function queuePath(view: QueueView, itemId?: string): string {
  return `/requests/queue/${view}${itemId ? `?item=${itemId}` : ''}`
}

/** My requests, with one open in its panel: `#/requests/mine?request=cameras`. */
export function minePath(requestId?: string): string {
  return `/requests/mine${requestId ? `?request=${requestId}` : ''}`
}

/** A form's builder, with a question or the settings open in its panel. */
export function formPath(formId: string, panel?: { question: string } | 'settings'): string {
  const query = panel === 'settings' ? '?settings=1' : panel ? `?question=${panel.question}` : ''
  return `/requests/forms/${formId}${query}`
}

/** A form as the person asking fills it in. */
export function submitPath(formId: string): string {
  return `/requests/forms/${formId}/submit`
}
