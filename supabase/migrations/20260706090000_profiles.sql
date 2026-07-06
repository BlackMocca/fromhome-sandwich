-- =====================================================
-- From Home Sandwich — profiles table
-- Stores the public email (unique) and an optional
-- display_name for each auth user so the app can read
-- profile info via PostgREST.
-- =====================================================

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for fast email lookup (unique constraint already creates one,
-- but kept explicit for clarity)
create index profiles_email_idx on public.profiles (email);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =====================================================
-- Row Level Security
-- =====================================================
alter table public.profiles enable row level security;

-- Anyone (including anon) can READ email + display_name.
create policy "profiles: public read"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- A user can INSERT/UPDATE/DELETE only their own profile.
create policy "profiles: owner insert"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: owner delete"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- =====================================================
-- Auto-create a profile when a new auth user signs up
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
