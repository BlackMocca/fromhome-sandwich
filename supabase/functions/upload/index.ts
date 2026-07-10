import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  uploadFile,
  SupabaseClient,
} from "./upload.ts";

const SUPABASE_SECRET_KEYS = JSON.parse(
  Deno.env.get("SUPABASE_SECRET_KEYS")!,
);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      SUPABASE_SECRET_KEYS["fromhome_sandwidch"],
    );

    const res = await uploadFile(req, supabaseAdmin as SupabaseClient);
    for (const [k, v] of Object.entries(corsHeaders())) {
      res.headers.set(k, v);
    }
    return res;
  } catch (err) {
    console.error("Unhandled error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500, headers: corsHeaders() },
    );
  }
});
