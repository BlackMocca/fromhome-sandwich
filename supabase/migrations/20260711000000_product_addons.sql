-- Create product_addons table with auto-updated timestamps
CREATE TABLE IF NOT EXISTS product_addons (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT         NOT NULL,
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Create trigger to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON product_addons;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON product_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated to insert/update/delete
CREATE POLICY "Allow write access" ON product_addons
  FOR ALL USING (auth.role() = 'authenticated');