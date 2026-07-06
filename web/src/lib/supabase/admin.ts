import { createClient } from '@supabase/supabase-js';

/**
 * Supabase ADMIN client — SERVER ONLY.
 *
 * Uses the new Supabase "secret key" (sb_secret_*) to
 * bypass RLS for privileged operations such as
 * auth.admin.* and cross-tenant reads/writes. Never
 * import this file from a Client Component.
 *
 * Required env:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SECRET_KEY  (server-only secret)
 *
 * Note: this is the modern Supabase key scheme that
 * replaces the old SUPABASE_SERVICE_ROLE_KEY (anon JWT).
 * See https://supabase.com/docs/guides/api/api-keys for
 * the new publishable / secret key pair.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY). ' +
        'Add SUPABASE_SECRET_KEY to .env.local before using admin operations.'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
