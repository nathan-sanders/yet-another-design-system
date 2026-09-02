/**
 * The YADS wordmark, for the navigation stories.
 *
 * Not exported from the library barrel and not a component anyone consumes:
 * `SideNav` and `TopNav` take a `logo` slot precisely so the brand mark stays
 * the application's business. This is here so both story files draw the same
 * one instead of keeping two copies of the path data.
 *
 * `fill="currentColor"` rather than the `#F5F5F5` the exported SVG carries —
 * Figma binds the mark to `Nav Content/Primary`, and inheriting is how it
 * follows the nav theme through every mode instead of staying near-white
 * on the light ones. It is 36×16, which centres inside the 40px logo slot.
 */
export function Logo() {
  return (
    <svg
      width="36"
      height="16"
      viewBox="0 0 36 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Yet Another Design System"
    >
      <path
        d="M5.27579 8.52005H7.03438V0H12.3102V12.4444C12.3102 14.4081 10.7355 16 8.79298 16H0V12.7653H7.03438V10.9875H3.51719C1.5747 10.9875 2.83256e-08 9.39567 0 7.43199V0H5.27579V8.52005Z"
        fill="currentColor"
      />
      <path
        d="M36 3.55556H33.3621V16H28.0863V3.55556H13.9356V8.10425e-06H36V3.55556Z"
        fill="currentColor"
      />
      <path
        d="M20.97 8.52005H19.2114V5.3112H13.9356V12.4444C13.9356 14.4081 15.5103 16 17.4528 16H26.2458V12.7653H19.2114V10.9875H22.7286C24.6711 10.9875 26.2458 9.39567 26.2458 7.43199V5.3112H20.97V8.52005Z"
        fill="currentColor"
      />
    </svg>
  )
}
