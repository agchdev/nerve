"use client";

import { GridScan } from "@/components/GridScan";
import { useState } from "react";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const trimmedNombre = nombre.trim();
    const trimmedTelefono = telefono.trim();
    const rawPassword = password;

    if (!trimmedNombre || !trimmedTelefono || !rawPassword.trim()) {
      setStatus({
        type: "error",
        message: "Completa todos los campos antes de registrar.",
      });
      return;
    }

    if (rawPassword.length < 8) {
      setStatus({
        type: "error",
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: trimmedNombre,
          telefono: trimmedTelefono,
          password: rawPassword,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          payload?.code === "DUPLICATE_PHONE"
            ? "Ese teléfono ya está registrado."
            : payload?.code === "WEAK_PASSWORD"
            ? "La contraseña debe tener al menos 8 caracteres."
            : payload?.code === "MISSING_FIELDS"
            ? "Completa todos los campos antes de registrar."
            : "No se pudo registrar. Intenta de nuevo.";

        setStatus({ type: "error", message });
      } else {
        setStatus({ type: "success", message: "Jugador registrado con éxito." });
        setNombre("");
        setTelefono("");
        setPassword("");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Error de red. Intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GridScan
          sensitivity={0.005}
          lineThickness={1}
          linesColor="#392e4e"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          className="h-full w-full"
        />
      </div>

      <main className="relative z-10 flex w-full max-w-[520px] flex-col items-center text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
          Registro de jugadores
        </p>
        <h1 className="mt-3 font-[var(--font-orbitron)] text-[40px] uppercase tracking-[0.2em] text-[#f5f0ff] drop-shadow-[0_0_26px_rgba(255,159,252,0.55)] sm:text-[52px]">
          AGCH GAMES
        </h1>
        <p className="mt-2 max-w-[420px] text-sm leading-6 text-white/70">
          Completa los datos básicos para crear un jugador.
        </p>

        <form
          className="mt-8 w-full max-w-[360px] space-y-4 text-left"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label
              className="text-[11px] uppercase tracking-[0.12em] text-white/70"
              htmlFor="nombre"
            >
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-[11px] uppercase tracking-[0.12em] text-white/70"
              htmlFor="telefono"
            >
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              autoComplete="tel"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-[11px] uppercase tracking-[0.12em] text-white/70"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-xl border border-white/20 bg-[rgba(6,8,16,0.7)] px-3.5 py-3 text-[15px] text-[#f5f0ff] transition focus:border-[#6fd6ff] focus:outline-none focus:ring-1 focus:ring-[#6fd6ff]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            className="w-full rounded-full bg-gradient-to-br from-[#ff9ffc] to-[#6fd6ff] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#05020c] shadow-[0_14px_30px_rgba(111,214,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(255,159,252,0.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Registrando..." : "Registrar"}
          </button>
        </form>

        {status.message ? (
          <p
            role="status"
            aria-live="polite"
            className={`mt-5 w-full max-w-[360px] rounded-xl border border-white/15 bg-[rgba(8,10,18,0.7)] px-3 py-2 text-center text-sm text-[#f5f0ff] ${
              status.type === "success"
                ? "border-[#7ef3b2]/45 text-[#7ef3b2]"
                : status.type === "error"
                ? "border-[#ff8f90]/45 text-[#ff8f90]"
                : ""
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}
