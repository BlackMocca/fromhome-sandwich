import { createClient } from '@/lib/supabase/client';
import { useMutation, type UseMutateFunction } from '@tanstack/react-query';
import type { AuthError } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

/* ──────────────────────────────────────────────
 *  signInWithPassword  (useMutation)
 * ────────────────────────────────────────────── */

type SignInInput = { email: string; password: string };

export async function signInUser(input: SignInInput) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
}

type UseSignInReturn = ReturnType<typeof useMutation<{ error: AuthError | null; data?: any }, AuthError, SignInInput>> & {
  mutateFn: UseMutateFunction<any, AuthError, SignInInput, unknown>;
};

/** Hook — ใช้ใน login page แทน useState ล้วน */
export function useSignIn() {
  const mutation = useMutation({
    mutationFn: signInUser,
  });
  return { ...mutation };
}

/* ──────────────────────────────────────────────
 *  resetPasswordForEmail  (useMutation)
 * ────────────────────────────────────────────── */

type ResetInput = { email: string; redirectTo: string };

export async function resetPassword(input: ResetInput) {
  const supabase = createClient();
  return await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });
}

/** Hook — ใช้ใน forgot-password / login */
export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

/* ──────────────────────────────────────────────
 *  resolveUsername  (PostgREST direct)
 *
 *  Login UI accepts "username + password" but Supabase
 *  signs in with email. We look up the email for a given
 *  username from the public.profiles table via PostgREST.
 *
 *  Uses native fetch + the publishable key (per SPEC §3.A
 *  — avoid IPv6 issues on dev by going through REST).
 * ────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export class UsernameNotFoundError extends Error {
  constructor() {
    super('ไม่พบชื่อผู้ใช้นี้ในระบบ');
    this.name = 'UsernameNotFoundError';
  }
}

/**
 * Resolve a public.username to its auth email.
 * Throws UsernameNotFoundError when no profile matches.
 */
export async function resolveUsername(username: string): Promise<string> {
  const url =
    `${SUPABASE_URL}/rest/v1/profiles` +
    `?select=email&username=eq.${encodeURIComponent(username)}&limit=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Profile lookup failed (${res.status})`);
  }

  const rows = (await res.json()) as Pick<Profile, 'email'>[];
  const email = rows[0]?.email;

  if (!email) {
    throw new UsernameNotFoundError();
  }
  return email;
}

/** Hook — used by the login page to resolve a username → email */
export function useResolveUsername() {
  return useMutation({
    mutationFn: (username: string) => resolveUsername(username),
  });
}
