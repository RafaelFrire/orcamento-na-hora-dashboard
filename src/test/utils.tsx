import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/contexts/AuthContext'
import { routes } from '@/routes'

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
  return router
}
