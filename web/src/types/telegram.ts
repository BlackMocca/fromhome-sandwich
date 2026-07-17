/**
 * Telegram integration settings (table: telegram_settings)
 * Stored server-side; the BOT Token is secret and only shown masked
 * in the UI. Used by the `telegram-send` Edge Function.
 */
export interface TelegramSettings {
  id: number;
  bot_token: string;
  chat_id: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Payload sent from the management UI when saving the config. */
export interface TelegramSettingsInput {
  bot_token: string;
  chat_id?: string | null;
  is_active?: boolean;
}
