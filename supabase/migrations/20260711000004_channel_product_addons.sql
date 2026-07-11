-- channel_product_addons: Junction table for channel product addon mappings with price override
CREATE TABLE IF NOT EXISTS channel_product_addons (
  channel_product_id BIGINT NOT NULL REFERENCES channel_products(id) ON DELETE CASCADE,
  addon_id           BIGINT NOT NULL REFERENCES product_addons(id) ON DELETE CASCADE,
  price              NUMERIC(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (channel_product_id, addon_id)
);

CREATE INDEX idx_channel_product_addons_channel_product_id ON channel_product_addons(channel_product_id);
CREATE INDEX idx_channel_product_addons_addon_id ON channel_product_addons(addon_id);

ALTER TABLE channel_product_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow write access" ON channel_product_addons
  FOR ALL USING (auth.role() = 'authenticated');
