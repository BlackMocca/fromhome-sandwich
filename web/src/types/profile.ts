/**
 * Profile entity — mirrors the `public.profiles` table.
 *
 * A profile stores the public email (unique) and an optional
 * display_name for an auth user so the app can read profile
 * info via PostgREST.
 *
 * @see /supabase/migrations/20260706090000_profiles.sql
 */
export interface Profile {
  id: string;              // uuid — auth.users.id
  email: string;           // unique
  display_name: string | null;
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
