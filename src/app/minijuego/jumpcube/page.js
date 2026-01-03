"use client";

import { initialStatus } from "@/constantes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CoinsBadge } from "@/components/CoinsBadge";
import { GridScan } from "@/components/GridScan";
import { JumpCubeGame } from "@/components/JumpCubeGame";
import { SnakeIntro } from "@/components/SnakeIntro";

export default function JumpCubePage() {
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
  const [playStatus, setPlayStatus] = useState(initialStatus);
  const [isStarting, setIsStarting] = useState(false);
  const [startSignal, setStartSignal] = useState(0);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replayStatus, setReplayStatus] = useState(initialStatus);
  const [isReplaying, setIsReplaying] = useState(false);

  const REPLAY_COST = 100;

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
        const response = await fetch("/api/juegos/jumpcube");
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
              `/verificacion?next=${encodeURIComponent("/minijuego/jumpcube")}`
            );
          }
          return;
        }

        if (isMounted) {
          const verified = Boolean(data?.verified);
          setIsVerified(verified);
          if (!verified) {
            router.replace(
              `/verificacion?next=${encodeURIComponent("/minijuego/jumpcube")}`
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsVerified(false);
          router.replace(
            `/verificacion?next=${encodeURIComponent("/minijuego/jumpcube")}`
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

  const handleContinue = useCallback(async () => {
    if (!user?.id || !game || isStarting) return;
    setPlayStatus(initialStatus);

    const priceRaw = Number(game?.preciopartida);
    if (!Number.isFinite(priceRaw)) {
      setPlayStatus({ type: "error", message: "Precio no disponible." });
      return;
    }

    const price = Math.trunc(priceRaw);
    if (price <= 0) {
      setShowGame(true);
      setSaveStatus(initialStatus);
      setShowReplayModal(false);
      setReplayStatus(initialStatus);
      setStartSignal((prev) => prev + 1);
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch("/api/monedas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, delta: -price }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data?.code === "INSUFFICIENT_FUNDS"
            ? "Saldo insuficiente."
            : "No se pudo descontar.";
        setPlayStatus({ type: "error", message });
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("coins:refresh"));
      }

      setShowGame(true);
      setSaveStatus(initialStatus);
      setShowReplayModal(false);
      setReplayStatus(initialStatus);
      setStartSignal((prev) => prev + 1);
    } catch (error) {
      setPlayStatus({
        type: "error",
        message: "No se pudo descontar.",
      });
    } finally {
      setIsStarting(false);
    }
  }, [game, isStarting, user?.id]);

  const handleBack = useCallback(() => {
    setShowGame(false);
    setPlayStatus(initialStatus);
    setShowReplayModal(false);
    setReplayStatus(initialStatus);
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
    async (score, durationSeconds = 0) => {
      setShowReplayModal(true);
      setReplayStatus(initialStatus);
      if (!user?.id || !game?.id) return;
      setIsSaving(true);
      setSaveStatus(initialStatus);

      try {
        const tiempo =
          Number.isFinite(durationSeconds) && durationSeconds >= 0
            ? Math.floor(durationSeconds)
            : 0;
        const response = await fetch("/api/puntuaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            gameId: game.id,
            puntos: score,
            tiempo,
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

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("coins:refresh"));
        }

        const best = data?.puntuacion_max ?? score;
        const reward = Number(data?.monedas_ganadas ?? 0);
        setSaveStatus({
          type: "success",
          message:
            reward > 0
              ? `Puntuacion guardada. Mejor: ${best}. +${reward} monedas`
              : `Puntuacion guardada. Mejor: ${best}`,
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

  const handleReplay = useCallback(async () => {
    if (!user?.id || isReplaying) return;
    setReplayStatus(initialStatus);
    setIsReplaying(true);

    try {
      const response = await fetch("/api/monedas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, delta: -REPLAY_COST }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data?.code === "INSUFFICIENT_FUNDS"
            ? "Saldo insuficiente."
            : "No se pudo descontar.";
        setReplayStatus({ type: "error", message });
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("coins:refresh"));
      }

      setShowReplayModal(false);
      setSaveStatus(initialStatus);
      setStartSignal((prev) => prev + 1);
    } catch (error) {
      setReplayStatus({
        type: "error",
        message: "No se pudo descontar.",
      });
    } finally {
      setIsReplaying(false);
    }
  }, [REPLAY_COST, isReplaying, user?.id]);

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
        <CoinsBadge userId={user?.id} />
        <main className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
          <h1 className="font-[var(--font-press-start)] text-[28px] uppercase tracking-[0.18em] text-[#f5f0ff] sm:text-[36px]">
            ALEX GAMES
          </h1>
          <p className="mt-4 text-sm text-white/70">Redirigiendo...</p>
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
            ALEX GAMES
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

  const priceValue = Number(game?.preciopartida);
  const priceLabel =
    Number.isFinite(priceValue) && Math.trunc(priceValue) > 0
      ? `Jugar ${Math.trunc(priceValue)} monedas`
      : "Continuar";
  const containerClassName = showGame
    ? "relative flex h-screen w-screen items-stretch justify-center overflow-hidden bg-[#07040f] text-[#f5f0ff]"
    : "relative flex min-h-screen items-start justify-center overflow-hidden bg-[#07040f] px-4 pb-12 pt-6 text-[#f5f0ff] sm:px-6";
  const mainClassName = showGame
    ? "relative z-10 flex h-full w-full flex-col items-stretch text-center"
    : "relative z-10 flex w-full max-w-[760px] flex-col items-center text-center";

  return (
    <div className={containerClassName}>
      {!showGame ? (
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
      ) : null}

      <CoinsBadge userId={user?.id} />

      <main className={mainClassName}>
        {showGame ? (
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/70">
            <span className="font-[var(--font-press-start)] text-[14px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[18px]">
              ALEX GAMES
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.45)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60">
              <span className="font-[var(--font-press-start)] text-[18px] uppercase tracking-[0.2em] text-[#f5f0ff] sm:text-[22px]">
                ALEX GAMES
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/80 transition hover:border-[#6fd6ff] hover:text-white"
              >
                Cerrar sesion
              </button>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60">
              JumpCube
            </p>
          </>
        )}

        {showGame ? (
          <div className="relative flex h-full w-full flex-1 flex-col">
            <JumpCubeGame
              onGameOver={handleGameOver}
              startSignal={startSignal}
              controlsLocked={showReplayModal}
              fullScreen
            />

            {saveStatus.message ? (
              <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center px-4">
                <p
                  className={`rounded-full border border-white/15 bg-[rgba(6,8,16,0.65)] px-4 py-2 text-xs ${
                    saveStatus.type === "success"
                      ? "text-[#7ef3b2]"
                      : "text-[#ff8f90]"
                  }`}
                >
                  {saveStatus.message}
                </p>
              </div>
            ) : isSaving ? (
              <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center px-4">
                <p className="rounded-full border border-white/15 bg-[rgba(6,8,16,0.65)] px-4 py-2 text-xs text-white/70">
                  Guardando puntuacion...
                </p>
              </div>
            ) : null}

            {showReplayModal ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                <div className="w-full max-w-[360px] rounded-2xl border border-white/15 bg-[rgba(10,12,22,0.95)] px-5 py-6 text-center text-white/80 shadow-[0_18px_40px_rgba(5,8,18,0.45)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                    Game Over
                  </p>
                  <p className="mt-3 text-sm text-white/80">
                    Vuelve a jugar por {REPLAY_COST} monedas.
                  </p>

                  {replayStatus.message ? (
                    <p className="mt-3 text-xs text-[#ff8f90]">
                      {replayStatus.message}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={handleReplay}
                      disabled={isReplaying}
                      className="w-full rounded-full border border-white/20 bg-[rgba(6,8,16,0.65)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#ff9ffc] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff9ffc] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isReplaying
                        ? "Procesando..."
                        : `Volver a jugar ${REPLAY_COST} monedas`}
                    </button>
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isReplaying}
                      className="w-full rounded-full border border-white/20 bg-[rgba(6,8,16,0.35)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <SnakeIntro
            game={game}
            isLoading={isGameLoading || isStarting}
            error={gameStatus.message || playStatus.message}
            onContinue={handleContinue}
            onBack={handleBackHome}
            actionLabel={priceLabel}
          />
        )}
      </main>
    </div>
  );
}
