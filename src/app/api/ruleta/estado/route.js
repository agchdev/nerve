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

const HISTORY_LIMIT = 12;

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId") ?? "";

  let roundQuery = supabase
    .from("ruleta_rondas")
    .select(
      "id, id_juego, estado, numero_ganador, color_ganador, paridad_ganadora, rango_ganador, inicio_en, cierre_en, resuelta_en, actualizado_en, creado_en"
    )
    .order("creado_en", { ascending: false })
    .limit(1);
  if (gameId) {
    roundQuery = roundQuery.eq("id_juego", gameId);
  }
  const { data: roundData, error: roundError } = await roundQuery;

  let historyQuery = supabase
    .from("ruleta_rondas")
    .select("numero_ganador, resuelta_en")
    .eq("estado", "resuelta")
    .not("numero_ganador", "is", null)
    .order("resuelta_en", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (gameId) {
    historyQuery = historyQuery.eq("id_juego", gameId);
  }
  const { data: historyData, error: historyError } = await historyQuery;

  const history = Array.isArray(historyData)
    ? historyData
        .map((row) => clampNumber(Number(row.numero_ganador), 0, 36))
        .filter((value) => !Number.isNaN(value))
    : [];

  const hasRoundError = Boolean(roundError);
  const hasHistoryError = Boolean(historyError);
  const status = hasRoundError && hasHistoryError ? 500 : 200;

  return NextResponse.json(
    {
      round: roundData?.[0] ?? null,
      history,
      roundError: hasRoundError ? "ROUND_LOOKUP_FAILED" : null,
      historyError: hasHistoryError ? "HISTORY_LOOKUP_FAILED" : null,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
