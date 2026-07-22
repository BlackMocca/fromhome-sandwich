-- ============================================================
-- INGREDIENT PURCHASES (บันทึกการซื้อวัตถุดิบ)
-- วัตถุประสงค์: บันทึกค่าใช้จ่ายในการซื้อวัตถุดิบเพื่อเปรียบเทียบกับรายได้จากการขาย
-- ระบบนี้เป็นแบบ single-user ไม่มีระบบจัดการสต็อก หรือติดตามราคา历史
-- ============================================================

CREATE TABLE IF NOT EXISTS ingredient_purchases (
  id              BIGSERIAL PRIMARY KEY,
  
  -- FK reference to ingredients master data
  ingredient_id   BIGINT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  
  -- วันที่ซื้อวัตถุดิบ
  purchase_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- จำนวนที่ซื้อ (ต้อง > 0)
  quantity        NUMERIC(12,3) NOT NULL CHECK(quantity > 0),
  
  -- หน่วยนับ (เช่น กล่อง, กก., ลู่น, แพ็ค ฯลฯ)
  unit            TEXT NOT NULL DEFAULT 'ชิ้น',
  
  -- ราคาทั้งหมดที่จ่าย (ต้อง >= 0)
  amount          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK(amount >= 0),
  
  -- หมายเหตุเพิ่มเติม (ไม่บังคับ)
  note            TEXT,
  
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_purchase_date ON ingredient_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_ingredient_id ON ingredient_purchases(ingredient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredient_purchases_unique_order 
  ON ingredient_purchases(ingredient_id, purchase_date) 
  WHERE quantity > 0 AND amount >= 0;

-- ============================================================
-- RLS Policies (authenticated users can CRUD)
-- ============================================================
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view ingredient_purchases' AND tablename = 'ingredient_purchases') THEN
    CREATE POLICY "Authenticated users can view ingredient_purchases"
      ON ingredient_purchases FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert ingredient_purchases' AND tablename = 'ingredient_purchases') THEN
    CREATE POLICY "Authenticated users can insert ingredient_purchases"
      ON ingredient_purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update ingredient_purchases' AND tablename = 'ingredient_purchases') THEN
    CREATE POLICY "Authenticated users can update ingredient_purchases"
      ON ingredient_purchases FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete ingredient_purchases' AND tablename = 'ingredient_purchases') THEN
    CREATE POLICY "Authenticated users can delete ingredient_purchases"
      ON ingredient_purchases FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
