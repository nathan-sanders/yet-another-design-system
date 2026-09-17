/**
 * The Yet scribble, for the chat stories.
 *
 * Not exported from the library barrel and not a component anyone consumes:
 * `ChatMessage` takes an `avatar` slot and `ThoughtProcess` an `icon` slot
 * precisely so the assistant's mark stays the application's business — the
 * call `SideNav` makes with its `logo`, and `Nav/story-logo.tsx` is this
 * file's twin. It is here so every chat story draws the same one.
 *
 * `stroke="currentColor"` rather than the `#0A0807` the exported SVG carries —
 * Figma binds the scribble to `Content/Emphasized`, and inheriting is how it
 * follows the theme. Figma's `Scribble Frame` (`40005221:44235`), 24×24 at a
 * 1.5 stroke, the same weight the Icon component forces on every glyph.
 *
 * **`animate` is Nathan's "thinking" scribble**, taken verbatim: the path
 * draws itself in and back out along `stroke-dashoffset` while the whole
 * mark wobbles a few degrees, both on one 1.8s loop. It is for the
 * `ThoughtProcess` row while `thinking` and nowhere else — the mark beside a
 * reply and in the welcome heading is a still frame. The 1.8s is the
 * application's number rather than a motion token, which is right for a
 * brand animation the library does not ship; and it rests under
 * `prefers-reduced-motion` on its own, because the global 1ms clamp would
 * turn an infinite loop into a jitter rather than a rest.
 */

const PATH =
  'M19.9 16.8C19.2 17.2 17.1 18.9 15.6 19.4C14.1 19.9 12.5 20.2 11 19.6C9.5 19 7.7 17 6.7 15.7C5.7 14.4 5.1 13.1 4.9 11.7C4.8 10.3 5.5 8.4 5.9 7.1C6.3 5.9 6.8 4.9 7.3 4.2C7.9 3.6 8.4 3.4 9.1 3.1C9.8 2.9 10.7 2.7 11.5 2.7C12.3 2.7 13.3 2.6 14 2.9C14.7 3.3 15.3 3.9 15.7 4.8C16 5.7 16 7.2 16 8.4C16 9.5 16.1 10.5 15.7 11.9C15.3 13.3 14.6 15.4 13.6 16.6C12.5 17.7 10.6 18.4 9.3 18.8C8.1 19.2 7.1 19.6 6.2 19C5.3 18.3 3.9 16.4 3.8 15C3.8 13.7 4.9 12.4 5.7 11C6.5 9.6 7.3 7.6 8.6 6.8C9.8 6 11.9 6.1 13.3 6.1C14.7 6.1 16 6.1 16.8 6.6C17.7 7 18.1 7.9 18.6 8.8C19 9.7 19.4 11 19.6 12C19.7 13 19.9 13.9 19.7 14.6C19.5 15.4 19.1 15.9 18.5 16.6C17.9 17.2 17 17.9 16 18.3C15.1 18.8 14 19.4 13.1 19.3C12.1 19.1 11.4 18.3 10.4 17.5C9.5 16.7 8 15.7 7.3 14.4C6.6 13.1 6.2 11 6.3 9.5C6.3 8 6.8 6.5 7.5 5.5C8.1 4.5 9.1 3.4 10.1 3.4C11.1 3.4 12.6 4.6 13.4 5.6C14.2 6.6 14.5 7.8 14.8 9.3C15.1 10.8 15.6 13.1 15.4 14.6C15.2 16.1 14.1 17.1 13.4 18.1C12.7 19 11.8 19.6 11.1 20.2C10.4 20.7 9.8 21.2 9.1 21.3C8.4 21.4 7.5 21 6.8 20.5C6 20.1 5.1 19.2 4.5 18.4C3.9 17.6 3.3 16.8 3.2 15.8C3 14.9 3.2 14 3.6 12.8C4.1 11.6 4.8 9.7 5.7 8.6C6.6 7.4 7.6 6.3 9.1 5.8C10.6 5.3 13.3 5.1 15 5.5C16.6 5.8 18.1 6.9 19 8.1C20 9.3 20.5 12 20.8 12.7'

/** The two loops, scoped to the SVG that carries them. */
const KEYFRAMES = `
@keyframes scribble-draw { 0%{stroke-dashoffset:100} 14%{stroke-dashoffset:86} 27%{stroke-dashoffset:58} 36%{stroke-dashoffset:46} 48%,57%{stroke-dashoffset:0} 72%{stroke-dashoffset:-34} 84%{stroke-dashoffset:-52} 100%{stroke-dashoffset:-100} }
@keyframes scribble-wobble { 0%,100%{transform:rotate(-5deg) translate(.2px,-.15px)} 28%{transform:rotate(1.5deg) translate(-.25px,.2px)} 63%{transform:rotate(5deg) translate(.15px,.25px)} 82%{transform:rotate(-1deg) translate(-.2px,-.1px)} }
.scribble-spin { transform-origin:12px 12px; animation:scribble-wobble 1.8s ease-in-out infinite }
.scribble-path { stroke-dasharray:100 100; animation:scribble-draw 1.8s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .scribble-spin, .scribble-path { animation: none } }
`

export interface MarkProps {
  /** Run the thinking scribble. Only the `ThoughtProcess` row while it thinks. */
  animate?: boolean
  className?: string
}

export function Mark({ animate = false, className }: MarkProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={animate ? 'Yet, thinking' : 'Yet'}
      className={className}
    >
      {animate && <style>{KEYFRAMES}</style>}
      <g className={animate ? 'scribble-spin' : undefined}>
        <path className={animate ? 'scribble-path' : undefined} pathLength={100} d={PATH} />
      </g>
    </svg>
  )
}
