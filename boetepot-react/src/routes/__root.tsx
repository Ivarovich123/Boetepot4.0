import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../context/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const isDark = localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.theme = newTheme
    document.documentElement.classList.toggle('dark')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <Link to="/" className="mr-6 flex items-center space-x-2">
                  <span className="font-bold">Boetepot</span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link to="/" className="transition-colors hover:text-foreground/80">
                    Home
                  </Link>
                  <Link to="/admin" className="transition-colors hover:text-foreground/80">
                    Beheer
                  </Link>
                </nav>
              </div>
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <NavbarActions />
                <button
                  onClick={toggleTheme}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {theme === 'light' ? (
                    <SunIcon className="h-4 w-4" />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </button>
              </div>
            </div>
          </header>
          <main className="container py-6">
            <Outlet />
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 4000,
              success: {
                duration: 2000,
              },
              error: {
                duration: 4000,
              },
            }}
          />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Component for login/logout actions in navbar
function NavbarActions() {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <>
      {isAuthenticated && (
        <button
          onClick={logout}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Uitloggen
        </button>
      )}
    </>
  );
}