-- ============================================================
-- TELEGRAM SETTINGS — Bot token + target chat for the
-- "เชื่อมต่อ Telegram" integration (single config record).
-- ------------------------------------------------------------
-- Stores the BotFather BOT Token and the default chat_id /
-- channel username that Edge Function `telegram-send` delivers
-- messages & images to. RLS restricts all access to authenticated
-- users (this is an internal admin tool).
-- ============================================================

CREATE TABLE IF NOT EXISTS telegram_settings (
  id          BIGSERIAL PRIMARY KEY,
  bot_token   TEXT NOT NULL,
  chat_id     TEXT,                       -- target chat / channel (e.g. '-100123' or '@mychannel')
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_settings_active ON telegram_settings (is_active);

ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can manage telegram_settings'
      AND tablename = 'telegram_settings'
  ) THEN
    CREATE POLICY "Authenticated users can manage telegram_settings"
      ON telegram_settings
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
