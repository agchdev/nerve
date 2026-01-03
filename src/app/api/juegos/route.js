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

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("juegos")
    .select("id, slug, image_url, esta_activo")
    .eq("esta_activo", true)
    .order("creado_en", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "GAMES_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] }, { status: 200 });
}
