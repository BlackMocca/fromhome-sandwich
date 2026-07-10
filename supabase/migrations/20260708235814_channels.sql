-- Create channels table with auto-updated timestamps and soft delete support
CREATE TABLE IF NOT EXISTS channels (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(6)       NOT NULL UNIQUE,
  name        TEXT             NOT NULL,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Create trigger to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON channels;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for fast code lookup
CREATE INDEX channels_code_idx ON channels (code);

-- Index for deleted_at soft delete queries
CREATE INDEX channels_deleted_at_idx ON channels (deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- Row Level Security
-- =====================================================
alter table public.channels enable row level security;

-- Anyone (including authenticated users) can READ channels.
create policy "channels: public read"
  on public.channels
  for select
  to authenticated
  using (deleted_at is null);

-- A user can INSERT/UPDATE/DELETE channels.
create policy "channels: owner insert"
  on public.channels
  for insert
  to authenticated
  with check (true);

create policy "channels: owner update"
  on public.channels
  for update
  to authenticated
  using (deleted_at is null)
  with check (deleted_at is null);

create policy "channels: owner delete"
  on public.channels
  for delete
  to authenticated
  using (deleted_at is null);
