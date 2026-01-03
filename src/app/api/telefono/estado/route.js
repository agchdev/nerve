import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "";

  if (!userId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("telefono_verificado_en")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "VERIF_LOOKUP_FAILED" }, { status: 500 });
  }

  return NextResponse.json(
    { verified: Boolean(data?.telefono_verificado_en) },
    { status: 200 }
  );
}
