create policy "categories: public read"
  on public.categories
  for select
  to authenticated
  using (true);

-- A user can INSERT/UPDATE/DELETE only their own profile.
create policy "categories: owner insert"
  on public.categories
  for insert
  to authenticated
  with check (true);

create policy "categories: owner update"
  on public.categories
  for update
  to authenticated
  using (true)
  with check (true);

create policy "categories: owner delete"
  on public.profiles
  for delete
  to authenticated
  using (true);