// supabase/functions/telegram-updates/index.ts
//
// Proxies Telegram Bot API `getUpdates` so the management UI can list
// recent chats and discover the `chat_id` without exposing the bot token
// (the token stays server-side in `telegram_settings`).
//
// Auth: same as telegram-send — gateway `verify_jwt = true` plus an
// explicit `role === 'authenticated'` check (and optional JWKS signature
// verification when SUPABASE_JWKS is present).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const SERVICE_KEY = SECRET_KEYS["fromhome_sandwidch"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

/* ── JWT helpers (Web Crypto, no external deps) ──────────── */

function b64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadB64 = token.split(".")[1];
  const json = new TextDecoder().decode(b64urlToBytes(payloadB64));
  return JSON.parse(json);
}

interface Jwk {
  kty: string;
  n?: string;
  e?: string;
  crv?: string;
  x?: string;
  y?: string;
  kid?: string;
  alg?: string;
}
interface Jwks {
  keys: Jwk[];
}

async function verifyJwtSignature(token: string, jwks: Jwks): Promise<void> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching JWK for token kid");

  // Support both RSA (RS256) and EC (ES256) Supabase JWTs.
  const isEC = jwk.kty === "EC";
  const crv = (jwk.crv ?? "P-256") as "P-256" | "P-384" | "P-521";

  const importAlgorithm = isEC
    ? { name: "ECDSA", namedCurve: crv }
    : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const verifyAlgorithm = isEC
    ? { name: "ECDSA", hash: "SHA-256" }
    : { name: "RSASSA-PKCS1-v1_5" };

  const keyData = isEC
    ? { kty: "EC", crv, x: jwk.x ?? "", y: jwk.y ?? "", ext: false }
    : { kty: "RSA", n: jwk.n ?? "", e: jwk.e ?? "", ext: false };

  const key = await crypto.subtle.importKey(
    "jwk",
    keyData as JsonWebKey,
    importAlgorithm as AlgorithmIdentifier,
    false,
    ["verify"],
  );

  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToBytes(parts[2]);
  const valid = await crypto.subtle.verify(
    verifyAlgorithm as AlgorithmIdentifier,
    key,
    sig,
    data,
  );
  if (!valid) throw new Error("Invalid JWT signature");
}

async function authorize(req: Request): Promise<void> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  if (!token) throw new Error("Missing authorization");

  let payload: Record<string, unknown>;
  try {
    payload = decodeJwtPayload(token);
  } catch {
    throw new Error("Malformed authorization token");
  }

  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired");
  }
  if (payload.role !== "authenticated") {
    throw new Error("Forbidden: requires authenticated role");
  }

  const jwksRaw = Deno.env.get("SUPABASE_JWKS");
  if (jwksRaw) {
    try {
      const jwks = JSON.parse(jwksRaw) as Jwks;
      if (jwks.keys?.length) await verifyJwtSignature(token, jwks);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "JWT signature verification failed",
      );
    }
  }
}

/* ── Chat extraction ───────────────────────────────────── */

interface ChatInfo {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
}

function extractChats(result: unknown[]): ChatInfo[] {
  const chats: ChatInfo[] = [];
  const seen = new Set<number>();
  for (const upd of result) {
    const u = upd as Record<string, any>;
    // A Telegram update can carry a chat in several places.
    // `my_chat_member` / `chat_member` are emitted when the bot is added to a
    // chat or a user first starts it — these updates have NO `message` field,
    // so they MUST be handled explicitly or the chat list comes back empty.
    const chat =
      u?.message?.chat ??
      u?.edited_message?.chat ??
      u?.channel_post?.chat ??
      u?.edited_channel_post?.chat ??
      u?.callback_query?.message?.chat ??
      u?.my_chat_member?.chat ??
      u?.chat_member?.chat;
    if (chat && !seen.has(chat.id)) {
      seen.add(chat.id);
      chats.push({
        id: chat.id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
        first_name: chat.first_name,
      });
    }
  }
  return chats;
}

/**
 * When getUpdates returns nothing, the most common cause is a webhook being
 * set on the bot — Telegram disables getUpdates entirely while a webhook is
 * active, so it always yields an empty `result`. Detect it so the UI can tell
 * the user *why* the list is empty instead of failing silently.
 */
async function diagnoseEmpty(botToken: string): Promise<string | undefined> {
  try {
    const whRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
    );
    const wh = (await whRes.json()) as { ok?: boolean; result?: { url?: string } };
    if (wh?.ok && wh.result?.url) {
      return (
        "พบ webhook ถูกตั้งค่าไว้ (`getWebhookInfo.url`) ทำให้ getUpdates ไม่ทำงานและคืนค่า empty — " +
        "ลบ webhook ด้วย deleteWebhook ก่อน หรือใช้ chat_id จาก webhook แทน"
      );
    }
    return "ยังไม่มีข้อความใหม่ในคิว (ลองส่งข้อความหาบอทก่อนแล้วกดดึงรายการแชทอีกครั้ง)";
  } catch {
    // diagnostic failure is non-fatal — just don't attach a note
    return undefined;
  }
}

/* ── Handler ────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    try {
      await authorize(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unauthorized";
      const status = msg.includes("Forbidden") ? 403 : 401;
      return Response.json({ error: msg }, { status, headers: corsHeaders() });
    }

    // Resolve the bot token.
    // Prefer the token sent from the UI (the unsaved BOT Token input) so the
    // "ดึงรายการแชท" button works without saving first. Fall back to the saved
    // DB setting. getUpdates needs ONLY the bot token — never the chat_id.
    let botToken: string | undefined;
    if (req.method === "POST") {
      try {
        const body = (await req.json().catch(() => null)) as { bot_token?: string } | null;
        botToken = body?.bot_token || undefined;
      } catch {
        // ignore malformed body
      }
    }

    if (!botToken) {
      const settingsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/telegram_settings?select=*&limit=1`,
        {
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        },
      );
      if (settingsRes.ok) {
        const rows = await settingsRes.json() as Array<{ bot_token: string }>;
        botToken = rows[0]?.bot_token;
      }
    }

    if (!botToken) {
      return Response.json(
        { error: "Telegram not configured (ระบุ BOT Token ก่อน)" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=100&timeout=5`,
    );
    const tg = await tgRes.json();
    if (!tg.ok) {
      return Response.json(
        { error: tg.description || "Telegram getUpdates failed" },
        { status: 502, headers: corsHeaders() },
      );
    }

    const chats = extractChats(Array.isArray(tg.result) ? tg.result : []);

    // Empty result: explain *why* instead of returning a silent [].
    let note: string | undefined;
    if (chats.length === 0) {
      note = await diagnoseEmpty(botToken);
    }

    return Response.json(
      { success: true, chats, ...(note ? { note } : {}) },
      { status: 200, headers: corsHeaders() },
    );
  } catch (err) {
    console.error("telegram-updates error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500, headers: corsHeaders() },
    );
  }
});
