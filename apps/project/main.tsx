import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'

import '../shared/setup'
import { Toast } from '../../src/components/Toast'
import { HomeScreen } from './screens/home/HomeScreen'
import { InboxProvider } from './screens/inbox/InboxProvider'
import { InboxIndex, InboxScreen } from './screens/inbox/InboxScreen'
import { BlocksProvider } from './screens/my-work/BlocksProvider'
import { MyWorkIndex, MyWorkScreen } from './screens/my-work/MyWorkScreen'
import { NotBuilt } from './screens/NotBuilt'
import { GoalsScreen } from './screens/plan/goals/GoalsScreen'
import { PlanProvider } from './screens/plan/PlanProvider'
import { PortfolioIndex, PortfolioPage } from './screens/plan/portfolios/PortfolioPage'
import { PortfoliosScreen } from './screens/plan/portfolios/PortfoliosScreen'
import { RoadmapScreen } from './screens/plan/roadmap/RoadmapScreen'
import { WorkloadScreen } from './screens/plan/workload/WorkloadScreen'
import { ProjectIndex, ProjectPage } from './screens/project/ProjectPage'
import { RulesProvider } from './screens/project/RulesProvider'
import { FormBuilderScreen } from './screens/requests/FormBuilder'
import { MyRequestsScreen } from './screens/requests/MyRequestsScreen'
import { QueueScreen, RequestsIndex } from './screens/requests/QueueScreen'
import { RequestsProvider } from './screens/requests/RequestsProvider'
import { SubmitFormScreen } from './screens/requests/SubmitForm'
import { TasksProvider } from './screens/project/TasksProvider'
import { ProjectsScreen } from './screens/projects/ProjectsScreen'
import { ProjectShell } from './shell/ProjectShell'

// Hash routes (`#/projects/austin/list`) so every screen has a link that works
// on GitHub Pages, which has no server to rewrite a deep path to this page.
const router = createHashRouter([
  {
    element: <ProjectShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeScreen /> },
      { path: 'inbox', element: <InboxIndex /> },
      { path: 'inbox/:view', element: <InboxScreen /> },
      { path: 'my-work', element: <MyWorkIndex /> },
      { path: 'my-work/:view', element: <MyWorkScreen /> },
      { path: 'projects', element: <ProjectsScreen /> },
      { path: 'projects/:projectId', element: <ProjectIndex /> },
      { path: 'projects/:projectId/:tab', element: <ProjectPage /> },
      { path: 'plan', element: <Navigate to="/plan/roadmap" replace /> },
      { path: 'plan/roadmap', element: <RoadmapScreen /> },
      { path: 'plan/portfolios', element: <PortfoliosScreen /> },
      { path: 'plan/portfolios/:portfolioId', element: <PortfolioIndex /> },
      { path: 'plan/portfolios/:portfolioId/:tab', element: <PortfolioPage /> },
      { path: 'plan/goals', element: <GoalsScreen /> },
      { path: 'plan/workload', element: <WorkloadScreen /> },
      { path: 'requests', element: <RequestsIndex /> },
      { path: 'requests/queue', element: <RequestsIndex /> },
      { path: 'requests/queue/:view', element: <QueueScreen /> },
      { path: 'requests/mine', element: <MyRequestsScreen /> },
      { path: 'requests/forms/:formId', element: <FormBuilderScreen /> },
      { path: 'requests/forms/:formId/submit', element: <SubmitFormScreen /> },
      { path: '*', element: <NotBuilt /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toast.Provider>
      <TasksProvider>
        <RulesProvider>
          <BlocksProvider>
            <InboxProvider>
              <PlanProvider>
                <RequestsProvider>
                  <RouterProvider router={router} />
                </RequestsProvider>
              </PlanProvider>
            </InboxProvider>
          </BlocksProvider>
        </RulesProvider>
      </TasksProvider>
    </Toast.Provider>
  </StrictMode>,
)
