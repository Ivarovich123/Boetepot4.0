import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as adminRoute } from './routes/admin'
import { Route as loginRoute } from './routes/login'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': typeof indexRoute
    '/admin': typeof adminRoute
    '/login': typeof loginRoute
  }
}

export const routeTree = rootRoute.addChildren([indexRoute, adminRoute, loginRoute])