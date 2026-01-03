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
    .select(
      "id, slug, reglas, esta_activo, tipo, max_intentos, preciopartida, image_url"
    )
    .eq("slug", "Snake")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "GAME_FETCH_FAILED" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ game: data }, { status: 200 });
}
