'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Delete all Supabase auth cookies
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.set(cookie.name, '', { maxAge: 0 });
    }
  }

  redirect('/auth/login');
}
