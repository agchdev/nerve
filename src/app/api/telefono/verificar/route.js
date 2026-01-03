import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scryptSync, timingSafeEqual } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

const parseHash = (storedHash) => {
  if (!storedHash || typeof storedHash !== "string") return null;
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return null;
  return { salt, hash };
};

const compareHash = (code, storedHash) => {
  const parsed = parseHash(storedHash);
  if (!parsed) return false;
  const derived = scryptSync(code, parsed.salt, 64);
  const stored = Buffer.from(parsed.hash, "hex");
  if (stored.length !== derived.length) return false;
  return timingSafeEqual(derived, stored);
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
  const codigo = typeof payload?.codigo === "string" ? payload.codigo.trim() : "";

  if (!userId || !codigo) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("usuarios_otp")
    .select("id, codigo_hash, expira_en, intentos, max_intentos")
    .eq("user_id", userId)
    .is("usado_en", null)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "VERIF_LOOKUP_FAILED" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ code: "INVALID_CODE" }, { status: 400 });
  }

  if (data.expira_en && new Date(data.expira_en) < new Date()) {
    return NextResponse.json({ code: "CODE_EXPIRED" }, { status: 400 });
  }

  const maxIntentos = Number(data.max_intentos ?? 0);
  const intentosActuales = Number(data.intentos ?? 0);
  if (maxIntentos && intentosActuales >= maxIntentos) {
    return NextResponse.json({ code: "MAX_ATTEMPTS" }, { status: 400 });
  }

  const isMatch = compareHash(codigo, data.codigo_hash);
  if (!isMatch) {
    const nextAttempts = intentosActuales + 1;
    await supabase
      .from("usuarios_otp")
      .update({
        intentos: nextAttempts,
      })
      .eq("id", data.id);
    return NextResponse.json({ code: "INVALID_CODE" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  const { error: otpUpdateError } = await supabase
    .from("usuarios_otp")
    .update({
      usado_en: nowIso,
    })
    .eq("id", data.id);

  if (otpUpdateError) {
    return NextResponse.json({ error: "OTP_UPDATE_FAILED" }, { status: 500 });
  }

  const { error: userUpdateError } = await supabase
    .from("usuarios")
    .update({
      telefono_verificado_en: nowIso,
      esta_activo: true,
    })
    .eq("id", userId);

  if (userUpdateError) {
    return NextResponse.json({ error: "USER_UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
