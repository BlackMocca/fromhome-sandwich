-- ============================================================
-- DISBURSEMENTS (เบิกเงิน — รายการเบิกจ่าย/เบิกเงินสด)
-- วัตถุประสงค์: บันทึกรายการเบิกเงิน พร้อมราคา วันที่ และสถานะ
-- จ่ายแล้ว / ค้างจ่าย (toggle switch)
-- โครงสร้างเรียบง่ายกว่า claims (รายการละ 1 บันทึก ไม่มี line items)
-- ============================================================

CREATE TABLE IF NOT EXISTS disbursements (
  id              BIGSERIAL PRIMARY KEY,

  -- เลขที่เบิก (WD + YYYYMMDD + running seq, reset รันใหม่ทุกวัน)
  withdraw_no     TEXT NOT NULL UNIQUE,

  -- วันที่เบิก
  withdraw_date   DATE NOT NULL DEFAULT CURRENT_DATE,

  -- รายการ (what the disbursement is for)
  description     TEXT NOT NULL,

  -- ราคา / จำนวนเงิน
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- สถานะการจ่าย (paid = จ่ายแล้ว, unpaid = ค้างจ่าย)
  status          TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('paid', 'unpaid')),

  -- หมายเหตุ
  note            TEXT,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disbursements_withdraw_date ON disbursements(withdraw_date);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_disbursements_withdraw_no ON disbursements(withdraw_no);

-- ============================================================
-- RLS Policies (authenticated users can CRUD) — mirror claims
-- ============================================================
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view disbursements' AND tablename = 'disbursements') THEN
    CREATE POLICY "Authenticated users can view disbursements"
      ON disbursements FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert disbursements' AND tablename = 'disbursements') THEN
    CREATE POLICY "Authenticated users can insert disbursements"
      ON disbursements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update disbursements' AND tablename = 'disbursements') THEN
    CREATE POLICY "Authenticated users can update disbursements"
      ON disbursements FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete disbursements' AND tablename = 'disbursements') THEN
    CREATE POLICY "Authenticated users can delete disbursements"
      ON disbursements FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
