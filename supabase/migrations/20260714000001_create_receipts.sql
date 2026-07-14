-- ============================================================
-- RECEIPTS (Header)
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id              BIGSERIAL PRIMARY KEY,

  -- Channel reference
  channel_id      BIGINT NOT NULL REFERENCES channels(id),
  channel_code    TEXT NOT NULL,                   -- denormalized (LMN, GRAB...)

  -- Receipt identity
  receipt_no      TEXT NOT NULL UNIQUE,            -- LMN202607140001

  -- Customer info (snapshot at order time)
  customer_name   TEXT,

  -- Dates
  bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Quantity
  total_quantity  INT NOT NULL DEFAULT 0,

  -- Money
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Discount snapshot (JSONB)
  discounts       JSONB NOT NULL DEFAULT '[]',

  -- Status
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled')),

  -- Metadata
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_channel_id ON receipts(channel_id);
CREATE INDEX IF NOT EXISTS idx_receipts_bill_date ON receipts(bill_date);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_receipt_no ON receipts(receipt_no);

-- ============================================================
-- RECEIPT ITEMS (Line Items + Product Snapshot)
-- ============================================================
CREATE TABLE IF NOT EXISTS receipt_items (
  id              BIGSERIAL PRIMARY KEY,
  receipt_id      BIGINT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,

  -- FK reference (nullable: product ถูกลบก็ยังดู receipt ได้)
  product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,

  -- Product snapshot (คัดลอกจาก master data ณ ตอนสั่ง)
  product_name    TEXT NOT NULL,
  product_price   NUMERIC(10,2) NOT NULL,
  product_cost    NUMERIC(10,2) NOT NULL,
  product_options JSONB NOT NULL DEFAULT '[]',

  -- Quantity & calculated
  quantity        INT NOT NULL DEFAULT 1,
  line_total      NUMERIC(10,2) NOT NULL,

  -- Optional
  note            TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_product_id ON receipt_items(product_id);

-- ============================================================
-- RLS Policies (authenticated users can CRUD)
-- ============================================================
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view receipts' AND tablename = 'receipts') THEN
    CREATE POLICY "Authenticated users can view receipts"
      ON receipts FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert receipts' AND tablename = 'receipts') THEN
    CREATE POLICY "Authenticated users can insert receipts"
      ON receipts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update receipts' AND tablename = 'receipts') THEN
    CREATE POLICY "Authenticated users can update receipts"
      ON receipts FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete receipts' AND tablename = 'receipts') THEN
    CREATE POLICY "Authenticated users can delete receipts"
      ON receipts FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view receipt_items' AND tablename = 'receipt_items') THEN
    CREATE POLICY "Authenticated users can view receipt_items"
      ON receipt_items FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert receipt_items' AND tablename = 'receipt_items') THEN
    CREATE POLICY "Authenticated users can insert receipt_items"
      ON receipt_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update receipt_items' AND tablename = 'receipt_items') THEN
    CREATE POLICY "Authenticated users can update receipt_items"
      ON receipt_items FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete receipt_items' AND tablename = 'receipt_items') THEN
    CREATE POLICY "Authenticated users can delete receipt_items"
      ON receipt_items FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
