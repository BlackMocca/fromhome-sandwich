-- Create products table with auto-updated timestamps
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT         NOT NULL,
  category_id BIGINT       NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  cover_url   TEXT,
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost        NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Create index on category_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create index on name for search/filtering
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create trigger to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated to insert/update/delete
CREATE POLICY "Allow write access" ON products
  FOR ALL USING (auth.role() = 'authenticated');
