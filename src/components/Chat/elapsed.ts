/**
 * How long the assistant has been thinking, as the row prints it: "4s" up to
 * a minute, then "1m 5s" — the shape Figma's `Time Thinking` text draws. A
 * pure function in its own file so it can be tested in node and so
 * `ThoughtProcess.tsx` exports only a component (React Fast Refresh's rule).
 */
export function formatElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  if (whole < 60) return `${whole}s`
  return `${Math.floor(whole / 60)}m ${whole % 60}s`
}
