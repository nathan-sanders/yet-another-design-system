import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'

import '../shared/setup'
import { Toast } from '../../src/components/Toast'
import { CalendarScreen } from './screens/calendar/CalendarScreen'
import { CreatorsScreen } from './screens/creators/CreatorsScreen'
import { DiscoverScreen } from './screens/discover/DiscoverScreen'
import { InboxProvider } from './screens/inbox/InboxProvider'
import { InboxScreen } from './screens/inbox/InboxScreen'
import { NotBuilt } from './screens/NotBuilt'
import { ReportsProvider } from './screens/reports/ReportsProvider'
import { ReportScreen } from './screens/reports/ReportScreen'
import { ReportsScreen } from './screens/reports/ReportsScreen'
import { WidgetDetailScreen } from './screens/reports/WidgetDetailScreen'
import { SocialShell } from './shell/SocialShell'
import { YakScreen } from './yak/YakScreen'

// Hash routes (`#/plan/calendar`) so every screen has a link that works on
// GitHub Pages, which has no server to rewrite a deep path back to this page.
const router = createHashRouter([
  {
    element: <SocialShell />,
    children: [
      { index: true, element: <Navigate to="/plan/calendar" replace /> },
      { path: 'plan/calendar', element: <CalendarScreen /> },
      { path: 'plan/creators', element: <CreatorsScreen /> },
      { path: 'engage/my-inbox', element: <InboxScreen scope="mine" /> },
      { path: 'engage/all', element: <InboxScreen /> },
      { path: 'measure/discover', element: <DiscoverScreen /> },
      { path: 'measure/reports', element: <ReportsScreen /> },
      { path: 'measure/reports/:reportId', element: <ReportScreen /> },
      { path: 'measure/reports/:reportId/widgets/:widgetId', element: <WidgetDetailScreen /> },
      { path: 'yak', element: <YakScreen /> },
      { path: '*', element: <NotBuilt /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toast.Provider>
      <InboxProvider>
        <ReportsProvider>
          <RouterProvider router={router} />
        </ReportsProvider>
      </InboxProvider>
    </Toast.Provider>
  </StrictMode>,
)
