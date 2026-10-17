import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'

import '../shared/setup'
import { Toast } from '../../src/components/Toast'
import { CalendarScreen } from './screens/calendar/CalendarScreen'
import { NotBuilt } from './screens/NotBuilt'
import { SocialShell } from './shell/SocialShell'

// Hash routes (`#/plan/calendar`) so every screen has a link that works on
// GitHub Pages, which has no server to rewrite a deep path back to this page.
const router = createHashRouter([
  {
    element: <SocialShell />,
    children: [
      { index: true, element: <Navigate to="/plan/calendar" replace /> },
      { path: 'plan/calendar', element: <CalendarScreen /> },
      { path: '*', element: <NotBuilt /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toast.Provider>
      <RouterProvider router={router} />
    </Toast.Provider>
  </StrictMode>,
)
