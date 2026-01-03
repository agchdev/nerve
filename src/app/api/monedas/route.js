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
    .from("monedas")
    .select("cantidad")
    .eq("id_usuario", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "COINS_LOOKUP_FAILED" }, { status: 500 });
  }

  return NextResponse.json(
    { coins: typeof data?.cantidad === "number" ? data.cantidad : 0 },
    { status: 200 }
  );
}

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
  const deltaValue = Number(payload?.delta);

  if (!userId || !Number.isFinite(deltaValue)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const delta = Math.trunc(deltaValue);

  const { error: insertError } = await supabase
    .from("monedas")
    .insert({ id_usuario: userId })
    .select("id")
    .single();

  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: "COINS_INIT_FAILED" }, { status: 500 });
  }

  const { data: currentRow, error: currentError } = await supabase
    .from("monedas")
    .select("cantidad")
    .eq("id_usuario", userId)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ error: "COINS_LOOKUP_FAILED" }, { status: 500 });
  }

  const currentCoins =
    typeof currentRow?.cantidad === "number" ? currentRow.cantidad : 0;
  const nextCoins = currentCoins + delta;

  if (nextCoins < 0) {
    return NextResponse.json(
      { code: "INSUFFICIENT_FUNDS", coins: currentCoins },
      { status: 403 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("monedas")
    .update({
      cantidad: nextCoins,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id_usuario", userId)
    .select("cantidad")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "COINS_UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, coins: updated?.cantidad ?? nextCoins },
    { status: 200 }
  );
}
