import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_NOT_CONFIGURED" },
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

  if (!userId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .select("id, telefono")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: "USER_LOOKUP_FAILED" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const fullPhone = normalizeDigits(user.telefono);
  if (!fullPhone || fullPhone.length < 6) {
    return NextResponse.json({ error: "PHONE_NOT_SET" }, { status: 400 });
  }

  const codigo = `${Math.floor(100000 + Math.random() * 900000)}`;
  const salt = randomBytes(12).toString("hex");
  const hash = scryptSync(codigo, salt, 64).toString("hex");
  const codigoHash = `scrypt$${salt}$${hash}`;
  const expiraEn = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: otpError } = await supabase.from("usuarios_otp").insert({
    user_id: userId,
    codigo_hash: codigoHash,
    expira_en: expiraEn,
    usado_en: null,
    intentos: 0,
    max_intentos: 5,
  });

  if (otpError) {
    return NextResponse.json({ error: "OTP_SAVE_FAILED" }, { status: 500 });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono: fullPhone, codigo }),
  });
  if (!response.ok) {
    return NextResponse.json({ error: "N8N_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, expira_en: expiraEn }, { status: 200 });
}
