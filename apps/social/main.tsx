import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'

import '../shared/setup'
import { Toast } from '../../src/components/Toast'
import { CalendarScreen } from './screens/calendar/CalendarScreen'
import { CalendarNotesProvider } from './screens/calendar/CalendarNotesProvider'
import { ScheduleProvider } from './screens/calendar/ScheduleProvider'
import { PostNotesProvider } from './screens/calendar/PostNotesProvider'
import { CommentsScreen } from './screens/comments/CommentsScreen'
import { ComposeScreen } from './screens/compose/ComposeScreen'
import { CreatorFullView } from './screens/creators/CreatorFullView'
import { CreatorsScreen } from './screens/creators/CreatorsScreen'
import { HomeScreen } from './screens/home/HomeScreen'
import { IdeasProvider } from './screens/ideas/IdeasProvider'
import { NotificationsProvider } from './screens/notifications/NotificationsProvider'
import { IdeasScreen } from './screens/ideas/IdeasScreen'
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
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeScreen /> },
      { path: 'plan/calendar', element: <CalendarScreen /> },
      { path: 'plan/ideas', element: <IdeasScreen /> },
      { path: 'plan/creators', element: <CreatorsScreen /> },
      { path: 'plan/creators/:creatorId', element: <CreatorFullView /> },
      { path: 'plan/compose', element: <ComposeScreen /> },
      { path: 'engage/my-inbox', element: <InboxScreen scope="mine" /> },
      { path: 'engage/all', element: <InboxScreen /> },
      { path: 'engage/comments', element: <CommentsScreen /> },
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
          <IdeasProvider>
            <PostNotesProvider>
              <CalendarNotesProvider>
                <ScheduleProvider>
                  <NotificationsProvider>
                    <RouterProvider router={router} />
                  </NotificationsProvider>
                </ScheduleProvider>
              </CalendarNotesProvider>
            </PostNotesProvider>
          </IdeasProvider>
        </ReportsProvider>
      </InboxProvider>
    </Toast.Provider>
  </StrictMode>,
)
