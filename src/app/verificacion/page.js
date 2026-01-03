"use client";

import { initialStatus } from "@/constantes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { GridScan } from "@/components/GridScan";

function VerificacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(() => {
    const nextValue = searchParams.get("next") || "/";
    return nextValue.startsWith("/") ? nextValue : "/";
  }, [searchParams]);

  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("agch_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          setUser(parsed);
        }
      } catch {
        window.localStorage.removeItem("agch_user");
      }
    }
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    let isMounted = true;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(
          `/api/telefono/estado?userId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;
        if (isMounted && data?.verified) {
          router.replace(safeNext);
        }
      } catch (error) {
        // ignore, user can still request verification
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, router, safeNext, user]);


  const handleSendCode = useCallback(async () => {
    if (!user?.id) return;

    setIsSending(true);
    setStatus(initialStatus);

    try {
      const response = await fetch("/api/telefono/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data?.error === "PHONE_NOT_SET"
            ? "No hay telefono asociado a tu cuenta."
            : data?.error === "INVALID_PHONE"
            ? "El numero no es valido."
            : data?.error === "N8N_FAILED"
            ? "No se pudo enviar el WhatsApp."
            : "No se pudo enviar el codigo.";
        setStatus({ type: "error", message });
        return;
      }

      setStatus({ type: "success", message: "Codigo enviado por WhatsApp." });
    } catch (error) {
      setStatus({ type: "error", message: "No se pudo enviar el codigo." });
    } finally {
      setIsSending(false);
    }
  }, [user]);

  const handleVerifyCode = useCallback(async () => {
    if (!user?.id || !codigo.trim()) return;
    setIsVerifying(true);
    setStatus(initialStatus);

    try {
      const response = await fetch("/api/telefono/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          codigo: codigo.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data?.code === "INVALID_CODE"
            ? "Codigo incorrecto."
            : data?.code === "CODE_EXPIRED"
            ? "El codigo expiro. Solicita otro."
            : data?.code === "MAX_ATTEMPTS"
            ? "Demasiados intentos. Solicita otro codigo."
            : "No se pudo verificar el telefono.";
        setStatus({ type: "error", message });
        return;
      }

      setStatus({ type: "success", message: "Telefono verificado." });
      router.replace(safeNext);
    } catch (error) {
      setStatus({ type: "error", message: "No se pudo verificar el telefono." });
    } finally {
      setIsVerifying(false);
    }
  }, [codigo, router, safeNext, user]);

  if (!isAuthReady) {
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
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <p className="text-sm text-white/70">Cargando...</p>
        </main>
      </div>
    );
  }

  if (!user) {
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
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <h1 className="font-[var(--font-press-start)] text-[28px] uppercase tracking-[0.18em] text-[#f5f0ff] sm:text-[36px]">
            ALEX GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Inicia sesion para verificar tu telefono.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white"
          >
            Volver al inicio
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07040f] px-4 py-12 text-[#f5f0ff] sm:px-6">
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,159,252,0.12),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(111,214,255,0.16),transparent_50%),linear-gradient(180deg,rgba(5,6,12,0.65),rgba(5,6,12,0.25))]" />
      </div>

      <main className="relative z-10 flex w-full max-w-[540px] flex-col items-center text-center">
        <div className="flex w-full items-center justify-center text-[11px] uppercase tracking-[0.22em] text-white/60">
          <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
            ALEX GAMES
          </span>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
          Verificacion
        </p>

        <div className="mt-6 w-full rounded-3xl border border-white/15 bg-[rgba(10,12,22,0.75)] px-6 py-5 text-left text-sm text-white/80 shadow-[0_18px_40px_rgba(5,8,18,0.45)]">
          <p className="text-xs text-white/70">
            Confirma tu numero para poder jugar. Te enviaremos un codigo por
            WhatsApp al telefono registrado.
          </p>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSending || isChecking}
            className="mt-5 w-full rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Enviando..." : "Enviar WhatsApp"}
          </button>

          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-[0.18em] text-white/60">
              Codigo
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-xl border border-white/15 bg-[rgba(6,8,16,0.7)] px-3 py-2 text-sm text-white/90"
                placeholder="000000"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isVerifying || !codigo.trim()}
                className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#ff9ffc] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifying ? "Verificando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>

        {status.message ? (
          <p
            className={`mt-4 text-sm ${
              status.type === "success"
                ? "text-[#7ef3b2]"
                : "text-[#ff8f90]"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <Link
          href="/ajustes"
          className="mt-6 inline-flex w-full max-w-[360px] items-center justify-center rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] text-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:text-white"
        >
          Ir a ajustes de cuenta
        </Link>

        <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-white/60">
          <Link href="/" className="transition hover:text-white">
            Volver al inicio
          </Link>
          {isChecking ? <span>Comprobando...</span> : null}
        </div>
      </main>
    </div>
  );
}

function VerificacionFallback() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07040f] px-6 py-12 text-[#f5f0ff]">
      <p className="text-sm text-white/70">Cargando...</p>
    </div>
  );
}

export default function VerificacionPage() {
  return (
    <Suspense fallback={<VerificacionFallback />}>
      <VerificacionContent />
    </Suspense>
  );
}
