import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'

import '../shared/setup'
import { Toast } from '../../src/components/Toast'
import { HomeScreen } from './screens/home/HomeScreen'
import { BlocksProvider } from './screens/my-work/BlocksProvider'
import { MyWorkIndex, MyWorkScreen } from './screens/my-work/MyWorkScreen'
import { NotBuilt } from './screens/NotBuilt'
import { ProjectIndex, ProjectPage } from './screens/project/ProjectPage'
import { RulesProvider } from './screens/project/RulesProvider'
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
      { path: 'my-work', element: <MyWorkIndex /> },
      { path: 'my-work/:view', element: <MyWorkScreen /> },
      { path: 'projects', element: <ProjectsScreen /> },
      { path: 'projects/:projectId', element: <ProjectIndex /> },
      { path: 'projects/:projectId/:tab', element: <ProjectPage /> },
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
            <RouterProvider router={router} />
          </BlocksProvider>
        </RulesProvider>
      </TasksProvider>
    </Toast.Provider>
  </StrictMode>,
)
