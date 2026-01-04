"use client";

import { initialStatus } from "@/constantes";
import { CoinsBadge } from "@/components/CoinsBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GridScan } from "@/components/GridScan";

export default function AjustesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(initialStatus);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("agch_user");
    }
    setUser(null);
    router.push("/");
  }, [router]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user?.id || isDeleting) return;
    const confirmed = window.confirm(
      "Seguro que quieres eliminar tu cuenta? Esta accion es permanente."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteStatus(initialStatus);

    try {
      const response = await fetch("/api/usuarios/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setDeleteStatus({
          type: "error",
          message: "No se pudo eliminar la cuenta.",
        });
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("agch_user");
      }
      setUser(null);
      router.push("/");
    } catch (error) {
      setDeleteStatus({
        type: "error",
        message: "No se pudo eliminar la cuenta.",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, router, user]);

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
            Inicia sesion para ver los ajustes.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full border border-white/25 bg-[rgba(8,12,22,0.85)] px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] text-white/90 shadow-[0_10px_22px_rgba(111,214,255,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white hover:shadow-[0_16px_28px_rgba(255,159,252,0.45)]"
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
      </div>

      <CoinsBadge userId={user?.id} />

      <main className="relative z-10 flex w-full max-w-[540px] flex-col items-center text-center">
        <div className="flex w-full items-center justify-center text-[11px] uppercase tracking-[0.22em] text-white/60">
          <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
            ALEX GAMES
          </span>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
          Ajustes de cuenta
        </p>

        <div className="mt-6 w-full max-w-[360px] rounded-2xl border border-white/15 bg-[rgba(6,8,16,0.65)] px-4 py-4 text-left">
          <div className="grid gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-full border border-[#6fd6ff]/60 bg-[rgba(8,12,22,0.85)] px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] text-white/90 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6fd6ff] hover:text-white"
            >
              Cerrar sesion
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full rounded-full border border-[#ff8f90]/70 bg-[rgba(24,10,14,0.85)] px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] text-[#ff8f90] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff8f90] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
            </button>
          </div>
          {deleteStatus.message ? (
            <p className="mt-3 text-sm text-[#ff8f90]">
              {deleteStatus.message}
            </p>
          ) : null}
        </div>

        <Link
          href="/"
          className="mt-6 rounded-full border border-[#ff9ffc]/60 bg-[rgba(8,12,22,0.8)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/90 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
