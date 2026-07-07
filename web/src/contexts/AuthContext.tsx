'use client';

/**
 * AuthContext — holds the currently signed-in user across the app.
 *
 * The user is set after a successful sign-in (see login page) and
 * cleared on sign-out. Components anywhere in the tree can read it
 * via the {@link useAuth} hook.
 *
 * On mount, AuthContext **hydrates from Supabase cookies** so that
 * even after a browser refresh (F5), the user data is available
 * immediately — no flicker to null.
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
  useEffect,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';
import { createClient } from '@/lib/supabase/client';

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
  // Start with the provided initial value (SSR-hydrated), or null
  const [authUser, setAuthUserState] = useState<AuthUser | null>(initialAuthUser);
  const [isHydrated, setIsHydrated] = useState(false);

  /**
   * On mount, read the current session from Supabase cookies and update the context.
   * This prevents the "null flicker" after a browser refresh (F5).
   */
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // Subscribe to auth state changes so we stay synced with Supabase (handles token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setAuthUserState(session?.user ? { user: session.user, profile: initialAuthUser?.profile ?? null } : null);
      }
    });

    // Hydrate from cookies on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setAuthUserState(session?.user ? { user: session.user, profile: initialAuthUser?.profile ?? null } : null);
        setIsHydrated(true); // mark as hydrated so Navbar shows real state instead of loading
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [initialAuthUser]);

  const setAuthUser = useCallback((next: AuthUser | null) => {
    setAuthUserState(next);
  }, []);

  const clearAuthUser = useCallback(() => {
    setAuthUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      isAuthenticated: authUser !== null && isHydrated,
      setAuthUser,
      clearAuthUser,
    }),
    [authUser, isHydrated, setAuthUser, clearAuthUser],
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
