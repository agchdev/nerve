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

  if (!userId || !gameId || !Number.isFinite(puntos) || puntos < 0) {
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
    .select("id, puntuacion_max, intento")
    .eq("id_usuario", userId)
    .eq("id_juego", gameId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "SCORE_LOOKUP_FAILED" }, { status: 500 });
  }

  if (game.max_intentos !== null && existing?.intento >= game.max_intentos) {
    return NextResponse.json(
      { code: "MAX_INTENTOS_ALCANZADO" },
      { status: 403 }
    );
  }

  let result;
  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from("puntuaciones")
      .insert({
        id_usuario: userId,
        id_juego: gameId,
        puntuacion_max: puntosInt,
        intento: 1,
      })
      .select("puntuacion_max, intento")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: retry, error: retryError } = await supabase
          .from("puntuaciones")
          .select("id, puntuacion_max, intento")
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
        const nextIntento = retry.intento + 1;
        const { data: updated, error: updateError } = await supabase
          .from("puntuaciones")
          .update({
            puntuacion_max: nextPuntuacion,
            intento: nextIntento,
          })
          .eq("id", retry.id)
          .select("puntuacion_max, intento")
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
    const nextIntento = existing.intento + 1;
    const { data: updated, error: updateError } = await supabase
      .from("puntuaciones")
      .update({
        puntuacion_max: nextPuntuacion,
        intento: nextIntento,
      })
      .eq("id", existing.id)
      .select("puntuacion_max, intento")
      .single();

    if (updateError) {
      return NextResponse.json({ error: "SCORE_SAVE_FAILED" }, { status: 500 });
    }

    result = updated;
  }

  return NextResponse.json(
    {
      ok: true,
      puntuacion_max: result?.puntuacion_max ?? null,
      intento: result?.intento ?? null,
    },
    { status: 200 }
  );
}
