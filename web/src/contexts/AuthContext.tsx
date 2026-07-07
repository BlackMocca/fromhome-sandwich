'use client';

/**
 * AuthContext — holds the currently signed-in user across the app.
 *
 * The user is set after a successful sign-in (see login page) and
 * cleared on sign-out. Components anywhere in the tree can read it
 * via the {@link useAuth} hook.
 *
 * The shape combines Supabase's `auth.User` with the matching
 * `public.profiles` row so consumers can read both the auth
 * identity (id, email) and the public profile (display_name) in
 * one go.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

export interface AuthUser {
  user: User;
  profile: Profile | null;
}

interface AuthContextValue {
  authUser: AuthUser | null;
  /** True when an auth user is currently set. */
  isAuthenticated: boolean;
  /** Replace the current user (called after sign-in / sign-out / refresh). */
  setAuthUser: (authUser: AuthUser | null) => void;
  /** Convenience: clear the user (sign-out). */
  clearAuthUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  /** Optional initial user (e.g. from a server component / SSR). */
  initialAuthUser?: AuthUser | null;
  children: ReactNode;
}

export function AuthProvider({ initialAuthUser = null, children }: AuthProviderProps) {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(initialAuthUser);

  const setAuthUser = useCallback((next: AuthUser | null) => {
    setAuthUserState(next);
  }, []);

  const clearAuthUser = useCallback(() => {
    setAuthUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      isAuthenticated: authUser !== null,
      setAuthUser,
      clearAuthUser,
    }),
    [authUser, setAuthUser, clearAuthUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read auth state from anywhere in the tree. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
