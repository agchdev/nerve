import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

const MIN_PASSWORD_LENGTH = 8;
const hasUppercase = (value) => /[A-Z]/.test(value);
const hasLowercase = (value) => /[a-z]/.test(value);
const hasNumber = (value) => /\d/.test(value);
const hasSymbol = (value) => /[^A-Za-z0-9]/.test(value);

const isStrongPassword = (value) =>
  value.length >= MIN_PASSWORD_LENGTH &&
  hasUppercase(value) &&
  hasLowercase(value) &&
  hasNumber(value) &&
  hasSymbol(value);
const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
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

  const nombre =
    typeof payload?.nombre === "string" ? payload.nombre.trim() : "";
  const telefono = normalizeDigits(payload?.telefono);
  const rawPassword =
    typeof payload?.password === "string" ? payload.password : "";

  if (!nombre || !telefono || !rawPassword.trim()) {
    return NextResponse.json({ code: "MISSING_FIELDS" }, { status: 400 });
  }

  if (!isStrongPassword(rawPassword)) {
    return NextResponse.json({ code: "WEAK_PASSWORD" }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .insert({
      nombre,
      telefono,
    })
    .select("id")
    .single();

  if (userError) {
    if (userError.code === "23505") {
      return NextResponse.json({ code: "DUPLICATE_PHONE" }, { status: 409 });
    }

    return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 });
  }

  const passwordHash = hashPassword(rawPassword);
  const { error: passwordError } = await supabase
    .from("usuarios_password")
    .insert({
      user_id: user.id,
      password_hash: passwordHash,
    });

  if (passwordError) {
    await supabase.from("usuarios").delete().eq("id", user.id);
    return NextResponse.json({ error: "PASSWORD_INSERT_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
