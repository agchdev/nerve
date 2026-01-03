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
  if (!userId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { error: otpError } = await supabase
    .from("usuarios_otp")
    .delete()
    .eq("user_id", userId);

  if (otpError) {
    return NextResponse.json({ error: "OTP_DELETE_FAILED" }, { status: 500 });
  }

  const { error: passError } = await supabase
    .from("usuarios_password")
    .delete()
    .eq("user_id", userId);

  if (passError) {
    return NextResponse.json({ error: "PASSWORD_DELETE_FAILED" }, { status: 500 });
  }

  const { error: scoresError } = await supabase
    .from("puntuaciones")
    .delete()
    .eq("id_usuario", userId);

  if (scoresError) {
    return NextResponse.json({ error: "SCORES_DELETE_FAILED" }, { status: 500 });
  }

  const { error: userError } = await supabase
    .from("usuarios")
    .delete()
    .eq("id", userId);

  if (userError) {
    return NextResponse.json({ error: "USER_DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
