'use server';

/**
 * User management — privileged server actions.
 *
 * Uses two Supabase clients:
 *   1. createClient() from @/lib/supabase/server
 *      → user-context (RLS-respecting) reads & profile
 *        updates. Works because the caller is signed in
 *        as an admin and matches the RLS policies.
 *   2. createAdminClient() from @/lib/supabase/admin
 *      → privileged auth.admin.* calls (createUser,
 *        updateUserById, deleteUser). Uses the new
 *        SUPABASE_SECRET_KEY (sb_secret_*).
 *
 * Next.js runs these on the server only, so the secret
 * key never reaches the browser.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/types/profile';

/* ─── Result helpers ───────────────────────────────────── */

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

function fail(error: unknown): ActionResult<never> {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return { ok: false, error: message };
}

/* ─── Create User ──────────────────────────────────────── */

export interface CreateUserInput {
  email: string;
  password: string;
  display_name?: string;
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<Profile>> {
  try {
    const admin = createAdminClient();

    // 1. Create the auth user (email_confirm: true skips the verify-email flow)
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { display_name: input.display_name ?? null },
      });

    if (createErr || !created.user) {
      return fail(createErr?.message ?? 'Failed to create auth user');
    }

    // 2. Upsert the matching profile row (display_name lives here)
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          email: input.email,
          display_name: input.display_name ?? null,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (profileErr) {
      return fail(`Auth user created but profile failed: ${profileErr.message}`);
    }

    revalidatePath('/management/user');
    return ok(profile as Profile);
  } catch (error) {
    return fail(error);
  }
}

/* ─── Update User ──────────────────────────────────────── */

export interface UpdateUserInput {
  id: string;
  email?: string;
  display_name?: string | null;
  password?: string; // optional — only sent if admin wants to reset it
}

export async function updateUser(
  input: UpdateUserInput
): Promise<ActionResult<Profile>> {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();

    // 1. Update auth (email / password) — admin API only
    const authPayload: Record<string, unknown> = {};
    if (input.email) authPayload.email = input.email;
    if (input.password) authPayload.password = input.password;

    if (Object.keys(authPayload).length > 0) {
      const { error: authErr } = await admin.auth.admin.updateUserById(
        input.id,
        authPayload
      );
      if (authErr) return fail(authErr.message);
    }

    // 2. Update profile (email, display_name) via user-context client
    const profilePayload: Record<string, unknown> = {};
    if (input.email) profilePayload.email = input.email;
    if (input.display_name !== undefined) {
      profilePayload.display_name = input.display_name;
    }

    if (Object.keys(profilePayload).length === 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', input.id)
        .single();
      if (error) return fail(error.message);
      revalidatePath('/management/user');
      return ok(data as Profile);
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', input.id)
      .select('*')
      .single();

    if (profileErr) return fail(profileErr.message);

    revalidatePath('/management/user');
    return ok(profile as Profile);
  } catch (error) {
    return fail(error);
  }
}

/* ─── Delete User ──────────────────────────────────────── */

export async function deleteUser(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = createAdminClient();

    // auth.admin.deleteUser cascades to the profile row
    // (FK on profiles.id is ON DELETE CASCADE).
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return fail(error.message);

    revalidatePath('/management/user');
    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}

/* ─── List Profiles (for the user table) ───────────────── */

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as Profile[];
}

/* ─── Get Single Profile (for the edit page) ───────────── */

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as Profile) ?? null;
}
