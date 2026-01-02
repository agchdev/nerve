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
    .from("puntuaciones")
    .select("puntuacion_max, id_usuario, usuarios ( id, nombre )")
    .order("puntuacion_max", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "RANKING_FETCH_FAILED" },
      { status: 500 }
    );
  }

  const bestByUser = new Map();
  for (const row of data ?? []) {
    const user = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios;
    if (!user?.id) continue;

    const existing = bestByUser.get(user.id);
    if (!existing || row.puntuacion_max > existing.puntuacion) {
      bestByUser.set(user.id, {
        id: user.id,
        nombre: user.nombre,
        puntuacion: row.puntuacion_max,
      });
    }
  }

  const items = Array.from(bestByUser.values()).sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  return NextResponse.json({ items }, { status: 200 });
}
