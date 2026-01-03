"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GridScan } from "@/components/GridScan";
import { SnakeGame } from "@/components/SnakeGame";
import { SnakeIntro } from "@/components/SnakeIntro";

const initialStatus = { type: "", message: "" };

export default function SnakePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [game, setGame] = useState(null);
  const [gameStatus, setGameStatus] = useState(initialStatus);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifLoading, setIsVerifLoading] = useState(false);
  const [isVerifChecked, setIsVerifChecked] = useState(false);
  const [saveStatus, setSaveStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!isAuthReady || !user || !isVerified) return;
    let isMounted = true;

    const fetchGame = async () => {
      setIsGameLoading(true);
      setGameStatus(initialStatus);
      try {
        const response = await fetch("/api/juegos/snake");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (isMounted) {
            setGame(null);
            setGameStatus({
              type: "error",
              message: "No se pudo cargar el minijuego.",
            });
          }
          return;
        }

        if (isMounted) {
          setGame(data?.game ?? null);
          if (!data?.game) {
            setGameStatus({
              type: "error",
              message: "No se encontro el minijuego.",
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setGame(null);
          setGameStatus({
            type: "error",
            message: "No se pudo cargar el minijuego.",
          });
        }
      } finally {
        if (isMounted) {
          setIsGameLoading(false);
        }
      }
    };

    fetchGame();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, isVerified, user]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    let isMounted = true;

    const fetchVerification = async () => {
      setIsVerifLoading(true);
      try {
        const response = await fetch(
          `/api/telefono/estado?userId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (isMounted) {
            setIsVerified(false);
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuego/snake")}`
            );
          }
          return;
        }

        if (isMounted) {
          const verified = Boolean(data?.verified);
          setIsVerified(verified);
          if (!verified) {
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuego/snake")}`
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsVerified(false);
          router.replace(
            `/verificacion?next=${encodeURIComponent("/minijuego/snake")}`
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifLoading(false);
          setIsVerifChecked(true);
        }
      }
    };

    fetchVerification();
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, router, user]);

  const handleContinue = useCallback(() => {
    setShowGame(true);
    setSaveStatus(initialStatus);
  }, []);

  const handleBack = useCallback(() => {
    setShowGame(false);
  }, []);

  const handleBackHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("agch_user");
    }
    setUser(null);
    router.push("/");
  }, [router]);

  const handleGameOver = useCallback(
    async (score) => {
      if (!user?.id || !game?.id) return;
      setIsSaving(true);
      setSaveStatus(initialStatus);

      try {
        const response = await fetch("/api/puntuaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            gameId: game.id,
            puntos: score,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            data?.code === "MAX_INTENTOS_ALCANZADO"
              ? "Max intentos alcanzado."
              : "No se pudo guardar la puntuacion.";
          setSaveStatus({ type: "error", message });
          return;
        }

        const best = data?.puntuacion_max ?? score;
        setSaveStatus({
          type: "success",
          message: `Puntuacion guardada. Mejor: ${best}`,
        });
      } catch (error) {
        setSaveStatus({
          type: "error",
          message: "No se pudo guardar la puntuacion.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [game?.id, user?.id]
  );

  if (user && (!isVerifChecked || isVerifLoading || !isVerified)) {
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
            AGCH GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Verificando telefono...
          </p>
        </main>
      </div>
    );
  }

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
            AGCH GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Inicia sesion para acceder al minijuego.
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
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#07040f] px-4 pb-12 pt-6 text-[#f5f0ff] sm:px-6">
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

      <main className="relative z-10 flex w-full max-w-[640px] flex-col items-center text-center">
        <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
          <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
            AGCH GAMES
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="transition hover:text-white"
          >
            Cerrar sesion
          </button>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
          Snake
        </p>

        {showGame ? (
          <div className="mt-4 w-full text-center">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
              <span>Snake</span>
              <button
                type="button"
                onClick={handleBack}
                className="transition hover:text-white"
              >
                Volver
              </button>
            </div>

            <SnakeGame onGameOver={handleGameOver} />

            {saveStatus.message ? (
              <p
                className={`mt-4 text-sm ${
                  saveStatus.type === "success"
                    ? "text-[#7ef3b2]"
                    : "text-[#ff8f90]"
                }`}
              >
                {saveStatus.message}
              </p>
            ) : isSaving ? (
              <p className="mt-4 text-sm text-white/60">
                Guardando puntuacion...
              </p>
            ) : null}
          </div>
        ) : (
          <SnakeIntro
            game={game}
            isLoading={isGameLoading}
            error={gameStatus.message}
            onContinue={handleContinue}
            onBack={handleBackHome}
          />
        )}
      </main>
    </div>
  );
}
