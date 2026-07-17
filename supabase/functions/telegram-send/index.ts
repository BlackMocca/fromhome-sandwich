// supabase/functions/telegram-send/index.ts
//
// Sends a text message and/or file(s) to Telegram via the Bot API.
// Files are sent as *documents* (sendDocument) rather than photos so the
// original file is preserved (Telegram does not re-encode documents), which
// is what you want when the file is consumed/processed downstream.
//
// Auth:
//   - config.toml sets `verify_jwt = true`, so the Supabase gateway
//     already rejects requests without a valid JWT.
//   - Additionally we decode the JWT and assert `role === 'authenticated'`
//     (the anon key has role `anon` and must be rejected), and — when the
//     SUPABASE_JWKS env is present — verify the RS256 signature.
//
// Config (bot_token + chat_id) is read from the `telegram_settings` table
// using the service-role key, so the secret token never reaches the client.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const SERVICE_KEY = SECRET_KEYS["fromhome_sandwidch"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

/** Verify the RS256 signature of a Supabase JWT using the project JWKS. */
async function verifyJwtSignature(
  token: string,
  jwks: Jwks,
): Promise<void> {
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

/**
 * Authorize the request: decode the JWT from the Authorization header,
 * optionally verify its signature (when SUPABASE_JWKS is available), and
 * assert the caller has the `authenticated` role. Returns the payload.
 */
async function authorize(req: Request): Promise<Record<string, unknown>> {
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

  // Expiry check (defense in depth; gateway also enforces this)
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired");
  }

  // Explicit role check — anon key (role 'anon') must be rejected.
  if (payload.role !== "authenticated") {
    throw new Error("Forbidden: requires authenticated role");
  }

  // Optional signature verification using SUPABASE_JWKS.
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

  return payload;
}

/* ── Telegram Bot API ───────────────────────────────────── */

async function sendToTelegram(
  botToken: string,
  chatId: string,
  files: File[],
  text: string,
): Promise<unknown> {
  const base = `https://api.telegram.org/bot${botToken}`;

  // Text only
  if (files.length === 0) {
    if (!text.trim()) throw new Error("No text or file provided");
    const res = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return await res.json();
  }

  // Send each file as a *document* (not a re-compressed photo) so the
  // original bytes are preserved for downstream use. Telegram's sendMediaGroup
  // only supports photo/video, NOT documents, so for multiple files we send
  // one sendDocument per file (caption only on the first to avoid repeats).
  const results: unknown[] = [];
  for (let i = 0; i < files.length; i++) {
    const fd = new FormData();
    fd.append("chat_id", chatId);
    fd.append("document", files[i], files[i].name || `file${i}`);
    if (i === 0 && text.trim()) fd.append("caption", text.trim());
    const res = await fetch(`${base}/sendDocument`, {
      method: "POST",
      body: fd,
    });
    results.push(await res.json());
  }
  // Keep the response shape compatible: a single file returns the single
  // Telegram result object; multiple files return an array of results.
  return files.length === 1 ? results[0] : results;
}

/* ── Handler ────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    // 1) Auth: verify JWT + role === authenticated
    try {
      await authorize(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unauthorized";
      const status = msg.includes("Forbidden") ? 403 : 401;
      return Response.json(
        { error: msg },
        { status, headers: corsHeaders() },
      );
    }

    // 2) Load Telegram config (service role — bypasses RLS)
    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/telegram_settings?select=*&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      },
    );
    if (!settingsRes.ok) {
      return Response.json(
        { error: "Failed to load Telegram settings" },
        { status: 500, headers: corsHeaders() },
      );
    }
    const rows = await settingsRes.json() as Array<{
      bot_token: string;
      chat_id: string | null;
    }>;
    const settings = rows[0];
    if (!settings || !settings.bot_token) {
      return Response.json(
        { error: "Telegram not configured" },
        { status: 400, headers: corsHeaders() },
      );
    }

    // 3) Parse request body (multipart/form-data)
    const formData = await req.formData();
    const text = (formData.get("text") as string) ?? "";
    const chatIdOverride = (formData.get("chat_id") as string) || undefined;
    const chatId = chatIdOverride || settings.chat_id;
    if (!chatId) {
      return Response.json(
        { error: "No chat_id configured" },
        { status: 400, headers: corsHeaders() },
      );
    }
    const files = (formData.getAll("file") as unknown[]).filter(
      (f): f is File => f instanceof File && f.size > 0,
    );

    // 4) Send
    const result = await sendToTelegram(
      settings.bot_token,
      chatId,
      files,
      text,
    );
    return Response.json(
      { success: true, result },
      { status: 200, headers: corsHeaders() },
    );
  } catch (err) {
    console.error("telegram-send error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500, headers: corsHeaders() },
    );
  }
});
