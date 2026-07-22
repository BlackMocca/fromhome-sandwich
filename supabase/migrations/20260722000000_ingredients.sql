-- ============================================================
-- INGREDIENTS (วัตถุดิบ)
-- วัตถุประสงค์: ข้อมูล.master ของวัตถุดิบที่ใช้ในการสั่งซื้อและบันทึกการซื้อ
-- ============================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id              BIGSERIAL PRIMARY KEY,
  
  -- ชื่อวัตถุดิบ
  name            TEXT NOT NULL UNIQUE,
  
  -- หน่วยนับเริ่มต้น (เช่น กล่อง, กก., ลู่น, แพ็ค ฯลฯ)
  default_unit    TEXT NOT NULL DEFAULT 'ชิ้น',
  
  -- คำอธิบายเพิ่มเติม (ไม่บังคับ)
  description     TEXT,
  
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- ============================================================
-- RLS Policies (authenticated users can CRUD)
-- ============================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view ingredients' AND tablename = 'ingredients') THEN
    CREATE POLICY "Authenticated users can view ingredients"
      ON ingredients FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert ingredients' AND tablename = 'ingredients') THEN
    CREATE POLICY "Authenticated users can insert ingredients"
      ON ingredients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update ingredients' AND tablename = 'ingredients') THEN
    CREATE POLICY "Authenticated users can update ingredients"
      ON ingredients FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete ingredients' AND tablename = 'ingredients') THEN
    CREATE POLICY "Authenticated users can delete ingredients"
      ON ingredients FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
