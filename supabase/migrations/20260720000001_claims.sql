-- ============================================================
-- CLAIMS (เคลมสินค้า — ของหมดอายุ / เสียหาย / สูญหาย)
-- วัตถุประสงค์: บันทึกสินค้าที่สูญเสียไปโดยที่ต้นทุน (cost) ยังคงอยู่กับเรา
-- (กำไรลดลงเท่ากับต้นทุนของสินค้าที่เคลม) โครงสร้าง mirror กับ receipts
-- ============================================================

CREATE TABLE IF NOT EXISTS claims (
  id              BIGSERIAL PRIMARY KEY,

  -- Claim identity (CLM + YYYYMMDD + running seq, reset รันใหม่ทุกวัน)
  claim_no        TEXT NOT NULL UNIQUE,

  -- วันที่ทำการเคลม
  claim_date      DATE NOT NULL DEFAULT CURRENT_DATE,

  -- เหตุผลการเคลม
  reason          TEXT NOT NULL
                  CHECK (reason IN ('expired', 'damaged', 'lost', 'other')),

  -- สถานะ (cancelled = ไม่นับใน Dashboard)
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled')),

  -- Quantity
  total_quantity  INT NOT NULL DEFAULT 0,

  -- ต้นทุนของเสียทั้งหมด (cost ที่ยังคงอยู่กับเรา)
  total_cost      NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- หมายเหตุ
  note            TEXT,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_claim_date ON claims(claim_date);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_reason ON claims(reason);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_claim_no ON claims(claim_no);

-- ============================================================
-- CLAIM ITEMS (รายการสินค้าที่เคลม — snapshot ณ ตอนเคลม)
-- ============================================================
CREATE TABLE IF NOT EXISTS claim_items (
  id              BIGSERIAL PRIMARY KEY,
  claim_id        BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,

  -- FK reference (nullable: product ถูกลบก็ยังดู claim ได้)
  product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,

  -- Product snapshot (คัดลอกจาก master data ณ ตอนเคลม)
  product_name    TEXT NOT NULL,
  unit_cost       NUMERIC(10,2) NOT NULL,   -- ต้นทุน/หน่วย (snapshot จาก product.cost)
  quantity        INT NOT NULL DEFAULT 1,
  line_cost       NUMERIC(10,2) NOT NULL,   -- unit_cost * quantity

  -- หมายเหตุเฉพาะรายการ
  note            TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_product_id ON claim_items(product_id);

-- ============================================================
-- RLS Policies (authenticated users can CRUD) — mirror receipts
-- ============================================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view claims' AND tablename = 'claims') THEN
    CREATE POLICY "Authenticated users can view claims"
      ON claims FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert claims' AND tablename = 'claims') THEN
    CREATE POLICY "Authenticated users can insert claims"
      ON claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update claims' AND tablename = 'claims') THEN
    CREATE POLICY "Authenticated users can update claims"
      ON claims FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete claims' AND tablename = 'claims') THEN
    CREATE POLICY "Authenticated users can delete claims"
      ON claims FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view claim_items' AND tablename = 'claim_items') THEN
    CREATE POLICY "Authenticated users can view claim_items"
      ON claim_items FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert claim_items' AND tablename = 'claim_items') THEN
    CREATE POLICY "Authenticated users can insert claim_items"
      ON claim_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update claim_items' AND tablename = 'claim_items') THEN
    CREATE POLICY "Authenticated users can update claim_items"
      ON claim_items FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete claim_items' AND tablename = 'claim_items') THEN
    CREATE POLICY "Authenticated users can delete claim_items"
      ON claim_items FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
