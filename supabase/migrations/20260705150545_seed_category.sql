
-- Seed data from mock (ON CONFLICT prevents duplicates)
INSERT INTO categories (name, is_active) VALUES
  ('Sandwich',    true),
  ('Drink',       true)
ON CONFLICT (name) DO NOTHING;
