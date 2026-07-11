-- Create product_mapping_addons table for mapping products to their addons/options
CREATE TABLE IF NOT EXISTS product_mapping_addons (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id   BIGINT NOT NULL REFERENCES product_addons(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, addon_id)
);

-- Create index on product_id for faster lookup of addons per product
CREATE INDEX IF NOT EXISTS idx_product_mapping_addons_product_id ON product_mapping_addons(product_id);

-- Create index on addon_id for faster lookup of products per addon
CREATE INDEX IF NOT EXISTS idx_product_mapping_addons_addon_id ON product_mapping_addons(addon_id);

-- Enable RLS
ALTER TABLE product_mapping_addons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated to insert/update/delete
CREATE POLICY "Allow write access" ON product_mapping_addons
  FOR ALL USING (auth.role() = 'authenticated');
