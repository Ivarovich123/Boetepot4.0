/// <reference types="vite/client" />

// Declare modules that don't have proper type definitions
declare module 'react' {
  export const useState: <T>(initialState: T | (() => T)) => [T, (newState: T | ((prevState: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: any[]) => void;
  export const createContext: <T>(defaultValue: T) => React.Context<T>;
  export const useContext: <T>(context: React.Context<T>) => T;
  export type ReactNode = React.ReactNode;
  
  // Forward declarations for React namespace
  namespace React {
    type ReactNode = any;
    interface Context<T> {
      Provider: any;
      Consumer: any;
    }
    type ComponentType<P = any> = any;
    interface FormEvent<T = Element> {
      preventDefault(): void;
      target: EventTarget & T;
    }
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module '@tanstack/react-router' {
  // Basic type definitions for TanStack Router
  export interface RouteOptions {
    component?: React.ComponentType<any>;
    // Add other properties as needed
  }

  export type NavigateOptions = string | { to: string };
  
  export function useNavigate(): {
    (options: NavigateOptions): void;
    to: (options: NavigateOptions) => void;
  };

  export function createRootRoute(options: RouteOptions): any;
  export function createFileRoute(path: string): (options: RouteOptions) => any;
  export function Link(props: any): JSX.Element;
  export function Outlet(): JSX.Element;
}

declare module 'react-hot-toast' {
  const toast: {
    (message: string): void;
    success(message: string): void;
    error(message: string): void;
  };
  
  export const Toaster: (props: any) => JSX.Element;
  export default toast;
}

declare module '@tanstack/react-query' {
  export function useQuery(options: any): any;
  export function useMutation(options: any): any;
  export function useQueryClient(): any;
  export class QueryClient {
    constructor(options?: any);
  }
  export function QueryClientProvider(props: any): JSX.Element;
}

// Types for the application
declare interface Player {
  id: string;
  name: string;
}

declare interface Reason {
  id: string;
  description: string;
}

declare interface Fine {
  id: number;
  player_id: string;
  reason_id: string;
  amount: number;
  created_at: string;
  player_name?: string;
  reason_description?: string;
}

// Ensure JSX elements are properly typed
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
