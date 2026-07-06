import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?message=invalid_code', request.url));
  }

  // Create server client to manage cookies directly
  const supabaseClient = await createClient();
  
  // Exchange the authorization code for a session (which sets the cookie)
  const { error } = await supabaseClient.auth.exchangeCodeForSession(code);

  if (!error) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If error, redirect back to login with message
  return NextResponse.redirect(
    new URL(`/auth/login?message=${encodeURIComponent(error.message)}`, request.url)
  );
}
