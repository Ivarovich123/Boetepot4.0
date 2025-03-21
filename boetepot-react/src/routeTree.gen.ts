import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as adminRoute } from './routes/admin'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': typeof indexRoute
    '/admin': typeof adminRoute
  }
}

export const routeTree = rootRoute.addChildren([indexRoute, adminRoute]) 