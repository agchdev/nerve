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
  const puntos = Number(payload?.puntos);
  const tiempoRaw = payload?.tiempo;
  const tiempoValue = Number(tiempoRaw);
  const tiempo =
    tiempoRaw === undefined || tiempoRaw === null
      ? null
      : Number.isFinite(tiempoValue) && tiempoValue >= 0
      ? Math.floor(tiempoValue)
      : null;

  if (
    !userId ||
    !gameId ||
    !Number.isFinite(puntos) ||
    puntos < 0 ||
    (tiempoRaw !== undefined && tiempo === null)
  ) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const puntosInt = Math.floor(puntos);

  const { data: game, error: gameError } = await supabase
    .from("juegos")
    .select("id, max_intentos")
    .eq("id", gameId)
    .maybeSingle();

  if (gameError) {
    return NextResponse.json({ error: "GAME_LOOKUP_FAILED" }, { status: 500 });
  }

  if (!game) {
    return NextResponse.json({ error: "GAME_NOT_FOUND" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("puntuaciones")
    .select("id, puntuacion_max, intentos, tiempopartida_max")
    .eq("id_usuario", userId)
    .eq("id_juego", gameId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "SCORE_LOOKUP_FAILED" }, { status: 500 });
  }

  if (game.max_intentos !== null && existing?.intentos >= game.max_intentos) {
    return NextResponse.json(
      { code: "MAX_INTENTOS_ALCANZADO" },
      { status: 403 }
    );
  }

  let result;
  let monedasGanadas = 0;
  let monedasTotal = null;
  if (!existing) {
    const tiempoInicial = tiempo ?? 0;
    const { data: inserted, error: insertError } = await supabase
      .from("puntuaciones")
      .insert({
        id_usuario: userId,
        id_juego: gameId,
        puntuacion_max: puntosInt,
        intentos: 1,
        tiempopartida_max: tiempoInicial,
      })
      .select("puntuacion_max, intentos, tiempopartida_max")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: retry, error: retryError } = await supabase
          .from("puntuaciones")
          .select("id, puntuacion_max, intentos, tiempopartida_max")
          .eq("id_usuario", userId)
          .eq("id_juego", gameId)
          .maybeSingle();

        if (retryError || !retry) {
          return NextResponse.json(
            { error: "SCORE_SAVE_FAILED" },
            { status: 500 }
          );
        }

        const nextPuntuacion = Math.max(retry.puntuacion_max, puntosInt);
        const nextIntentos = retry.intentos + 1;
        const prevTiempo =
          typeof retry.tiempopartida_max === "number"
            ? retry.tiempopartida_max
            : 0;
        const nextTiempo =
          tiempo === null ? prevTiempo : Math.max(prevTiempo, tiempo);
        const { data: updated, error: updateError } = await supabase
          .from("puntuaciones")
          .update({
            puntuacion_max: nextPuntuacion,
            intentos: nextIntentos,
            tiempopartida_max: nextTiempo,
          })
          .eq("id", retry.id)
          .select("puntuacion_max, intentos, tiempopartida_max")
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: "SCORE_SAVE_FAILED" },
            { status: 500 }
          );
        }

        result = updated;
      } else {
        return NextResponse.json(
          { error: "SCORE_SAVE_FAILED" },
          { status: 500 }
        );
      }
    } else {
      result = inserted;
    }
  } else {
    const nextPuntuacion = Math.max(existing.puntuacion_max, puntosInt);
    const nextIntentos = existing.intentos + 1;
    const prevTiempo =
      typeof existing.tiempopartida_max === "number"
        ? existing.tiempopartida_max
        : 0;
    const nextTiempo = tiempo === null ? prevTiempo : Math.max(prevTiempo, tiempo);
    const { data: updated, error: updateError } = await supabase
      .from("puntuaciones")
      .update({
        puntuacion_max: nextPuntuacion,
        intentos: nextIntentos,
        tiempopartida_max: nextTiempo,
      })
      .eq("id", existing.id)
      .select("puntuacion_max, intentos, tiempopartida_max")
      .single();

    if (updateError) {
      return NextResponse.json({ error: "SCORE_SAVE_FAILED" }, { status: 500 });
    }

    result = updated;
  }

  if (puntosInt > 0) {
    const { data: rewardRow, error: rewardError } = await supabase
      .from("recompensas")
      .select("monedas_por_unidad")
      .eq("id_juego", gameId)
      .eq("activo", true)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rewardError) {
      const unitValue = Number(rewardRow?.monedas_por_unidad);
      const reward = Number.isFinite(unitValue) && unitValue > 0 ? unitValue : 0;
      if (reward > 0) {
        monedasGanadas = puntosInt * reward;

        const { error: initError } = await supabase
          .from("monedas")
          .insert({ id_usuario: userId })
          .select("id")
          .single();

        if (!initError || initError.code === "23505") {
          const { data: coinsRow, error: coinsError } = await supabase
            .from("monedas")
            .select("cantidad")
            .eq("id_usuario", userId)
            .maybeSingle();

          if (!coinsError) {
            const currentCoins =
              typeof coinsRow?.cantidad === "number" ? coinsRow.cantidad : 0;
            const nextCoins = currentCoins + monedasGanadas;
            const { data: updatedCoins } = await supabase
              .from("monedas")
              .update({
                cantidad: nextCoins,
                actualizado_en: new Date().toISOString(),
              })
              .eq("id_usuario", userId)
              .select("cantidad")
              .single();

            monedasTotal = updatedCoins?.cantidad ?? nextCoins;
          }
        }
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      puntuacion_max: result?.puntuacion_max ?? null,
      intentos: result?.intentos ?? null,
      tiempopartida_max: result?.tiempopartida_max ?? null,
      monedas_ganadas: monedasGanadas,
      monedas_total: monedasTotal,
    },
    { status: 200 }
  );
}
