import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fonts for --font-sans / --font-mono. Only the weights the type tokens use
// (--font-weight-normal / -semibold / -bold) are pulled in.
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource-variable/geist-mono'

// The generated token layer. Its own `@import "tailwindcss"` pulls in Tailwind,
// so this is the only stylesheet the app needs.
import './styles/theme.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
