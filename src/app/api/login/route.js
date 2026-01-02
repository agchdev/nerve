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

const verifyPassword = (password, storedHash) => {
  if (!storedHash || typeof storedHash !== "string") return false;
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
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

  const telefono =
    typeof payload?.telefono === "string" ? payload.telefono.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!telefono || !password.trim()) {
    return NextResponse.json({ code: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .select("id, nombre, telefono")
    .eq("telefono", telefono)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: "USER_LOOKUP_FAILED" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const { data: passRow, error: passError } = await supabase
    .from("usuarios_password")
    .select("password_hash")
    .eq("user_id", user.id)
    .maybeSingle();

  if (passError) {
    return NextResponse.json(
      { error: "PASSWORD_LOOKUP_FAILED" },
      { status: 500 }
    );
  }

  if (!passRow?.password_hash) {
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const isValid = verifyPassword(password, passRow.password_hash);
  if (!isValid) {
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  return NextResponse.json(
    { ok: true, usuario: { id: user.id, nombre: user.nombre } },
    { status: 200 }
  );
}
