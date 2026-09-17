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
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Yet"
      className={className}
    >
      <path
        d="M19.9 16.8C19.2 17.2 17.1 18.9 15.6 19.4C14.1 19.9 12.5 20.2 11 19.6C9.50004 19 7.70004 17 6.70004 15.7C5.70004 14.4 5.10004 13.1 4.90004 11.7C4.80004 10.3 5.50004 8.40001 5.90004 7.10001C6.30004 5.90001 6.80004 4.90001 7.30004 4.20001C7.90004 3.60001 8.40004 3.40001 9.10004 3.10001C9.80004 2.90001 10.7 2.70001 11.5 2.70001C12.3 2.70001 13.3 2.60001 14 2.90001C14.7 3.30001 15.3 3.90001 15.7 4.80001C16 5.70001 16 7.20001 16 8.40001C16 9.50001 16.1 10.5 15.7 11.9C15.3 13.3 14.6 15.4 13.6 16.6C12.5 17.7 10.6 18.4 9.30004 18.8C8.10004 19.2 7.10004 19.6 6.20004 19C5.30004 18.3 3.90004 16.4 3.80004 15C3.80004 13.7 4.90004 12.4 5.70004 11C6.50004 9.60001 7.30004 7.60001 8.60004 6.80001C9.80004 6.00001 11.9 6.10001 13.3 6.10001C14.7 6.10001 16 6.10001 16.8 6.60001C17.7 7.00001 18.1 7.90001 18.6 8.80001C19 9.70001 19.4 11 19.6 12C19.7 13 19.9 13.9 19.7 14.6C19.5 15.4 19.1 15.9 18.5 16.6C17.9 17.2 17 17.9 16 18.3C15.1 18.8 14 19.4 13.1 19.3C12.1 19.1 11.4 18.3 10.4 17.5C9.50004 16.7 8.00004 15.7 7.30004 14.4C6.60004 13.1 6.20004 11 6.30004 9.50001C6.30004 8.00001 6.80004 6.50001 7.50004 5.50001C8.10004 4.50001 9.10004 3.40001 10.1 3.40001C11.1 3.40001 12.6 4.60001 13.4 5.60001C14.2 6.60001 14.5 7.80001 14.8 9.30001C15.1 10.8 15.6 13.1 15.4 14.6C15.2 16.1 14.1 17.1 13.4 18.1C12.7 19 11.8 19.6 11.1 20.2C10.4 20.7 9.80004 21.2 9.10004 21.3C8.40004 21.4 7.50004 21 6.80004 20.5C6.00004 20.1 5.10004 19.2 4.50004 18.4C3.90004 17.6 3.30004 16.8 3.20004 15.8C3.00004 14.9 3.20004 14 3.60004 12.8C4.10004 11.6 4.80004 9.70001 5.70004 8.60001C6.60004 7.40001 7.60004 6.30001 9.10004 5.80001C10.6 5.30001 13.3 5.10001 15 5.50001C16.6 5.80001 18.1 6.90001 19 8.10001C20 9.30001 20.5 12 20.8 12.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
