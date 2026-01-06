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

const toInt = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
};

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const userId = typeof payload?.userId === "string" ? payload.userId : "";
  const gameId = typeof payload?.gameId === "string" ? payload.gameId : "";
  const rawBets = Array.isArray(payload?.bets) ? payload.bets : [];

  if (!userId || !gameId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const bets = rawBets
    .map((bet) => {
      if (!bet || typeof bet.id !== "string") return null;
      const total = toInt(bet.total);
      if (!Number.isFinite(total) || total <= 0) return null;
      return {
        id: bet.id,
        label: typeof bet.label === "string" ? bet.label : bet.id,
        total,
      };
    })
    .filter(Boolean);

  if (!bets.length) {
    return NextResponse.json({ error: "NO_BETS" }, { status: 400 });
  }

  const totalBet = bets.reduce((sum, bet) => sum + bet.total, 0);
  if (totalBet <= 0) {
    return NextResponse.json({ error: "INVALID_BET_TOTAL" }, { status: 400 });
  }

  const { data: pendingBet, error: pendingError } = await supabase
    .from("ruleta_historial")
    .select("id")
    .eq("id_usuario", userId)
    .eq("id_juego", gameId)
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingError) {
    return NextResponse.json(
      { error: "BET_LOOKUP_FAILED" },
      { status: 500 }
    );
  }

  if (pendingBet) {
    return NextResponse.json({ error: "PENDING_BET" }, { status: 409 });
  }

  const { data: round, error: roundError } = await supabase
    .from("ruleta_rondas")
    .select("id, estado, cierre_en")
    .eq("id_juego", gameId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError || !round?.id) {
    return NextResponse.json(
      { error: "ROUND_LOOKUP_FAILED" },
      { status: 500 }
    );
  }

  if (round.estado !== "abierta") {
    return NextResponse.json({ error: "BETTING_CLOSED" }, { status: 409 });
  }

  if (round.cierre_en) {
    const closesAt = new Date(round.cierre_en).getTime();
    if (!Number.isFinite(closesAt) || closesAt <= Date.now()) {
      return NextResponse.json({ error: "BETTING_CLOSED" }, { status: 409 });
    }
  }

  const { error: initError } = await supabase
    .from("monedas")
    .insert({ id_usuario: userId })
    .select("id")
    .single();

  if (initError && initError.code !== "23505") {
    return NextResponse.json({ error: "COINS_INIT_FAILED" }, { status: 500 });
  }

  const { data: coinsRow, error: coinsError } = await supabase
    .from("monedas")
    .select("cantidad")
    .eq("id_usuario", userId)
    .maybeSingle();

  if (coinsError) {
    return NextResponse.json({ error: "COINS_LOOKUP_FAILED" }, { status: 500 });
  }

  const currentCoins =
    typeof coinsRow?.cantidad === "number" ? coinsRow.cantidad : 0;

  if (currentCoins < totalBet) {
    return NextResponse.json(
      { error: "INSUFFICIENT_FUNDS", coins: currentCoins },
      { status: 403 }
    );
  }

  const nextCoins = currentCoins - totalBet;
  const { error: updateError } = await supabase
    .from("monedas")
    .update({
      cantidad: nextCoins,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id_usuario", userId);

  if (updateError) {
    return NextResponse.json({ error: "COINS_UPDATE_FAILED" }, { status: 500 });
  }

  const { data: insertRow, error: insertError } = await supabase
    .from("ruleta_historial")
    .insert({
      id_usuario: userId,
      id_juego: gameId,
      apuesta_total: totalBet,
      pago_total: 0,
      ganancia_neta: 0,
      saldo_antes: currentCoins,
      saldo_despues: nextCoins,
      estado: "pendiente",
      apuestas: {
        round_id: round.id,
        bets,
        total: totalBet,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    await supabase
      .from("monedas")
      .update({
        cantidad: currentCoins,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id_usuario", userId);
    return NextResponse.json({ error: "BET_SAVE_FAILED" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, betId: insertRow?.id ?? null, roundId: round.id, coins: nextCoins },
    { status: 200 }
  );
}
