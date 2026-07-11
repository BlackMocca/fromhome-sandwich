-- channel_products: Stores channel-specific product data
-- name, category_id, cover_url are from master product (joined via products table)
-- price, cost can be overridden per channel
CREATE TABLE IF NOT EXISTS channel_products (
  id            BIGSERIAL PRIMARY KEY,
  channel_id    BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Mutable fields (can be overridden per channel)
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost          NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(channel_id, product_id)
);

CREATE INDEX idx_channel_products_channel_id ON channel_products(channel_id);
CREATE INDEX idx_channel_products_product_id ON channel_products(product_id);

DROP TRIGGER IF EXISTS set_updated_at ON channel_products;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON channel_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE channel_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow write access" ON channel_products
  FOR ALL USING (auth.role() = 'authenticated');
